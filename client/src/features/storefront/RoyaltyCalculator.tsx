import { useState } from 'react';
import styles from './RoyaltyCalculator.module.css';

const PLATFORM_RATE = 0.05;
const VOLUME_TIERS  = [10, 25, 50, 100, 250, 500];

type Format = 'ebook' | 'paperback';

const FORMAT_CONFIG: Record<Format, { min: number; max: number; step: number; default: number }> = {
  ebook:     { min: 0.99, max: 24.99, step: 0.50, default: 9.99  },
  paperback: { min: 4.99, max: 49.99, step: 0.50, default: 17.99 },
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RoyaltyCalculator() {
  const [format, setFormat] = useState<Format>('ebook');
  const [price,  setPrice]  = useState(FORMAT_CONFIG.ebook.default);

  const config  = FORMAT_CONFIG[format];
  const royalty = price * (1 - PLATFORM_RATE);

  function handleFormatChange(f: Format) {
    setFormat(f);
    setPrice(FORMAT_CONFIG[f].default);
  }

  const pct = ((price - config.min) / (config.max - config.min)) * 100;

  return (
    <div className={styles.calc}>
      <div className={styles.calcHeader}>
        <div className="label">Royalty calculator</div>
        <span className={styles.calcSub}>BOOKENDING TAKES 5% · YOU KEEP 95¢ OF EVERY DOLLAR</span>
      </div>

      <div className={styles.calcBody}>

        {/* Format toggle */}
        <div className={styles.formatRow}>
          <div className={styles.segmented}>
            <button
              className={styles.seg}
              data-active={format === 'ebook' ? '' : undefined}
              onClick={() => handleFormatChange('ebook')}
            >
              Ebook
            </button>
            <button
              className={styles.seg}
              data-active={format === 'paperback' ? '' : undefined}
              onClick={() => handleFormatChange('paperback')}
            >
              Paperback
            </button>
          </div>
        </div>

        {/* Slider column */}
        <div className={styles.sliderCol}>
          <div className={styles.priceDisplay}>
            <span className={styles.priceCurrency}>$</span>
            <span className={`serif ${styles.priceValue}`}>{fmt(price)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={config.min}
            max={config.max}
            step={config.step}
            value={price}
            style={{ '--fill': `${pct}%` } as React.CSSProperties}
            onChange={e => setPrice(parseFloat(e.target.value))}
            aria-label={`${format} price`}
          />
          <div className={styles.sliderBounds}>
            <span>${fmt(config.min)}</span>
            <span>${fmt(config.max)}</span>
          </div>
        </div>

        {/* Per-sale royalty */}
        <div className={styles.royaltyBox}>
          <span className={styles.royaltyLabel}>You earn per sale</span>
          <span className={`serif ${styles.royaltyValue}`}>${fmt(royalty)}</span>
          <span className={styles.royaltyNote}>after 5% platform fee</span>
        </div>

        {/* Monthly volume tiers */}
        <div className={styles.tiersTable}>
          <div className={styles.tiersHead}>
            <span>Monthly sales</span>
            <span>Monthly earnings</span>
            <span>Annual earnings</span>
          </div>
          {VOLUME_TIERS.map(vol => (
            <div key={vol} className={styles.tierRow}>
              <span className={styles.tierVol}>{vol} sales / mo</span>
              <span className={`serif ${styles.tierMonthly}`}>${fmt(royalty * vol)}</span>
              <span className={`serif ${styles.tierAnnual}`}>${fmt(royalty * vol * 12)}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
