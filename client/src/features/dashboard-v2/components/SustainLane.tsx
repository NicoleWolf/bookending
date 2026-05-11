import styles from './SustainLane.module.css';
import type { SustainLaneData } from '../stub';

export const SustainLane = ({ data }: { data: SustainLaneData }) => (
  <section className={styles.lane}>
    <div className={styles.header}>
      <span className={`mono ${styles.eyebrow}`}>§ Lane 03 · maintenance</span>
      <h3 className={`serif ${styles.title}`}>Sell &amp; sustain</h3>
    </div>
    <div className={styles.card}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={`mono ${styles.statLabel}`}>Prior title</span>
          <span className={`serif ${styles.statValue}`}>{data.salesCount} sales</span>
        </div>
        <div className={styles.stat}>
          <span className={`mono ${styles.statLabel}`}>Unreplied Q&amp;A</span>
          <span className={`serif ${styles.statValueAlert}`}>{data.unrepliedQa}</span>
        </div>
      </div>
      <p className={`serif ${styles.description}`}>{data.description}</p>
      <button className={`mono ${styles.btn}`}>Reply now →</button>
    </div>
  </section>
);
