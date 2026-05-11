import { useState } from 'react';
import { Btn } from '../../shared/ui/atoms';
import { TAX_DATA, CHANNEL_INFO } from './data';
import styles from './Tax.module.css';

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function TaxView() {
  const [yearIdx, setYearIdx] = useState(0);
  const data = TAX_DATA[yearIdx];

  const totalGross = data.channels.reduce((s, c) => s + c.gross, 0);
  const totalFees  = data.channels.reduce((s, c) => s + c.fees, 0);
  const totalNet   = data.channels.reduce((s, c) => s + c.net, 0);

  return (
    <div className={styles.view}>
      <div className={styles.yearTabs}>
        {TAX_DATA.map((d, i) => (
          <button
            key={d.year}
            className={styles.yearTab}
            data-active={i === yearIdx ? 'true' : undefined}
            onClick={() => setYearIdx(i)}
          >
            {d.year}{i === 0 ? ' (YTD)' : ''}
          </button>
        ))}
        {yearIdx === 0 && (
          <span className={styles.yearNote}>Jan 1 – May 5, 2026</span>
        )}
      </div>

      <div className={styles.summaryStrip}>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Gross income</div>
          <div className={`serif ${styles.summaryValue}`}>{fmt(totalGross)}</div>
          <div className={styles.summarySub}>before platform fees</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Platform fees</div>
          <div className={`serif ${styles.summaryValue}`} data-danger="true">−{fmt(totalFees)}</div>
          <div className={styles.summarySub}>taken by channels</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Net income</div>
          <div className={`serif ${styles.summaryValue}`} data-good="true">{fmt(totalNet)}</div>
          <div className={styles.summarySub}>reportable earnings</div>
        </div>
        <div className={styles.summaryCell}>
          <div className={styles.summaryLabel}>Payouts received</div>
          <div className={`serif ${styles.summaryValue}`}>{fmt(data.payoutsReceived)}</div>
          <div className={styles.summarySub}>deposited to bank</div>
        </div>
      </div>

      <div className={styles.tableHead}>
        <span className={styles.colHead}>Channel</span>
        <span className={styles.colHead}>Gross</span>
        <span className={styles.colHead}>Fees</span>
        <span className={styles.colHead}>Net</span>
        <span className={styles.colHead}>% of net</span>
      </div>

      {data.channels.filter(c => c.gross > 0).map(c => (
        <div key={c.channel} className={styles.tableRow}>
          <span className={styles.cellChannel}>{CHANNEL_INFO[c.channel].label}</span>
          <span className={styles.cellGross}>{fmt(c.gross)}</span>
          <span className={styles.cellFees}>−{fmt(c.fees)}</span>
          <span className={styles.cellNet}>{fmt(c.net)}</span>
          <span className={styles.cellPct}>{Math.round((c.net / totalNet) * 100)}%</span>
        </div>
      ))}

      <div className={styles.totalsRow}>
        <span className={styles.totalsLabel}>Total</span>
        <span className={styles.totalsGross}>{fmt(totalGross)}</span>
        <span className={styles.totalsFees}>−{fmt(totalFees)}</span>
        <span className={styles.totalsNet}>{fmt(totalNet)}</span>
        <span />
      </div>

      <div className={styles.exportRow}>
        <Btn tone="ghost">Export CSV</Btn>
        <Btn tone="ghost">Download {data.year} summary</Btn>
      </div>

      <p className={styles.disclaimer}>
        This summary reflects earned royalties as reported by each platform and may not match
        your bank deposits — payouts lag behind earnings by 30–90 days depending on channel.
        Share this data with your accountant; Bookending does not provide tax advice.
      </p>
    </div>
  );
}
