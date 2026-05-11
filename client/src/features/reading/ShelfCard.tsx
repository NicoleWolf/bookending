import type { HubShelfItem } from '@bookending/shared';
import styles from './Hub.module.css';

interface ShelfCardProps {
  item:      HubShelfItem;
  onBegin:   (msRef: string) => void;
  onRemove:  (msRef: string) => void;
}

function reasonLine(item: HubShelfItem): string {
  switch (item.source) {
    case 'self_saved':
      return 'You saved this from Discover.';
    case 'recommended_algo':
      return `The house thinks this matches your ${item.recommendationDimension ?? 'reading profile'}.`;
    case 'recommended_editorial':
      return 'An editorial pick this season.';
    case 'recommended_circle':
      return item.circleCount
        ? `${item.circleCount} reader${item.circleCount !== 1 ? 's' : ''} in your circle have started this.`
        : 'Readers in your circle have started this.';
    default:
      return 'Saved to your shelf.';
  }
}

export default function ShelfCard({ item, onBegin, onRemove }: ShelfCardProps) {
  const { manuscriptRef, title, authorName, genre, totalChapters, draftLabel, source } = item;
  const isRecommended = source !== 'self_saved';

  const metaParts = [
    draftLabel,
    totalChapters > 0 ? `${totalChapters} CHAPTERS` : null,
    genre,
  ].filter(Boolean);

  return (
    <div className={styles.shelfCard}>
      <div className={styles.shelfCover} />
      <div className={styles.shelfContent}>
        <div className={styles.shelfTitle}>{title ?? manuscriptRef}</div>
        {metaParts.length > 0 && (
          <div className={styles.shelfMeta}>{metaParts.join(' · ').toUpperCase()}</div>
        )}
        {authorName && <div className={styles.shelfAuthor}>{authorName}</div>}
        <p className={`serif ${styles.shelfReason}`}>{reasonLine(item)}</p>
        <div className={styles.shelfActions}>
          <button className={styles.shelfActionPrimary} onClick={() => onBegin(manuscriptRef)}>
            Begin reading →
          </button>
          {isRecommended
            ? <button className={styles.shelfActionSecondary}>Why this?</button>
            : <button className={styles.shelfActionSecondary} onClick={() => onRemove(manuscriptRef)}>Remove</button>
          }
        </div>
      </div>
    </div>
  );
}
