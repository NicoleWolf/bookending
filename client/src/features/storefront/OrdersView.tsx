import { useState, useEffect, Fragment } from 'react';
import { Pill, Btn } from '../../shared/ui/atoms';
import { IconArrowUp } from '../../shared/ui/icons';
import { ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from './data';
import type { Order, OrderStatus } from './types';
import { useAuth } from '../auth';
import styles from './OrdersView.module.css';

import { api } from '../../lib/api';
import type { OrderRecord } from '@bookending/shared';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function recordToOrder(r: OrderRecord): Order {
  return {
    id:              r.id,
    num:             r.num,
    customer:        r.customer,
    location:        r.location,
    items:           r.product,
    total:           r.amount,
    status:          r.status as OrderStatus,
    date:            timeAgo(r.createdAt),
    address: {
      line1:   r.addressLine1   ?? '',
      city:    r.addressCity    ?? '',
      country: r.addressCountry ?? '',
      postal:  r.addressPostal  ?? undefined,
    },
    notes:           r.notes           ?? undefined,
    signedRequested: r.signedRequested,
    letterRequested: r.letterRequested,
    digital:         r.digital,
  };
}

// ── Fulfillment checklist helpers ─────────────────────────────

type ChecklistKey = 'signed' | 'letter' | 'labeled' | 'packed';
type Checklists   = Record<string, Record<ChecklistKey, boolean>>;

function initChecklist(o: Order): Record<ChecklistKey, boolean> {
  const done = o.status === 'shipped' || o.status === 'delivered';
  return {
    signed:  done && o.signedRequested,
    letter:  done && o.letterRequested,
    labeled: done && !o.digital,
    packed:  done && !o.digital,
  };
}

// ── Order detail (full-page) ──────────────────────────────────

interface DetailProps {
  order: Order;
  checklist: Record<ChecklistKey, boolean>;
  onCheck: (key: ChecklistKey) => void;
  onAdvanceStatus: (status: OrderStatus) => void;
  onBack: () => void;
}

function OrderDetail({ order, checklist, onCheck, onAdvanceStatus, onBack }: DetailProps) {
  const tasks: Array<{ key: ChecklistKey; label: string; done: boolean }> = [];
  if (order.signedRequested) tasks.push({ key: 'signed', label: 'Sign the copy',         done: checklist.signed  });
  if (order.letterRequested) tasks.push({ key: 'letter', label: 'Write the letter',       done: checklist.letter  });
  if (!order.digital)        tasks.push({ key: 'labeled', label: 'Print shipping label',  done: checklist.labeled });
  if (!order.digital)        tasks.push({ key: 'packed',  label: 'Pack and seal',         done: checklist.packed  });

  const doneTasks = tasks.filter(t => t.done).length;
  const allDone   = tasks.length > 0 && doneTasks === tasks.length;

  const canAdvance = order.status === 'new' || order.status === 'processing';

  return (
    <div>
      {/* ── Back bar ── */}
      <div className={styles.detailBackBar}>
        <button className={styles.detailBackBtn} onClick={onBack}>← Orders</button>
        <div className={styles.detailBackRight}>
          <span className={styles.detailBackNum}>{order.num}</span>
          <Pill tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Pill>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className={styles.detailBody}>

        {/* Left — order meta */}
        <div className={styles.detailLeft}>

          <div className={styles.detailSection}>
            <div className="label">Order</div>
            <div className={`serif ${styles.detailItems}`}>{order.items}</div>
            <div className={styles.detailOrderMeta}>
              <span className={`serif ${styles.detailTotal}`}>${order.total}</span>
              <span className={styles.detailDate}>{order.date}</span>
            </div>
          </div>

          {order.digital ? (
            <div className={styles.detailSection}>
              <div className="label">Delivery</div>
              <div className={styles.digitalNote}>Digital — no physical fulfilment required.</div>
            </div>
          ) : (
            <div className={styles.detailSection}>
              <div className="label">Ship to</div>
              <address className={styles.detailAddress}>
                <div>{order.customer}</div>
                <div>{order.address.line1}</div>
                <div>{order.address.city}{order.address.postal ? ` ${order.address.postal}` : ''}</div>
                <div>{order.address.country}</div>
              </address>
            </div>
          )}

          {order.notes && (
            <div className={styles.detailSection}>
              <div className="label">Note from customer</div>
              <p className={`serif ${styles.detailNote}`}>"{order.notes}"</p>
            </div>
          )}
        </div>

        {/* Right — commitments + checklist + actions */}
        <div className={styles.detailRight}>

          {(order.signedRequested || order.letterRequested) && (
            <div className={styles.detailSection}>
              <div className="label">Commitments at checkout</div>
              <div className={styles.promiseList}>
                {order.signedRequested && (
                  <div className={styles.promiseItem}>Signed copy requested</div>
                )}
                {order.letterRequested && (
                  <div className={styles.promiseItem}>Free letter requested</div>
                )}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.checklistHeader} data-complete={allDone ? '' : undefined}>
                <div className="label">Fulfilment checklist</div>
                <span className={styles.checklistProgress}>{doneTasks}/{tasks.length}</span>
              </div>
              <div className={styles.checklistItems}>
                {tasks.map(({ key, label, done }) => (
                  <label key={key} className={styles.checklistRow} data-done={done ? '' : undefined}>
                    <input
                      type="checkbox"
                      className={styles.checklistBox}
                      checked={done}
                      onChange={() => onCheck(key)}
                    />
                    <span className={styles.checklistLabel}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {canAdvance && (
            <div className={styles.detailActions}>
              {order.status === 'new' && (
                <Btn tone="primary" onClick={() => onAdvanceStatus('processing')}>Mark processing</Btn>
              )}
              {order.status === 'processing' && (
                <Btn tone="primary" onClick={() => onAdvanceStatus('shipped')}>Mark shipped</Btn>
              )}
              {!order.digital && (
                <Btn tone="ghost" icon={<IconArrowUp size={11} />}>Generate label</Btn>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Orders table ──────────────────────────────────────────────

export function OrdersView() {
  const { session } = useAuth();
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [filter,     setFilter]     = useState<OrderStatus | 'all'>('all');
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [openId,     setOpenId]     = useState<string | null>(null);
  const [checklists, setChecklists] = useState<Checklists>({});

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<OrderRecord[]>('/api/orders');
        const loaded = records.map(recordToOrder);
        setOrders(loaded);
        setChecklists(Object.fromEntries(loaded.map(o => [o.id, initChecklist(o)])));
      } catch { /* leave empty */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  // ── Detail view ──
  if (openId !== null) {
    const order = orders.find(o => o.id === openId)!;
    return (
      <OrderDetail
        order={order}
        checklist={checklists[order.id]}
        onCheck={key => setChecklists(prev => ({
          ...prev,
          [order.id]: { ...prev[order.id], [key]: !prev[order.id][key] },
        }))}
        onAdvanceStatus={status => advanceStatus([openId], status)}
        onBack={() => setOpenId(null)}
      />
    );
  }

  // ── Table view ──
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered    = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id));
  const selArr      = [...selected];

  function advanceStatus(ids: string[], status: OrderStatus) {
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o));
    setSelected(new Set());
    for (const id of ids) {
      api.patch(`/api/orders/${id}`, { status })
        .catch(err => console.error('Failed to update order:', err));
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBtns}>
          <button
            className={styles.filterBtn}
            data-active={filter === 'all' ? '' : undefined}
            onClick={() => setFilter('all')}
          >
            All <span className={styles.filterCount}>({orders.length})</span>
          </button>
          {(['new', 'processing', 'shipped', 'delivered', 'refunded'] as OrderStatus[]).map(s => (
            <button
              key={s}
              className={styles.filterBtn}
              data-active={filter === s ? '' : undefined}
              onClick={() => setFilter(s)}
            >
              {ORDER_STATUS_LABEL[s]}
              {statusCounts[s] ? <span className={styles.filterCount}> ({statusCounts[s]})</span> : null}
            </button>
          ))}
        </div>
        <Btn tone="ghost">Export CSV</Btn>
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <button className={styles.bulkBtn} onClick={() => advanceStatus(selArr, 'processing')}>Mark processing</button>
          <button className={styles.bulkBtn} onClick={() => advanceStatus(selArr, 'shipped')}>Mark shipped</button>
          <button className={styles.bulkBtn}>Generate labels ↗</button>
          <button className={styles.bulkClear} onClick={() => setSelected(new Set())}>Clear ×</button>
        </div>
      )}

      {/* ── Table head ── */}
      <div className={styles.tableHead}>
        <div className={styles.tableHeadCell}>
          <input
            type="checkbox"
            className={styles.selectAll}
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map(o => o.id)))}
          />
        </div>
        {['Order', 'Customer', 'Location', 'Items', 'Total', 'Status', 'Date', ''].map((h, i) => (
          <div key={i} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {/* ── Rows ── */}
      {filtered.map(o => (
        <Fragment key={o.id}>
          <div
            className={styles.orderRow}
            data-new={o.status === 'new' ? '' : undefined}
            data-selected={selected.has(o.id) ? '' : undefined}
          >
            <div className={styles.checkCell}>
              <input
                type="checkbox"
                className={styles.rowCheck}
                checked={selected.has(o.id)}
                onChange={() => toggleSelect(o.id)}
              />
            </div>

            <button className={styles.orderNum} onClick={() => setOpenId(o.id)}>
              {o.num}
            </button>

            <div className={styles.orderCustomer}>
              {o.customer}
              {(o.signedRequested || o.letterRequested) && (
                <div className={styles.orderFlagRow}>
                  {o.signedRequested && (
                    <span className={styles.flagTag} data-done={checklists[o.id].signed ? '' : undefined}>
                      SIGN
                    </span>
                  )}
                  {o.letterRequested && (
                    <span className={styles.flagTag} data-done={checklists[o.id].letter ? '' : undefined}>
                      LTTR
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={styles.orderLocation}>{o.location}</div>
            <div className={`serif ${styles.orderItems}`}>{o.items}</div>
            <div className={`serif ${styles.orderTotal}`}>${o.total}</div>
            <Pill tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Pill>
            <div className={styles.orderDate}>{o.date}</div>

            <div className={styles.rowActions}>
              {o.status === 'new' && (
                <button className={styles.rowBtn} onClick={() => advanceStatus([o.id], 'processing')}>
                  Processing →
                </button>
              )}
              {o.status === 'processing' && (
                <button className={styles.rowBtn} onClick={() => advanceStatus([o.id], 'shipped')}>
                  Shipped →
                </button>
              )}
              {!o.digital && (o.status === 'new' || o.status === 'processing') && (
                <button className={styles.rowBtnGhost}>Label ↗</button>
              )}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
