import { useState } from 'react';
import { Pill, Avatar } from '../../shared/ui/atoms';
import { COMMENTS, INITIAL_READERS, typeTone } from './data';
import styles from './FeedbackPanel.module.css';

interface Props {
  manuscriptId: number;
  chapterHtml: string;
  focusedCommentId: number | null;
  onClearFocus: () => void;
}

// Strip typographic quote wrappers then check if the passage text appears in the chapter HTML
function passageInChapter(passage: string, chapterHtml: string): boolean {
  if (!chapterHtml) return true;
  const text  = passage.replace(/^["""]/, '').replace(/["""]$/, '');
  const plain = chapterHtml.replace(/<[^>]+>/g, ' ');
  return plain.includes(text);
}

export default function FeedbackPanel({ manuscriptId, chapterHtml, focusedCommentId, onClearFocus }: Props) {
  const [filter, setFilter] = useState('All');

  const comments = COMMENTS
    .filter(c => c.manuscriptId === manuscriptId && passageInChapter(c.passage, chapterHtml))
    .sort((a, b) => {
      const chA = parseInt(a.chapter.replace(/\D/g, ''), 10) || 0;
      const chB = parseInt(b.chapter.replace(/\D/g, ''), 10) || 0;
      return chA !== chB ? chA - chB : a.page - b.page;
    });
  // Only show reader filter tabs for readers who have comments in this chapter
  const chapterReaderNames = [...new Set(comments.map(c => c.reader.name))];
  const names = ['All', ...chapterReaderNames];

  const isFocused = focusedCommentId !== null;
  const visible   = isFocused
    ? comments.filter(c => c.id === focusedCommentId)
    : filter === 'All'
      ? comments
      : comments.filter(c => c.reader.name === filter);

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
          <p className={styles.empty}>No feedback from this reader.</p>
        ) : (
          visible.map(c => (
            <div key={c.id} className={styles.card} data-focused={isFocused ? '' : undefined} data-theme={isFocused ? c.type : undefined}>
              <div className={styles.cardTop}>
                <Pill tone={typeTone[c.type]}>{c.type}</Pill>
                <span className={styles.location}>
                  {c.chapter.toUpperCase()} · P.{c.page}
                </span>
                {c.flaggedBy > 0 && (
                  <span className={styles.flagged}>+{c.flaggedBy} also flagged</span>
                )}
              </div>
              <p className={`serif ${styles.passage}`}>{c.passage}</p>
              <p className={styles.note}>{c.note}</p>
              <div className={styles.author}>
                <Avatar initials={c.reader.initials} tone={c.reader.tone} size={20} />
                <span className={styles.authorName}>{c.reader.name}</span>
                <span className={styles.authorTime}>{c.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
