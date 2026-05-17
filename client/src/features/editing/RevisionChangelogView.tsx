import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './Editing.module.css';

interface ChangelogEntry {
  noteId: string | null;
  noteKind: 'annotation' | 'chapter_note' | null;
  chapterNum: number | null;
  description: string;
  addedAt: string;
}

interface Props {
  manuscriptId: string;
}

export default function RevisionChangelogView({ manuscriptId }: Props) {
  const [entries, setEntries]   = useState<ChangelogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [draft, setDraft]       = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [adding, setAdding]     = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<ChangelogEntry[]>(`/api/manuscripts/${manuscriptId}/revision-changelog`)
      .then(data => setEntries(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [manuscriptId]);

  async function handleAdd() {
    const description = draft.trim();
    if (!description) return;
    const chapterNum = chapterInput ? parseInt(chapterInput, 10) : null;
    const entry = await api.post<ChangelogEntry>(`/api/manuscripts/${manuscriptId}/revision-changelog`, {
      description,
      chapterNum: Number.isNaN(chapterNum) ? null : chapterNum,
    }).catch(() => null);
    if (entry) {
      setEntries(prev => [...prev, entry]);
      setDraft('');
      setChapterInput('');
      setAdding(false);
    }
  }

  async function handleDelete(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
    await api.del(`/api/manuscripts/${manuscriptId}/revision-changelog/${idx}`).catch(() => {});
  }

  if (loading) return (
    <div className={styles.nfbWrap}>
      <div className={styles.nfbEmpty}>Loading…</div>
    </div>
  );

  return (
    <div className={styles.nfbWrap}>
      {entries.length === 0 && !adding && (
        <div className={styles.nfbEmpty}>No changelog entries yet.</div>
      )}

      {entries.map((entry, idx) => (
        <div key={idx} className={styles.nfbNoteRow}>
          <div>
            {entry.chapterNum != null && (
              <div className={styles.nfbNoteAttrib}>Chapter {entry.chapterNum}</div>
            )}
            <p className={styles.nfbNoteBody}>{entry.description}</p>
          </div>
          <button
            className={styles.editorialNoteActionLink}
            onClick={() => handleDelete(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      {adding ? (
        <div style={{ paddingTop: 16 }}>
          <input
            type="number"
            className={styles.editorialNoteEditArea}
            style={{ height: 'auto', padding: '6px 10px', marginBottom: 8 }}
            placeholder="Chapter number (optional)"
            value={chapterInput}
            onChange={e => setChapterInput(e.target.value)}
          />
          <textarea
            className={styles.editorialNoteEditArea}
            rows={3}
            placeholder="Describe the change and what drove it…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          <div className={styles.editorialNoteEditRow}>
            <button className={styles.editorialNoteActionLink} onClick={handleAdd}>Add entry</button>
            <button className={styles.editorialNoteActionLink} onClick={() => { setAdding(false); setDraft(''); setChapterInput(''); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ paddingTop: 12 }}>
          <button
            className={styles.editorialNoteActionLink}
            onClick={() => setAdding(true)}
          >
            + Add changelog entry
          </button>
        </div>
      )}
    </div>
  );
}
