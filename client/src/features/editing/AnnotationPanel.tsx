import { useState } from 'react';
import styles from './AnnotationPanel.module.css';

interface Annotation {
  id: number;
  passage: string;
  note: string;
  time: string;
}

interface Props {
  selectedText: string;
  onClearSelection: () => void;
}

export default function AnnotationPanel({ selectedText, onClearSelection }: Props) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [note, setNote] = useState('');

  function submit() {
    if (!note.trim() || !selectedText) return;
    setAnnotations(prev => [
      { id: Date.now(), passage: selectedText, note: note.trim(), time: 'just now' },
      ...prev,
    ]);
    setNote('');
    onClearSelection();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Annotations</span>
        <span className={styles.headBadge} data-active={annotations.length > 0 ? '' : undefined}>
          {annotations.length}
        </span>
      </div>

      {selectedText ? (
        <div className={styles.form}>
          <div className={styles.formLabel}>Selected passage</div>
          <p className={`serif ${styles.passage}`}>{selectedText}</p>
          <textarea
            className={styles.noteInput}
            placeholder="Add your note…"
            value={note}
            rows={4}
            autoFocus
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
          <div className={styles.formActions}>
            <button className={styles.clearBtn} onClick={onClearSelection}>Clear</button>
            <button
              className={styles.submitBtn}
              data-disabled={!note.trim() ? '' : undefined}
              onClick={note.trim() ? submit : undefined}
            >
              Add annotation
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.hint}>
          <p className={styles.hintText}>
            Select text in the manuscript, then add your note here.
          </p>
        </div>
      )}

      <div className={styles.list}>
        {annotations.length === 0 && !selectedText && (
          <p className={styles.empty}>No annotations yet this session.</p>
        )}
        {annotations.map(a => (
          <div key={a.id} className={styles.card}>
            <p className={`serif ${styles.cardPassage}`}>{a.passage}</p>
            <p className={styles.cardNote}>{a.note}</p>
            <span className={styles.cardTime}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
