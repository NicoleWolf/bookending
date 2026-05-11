import type { CSSProperties } from 'react';
import { Bars } from '../../shared/ui/atoms';
import {
  OVERVIEW_STATS,
  OVERVIEW_CHART_VALUES,
  DAILY_ROLLUPS,
  TITLE_EARNINGS,
  CHANNEL_INFO,
} from './data';
import styles from './OverviewView.module.css';

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function OverviewView() {
  const recentRollups = [...DAILY_ROLLUPS].reverse().slice(0, 15);

  const totalNet = TITLE_EARNINGS.flatMap(t => t.channels).reduce((s, c) => s + c.net, 0);
  const channelTotals = (['direct', 'kdp', 'ingram', 'other'] as const).map(ch => {
    const net = TITLE_EARNINGS.flatMap(t => t.channels)
      .filter(c => c.channel === ch)
      .reduce((s, c) => s + c.net, 0);
    return { channel: ch, net };
  }).sort((a, b) => b.net - a.net);

  return (
    <div>
      <div className={styles.statsStrip}>
        {OVERVIEW_STATS.map(s => (
          <div key={s.label} className={styles.statCell}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={`serif ${styles.statValue}`}>{s.value}</div>
            <div className={styles.statSub}>{s.sub}</div>
            <div className={styles.statDetail}>{s.detail}</div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftPanel}>
          <div className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <span className={styles.chartTitle}>Daily net earnings — last 30 days</span>
              <span className={styles.chartRange}>Apr 6 – May 5</span>
            </div>
            <Bars values={OVERVIEW_CHART_VALUES} w={620} h={56} color="var(--good)" />
            <div className={styles.chartDates}>
              <span className={styles.chartDate}>Apr 6</span>
              <span className={styles.chartDate}>May 5</span>
            </div>
          </div>

          <div>
            <div className={styles.tableHead}>
              <span className={styles.colHeader}>Date</span>
              <span className={styles.colHeader}>Channel</span>
              <span className={styles.colHeader}>Units</span>
              <span className={styles.colHeader}>Gross</span>
              <span className={styles.colHeader}>Net</span>
            </div>
            {recentRollups.map((r, i) => (
              <div key={i} className={styles.tableRow}>
                <span className={styles.cellDate}>{r.date}</span>
                <span className={styles.cellChannel}>{CHANNEL_INFO[r.channel].label}</span>
                <span className={styles.cellUnits}>{r.units}</span>
                <span className={styles.cellGross}>{fmt(r.gross)}</span>
                <span className={styles.cellNet}>{fmt(r.net)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.channelSidebar}>
          <div className={styles.sidebarHead}>Net by channel</div>
          <div className={styles.channelRows}>
            {channelTotals.map(({ channel, net }) => {
              if (net === 0) return null;
              const pct = Math.round((net / totalNet) * 100);
              return (
                <div key={channel} className={styles.channelRow}>
                  <div className={styles.channelRowTop}>
                    <span className={styles.channelName}>{CHANNEL_INFO[channel].label}</span>
                    <span className={styles.channelNet}>{fmt(net)}</span>
                  </div>
                  <div className={styles.channelBar}>
                    <div
                      className={styles.channelBarFill}
                      style={{ '--pct': `${pct}%` } as CSSProperties}
                    />
                  </div>
                  <span className={styles.channelPct}>{pct}% of total net</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
