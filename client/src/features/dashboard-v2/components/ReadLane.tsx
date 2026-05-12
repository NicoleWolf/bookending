import type { CSSProperties } from 'react';
import { Avatar } from '../../../shared/ui/atoms/Avatar';
import { Pill } from '../../../shared/ui/atoms/Pill';
import styles from './ReadLane.module.css';
import type { ReadLaneData } from '../stub';

export const ReadLane = ({ data }: { data: ReadLaneData }) => {
  const maxBar = Math.max(...data.hotspotBars, 1);

  return (
    <section className={styles.lane}>
      <div className={styles.header}>
        <div>
          <span className={`mono ${styles.eyebrow}`}>§ Lane 02 · primary</span>
          <h2 className={`serif ${styles.title}`}>Read</h2>
        </div>
        <div className={styles.meta}>
          <p className={styles.metaTitle}>{data.manuscriptsMeta}</p>
          <p className={`mono ${styles.metaStats}`}>{data.streakLabel.toUpperCase()}</p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Active manuscripts table */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`mono ${styles.eyebrow}`}>On your desk</span>
            <span className={`mono ${styles.eyebrow}`}>Sorted by recent activity</span>
          </div>

          <table className={styles.table}>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.title} className={styles.tr}>
                  <td className={styles.tdAvatar}>
                    <Avatar initials={r.initials} tone={r.avatarTone} size={26} />
                  </td>
                  <td className={styles.tdTitle}>
                    <p className={`serif ${styles.mTitle}`}><em>{r.title}</em></p>
                    <p className={styles.mMeta}>{r.subtitle}</p>
                  </td>
                  <td className={styles.tdProgress}>
                    <span className={`mono ${styles.progressLabel}`}>{r.progress.toUpperCase()}</span>
                    <div className={styles.track}>
                      <div
                        className={styles.fill}
                        data-muted={r.barMuted || undefined}
                        style={{ '--pct': `${r.progressPct}%` } as CSSProperties}
                      />
                    </div>
                  </td>
                  <td className={styles.tdPill}>
                    <Pill tone={r.pillTone}>{r.pillLabel}</Pill>
                  </td>
                  <td className={styles.tdOpen}>
                    <button className={`mono ${styles.openBtn}`}>Open →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className={`mono ${styles.moreBtn}`}>{data.moreLabel}</button>
        </div>

        {/* Hotspot + rhythm */}
        <div className={`${styles.section} ${styles.sectionGrid}`}>
          <div>
            <div className={styles.sectionHead}>
              <span className={`mono ${styles.eyebrow}`}>{data.hotspotTitle}</span>
              <span className={`mono ${styles.eyebrow}`}>{data.hotspotBars.reduce((a, b) => a + b, 0)} of your notes</span>
            </div>
            <div className={styles.histogram}>
              {data.hotspotBars.map((v, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  data-hot={i === data.hotspotHotIdx || undefined}
                  data-unread={i > data.hotspotHotIdx || undefined}
                  style={{ '--h': `${Math.round((v / maxBar) * 100)}%` } as CSSProperties}
                />
              ))}
            </div>
            <div className={styles.histogramLabels}>
              <span className={`mono ${styles.histLabel}`}>Ch. 1</span>
              <span className={`mono ${styles.histLabelHot}`}>Ch. {data.hotspotHotIdx + 1} — active</span>
              <span className={`mono ${styles.histLabelDim}`}>Ch. {data.hotspotBars.length}</span>
            </div>
          </div>

          <div className={styles.rhythm}>
            <span className={`mono ${styles.eyebrow}`}>Your reading rhythm</span>
            <div className={styles.rhythmList}>
              {data.rhythm.map((r) => (
                <div key={r.label} className={styles.rhythmRow}>
                  <span className={styles.rhythmLabel}>{r.label}</span>
                  <span className={`mono ${styles.rhythmValue}`} data-accent={r.accent || undefined}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
