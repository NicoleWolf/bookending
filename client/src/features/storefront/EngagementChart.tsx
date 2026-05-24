import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { EngagementPoint } from './data';
import styles from './EngagementChart.module.css';

// ── SVG layout constants ───────────────────────────────────────────
const VW = 640, VH = 136;
const PAD_T = 8, PAD_B = 28, PAD_X = 8;
const CW = VW - PAD_X * 2;
const CH = VH - PAD_T - PAD_B;

function xOf(i: number, n: number): number {
  return PAD_X + (i / (n - 1)) * CW;
}

function yOfNorm(norm: number): number {
  return PAD_T + CH * (1 - Math.max(0, Math.min(1, norm)));
}

function toPoints(vals: number[], max: number, n: number): string {
  const scale = max === 0 ? 0 : 1 / max;
  return vals.map((v, i) =>
    `${xOf(i, n).toFixed(1)},${yOfNorm(v * scale).toFixed(1)}`
  ).join(' ');
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function formatMoney(n: number): string {
  if (n >= 10000) return `$${Math.round(n / 1000)}k`;
  if (n >= 1000)  return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

// X-axis tick positions (indices into data array)
const TICKS = [0, 7, 14, 21, 29];

// ── Component ──────────────────────────────────────────────────────
export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return null;

  const n = data.length;
  const revMax  = Math.max(...data.map(d => d.revenue),   1);
  const rev2Max = Math.max(...data.map(d => d.reviews),   1);
  const qaMax   = Math.max(...data.map(d => d.qa),        1);
  const folMax  = Math.max(...data.map(d => d.followers), 1);

  const totalRev  = data.reduce((s, d) => s + d.revenue,   0);
  const totalRev2 = data.reduce((s, d) => s + d.reviews,   0);
  const totalQa   = data.reduce((s, d) => s + d.qa,        0);
  const totalFol  = data.reduce((s, d) => s + d.followers, 0);

  const barW = Math.max(2, (CW / n) * 0.55);
  const h    = hover !== null ? data[hover] : null;

  // Tooltip x position as % of SVG width, for CSS left
  const tooltipLeft = hover !== null
    ? `${(xOf(hover, n) / VW * 100).toFixed(2)}%`
    : '0%';
  const tooltipSide = hover !== null
    ? (hover < n * 0.25 ? 'right' : hover > n * 0.75 ? 'left' : 'center')
    : 'center';

  return (
    <section className={styles.section}>

      {/* ── Header + legend ───────────────────────────────────── */}
      <div className={styles.head}>
        <span className={styles.eyebrow}>Engagement · last 30 days</span>
        <div className={styles.legend} aria-hidden="true">
          <span className={`${styles.legendDot} ${styles.legendDotRev}`} />
          <span className={styles.legendLabel}>Revenue</span>
          <span className={`${styles.legendDot} ${styles.legendDotReviews}`} />
          <span className={styles.legendLabel}>Reviews</span>
          <span className={`${styles.legendDot} ${styles.legendDotQa}`} />
          <span className={styles.legendLabel}>Q&amp;A</span>
          <span className={`${styles.legendDot} ${styles.legendDotFol}`} />
          <span className={styles.legendLabel}>Followers</span>
        </div>
      </div>

      {/* ── 30-day totals strip ───────────────────────────────── */}
      <div className={styles.statStrip}>
        <div className={styles.stat}>
          <span className={`serif ${styles.statVal}`}>{formatMoney(totalRev)}</span>
          <span className={styles.statLabel}>revenue</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={`serif ${styles.statVal}`}>{totalRev2}</span>
          <span className={styles.statLabel}>reviews</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={`serif ${styles.statVal}`}>{totalQa}</span>
          <span className={styles.statLabel}>Q&amp;A replies</span>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={`serif ${styles.statVal}`}>+{totalFol}</span>
          <span className={styles.statLabel}>new followers</span>
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────────── */}
      <div className={styles.chartWrap}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className={styles.svg}
          role="img"
          aria-label="30-day engagement chart showing revenue, reviews, Q&A replies, and follower growth"
        >
          {/* Revenue bars */}
          {data.map((d, i) => {
            const barH = d.revenue > 0
              ? Math.max((d.revenue / revMax) * CH, 3)
              : 0;
            return (
              <rect
                key={i}
                x={xOf(i, n) - barW / 2}
                y={PAD_T + CH - barH}
                width={barW}
                height={barH}
                className={styles.revBar}
                data-hover={hover === i ? '' : undefined}
              />
            );
          })}

          {/* Community engagement lines */}
          <polyline
            points={toPoints(data.map(d => d.reviews),   rev2Max, n)}
            className={styles.lineReviews}
          />
          <polyline
            points={toPoints(data.map(d => d.qa),        qaMax,   n)}
            className={styles.lineQa}
          />
          <polyline
            points={toPoints(data.map(d => d.followers), folMax,  n)}
            className={styles.lineFollowers}
          />

          {/* Small dots at non-zero community values */}
          {data.map((d, i) => (
            <g key={i} className={styles.dotGroup}>
              {d.reviews   > 0 && <circle cx={xOf(i, n)} cy={yOfNorm(d.reviews   / rev2Max)} r={hover === i ? 4 : 2} className={styles.dotReviews}  />}
              {d.qa        > 0 && <circle cx={xOf(i, n)} cy={yOfNorm(d.qa        / qaMax)}   r={hover === i ? 4 : 2} className={styles.dotQa}       />}
              {d.followers > 0 && <circle cx={xOf(i, n)} cy={yOfNorm(d.followers / folMax)}  r={hover === i ? 4 : 2} className={styles.dotFollowers}/>}
            </g>
          ))}

          {/* Event markers below chart area */}
          {data.map((d, i) => d.note && (
            <circle
              key={`note-${i}`}
              cx={xOf(i, n)}
              cy={PAD_T + CH + 11}
              r={3}
              className={styles.noteDot}
            />
          ))}

          {/* Hover indicator line */}
          {hover !== null && (
            <line
              x1={xOf(hover, n)} y1={PAD_T}
              x2={xOf(hover, n)} y2={PAD_T + CH}
              className={styles.hoverLine}
            />
          )}

          {/* Invisible hit areas — one per day */}
          {data.map((_, i) => (
            <rect
              key={`hit-${i}`}
              x={xOf(i, n) - CW / n / 2}
              y={PAD_T}
              width={CW / n}
              height={CH}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}

          {/* X-axis date labels */}
          {TICKS.map((idx, k) => {
            const safeIdx = Math.min(idx, n - 1);
            return (
              <text
                key={idx}
                x={xOf(safeIdx, n)}
                y={VH - 6}
                className={styles.axisLabel}
                textAnchor={k === 0 ? 'start' : k === TICKS.length - 1 ? 'end' : 'middle'}
              >
                {formatDate(data[safeIdx].date)}
              </text>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hover !== null && h !== null && (
          <div
            className={styles.tooltip}
            data-side={tooltipSide}
            style={{ '--tx': tooltipLeft } as CSSProperties}
            aria-hidden="true"
          >
            <div className={styles.tooltipDate}>{formatDate(h.date)}</div>
            {h.revenue > 0 && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.tooltipSwatch} ${styles.swatchRev}`} />
                ${h.revenue.toLocaleString()} revenue
              </div>
            )}
            {h.reviews > 0 && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.tooltipSwatch} ${styles.swatchReviews}`} />
                {h.reviews} {h.reviews === 1 ? 'review' : 'reviews'}
              </div>
            )}
            {h.qa > 0 && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.tooltipSwatch} ${styles.swatchQa}`} />
                {h.qa} Q&A {h.qa === 1 ? 'reply' : 'replies'}
              </div>
            )}
            {h.followers > 0 && (
              <div className={styles.tooltipRow}>
                <span className={`${styles.tooltipSwatch} ${styles.swatchFol}`} />
                +{h.followers} followers
              </div>
            )}
            {h.revenue === 0 && h.reviews === 0 && h.qa === 0 && h.followers === 0 && (
              <div className={styles.tooltipEmpty}>No activity</div>
            )}
            {h.note && <div className={styles.tooltipNote}>{h.note}</div>}
          </div>
        )}
      </div>

    </section>
  );
}
