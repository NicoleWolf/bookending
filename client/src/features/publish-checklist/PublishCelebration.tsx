import { useEffect, useRef } from 'react';
import styles from './PublishCelebration.module.css';

interface Props {
  title:       string;
  authorName:  string;
  genre:       string | null;
  coverUrl:    string | null;
  onGoToStore: () => void;
}

export function PublishCelebration({ title, authorName, genre, coverUrl, onGoToStore }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Book published">
      <div className={styles.content}>

        <div className={styles.coverWrap}>
          {coverUrl ? (
            <img src={coverUrl} alt={`Cover of ${title}`} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder} aria-hidden="true" />
          )}
        </div>

        <h1 className={`serif ${styles.headline}`}>Published.</h1>

        {/* Shareable card — hardcoded light theme so it reads well in screenshots */}
        <div className={styles.shareCard}>
          <div className={styles.shareCardInner}>
            {coverUrl && (
              <img src={coverUrl} alt="" aria-hidden="true" className={styles.shareThumb} />
            )}
            <div className={styles.shareMeta}>
              <div className={styles.shareTitle}>{title}</div>
              <div className={styles.shareAuthor}>by {authorName}</div>
              <div className={styles.shareAvailable}>
                {genre && <><span className={styles.shareGenre}>{genre}</span><span aria-hidden="true"> · </span></>}
                <span>Now available</span>
              </div>
            </div>
          </div>
          <div className={styles.shareNote}>Screenshot to share</div>
        </div>

        {/* First reader stats — all zeros since the book just went live */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={`serif ${styles.statNum}`}>0</span>
            <span className={styles.statLabel}>readers</span>
          </div>
          <div className={styles.statItem}>
            <span className={`serif ${styles.statNum}`}>0</span>
            <span className={styles.statLabel}>reviews</span>
          </div>
          <div className={styles.statItem}>
            <span className={`serif ${styles.statNum}`}>0</span>
            <span className={styles.statLabel}>ARCs out</span>
          </div>
        </div>
        <p className={styles.statsHint}>Stats update live as readers find your book.</p>

        <button ref={btnRef} type="button" className={styles.storeBtn} onClick={onGoToStore}>
          Go to My Store <span aria-hidden="true">→</span>
        </button>

      </div>
    </div>
  );
}
