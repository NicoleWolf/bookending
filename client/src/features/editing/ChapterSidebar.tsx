import { useState, useRef, useEffect } from 'react';
import styles from './ChapterSidebar.module.css';

interface ChapterSlice { title: string; html: string; }

interface Props {
  chapters: ChapterSlice[];
  activeIndex: number;
  onSwitch: (idx: number) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  onRename: (idx: number, title: string) => void;
  open?: boolean;
  onClose?: () => void;
}

export default function ChapterSidebar({ chapters, activeIndex, onSwitch, onAdd, onDelete, onRename, open, onClose }: Props) {
  const [renameIdx, setRenameIdx] = useState<number | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renameIdx !== null) inputRef.current?.select();
  }, [renameIdx]);

  function startRename(idx: number) {
    setRenameVal(chapters[idx]?.title ?? '');
    setRenameIdx(idx);
  }

  function commitRename() {
    if (renameIdx !== null && renameVal.trim()) {
      onRename(renameIdx, renameVal.trim());
    }
    setRenameIdx(null);
  }

  function cancelRename() {
    setRenameIdx(null);
  }

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={styles.sidebar} data-open={open ? '' : undefined}>
      <div className={styles.header}>
        <span className={styles.sectionMark}>Editor</span>
        <p className={styles.tagline}>Chapters</p>
      </div>

      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={onAdd}>
          + New chapter
        </button>
      </div>

      <nav className={styles.list}>
        {chapters.map((ch, idx) => (
          <div
            key={idx}
            className={styles.item}
            data-active={idx === activeIndex ? '' : undefined}
          >
            {renameIdx === idx ? (
              <input
                ref={inputRef}
                className={styles.renameInput}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                  if (e.key === 'Escape') cancelRename();
                }}
              />
            ) : (
              <>
                <button
                  className={styles.itemBtn}
                  onClick={() => {
                    if (idx === activeIndex) startRename(idx);
                    else { onSwitch(idx); onClose?.(); }
                  }}
                  title={idx === activeIndex ? 'Click to rename' : ch.title}
                >
                  <span className={styles.itemNum}>{idx + 1}</span>
                  <span className={styles.itemTitle}>{ch.title}</span>
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => onDelete(idx)}
                  aria-label={`Delete ${ch.title}`}
                  disabled={chapters.length === 1}
                >×</button>
              </>
            )}
          </div>
        ))}
      </nav>

      </aside>
    </>
  );
}
