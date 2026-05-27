import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import { timeAgo } from '../notifications/data';
import type { ExclusivePost } from './exclusive-data';
import { EXCLUSIVE_TYPE_LABEL, DEMO_EXCLUSIVE_POSTS } from './exclusive-data';
import styles from './ExclusiveContent.module.css';

interface Props {
  authorId?: string;  // filter to one author (for author profile tab); omit for reading hub
  onGoToProfile?: (id: string, tab?: string) => void;
}

export default function ExclusiveContent({ authorId, onGoToProfile }: Props) {
  const { session } = useAuth();
  const [posts, setPosts] = useState<ExclusivePost[] | null>(null);

  useEffect(() => {
    if (!session?.token) { setPosts([]); return; }
    const url = authorId
      ? `/api/authors/${authorId}/exclusive-posts`
      : '/api/exclusive-posts/for-reader';
    void api.get<ExclusivePost[]>(url)
      .then(data => setPosts(data))
      .catch(() => {
        const fallback = authorId
          ? DEMO_EXCLUSIVE_POSTS.filter(p => p.authorId === authorId)
          : DEMO_EXCLUSIVE_POSTS;
        setPosts(fallback);
      });
  }, [session?.token, authorId]);

  if (!posts || posts.length === 0) return null;

  const unlockedCount = posts.filter(p => p.isUnlocked).length;

  return (
    <section>
      {!authorId && (
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Reader exclusives</span>
          <span className={styles.sectionCount}>{unlockedCount} unlocked</span>
        </div>
      )}
      <div className={styles.list}>
        {posts.map(post => (
          <div key={post.id} className={styles.card} data-locked={!post.isUnlocked ? '' : undefined}>
            <div className={styles.cardHead}>
              <span className={styles.typeBadge}>◆ {EXCLUSIVE_TYPE_LABEL[post.type]}</span>
              {!post.isUnlocked && <span className={styles.lockGlyph} aria-label="Locked">⊘</span>}
              <span className={styles.cardTime}>{timeAgo(post.postedAt)}</span>
            </div>

            {onGoToProfile ? (
              <button
                className={styles.bookBtn}
                type="button"
                onClick={() => onGoToProfile(post.authorId)}
              >
                {post.bookTitle} · {post.authorName}
              </button>
            ) : (
              <span className={styles.bookLabel}>{post.bookTitle} · {post.authorName}</span>
            )}

            <p className={styles.cardTitle}>{post.title}</p>

            {post.isUnlocked && post.body ? (
              <p className={`serif ${styles.cardBody}`}>{post.body}</p>
            ) : (
              <p className={styles.lockedMsg}>
                Read and review <em>{post.bookTitle}</em> to unlock this content.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
