import type { CSSProperties } from 'react';
import type { HubWarmItem } from '@bookending/shared';
import styles from './Hub.module.css';

interface WarmCardProps {
  item:     HubWarmItem;
  onOpen:   (msRef: string) => void;
}

function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
}

export default function WarmCard({ item, onOpen }: WarmCardProps) {
  const {
    manuscriptRef, title, authorName, draftLabel, genre,
    totalChapters, doneChapters, mood,
    lastOpenedAt, isDormant,
    newChapterCount, newNoteCount, newAuthorNote,
  } = item;

  const doneCount   = doneChapters.length;
  const available   = totalChapters;
  const hasNewNote  = newAuthorNote !== null && !isDormant;

  const primaryVerb  = isDormant ? 'Pick it back up' : 'Continue reading';
  const secondaryVerb = isDormant ? 'Step back' : (hasNewNote ? 'Jot an impression' : 'Jot an impression');

  return (
    <div
      className={styles.warmCard}
      data-dormant={isDormant ? '' : undefined}
    >
      {/* Cover column */}
      <div className={styles.warmCover} />

      {/* Content column */}
      <div className={styles.warmContent}>
        {/* Title + meta */}
        <div className={styles.warmTitle}>{title ?? manuscriptRef}</div>
        <div className={styles.warmMeta}>
          {[
            authorName,
            draftLabel,
            genre,
          ].filter(Boolean).join(' · ').toUpperCase() || 'MANUSCRIPT'}
          {isDormant && lastOpenedAt && (
            <em className={styles.warmDormantTime}> · Last read {relativeTime(lastOpenedAt)}</em>
          )}
        </div>

        {/* Activity strip */}
        <div className={styles.activityStrip}>
          {newChapterCount > 0 && (
            <button className={`${styles.badge} ${styles.badgeNewChapter}`} onClick={() => onOpen(manuscriptRef)}>
              {newChapterCount === 1 ? 'NEW CHAPTER' : `${newChapterCount} NEW CHAPTERS`}
            </button>
          )}
          {newNoteCount > 0 && (
            <button className={`${styles.badge} ${styles.badgeNewNote}`} onClick={() => onOpen(manuscriptRef)}>
              {newNoteCount === 1 ? '1 NEW NOTE' : `${newNoteCount} NEW NOTES`}
            </button>
          )}
          {mood && (
            <span className={styles.badge} style={{ '--badge-bg': 'var(--ink-2)', '--badge-text': 'var(--muted)', '--badge-border': 'var(--rule)' } as CSSProperties}>
              {mood.toUpperCase()}
            </span>
          )}
          <span className={`${styles.badge} ${styles.badgeNeutral}`}>
            {doneCount} OF {available} READ
          </span>
        </div>

        {/* Segmented progress bar */}
        {available > 0 && (
          <div
            className={styles.segBar}
            style={{ '--seg-count': available } as CSSProperties}
          >
            {Array.from({ length: available }).map((_, i) => (
              <div
                key={i}
                className={styles.segBarItem}
                data-state={i < doneCount ? 'done' : 'empty'}
              />
            ))}
          </div>
        )}

        {/* Pull-quote for new author note (active cards only) */}
        {hasNewNote && newAuthorNote && (
          <div className={styles.pullQuote}>
            <div className={styles.pullQuoteLabel}>
              NEW · FROM {newAuthorNote.authorFirstName.toUpperCase()}, ON CHAPTER {newAuthorNote.chapterNum}
            </div>
            <p className={`serif ${styles.pullQuoteBody}`}>
              "{newAuthorNote.body.length > 140 ? newAuthorNote.body.slice(0, 140) + '…' : newAuthorNote.body}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className={styles.warmActions}>
          <button className={styles.warmActionPrimary} onClick={() => onOpen(manuscriptRef)}>
            {primaryVerb}
          </button>
          <button className={styles.warmActionSecondary}>
            {secondaryVerb}
          </button>
        </div>
      </div>
    </div>
  );
}
