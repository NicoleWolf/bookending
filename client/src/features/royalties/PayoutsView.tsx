import { PAYOUTS, CHANNEL_INFO } from './data';
import styles from './Payouts.module.css';

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function PayoutsView() {
  const pending = PAYOUTS.filter(p => p.status === 'pending' || p.status === 'processing');
  const history = PAYOUTS.filter(p => p.status === 'paid');

  return (
    <div className={styles.view}>
      <div className={styles.sectionHead}>Expected payouts</div>
      <div className={styles.pendingCards}>
        {pending.map(p => (
          <div
            key={p.id}
            className={styles.pendingCard}
            data-processing={p.status === 'processing' ? 'true' : undefined}
          >
            <div className={styles.pendingChannel}>{CHANNEL_INFO[p.channel].label}</div>
            <div className={styles.pendingPeriod}>{p.period}</div>
            <div className={`serif ${styles.pendingNet}`}>{fmt(p.net)}</div>
            <div className={styles.pendingGross}>{fmt(p.gross)} gross</div>
            <div
              className={styles.pendingDate}
              data-processing={p.status === 'processing' ? 'true' : undefined}
              data-expected={p.status === 'pending' ? 'true' : undefined}
            >
              {p.status === 'processing' ? 'Processing · ' : 'Expected · '}{p.date}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.historySection}>
        <div className={styles.sectionHead}>Payment history</div>
        <div className={styles.tableHead}>
          <span className={styles.colHead}>Channel</span>
          <span className={styles.colHead}>Period</span>
          <span className={styles.colHead}>Gross</span>
          <span className={styles.colHead}>Net</span>
          <span className={styles.colHead}>Status</span>
          <span className={styles.colHead}>Date</span>
        </div>
        {history.map(p => (
          <div key={p.id} className={styles.tableRow}>
            <span className={styles.cellChannel}>{CHANNEL_INFO[p.channel].label}</span>
            <span className={styles.cellPeriod}>{p.period}</span>
            <span className={styles.cellMoney}>{fmt(p.gross)}</span>
            <span className={styles.cellNet}>{fmt(p.net)}</span>
            <div className={styles.cellStatus}>
              <span className={styles.statusPill} data-paid="true">Paid</span>
            </div>
            <span className={styles.cellDate}>{p.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
