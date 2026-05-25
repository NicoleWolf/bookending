import type { CSSProperties } from 'react';
import { ATTRIBUTION_DATA } from './data';
import styles from './AttributionView.module.css';

const TOTAL_REVENUE = ATTRIBUTION_DATA.reduce((s, c) => s + c.revenue, 0);
const TOTAL_ORDERS  = ATTRIBUTION_DATA.reduce((s, c) => s + c.orders, 0);
const HIGHLIGHT_PCT = 20;

export function AttributionView() {
  return (
    <div className={styles.root}>
      <div className={styles.previewBanner}>
        <span className="label" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
          PREVIEW DATA · Live attribution tracking coming soon
        </span>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={`serif ${styles.summaryNum}`}>${TOTAL_REVENUE.toLocaleString()}</span>
          <span className={styles.summaryLabel}>Total attributed revenue</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`serif ${styles.summaryNum}`}>{TOTAL_ORDERS}</span>
          <span className={styles.summaryLabel}>Orders tracked</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`serif ${styles.summaryNum}`}>{ATTRIBUTION_DATA.length}</span>
          <span className={styles.summaryLabel}>Channels</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`serif ${styles.summaryNum}`}>${Math.round(TOTAL_REVENUE / TOTAL_ORDERS)}</span>
          <span className={styles.summaryLabel}>Avg order value</span>
        </div>
      </div>

      <div className={styles.sectionLabel}>
        <span className="label">Sales by channel · May 9 – May 24 launch window</span>
      </div>

      <div className={styles.channels}>
        {ATTRIBUTION_DATA.map(ch => {
          const highlight = ch.pct > HIGHLIGHT_PCT;
          return (
            <div
              key={ch.id}
              className={styles.channel}
              data-highlight={highlight ? '' : undefined}
            >
              <div className={styles.channelHead}>
                <div className={styles.channelMeta}>
                  <span className={`serif ${styles.channelLabel}`}>{ch.label}</span>
                  {highlight && (
                    <span className={styles.highlightPill}>Top channel</span>
                  )}
                </div>
                <span className={`serif ${styles.channelPct}`}>{ch.pct}%</span>
              </div>

              <div className={styles.channelDesc}>{ch.description}</div>

              <div
                className={styles.barTrack}
                role="meter"
                aria-label={`${ch.label}: ${ch.pct}% of revenue`}
                aria-valuenow={ch.pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={styles.barFill}
                  style={{ '--w': `${ch.pct}%` } as CSSProperties}
                />
              </div>

              <div className={styles.channelStats}>
                <div className={styles.statPair}>
                  <span className={styles.statKey}>Revenue</span>
                  <span className={`serif ${styles.statVal}`}>${ch.revenue.toLocaleString()}</span>
                </div>
                <div className={styles.statPair}>
                  <span className={styles.statKey}>Orders</span>
                  <span className={`serif ${styles.statVal}`}>{ch.orders}</span>
                </div>
                <div className={styles.statPair}>
                  <span className={styles.statKey}>Avg order</span>
                  <span className={`serif ${styles.statVal}`}>${ch.avgOrder}</span>
                </div>
                <div className={styles.statPair}>
                  <span className={styles.statKey}>Timing</span>
                  <span className={styles.statVal}>{ch.timing}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.playbook}>
        <div className={`label ${styles.playbookLabel}`}>Repeat for your next launch</div>
        <div className={styles.playbookGrid}>
          {ATTRIBUTION_DATA.map(ch => (
            <div key={ch.id} className={styles.playbookItem}>
              <div className={styles.playbookChannel}>{ch.label}</div>
              <div className={styles.playbookRec}>{ch.repeat}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
