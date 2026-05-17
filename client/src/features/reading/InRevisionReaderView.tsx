import type { Manuscript, Chapter, Highlight } from './types';
import styles from './Reading.module.css';

interface Props {
  ms: Manuscript;
  highlights: Highlight[];
  onReread: (chapterId: number) => void;
}

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
                'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];

function toRoman(n: number): string {
  return ROMAN[n] ?? String(n + 1);
}

export default function InRevisionReaderView({ ms, highlights, onReread }: Props) {
  const pausedDate = ms.revisionPausedAt
    ? new Date(ms.revisionPausedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const releasedChapters = ms.chapters.filter(ch => ch.releasedAt != null);
  const lockedChapters   = ms.chapters.filter(ch => ch.releasedAt == null);

  function noteCountForChapter(ch: Chapter): number {
    return highlights.filter(h => h.chapterId === ch.id && h.status === 'submitted').length;
  }

  return (
    <div className={styles.irWrap}>
      {/* Status row */}
      <div className={styles.irStatusRow}>
        <span className={styles.irStatusDot} />
        <span className={styles.irStatusLabel}>
          In Revision
          <span className={styles.irStatusSep}> · </span>
          On the writer's desk
          {pausedDate && (
            <>
              <span className={styles.irStatusSep}> · </span>
              <span className={styles.irStatusMuted}>Paused {pausedDate}</span>
            </>
          )}
        </span>
      </div>

      {/* Author's note rail */}
      <div className={styles.irNoteRail}>
        {ms.editorialNote ? (
          <p className={styles.irNoteText}>{ms.editorialNote}</p>
        ) : (
          <p className={styles.irNotePlaceholder}>
            The writer is working behind a closed door. A note will appear here when they're ready.
          </p>
        )}
        <p className={styles.irNoteSystemLine}>
          Your notes are safe. Your place is held. The door will open when the draft is ready.
        </p>
      </div>

      {/* Chapters list */}
      <div className={styles.irChaptersLabel}>Chapters on the desk</div>
      <div className={styles.irChapterList}>
        {releasedChapters.map(ch => {
          const noteCount = noteCountForChapter(ch);
          return (
            <div key={ch.id} className={styles.irChapterRow}>
              <div>
                <div className={styles.irChapterTitle}>
                  {toRoman(ch.number)}. {ch.title}
                </div>
                <div className={styles.irChapterMeta}>
                  Read · {noteCount} {noteCount === 1 ? 'note' : 'notes'} preserved
                </div>
              </div>
              <button
                className={styles.irChapterAction}
                onClick={() => onReread(ch.id)}
              >
                Re-read →
              </button>
            </div>
          );
        })}

        {lockedChapters.map(ch => (
          <div key={ch.id} className={`${styles.irChapterRow} ${styles.irChapterRowLocked}`}>
            <div>
              <div className={styles.irChapterTitle}>
                {toRoman(ch.number)}. {ch.title}
              </div>
              <div className={styles.irChapterMeta}>Not yet released</div>
            </div>
            <span className={styles.irChapterActionLocked}>When the door opens</span>
          </div>
        ))}
      </div>

      {/* Slot held closer block */}
      <div className={styles.irCloserBlock}>
        <div className={styles.irCloserLabel}>Your slot is held</div>
        <p className={styles.irCloserStatement}>
          Devotion +1 the moment the door reopens.
        </p>
        <p className={styles.irCloserBody}>
          Readers who hold their place through a revision period earn a standing reservation
          as launch ARC readers when this manuscript publishes. Your notes are archived and
          waiting — nothing has been lost.
        </p>
      </div>
    </div>
  );
}
