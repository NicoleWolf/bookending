import { useState } from 'react';
import { SectionHead, Pill } from '../../shared/ui/atoms';
import { PURCHASES, PURCHASE_STATUS_TONE, PURCHASE_STATUS_LABEL } from './data';
import type { Purchase } from './data';
import { PurchaseDetail } from './PurchaseDetail';
import styles from './PurchasesView.module.css';

type Filter = 'all' | 'digital' | 'physical';

function hasDigital(p: Purchase)  { return p.items.some(i => i.digital); }
function hasPhysical(p: Purchase) { return p.items.some(i => !i.digital); }

export default function PurchasesView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  // ── Detail view ──
  if (openId !== null) {
    const purchase = PURCHASES.find(p => p.id === openId)!;
    return <PurchaseDetail purchase={purchase} onBack={() => setOpenId(null)} />;
  }

  const filtered = PURCHASES.filter(p => {
    if (filter === 'digital')  return hasDigital(p);
    if (filter === 'physical') return hasPhysical(p);
    return true;
  });

  const digitalCount  = PURCHASES.filter(hasDigital).length;
  const physicalCount = PURCHASES.filter(hasPhysical).length;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="§ · Purchases"
          title="Purchases"
          kicker="Books and items you've bought from authors on Bookending."
        />
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBtns}>
          <button
            className={styles.filterBtn}
            data-active={filter === 'all' ? '' : undefined}
            onClick={() => setFilter('all')}
          >
            All <span className={styles.filterCount}>({PURCHASES.length})</span>
          </button>
          <button
            className={styles.filterBtn}
            data-active={filter === 'digital' ? '' : undefined}
            onClick={() => setFilter('digital')}
          >
            Digital <span className={styles.filterCount}>({digitalCount})</span>
          </button>
          <button
            className={styles.filterBtn}
            data-active={filter === 'physical' ? '' : undefined}
            onClick={() => setFilter('physical')}
          >
            Physical <span className={styles.filterCount}>({physicalCount})</span>
          </button>
        </div>
      </div>

      {/* ── Table head ── */}
      <div className={styles.tableHead}>
        {['Order', 'From', 'Items', 'Total', 'Status', 'Date', ''].map((h, i) => (
          <div key={i} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {/* ── Rows ── */}
      {filtered.map(p => {
        const allDigital = p.items.every(i => i.digital);
        const itemLabel  = p.items.map(i => i.title + (p.items.length > 1 ? ` (${i.format})` : '')).join(', ');

        return (
          <div key={p.id} className={styles.purchaseRow}>
            <div>
              <button className={styles.orderNum} onClick={() => setOpenId(p.id)}>
                {p.num}
              </button>
            </div>

            <div>
              <div className={styles.authorName}>{p.author}</div>
              <div className={styles.storeName}>{p.storeName}</div>
            </div>

            <div className={`serif ${styles.itemLabel}`}>
              {itemLabel}
              <div className={styles.formatTags}>
                {p.items.map((item, i) => (
                  <span key={i} className={styles.formatTag} data-digital={item.digital ? '' : undefined}>
                    {item.format}
                  </span>
                ))}
              </div>
            </div>

            <div className={`serif ${styles.total}`}>${p.total}</div>

            <Pill tone={PURCHASE_STATUS_TONE[p.status]}>
              {PURCHASE_STATUS_LABEL[p.status]}
            </Pill>

            <div className={styles.date}>{p.date}</div>

            <div className={styles.actions}>
              {allDigital && p.status === 'delivered' && (
                <button className={styles.downloadBtn} onClick={() => setOpenId(p.id)}>Download ↗</button>
              )}
              {!allDigital && p.status === 'shipped' && p.trackingNum && (
                <div className={styles.tracking}>
                  <span className={styles.trackingLabel}>Tracking</span>
                  <span className={styles.trackingNum}>{p.trackingNum}</span>
                </div>
              )}
              {!allDigital && p.status === 'delivered' && (
                <span className={styles.deliveredNote}>Delivered</span>
              )}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className={styles.empty}>
          <p className="serif">No {filter === 'all' ? '' : filter + ' '}purchases yet.</p>
        </div>
      )}
    </div>
  );
}
