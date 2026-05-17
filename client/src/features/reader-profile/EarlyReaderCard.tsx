import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './EarlyReaderCard.module.css';

interface ArcCredit {
  id: string;
  status: string;
  reviewPostedAt: string | null;
  program: {
    reviewDeadline: string | null;
    manuscript: { id: string; title: string; genre: string | null; coverUrl: string | null; author: { name: string } };
  };
}

export function EarlyReaderCard() {
  const [credits, setCredits] = useState<ArcCredit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ArcCredit[]>('/api/arc/my-arcs')
      .then(data => {
        // Only show on-time fulfilled ARCs as early reader credits
        const earned = data.filter(a => {
          if (a.status !== 'FULFILLED') return false;
          if (!a.reviewPostedAt) return false;
          if (a.program.reviewDeadline) {
            return new Date(a.reviewPostedAt) <= new Date(a.program.reviewDeadline);
          }
          return true;
        });
        setCredits(earned);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || credits.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`label ${styles.cardLabel}`}>Early reader on</span>
        <span className={styles.cardCount}>{credits.length} {credits.length === 1 ? 'book' : 'books'}</span>
      </div>
      <p className={styles.cardSubhead}>
        Books you've helped bring into the world — a credit that stays with you on your profile.
      </p>
      <div className={styles.creditList}>
        {credits.map(credit => (
          <div key={credit.id} className={styles.creditRow}>
            <div className={styles.creditCover} data-empty={!credit.program.manuscript.coverUrl ? '' : undefined}>
              {credit.program.manuscript.coverUrl
                ? <img src={credit.program.manuscript.coverUrl} alt={credit.program.manuscript.title} className={styles.coverImg} />
                : <span className={styles.coverPlaceholder}>{credit.program.manuscript.title.charAt(0)}</span>
              }
            </div>
            <div className={styles.creditInfo}>
              <div className={styles.creditTitle}>{credit.program.manuscript.title}</div>
              <div className={styles.creditAuthor}>by {credit.program.manuscript.author.name}</div>
              {credit.program.manuscript.genre && (
                <div className={styles.creditGenre}>{credit.program.manuscript.genre}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
