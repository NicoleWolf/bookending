import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './Editing.module.css';

interface NoteFromBefore {
  id: string;
  kind: 'annotation' | 'chapter_note';
  chapterNum: number;
  readerName: string;
  selectedText: string | null;
  body: string;
  revisionTag: string | null;
  createdAt: string;
}

interface Props {
  manuscriptId: string;
}

const TAG_OPTIONS = ['', 'open', 'addressed', 'themed'] as const;
const TAG_LABELS: Record<string, string> = {
  '':         'Untagged',
  'open':     'Open',
  'addressed':'Addressed',
  'themed':   'Themed',
};

export default function NotesFromBefore({ manuscriptId }: Props) {
  const [notes, setNotes] = useState<NoteFromBefore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<NoteFromBefore[]>(`/api/manuscripts/${manuscriptId}/notes-from-before`)
      .then(data => setNotes(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [manuscriptId]);

  async function handleTag(note: NoteFromBefore, tag: string) {
    const revisionTag = tag === '' ? null : tag;
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, revisionTag } : n));
    await api.patch(`/api/manuscripts/${manuscriptId}/notes-from-before/${note.id}`, {
      kind: note.kind,
      revisionTag,
    }).catch(() => {});
  }

  if (loading) return (
    <div className={styles.nfbWrap}>
      <div className={styles.nfbEmpty}>Loading…</div>
    </div>
  );

  if (notes.length === 0) return (
    <div className={styles.nfbWrap}>
      <div className={styles.nfbEmpty}>No archived notes from this revision period.</div>
    </div>
  );

  // Group by chapter
  const byChapter = new Map<number, NoteFromBefore[]>();
  for (const n of notes) {
    const arr = byChapter.get(n.chapterNum) ?? [];
    arr.push(n);
    byChapter.set(n.chapterNum, arr);
  }
  const chapters = [...byChapter.keys()].sort((a, b) => a - b);

  return (
    <div className={styles.nfbWrap}>
      {chapters.map(chNum => (
        <div key={chNum} className={styles.nfbChapterGroup}>
          <div className={styles.nfbChapterLabel}>Chapter {chNum}</div>
          {byChapter.get(chNum)!.map(note => (
            <div key={note.id} className={styles.nfbNoteRow}>
              <div>
                <div className={styles.nfbNoteAttrib}>
                  {`Ch. ${note.chapterNum} · ${note.readerName}`}
                </div>
                {note.selectedText && (
                  <p className={styles.nfbNoteAnchor}>"{note.selectedText}"</p>
                )}
                <p className={styles.nfbNoteBody}>{note.body}</p>
              </div>
              <select
                className={styles.nfbTagSelect}
                data-tagged={note.revisionTag ? '' : undefined}
                value={note.revisionTag ?? ''}
                onChange={e => handleTag(note, e.target.value)}
              >
                {TAG_OPTIONS.map(t => (
                  <option key={t} value={t}>{TAG_LABELS[t]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
