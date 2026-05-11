import styles from './DeskQueue.module.css';
import type { QueueRow } from '../stub';

export const DeskQueue = ({ rows }: { rows: QueueRow[] }) => (
  <div className={styles.queue}>
    {rows.map((row) => (
      <div key={row.label} className={styles.row}>
        <div className={styles.top}>
          <span className={`mono ${styles.label}`}>{row.label}</span>
          <p className={`serif ${styles.headline}`}>{row.headline}</p>
        </div>
        <div className={styles.bottom}>
          <p className={styles.supporting}>{row.supporting}</p>
          <button className={`mono ${styles.cta}`}>{row.cta}</button>
        </div>
      </div>
    ))}
  </div>
);
