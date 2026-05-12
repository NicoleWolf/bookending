import { useRef, useEffect, useState } from 'react';
import styles from './WriterSparkline.module.css';

const SVG_H   = 130;
const SVG_PAD = { top: 28, bottom: 20, left: 130, right: 30 };
const STANCES = ['Enthralled', 'Engaged', 'Curious', 'Drifting', 'Lost'] as const;
const STANCE_VAL: Record<string, number> = {
  Enthralled: 4, Engaged: 3, Curious: 2, Drifting: 1, Lost: 0,
};
// Multi-reader palette — accent red is reserved for single-reader filtered view
const READER_COLORS = ['#7eb8c9', '#c9a07e', '#9e7ec9', '#7ec9a5', '#c97e7e'];

export interface ReaderImpression {
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  points:         { chapterNum: number; stance: string }[];
}

interface Props {
  readers:       ReaderImpression[];
  totalChapters: number;
}

export default function WriterSparkline({ readers, totalChapters }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(500);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setSvgWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (readers.length === 0 || totalChapters === 0) return null;

  const innerW   = svgWidth - SVG_PAD.left - SVG_PAD.right;
  const innerH   = SVG_H - SVG_PAD.top - SVG_PAD.bottom;
  const isSingle = readers.length === 1;

  const xFor = (chNum: number) =>
    SVG_PAD.left + (totalChapters === 1
      ? innerW / 2
      : ((chNum - 1) / (totalChapters - 1)) * innerW);
  const yFor = (val: number) =>
    SVG_PAD.top + ((4 - val) / 4) * innerH;

  const allChapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.head}>
        <span className={styles.label}>Reader Impressions</span>
        <div className={styles.legend}>
          {readers.map((r, i) => (
            <span key={r.readerId} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: isSingle ? 'var(--accent)' : READER_COLORS[i % READER_COLORS.length] }}
              />
              {r.readerName.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      <svg
        className={styles.svg}
        width={svgWidth}
        height={SVG_H}
        aria-label="Reader impressions"
      >
        {/* Gridlines + y-axis labels */}
        {STANCES.map(s => {
          const y = yFor(STANCE_VAL[s]);
          return (
            <g key={s}>
              <line
                x1={SVG_PAD.left} y1={y}
                x2={svgWidth - SVG_PAD.right} y2={y}
                className={styles.gridLine}
              />
              <text x={SVG_PAD.left - 10} y={y + 4} className={styles.yLabel} textAnchor="end">
                {s}
              </text>
            </g>
          );
        })}

        {/* X-axis ticks */}
        {allChapters.map(chNum => (
          <text key={`x-${chNum}`} x={xFor(chNum)} y={SVG_H - 4} className={styles.xLabel} textAnchor="middle">
            {chNum}
          </text>
        ))}

        {/* Single-reader: ghost dots for chapters without data */}
        {isSingle && allChapters.map(chNum => {
          if (readers[0].points.some(p => p.chapterNum === chNum)) return null;
          return (
            <circle
              key={`ghost-${chNum}`}
              cx={xFor(chNum)}
              cy={SVG_PAD.top + innerH / 2}
              r={3}
              className={styles.dotGhost}
            />
          );
        })}

        {/* Per-reader lines + dots */}
        {readers.map((r, i) => {
          const color  = isSingle ? 'var(--accent)' : READER_COLORS[i % READER_COLORS.length];
          const sorted = [...r.points].sort((a, b) => a.chapterNum - b.chapterNum);
          const polyPts = sorted
            .map(p => `${xFor(p.chapterNum).toFixed(1)},${yFor(STANCE_VAL[p.stance] ?? 2).toFixed(1)}`)
            .join(' ');

          return (
            <g key={r.readerId}>
              {sorted.length > 1 && (
                <polyline
                  points={polyPts}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSingle ? 1 : 1.5}
                  opacity={isSingle ? 1 : 0.75}
                />
              )}
              {sorted.map(p => (
                isSingle ? (
                  <circle
                    key={p.chapterNum}
                    cx={xFor(p.chapterNum)}
                    cy={yFor(STANCE_VAL[p.stance] ?? 2)}
                    r={4}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                  />
                ) : (
                  <circle
                    key={p.chapterNum}
                    cx={xFor(p.chapterNum)}
                    cy={yFor(STANCE_VAL[p.stance] ?? 2)}
                    r={3}
                    fill={color}
                  />
                )
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
