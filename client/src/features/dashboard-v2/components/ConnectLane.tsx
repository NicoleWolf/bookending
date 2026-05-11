import styles from './ConnectLane.module.css';
import type { ConnectLaneData } from '../stub';

export const ConnectLane = ({ data }: { data: ConnectLaneData }) => (
  <section className={styles.lane}>
    <div className={styles.header}>
      <span className={`mono ${styles.eyebrow}`}>§ Lane 03 · waiting on you</span>
      <h3 className={`serif ${styles.title}`}>Connect</h3>
    </div>
    <div className={styles.card}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={`mono ${styles.statLabel}`}>Letters</span>
          <span className={`serif ${styles.statValueAlert}`}>{data.lettersInDraft} in draft</span>
        </div>
        <div className={styles.stat}>
          <span className={`mono ${styles.statLabel}`}>Replies to you</span>
          <span className={`serif ${styles.statValue}`}>{data.unreadReplies} unread</span>
        </div>
      </div>
      <p className={`serif ${styles.description}`}>{data.description}</p>
      <button className={`mono ${styles.btn}`}>Open Correspondence →</button>
    </div>
  </section>
);
