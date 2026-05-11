import type { CSSProperties } from 'react';
import type { HubFinishedItem } from '@bookending/shared';
import styles from './Hub.module.css';

const VERDICT_COLORS: Record<string, string> = {
  'Enthralled':    '#0F6E56',
  'Moved':         '#534AB7',
  'Admiring':      '#185FA5',
  'Curious':       '#854F0B',
  'Unconvinced':   '#5F5E5A',
  'Lost interest': '#888780',
};

function formatMonth(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase();
}

interface FinishedCardProps {
  item: HubFinishedItem;
}

export default function FinishedCard({ item }: FinishedCardProps) {
  const { title, authorName, finishedAt, verdict, impression, totalChapters } = item;

  const verdictColor = verdict ? (VERDICT_COLORS[verdict] ?? '#5F5E5A') : null;
  const truncatedImpression = impression && impression.length > 280
    ? impression.slice(0, 280) + '…'
    : impression;

  return (
    <div className={styles.finishedCard}>
      <div className={styles.finishedCover} />
      <div className={styles.finishedContent}>
        <div className={styles.finishedTitle}>{title ?? item.manuscriptRef}</div>
        <div className={styles.finishedMeta}>
          FINISHED {formatMonth(finishedAt)}
          {totalChapters > 0 && ` · ${totalChapters} CHAPTERS`}
          {authorName && ` · BY ${authorName.toUpperCase()}`}
        </div>

        {verdict && (
          <>
            <div className={styles.finishedVerdictRow}>
              <span className={styles.finishedVerdictLabel}>YOUR VERDICT</span>
              <em
                className={`serif ${styles.finishedVerdictWord}`}
                style={{ '--verdict-c': verdictColor } as CSSProperties}
              >
                {verdict}
              </em>
            </div>
            <div className={styles.finishedVerdictRule} />
          </>
        )}

        {truncatedImpression && (
          <p className={`serif ${styles.finishedImpression}`}>
            "{truncatedImpression}"
          </p>
        )}

        <div className={styles.finishedActions}>
          <button className={styles.finishedActionBtn}>Edit impression →</button>
          <button className={styles.finishedActionBtn}>Recommend to a circle</button>
          <button className={styles.finishedActionBtn}>Revisit</button>
        </div>
      </div>
    </div>
  );
}
