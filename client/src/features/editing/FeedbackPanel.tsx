import { useState } from 'react';
import { Avatar } from '../../shared/ui/atoms';
import styles from './FeedbackPanel.module.css';

interface ReaderAnnotation {
  id:             string;
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  chapterId:      number;
  selectedText:   string;
  note:           string;
  createdAt:      string;
}

interface Props {
  manuscriptId:     string;
  chapterHtml:      string;
  readerAnnotations: ReaderAnnotation[];
  focusedCommentId: string | null;
  onClearFocus:     () => void;
}

function passageInChapter(passage: string, chapterHtml: string): boolean {
  if (!chapterHtml) return true;
  const plain = chapterHtml.replace(/<[^>]+>/g, ' ');
  return plain.includes(passage);
}

export default function FeedbackPanel({
  chapterHtml, readerAnnotations,
  focusedCommentId, onClearFocus,
}: Props) {
  const [filter, setFilter] = useState('All');

  const comments    = readerAnnotations.filter(a => passageInChapter(a.selectedText, chapterHtml));
  const readerNames = [...new Set(comments.map(c => c.readerName))];
  const names       = ['All', ...readerNames];

  const isFocused = focusedCommentId !== null;
  const visible   = isFocused
    ? comments.filter(c => c.id === focusedCommentId)
    : filter === 'All'
      ? comments
      : comments.filter(c => c.readerName === filter);

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Feedback</span>
        <span className={styles.headCount}>
          {isFocused ? `${visible.length} note` : `${comments.length} notes`}
        </span>
      </div>

      {isFocused ? (
        <div className={styles.focusBanner}>
          <button className={styles.focusBack} onClick={onClearFocus}>← All feedback</button>
          <span className={styles.focusLabel}>passage selected</span>
        </div>
      ) : (
        <div className={styles.filters}>
          {names.map(name => (
            <button
              key={name}
              className={styles.filterBtn}
              data-active={filter === name ? '' : undefined}
              onClick={() => setFilter(name)}
            >
              {name === 'All' ? 'All' : name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {visible.length === 0 ? (
          <p className={styles.empty}>
            {readerAnnotations.length === 0 ? 'No reader feedback yet.' : 'No feedback on this chapter.'}
          </p>
        ) : (
          visible.map(c => (
            <div key={c.id} className={styles.card} data-focused={isFocused ? '' : undefined}>
              <div className={styles.cardTop}>
                <span className={styles.location}>Ch. {c.chapterId}</span>
              </div>
              <p className={`serif ${styles.passage}`}>"{c.selectedText}"</p>
              {c.note && <p className={styles.note}>{c.note}</p>}
              <div className={styles.author}>
                <Avatar initials={c.readerInitials} tone="accent" size={20} />
                <span className={styles.authorName}>{c.readerName}</span>
                <span className={styles.authorTime}>
                  {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
