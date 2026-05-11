import { BookCover } from '../../shared/ui/atoms';
import { TITLE_EARNINGS, CHANNEL_INFO } from './data';
import type { BookMetadata } from '../library/data';
import styles from './ByTitle.module.css';

const fmt = (n: number) => `$${n.toFixed(2)}`;

interface ByTitleViewProps {
  savedBooks?: Record<number, BookMetadata>;
}

export function ByTitleView({ savedBooks }: ByTitleViewProps) {
  return (
    <div className={styles.view}>
      {TITLE_EARNINGS.map(title => {
        const totalUnits = title.channels.reduce((s, c) => s + c.units, 0);
        const totalGross = title.channels.reduce((s, c) => s + c.gross, 0);
        const totalFees  = title.channels.reduce((s, c) => s + (c.gross - c.net), 0);
        const totalNet   = title.channels.reduce((s, c) => s + c.net, 0);

        return (
          <div key={title.id} className={styles.titleSection}>
            <div className={styles.titleHeader}>
              <div className={styles.titleCover}>
                <BookCover
                  title={savedBooks?.[title.id]?.title ?? title.title}
                  scheme={(title.id - 1) % 5}
                />
              </div>
              <div className={styles.titleInfo}>
                <h3 className={`serif ${styles.titleName}`}>
                  {savedBooks?.[title.id]?.title ?? title.title}
                </h3>
                <div className={styles.titleGenre}>
                  {savedBooks?.[title.id]?.genre ?? title.genre}
                </div>
              </div>
              <div className={styles.titleTotals}>
                <div className={styles.totalStat}>
                  <span className={styles.totalLabel}>Units</span>
                  <span className={`serif ${styles.totalValue}`}>{totalUnits}</span>
                </div>
                <div className={styles.totalStat}>
                  <span className={styles.totalLabel}>Gross</span>
                  <span className={`serif ${styles.totalValue}`}>{fmt(totalGross)}</span>
                </div>
                <div className={styles.totalStat}>
                  <span className={styles.totalLabel}>Net</span>
                  <span className={`serif ${styles.totalValue}`} data-good={totalNet > 0 ? 'true' : undefined}>
                    {fmt(totalNet)}
                  </span>
                </div>
              </div>
            </div>

            {title.channels.length === 0 ? (
              <div className={styles.emptyState}>No sales recorded yet.</div>
            ) : (
              <>
                <div className={styles.channelTableHead}>
                  <span className={styles.colHead}>Channel</span>
                  <span className={styles.colHead}>Cut</span>
                  <span className={styles.colHead}>Units</span>
                  <span className={styles.colHead}>Avg. price</span>
                  <span className={styles.colHead}>Gross</span>
                  <span className={styles.colHead}>Fees</span>
                  <span className={styles.colHead}>Net</span>
                </div>

                {title.channels.map(ch => {
                  const fees = ch.gross - ch.net;
                  return (
                    <div key={ch.channel} className={styles.channelRow}>
                      <span className={styles.cellLabel}>{CHANNEL_INFO[ch.channel].label}</span>
                      <span className={styles.cellCut}>{CHANNEL_INFO[ch.channel].cut}%</span>
                      <span className={styles.cellNum}>{ch.units}</span>
                      <span className={styles.cellNum}>{fmt(ch.price)}</span>
                      <span className={styles.cellNum}>{fmt(ch.gross)}</span>
                      <span className={styles.cellFee}>−{fmt(fees)}</span>
                      <span className={styles.cellNetValue}>{fmt(ch.net)}</span>
                    </div>
                  );
                })}

                <div className={styles.totalsRow}>
                  <span className={styles.totalsLabel}>Total</span>
                  <span className={styles.totalsNum} />
                  <span className={styles.totalsNum}>{totalUnits}</span>
                  <span className={styles.totalsNum} />
                  <span className={styles.totalsNum}>{fmt(totalGross)}</span>
                  <span className={styles.totalsNum} data-danger="true">−{fmt(totalFees)}</span>
                  <span className={styles.totalsNum} data-good="true">{fmt(totalNet)}</span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
