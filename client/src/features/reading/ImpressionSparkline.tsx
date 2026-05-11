import { useState } from 'react';
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

const SVG_H    = 80;
const SVG_PAD  = { top: 8, bottom: 20, left: 64, right: 16 };
const STANCES  = ['Enthralled', 'Engaged', 'Curious', 'Drifting', 'Lost'] as const;

export default function ImpressionSparkline({
  chapters, impressionPoints, currentChapterId, doneChapters,
  authorFirstName, onUpdate, stanceOrder, stanceValue,
}: Props) {
  const [pickingFor, setPickingFor] = useState<number | null>(null);

  if (chapters.length === 0) return null;

  const plotW   = 580; // logical SVG width; scales via viewBox
  const innerW  = plotW - SVG_PAD.left - SVG_PAD.right;
  const innerH  = SVG_H - SVG_PAD.top - SVG_PAD.bottom;
  const maxVal  = 4; // Enthralled = 4
  const n       = chapters.length;

  const xFor = (i: number) => SVG_PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yFor = (val: number) => SVG_PAD.top + ((maxVal - val) / maxVal) * innerH;

  const pointMap = new Map(impressionPoints.map(p => [p.chapterNum, p]));

  // Build polyline segments: solid for read chapters, dashed for unread/unreleased
  type Seg = { pts: string; dashed: boolean };
  const segments: Seg[] = [];

  let solidPts: string[] = [];
  let dashedPts: string[] = [];

  chapters.forEach((ch, i) => {
    const pt = pointMap.get(ch.number);
    if (!pt) return;
    const x = xFor(i);
    const y = yFor(stanceValue[pt.stance as Stance] ?? 2);
    const isRead = doneChapters.has(ch.id);

    if (isRead) {
      if (dashedPts.length > 0) {
        segments.push({ pts: dashedPts.join(' '), dashed: true });
        dashedPts = [];
      }
      solidPts.push(`${x},${y}`);
    } else {
      if (solidPts.length > 0) {
        segments.push({ pts: solidPts.join(' '), dashed: false });
        // carry over last solid point as start of dashed segment
        dashedPts = [solidPts[solidPts.length - 1]];
        solidPts = [];
      }
      dashedPts.push(`${x},${y}`);
    }
  });
  if (solidPts.length > 0) segments.push({ pts: solidPts.join(' '), dashed: false });
  if (dashedPts.length > 0) segments.push({ pts: dashedPts.join(' '), dashed: true });

  return (
    <div className={styles.sparkWrap}>
      <div className={styles.sparkMeta}>
        <span className={styles.sparkLabel}>Your impression across the manuscript</span>
        <span className={styles.sparkHelper}>A record only you and {authorFirstName} can see.</span>
      </div>

      <svg
        className={styles.sparkSvg}
        viewBox={`0 0 ${plotW} ${SVG_H}`}
        preserveAspectRatio="none"
        aria-label="Impression sparkline"
      >
        {/* Y-axis labels */}
        {STANCES.map(s => {
          const y = yFor(stanceValue[s]);
          return (
            <text key={s} x={SVG_PAD.left - 6} y={y + 4} className={styles.yLabel} textAnchor="end">
              {s}
            </text>
          );
        })}

        {/* Polyline segments */}
        {segments.map((seg, i) =>
          seg.pts.split(' ').length > 1 ? (
            <polyline
              key={i}
              points={seg.pts}
              className={seg.dashed ? styles.lineDashed : styles.lineSolid}
            />
          ) : null
        )}

        {/* Data points */}
        {chapters.map((ch, i) => {
          const pt      = pointMap.get(ch.number);
          const isCurr  = ch.id === currentChapterId;
          const isRead  = doneChapters.has(ch.id);

          if (!pt) {
            // No impression yet — just an X-axis tick label
            return (
              <text key={ch.id} x={xFor(i)} y={SVG_H - 4} className={styles.xLabel} textAnchor="middle">
                {ch.number}
              </text>
            );
          }

          const x = xFor(i);
          const y = yFor(stanceValue[pt.stance as Stance] ?? 2);
          return (
            <g key={ch.id} className={styles.dataPoint} onClick={() => setPickingFor(ch.number)}>
              {isCurr ? (
                <circle cx={x} cy={y} r={6} className={styles.dotCurrent} />
              ) : (
                <circle cx={x} cy={y} r={4} className={isRead ? styles.dotRead : styles.dotUnread} />
              )}
              <text x={x} y={y - 10} className={isCurr ? styles.labelCurrent : styles.labelPast} textAnchor="middle">
                {isCurr ? `${pt.stance} · now` : pt.stance}
              </text>
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
