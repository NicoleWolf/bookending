import type { HubFollowingAuthor } from '@bookending/shared';
import styles from './Hub.module.css';

interface FollowingRowProps {
  authors: HubFollowingAuthor[];
}

function activityMeta(author: HubFollowingAuthor): string {
  switch (author.activityType) {
    case 'chapter_shipped': return `SHIPPED CHAPTER ${author.activityMeta ?? '–'}`;
    case 'new_manuscript':  return 'NEW MANUSCRIPT IN DRAFT';
    case 'next_book_est':   return `NEXT BOOK EST. ${author.activityMeta ?? '–'}`;
    default:                return 'NO RECENT ACTIVITY';
  }
}

export default function FollowingRow({ authors }: FollowingRowProps) {
  if (authors.length === 0) return null;

  const tiles = authors.slice(0, 3);
  const padCount = Math.max(0, 3 - tiles.length);

  return (
    <div className={styles.followingRow}>
      {tiles.map(a => (
        <div key={a.id} className={styles.followingTile}>
          <div className={`serif ${styles.followingName}`}>{a.name}</div>
          <div className={styles.followingActivity}>{activityMeta(a)}</div>
        </div>
      ))}
      {Array.from({ length: padCount }).map((_, i) => (
        <button key={`pad-${i}`} className={`${styles.followingTile} ${styles.followingTilePad}`}>
          Find writers to follow →
        </button>
      ))}
    </div>
  );
}
