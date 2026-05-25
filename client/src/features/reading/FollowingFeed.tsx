import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import { timeAgo } from '../notifications/data';
import styles from './FollowingFeed.module.css';

export interface FeedItem {
  id:             string;
  type:           'milestone' | 'post' | 'launch' | 'arc';
  authorId:       string;
  authorName:     string;
  authorInitials: string;
  headline:       string;   // e.g. "Hit 50,000 words on The Last Cartographer"
  detail?:        string;   // optional subtitle / book title
  createdAt:      string;   // ISO
  bookId?:        string;   // present for launch type
  firstIn30Days:  boolean;
}

const TYPE_LABEL: Record<FeedItem['type'], string> = {
  milestone: 'Milestone',
  post:      'New post',
  launch:    'Book launch',
  arc:       'ARC open',
};

function toneClass(authorId: string): string {
  const tones = ['accent', 'gold', 'muted', 'good', 'paper'];
  const sum = authorId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return tones[sum % tones.length]!;
}

interface Props {
  onViewListing?: (bookId: string) => void;
  onGoToProfile?: (authorId: string, tab?: string) => void;
}

export default function FollowingFeed({ onViewListing, onGoToProfile }: Props) {
  const { session } = useAuth();
  const [items,   setItems]   = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) { setLoading(false); return; }
    void api.get<FeedItem[]>('/api/following/feed')
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [session?.token]);

  if (loading) return <div className={styles.skeleton} aria-busy="true" aria-label="Loading feed" />;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={`serif ${styles.emptyHeadline}`}>No updates yet.</p>
        <p className={styles.emptyBody}>
          When authors you follow hit milestones, post chapters, or launch books, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.feed} role="feed" aria-label="Updates from authors you follow">
      {items.map(item => (
        <article
          key={item.id}
          className={styles.item}
          data-type={item.type}
          data-fresh={item.firstIn30Days ? '' : undefined}
        >
          {item.firstIn30Days && (
            <div className={styles.freshBadge}>
              <span aria-hidden="true">★</span> Back after a while
            </div>
          )}

          <div className={styles.itemRow}>
            <div
              className={styles.avatar}
              data-tone={toneClass(item.authorId)}
              aria-hidden="true"
            >
              {item.authorInitials}
            </div>

            <div className={styles.itemBody}>
              <div className={styles.itemHead}>
                <button
                  className={styles.authorName}
                  type="button"
                  onClick={() => onGoToProfile?.(item.authorId)}
                >
                  {item.authorName}
                </button>
                <span className={styles.typeBadge}>{TYPE_LABEL[item.type]}</span>
              </div>

              <p className={styles.headline}>{item.headline}</p>
              {item.detail && <p className={styles.detail}>{item.detail}</p>}

              <div className={styles.itemFoot}>
                <span className={styles.timestamp}>{timeAgo(item.createdAt)}</span>
                {item.type === 'launch' && item.bookId && onViewListing && (
                  <button
                    className={styles.actionLink}
                    type="button"
                    onClick={() => onViewListing(item.bookId!)}
                  >
                    View listing <span aria-hidden="true">→</span>
                  </button>
                )}
                {item.type === 'arc' && (
                  <button
                    className={styles.actionLink}
                    type="button"
                    onClick={() => onGoToProfile?.(item.authorId, 'arc')}
                  >
                    Apply for ARC <span aria-hidden="true">→</span>
                  </button>
                )}
                {(item.type === 'milestone' || item.type === 'post') && (
                  <button
                    className={styles.actionLink}
                    type="button"
                    onClick={() => onGoToProfile?.(item.authorId, 'activity')}
                  >
                    See activity <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
