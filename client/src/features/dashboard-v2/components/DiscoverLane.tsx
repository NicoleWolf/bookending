import styles from './DiscoverLane.module.css';
import type { DiscoverLaneData } from '../stub';

export const DiscoverLane = ({ data }: { data: DiscoverLaneData }) => (
  <section className={styles.lane}>
    <div className={styles.header}>
      <span className={`mono ${styles.eyebrow}`}>§ Lane 01 · queue</span>
      <h3 className={`serif ${styles.title}`}>Discover</h3>
    </div>
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`mono ${styles.cardEyebrow}`}>Open beta reads · {data.openCount} new</span>
        <span className={`mono ${styles.cardEyebrow}`}>{data.genreCount} in your genre</span>
      </div>
      <ul className={styles.list}>
        {data.manuscripts.map((m) => (
          <li key={m.title} className={`serif ${styles.item}`}>
            <em>{m.title}</em> by {m.author}
            <span className={styles.status}> — {m.status}</span>
          </li>
        ))}
      </ul>
      <button className={`mono ${styles.btn}`}>Browse the library →</button>
    </div>
  </section>
);
