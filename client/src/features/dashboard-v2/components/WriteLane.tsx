import type { CSSProperties } from 'react';
import { Avatar } from '../../../shared/ui/atoms/Avatar';
import { Pill } from '../../../shared/ui/atoms/Pill';
import styles from './WriteLane.module.css';
import type { WriteLaneData } from '../stub';

export const WriteLane = ({ data }: { data: WriteLaneData }) => {
  const maxBar = Math.max(...data.hotspotBars, 1);

  return (
    <section className={styles.lane}>
      <div className={styles.header}>
        <div>
          <span className={`mono ${styles.eyebrow}`}>§ Lane 01 · primary</span>
          <h2 className={`serif ${styles.title}`}>Write &amp; revise</h2>
        </div>
        <div className={styles.meta}>
          <p className={styles.metaTitle}>{data.manuscriptTitle}</p>
          <p className={`mono ${styles.metaStats}`}>{data.manuscriptMeta.toUpperCase()}</p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Reading room */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={`mono ${styles.eyebrow}`}>The reading room</span>
            <span className={`mono ${styles.eyebrow}`}>{data.readers.length + data.moreCount} readers · {data.readers.filter(r => !r.barMuted).length} active</span>
          </div>

          <table className={styles.table}>
            <tbody>
              {data.readers.map((r) => (
                <tr key={r.name} className={styles.tr}>
                  <td className={styles.tdAvatar}>
                    <Avatar initials={r.initials} tone={r.avatarTone} size={24} />
                  </td>
                  <td className={styles.tdName}>
                    <p className={`serif ${styles.name}`}>{r.name}</p>
                    <p className={styles.nameMeta}>{r.meta}</p>
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
                  <td className={`serif ${styles.tdNotes}`}>{r.noteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.moreCount > 0 && (
            <button className={`mono ${styles.moreBtn}`}>
              + {data.moreCount} more readers · view all →
            </button>
          )}
        </div>

        {/* Hotspot + themes */}
        <div className={`${styles.section} ${styles.sectionGrid}`}>
          <div>
            <div className={styles.sectionHead}>
              <span className={`mono ${styles.eyebrow}`}>Where readers are reacting</span>
              <span className={`mono ${styles.eyebrow}`}>{data.hotspotBars.reduce((a, b) => a + b, 0)} notes · {data.hotspotBars.length} ch.</span>
            </div>
            <div className={styles.histogram}>
              {data.hotspotBars.map((v, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  data-hot={i === data.hotspotHotIdx || undefined}
                  style={{ '--h': `${Math.round((v / maxBar) * 100)}%` } as CSSProperties}
                />
              ))}
            </div>
            <div className={styles.histogramLabels}>
              <span className={`mono ${styles.histLabel}`}>Ch. 1</span>
              <span className={`mono ${styles.histLabelHot}`}>Ch. {data.hotspotHotIdx + 1} — hotspot</span>
              <span className={`mono ${styles.histLabel}`}>Ch. {data.hotspotBars.length}</span>
            </div>
          </div>

          <div className={styles.themes}>
            <span className={`mono ${styles.eyebrow}`}>Feedback by theme</span>
            <div className={styles.themeList}>
              {data.themes.map((t) => (
                <div key={t.label} className={styles.themeRow}>
                  <div className={styles.themeTopRow}>
                    <span className={styles.themeLabel}>{t.label}</span>
                    <span className={`mono ${styles.themeCount}`}>{t.count}</span>
                  </div>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ '--pct': `${t.pct}%` } as CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
