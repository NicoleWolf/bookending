import type { CSSProperties } from 'react';
import styles from './PrepareLane.module.css';
import type { PrepareLaneData } from '../stub';

export const PrepareLane = ({ data }: { data: PrepareLaneData }) => (
  <section className={styles.lane}>
    <div className={styles.header}>
      <span className={`mono ${styles.eyebrow}`}>§ Lane 02 · upcoming</span>
      <h3 className={`serif ${styles.title}`}>Prepare &amp; launch</h3>
    </div>
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`mono ${styles.cardEyebrow}`}>{data.stepsLabel.toUpperCase()}</span>
        <span className={`mono ${styles.cardEyebrow}`}>Unlocks when ready</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ '--pct': `${Math.round(data.stepsProgress * 100)}%` } as CSSProperties}
        />
      </div>
      <p className={`serif ${styles.description}`}>{data.description}</p>
      <button className={`mono ${styles.btn}`}>Peek the checklist →</button>
    </div>
  </section>
);
