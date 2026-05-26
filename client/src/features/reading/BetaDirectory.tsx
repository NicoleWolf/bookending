import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import styles from './BetaDirectory.module.css';

interface OpenProgramme {
  id:              string;
  manuscriptId:    string;
  manuscriptTitle: string;
  authorId:        string;
  authorName:      string;
  authorInitials:  string;
  genres:          string[];
  description:     string | null;
  acceptedCount:   number;
  pendingCount:    number;
  cap:             number | null;
}

interface Props {
  onGoToProfile?: (authorId: string, tab?: string) => void;
}

export default function BetaDirectory({ onGoToProfile }: Props) {
  const { session } = useAuth();
  const [programmes, setProgrammes] = useState<OpenProgramme[]>([]);

  useEffect(() => {
    if (!session?.token) return;
    void api.get<OpenProgramme[]>('/api/beta-programmes/open')
      .then(data => setProgrammes(data))
      .catch(() => setProgrammes([]));
  }, [session?.token]);

  if (programmes.length === 0) return null;

  return (
    <section>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Beta programmes in your genres</span>
        <span className={styles.sectionCount}>{programmes.length} open</span>
      </div>
      <div className={styles.list}>
        {programmes.map(prog => {
          const stats = [
            prog.acceptedCount > 0 && `${prog.acceptedCount} reading`,
            prog.pendingCount  > 0 && `${prog.pendingCount} under review`,
            prog.cap !== null      && `cap: ${prog.cap}`,
          ].filter(Boolean).join(' · ');

          return (
            <button
              key={prog.id}
              type="button"
              className={styles.card}
              onClick={() => onGoToProfile?.(prog.authorId, 'arc')}
            >
              <div className={styles.cardHead}>
                <div className={styles.cardAvatar} aria-hidden="true">
                  {prog.authorInitials}
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.cardTitle}>{prog.manuscriptTitle}</span>
                  <span className={styles.cardAuthor}>by {prog.authorName}</span>
                </div>
                <span className={styles.cardArrow} aria-hidden="true">→</span>
              </div>

              {prog.genres.length > 0 && (
                <div className={styles.cardGenres}>
                  {prog.genres.map(g => (
                    <span key={g} className={styles.genreTag}>{g}</span>
                  ))}
                </div>
              )}

              {prog.description && (
                <p className={styles.cardDesc}>{prog.description}</p>
              )}

              {stats && <div className={styles.cardStats}>{stats}</div>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
