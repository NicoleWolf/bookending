import type { CSSProperties } from 'react';
import { TITLE_EARNINGS, CHANNEL_INFO } from './data';
import type { Channel } from './types';
import styles from './ByChannel.module.css';

const fmt = (n: number) => `$${n.toFixed(2)}`;
const CHANNELS: Channel[] = ['direct', 'kdp', 'ingram', 'other'];

export function ByChannelView() {
  const channelData = CHANNELS.map(ch => {
    const rows = TITLE_EARNINGS.flatMap(t => t.channels).filter(c => c.channel === ch);
    return {
      channel: ch,
      units: rows.reduce((s, c) => s + c.units, 0),
      gross: rows.reduce((s, c) => s + c.gross, 0),
      net:   rows.reduce((s, c) => s + c.net, 0),
    };
  });

  const maxNet = Math.max(...channelData.map(c => c.net), 1);

  return (
    <div className={styles.view}>
      <div className={styles.cardsGrid}>
        {channelData.map(({ channel, units, gross, net }) => {
          const info = CHANNEL_INFO[channel];
          const pct = Math.round((net / maxNet) * 100);
          return (
            <div key={channel} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.cardName}>{info.label}</span>
                <span className={styles.cardCut}>{info.cut}% cut</span>
              </div>

              <div className={styles.cardNetLabel}>Net earned</div>
              <div className={`serif ${styles.cardNetValue}`} data-nonzero={net > 0 ? 'true' : undefined}>
                {fmt(net)}
              </div>

              <div className={styles.cardBar}>
                <div
                  className={styles.cardBarFill}
                  style={{ '--pct': `${pct}%` } as CSSProperties}
                />
              </div>

              <div className={styles.cardStats}>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatLabel}>Units</span>
                  <span className={styles.cardStatValue}>{units}</span>
                </div>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatLabel}>Gross</span>
                  <span className={styles.cardStatValue}>{fmt(gross)}</span>
                </div>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatLabel}>Fees taken</span>
                  <span className={styles.cardStatValue}>−{fmt(gross - net)}</span>
                </div>
              </div>

              <div className={styles.cardSchedule}>{info.schedule}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.comparisonHead}>Net earnings comparison</div>
      <div className={styles.compRows}>
        {channelData
          .filter(c => c.net > 0)
          .sort((a, b) => b.net - a.net)
          .map(({ channel, units, net }) => (
            <div key={channel} className={styles.compRow}>
              <span className={styles.compLabel}>{CHANNEL_INFO[channel].label}</span>
              <div className={styles.compBar}>
                <div
                  className={styles.compBarFill}
                  style={{ '--pct': `${Math.round((net / maxNet) * 100)}%` } as CSSProperties}
                />
              </div>
              <span className={styles.compNet}>{fmt(net)}</span>
              <span className={styles.compUnits}>{units} units</span>
            </div>
          ))}
      </div>
    </div>
  );
}
