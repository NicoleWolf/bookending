import { useState, useRef, useEffect } from 'react';
import type { ImpressionPointRecord } from './types';
import type { Chapter } from './types';
import type { Stance } from './data';
import styles from './ImpressionSparkline.module.css';

interface Props {
  chapters:         Pick<Chapter, 'id' | 'number' | 'title'>[];
  impressionPoints: ImpressionPointRecord[];
  currentChapterId: number | null;
  doneChapters:     Set<number>;
  authorFirstName:  string;
  onUpdate:         (chapterNum: number, stance: string) => void;
  stanceOrder:      readonly Stance[];
  stanceValue:      Record<Stance, number>;
}

const SVG_H   = 130;
const SVG_PAD = { top: 28, bottom: 20, left: 130, right: 30 };
const STANCES = ['Enthralled', 'Engaged', 'Curious', 'Drifting', 'Lost'] as const;

export default function ImpressionSparkline({
  chapters, impressionPoints, currentChapterId, doneChapters,
  authorFirstName, onUpdate, stanceOrder, stanceValue,
}: Props) {
  const [pickingFor, setPickingFor] = useState<number | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(580);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setSvgWidth(Math.floor(entries[0].contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (chapters.length === 0) return null;

  const innerW = svgWidth - SVG_PAD.left - SVG_PAD.right;
  const innerH = SVG_H - SVG_PAD.top - SVG_PAD.bottom;
  const maxVal = 4;
  const n      = chapters.length;

  const xFor = (i: number) =>
    SVG_PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (val: number) =>
    SVG_PAD.top + ((maxVal - val) / maxVal) * innerH;

  const pointMap = new Map(impressionPoints.map(p => [p.chapterNum, p]));

  // Option A: solid line only through read chapters that have a stance
  const readPts: string[] = [];
  chapters.forEach((ch, i) => {
    const pt = pointMap.get(ch.number);
    if (pt && doneChapters.has(ch.id)) {
      readPts.push(
        `${xFor(i).toFixed(1)},${yFor(stanceValue[pt.stance as Stance] ?? 2).toFixed(1)}`
      );
    }
  });

  return (
    <div className={styles.sparkWrap} ref={wrapRef}>
      <div className={styles.sparkMeta}>
        <span className={styles.sparkLabel}>Your impression across the manuscript</span>
        <span className={styles.sparkHelper}>A record only you and {authorFirstName} can see.</span>
      </div>

      <svg
        className={styles.sparkSvg}
        width={svgWidth}
        height={SVG_H}
        aria-label="Impression sparkline"
      >
        {/* Gridlines + y-axis labels */}
        {STANCES.map(s => {
          const y = yFor(stanceValue[s]);
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

        {/* Solid line — read chapters with stances only */}
        {readPts.length > 1 && (
          <polyline points={readPts.join(' ')} className={styles.lineSolid} />
        )}

        {/* Data points */}
        {chapters.map((ch, i) => {
          const pt     = pointMap.get(ch.number);
          const isCurr = ch.id === currentChapterId;
          const isRead = doneChapters.has(ch.id);
          const x      = xFor(i);

          if (!pt) {
            const yMid = SVG_PAD.top + innerH / 2;
            return (
              <g key={ch.id} className={styles.dataPoint} onClick={() => setPickingFor(ch.number)}>
                <circle cx={x} cy={yMid} r={3} className={styles.dotGhost} />
                <text x={x} y={SVG_H - 4} className={styles.xLabel} textAnchor="middle">
                  {ch.number}
                </text>
              </g>
            );
          }

          const y = yFor(stanceValue[pt.stance as Stance] ?? 2);
          return (
            <g key={ch.id} className={styles.dataPoint} onClick={() => setPickingFor(ch.number)}>
              {isCurr ? (
                <>
                  <circle cx={x} cy={y} r={6} className={styles.dotCurrent} />
                </>
              ) : (
                <circle cx={x} cy={y} r={4} className={isRead ? styles.dotRead : styles.dotUnread} />
              )}
              <text x={x} y={SVG_H - 4} className={styles.xLabel} textAnchor="middle">
                {ch.number}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Stance picker */}
      {pickingFor !== null && (
        <div className={styles.picker}>
          <span className={styles.pickerLabel}>Update impression for Ch. {pickingFor}:</span>
          {stanceOrder.map(s => (
            <button
              key={s}
              className={styles.pickerBtn}
              data-active={pointMap.get(pickingFor)?.stance === s ? 'true' : undefined}
              onClick={() => { onUpdate(pickingFor, s); setPickingFor(null); }}
            >
              {s}
            </button>
          ))}
          <button className={styles.pickerCancel} onClick={() => setPickingFor(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
