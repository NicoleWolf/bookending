import { Pill } from '../../shared/ui/atoms';
import { PURCHASE_STATUS_TONE, PURCHASE_STATUS_LABEL, CHECKLIST_LABEL } from './data';
import type { Purchase, ChecklistKey } from './data';
import styles from './PurchaseDetail.module.css';

interface Props {
  purchase: Purchase;
  onBack: () => void;
}

const CHECKLIST_KEYS: ChecklistKey[] = ['signed', 'letter', 'labeled', 'packed'];

export function PurchaseDetail({ purchase: p, onBack }: Props) {
  const allDigital  = p.items.every(i => i.digital);

  // Only show checklist items that are relevant to this order
  const tasks = CHECKLIST_KEYS.filter(k => {
    if (k === 'signed')  return p.signedRequested;
    if (k === 'letter')  return p.letterRequested;
    if (k === 'labeled') return !allDigital;
    if (k === 'packed')  return !allDigital;
    return false;
  });
  const doneTasks = tasks.filter(k => p.checklist[k]).length;
  const allDone   = tasks.length > 0 && doneTasks === tasks.length;

  return (
    <div>
      {/* ── Back bar ── */}
      <div className={styles.backBar}>
        <button className={styles.backBtn} onClick={onBack}>← Purchases</button>
        <div className={styles.backRight}>
          <span className={styles.backNum}>{p.num}</span>
          <Pill tone={PURCHASE_STATUS_TONE[p.status]}>{PURCHASE_STATUS_LABEL[p.status]}</Pill>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* Left — receipt, address, downloads */}
        <div className={styles.left}>

          {/* From */}
          <div className={styles.section}>
            <div className="label">From</div>
            <div className={styles.fromAuthor}>{p.author}</div>
            <div className={styles.fromStore}>{p.storeName}</div>
          </div>

          {/* Receipt */}
          <div className={styles.section}>
            <div className="label">Receipt</div>
            <div className={styles.receiptTable}>
              {p.items.map((item, i) => (
                <div key={i} className={styles.receiptRow}>
                  <div className={styles.receiptItem}>
                    <span className={`serif ${styles.receiptTitle}`}>{item.title}</span>
                    <span className={styles.receiptFormat}>{item.format}</span>
                  </div>
                  <div className={`serif ${styles.receiptPrice}`}>${item.price}</div>
                </div>
              ))}
              {p.shipping > 0 && (
                <div className={styles.receiptRow}>
                  <div className={styles.receiptMeta}>Shipping</div>
                  <div className={styles.receiptMeta}>${p.shipping}</div>
                </div>
              )}
              <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
                <div className={styles.receiptTotalLabel}>Total</div>
                <div className={`serif ${styles.receiptTotalAmount}`}>${p.total}</div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          {allDigital ? (
            <div className={styles.section}>
              <div className="label">Delivery</div>
              <div className={styles.digitalNote}>Digital — delivered to your account.</div>
            </div>
          ) : (
            <div className={styles.section}>
              <div className="label">Delivered to</div>
              {p.address && (
                <address className={styles.address}>
                  <div>{p.address.line1}</div>
                  <div>{p.address.city}{p.address.postal ? ` ${p.address.postal}` : ''}</div>
                  <div>{p.address.country}</div>
                </address>
              )}
              {p.trackingNum && (
                <div className={styles.trackingBlock}>
                  <span className={styles.trackingLabel}>Tracking</span>
                  <span className={styles.trackingNum}>{p.trackingNum}</span>
                </div>
              )}
            </div>
          )}

          {/* Downloads */}
          {p.items.some(i => i.digital) && (
            <div className={styles.section}>
              <div className="label">Downloads</div>
              <div className={styles.downloadList}>
                {p.items.filter(i => i.digital).map((item, i) => (
                  <div key={i} className={styles.downloadRow}>
                    <div className={styles.downloadMeta}>
                      <span className={`serif ${styles.downloadTitle}`}>{item.title}</span>
                      <span className={styles.downloadFormat}>{item.format}</span>
                    </div>
                    <button className={styles.downloadBtn}>Download ↗</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — author note, fulfilment checklist, payment */}
        <div className={styles.right}>

          {/* Author note */}
          {p.authorNote && (
            <div className={styles.section}>
              <div className="label">Note from {p.author.split(' ')[0]}</div>
              <p className={`serif ${styles.authorNote}`}>"{p.authorNote}"</p>
            </div>
          )}

          {/* Fulfilment checklist (read-only) */}
          {tasks.length > 0 && (
            <div className={styles.section}>
              <div className={styles.checklistHeader} data-complete={allDone ? '' : undefined}>
                <div className="label">Fulfilment</div>
                <span className={styles.checklistProgress}>{doneTasks}/{tasks.length}</span>
              </div>
              <div className={styles.checklistItems}>
                {tasks.map(k => (
                  <div key={k} className={styles.checklistRow} data-done={p.checklist[k] ? '' : undefined}>
                    <span className={styles.checklistMark}>{p.checklist[k] ? '✓' : '○'}</span>
                    <span className={styles.checklistLabel}>{CHECKLIST_LABEL[k]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment */}
          <div className={styles.section}>
            <div className="label">Payment</div>
            <div className={styles.paymentRow}>
              <span className={styles.paymentCard}>
                {p.payment.brand} ···· {p.payment.last4}
              </span>
              <span className={styles.paymentDate}>{p.date}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
