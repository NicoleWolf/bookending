import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import styles from './NotesArchive.module.css';

interface NoteWithChapter {
  id: string;
  chapterId: string;
  chapterNum: number;
  chapterTitle: string;
  body: string;
  anchor: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

interface Props {
  manuscriptId: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function NotesArchive({ manuscriptId }: Props) {
  const [notes,          setNotes]          = useState<NoteWithChapter[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showArchived,   setShowArchived]   = useState(false);
  const [pendingDelete,  setPendingDelete]  = useState<string | null>(null);
  const [errorById,      setErrorById]      = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    api.get<NoteWithChapter[]>(`/api/manuscripts/${manuscriptId}/notes?status=all`)
      .then(data => { setNotes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [manuscriptId]);

  const active   = notes.filter(n => n.status === 'ACTIVE');
  const archived = notes.filter(n => n.status === 'ARCHIVED');

  function clearError(id: string) {
    setErrorById(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  async function archiveNote(note: NoteWithChapter) {
    clearError(note.id);
    try {
      await api.del(`/api/manuscripts/${manuscriptId}/chapters/${note.chapterNum}/notes/${note.id}`);
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, status: 'ARCHIVED' } : n));
    } catch {
      setErrorById(prev => ({ ...prev, [note.id]: 'Archive failed' }));
    }
  }

  async function restoreNote(note: NoteWithChapter) {
    clearError(note.id);
    try {
      const updated = await api.patch<NoteWithChapter>(
        `/api/manuscripts/${manuscriptId}/chapters/${note.chapterNum}/notes/${note.id}`,
        { status: 'ACTIVE' }
      );
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, ...updated } : n));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
      setErrorById(prev => ({ ...prev, [note.id]: msg }));
    }
  }

  async function permanentDelete(note: NoteWithChapter) {
    clearError(note.id);
    try {
      await api.del(`/api/manuscripts/${manuscriptId}/chapters/${note.chapterNum}/notes/${note.id}/permanent`);
      setNotes(prev => prev.filter(n => n.id !== note.id));
      setPendingDelete(null);
    } catch {
      setErrorById(prev => ({ ...prev, [note.id]: 'Delete failed' }));
    }
  }

  function NoteCard({ note, isArchived }: { note: NoteWithChapter; isArchived: boolean }) {
    const err          = errorById[note.id];
    const confirmingDel = pendingDelete === note.id;

    return (
      <div className={styles.noteCard} data-archived={isArchived ? '' : undefined}>
        <div className={styles.noteCardHead}>
          <span className={styles.noteCardChapter}>
            Ch. {note.chapterNum} · {note.chapterTitle}
          </span>
          <span className={styles.noteCardTime}>
            {isArchived ? 'archived' : 'updated'} {relativeTime(note.updatedAt)}
          </span>
        </div>
        <p className={styles.noteCardBody}>{note.body}</p>
        {err && <p className={styles.noteCardError}>{err}</p>}
        <div className={styles.noteCardActions}>
          {!isArchived && (
            <button className={styles.actionBtn} onClick={() => void archiveNote(note)}>
              Archive
            </button>
          )}
          {isArchived && !confirmingDel && (
            <>
              <button className={styles.actionBtnRestore} onClick={() => void restoreNote(note)}>
                Restore
              </button>
              <button className={styles.actionBtnDanger} onClick={() => setPendingDelete(note.id)}>
                Delete permanently
              </button>
            </>
          )}
          {isArchived && confirmingDel && (
            <>
              <span className={styles.confirmText}>Are you sure?</span>
              <button className={styles.actionBtnDanger} onClick={() => void permanentDelete(note)}>
                Yes, delete
              </button>
              <button className={styles.actionBtn} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.loading}>Loading notes…</div>;
  }

  return (
    <div className={styles.wrap}>
      {/* ── Active notes ─────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Active notes</span>
          <span className={styles.sectionCount}>{active.length}</span>
        </div>

        {active.length === 0 ? (
          <div className={styles.empty}>
            No active notes. Open a chapter in the editor and click Notes to add one.
          </div>
        ) : (
          <div className={styles.noteList}>
            {active.map(n => <NoteCard key={n.id} note={n} isArchived={false} />)}
          </div>
        )}
      </div>

      {/* ── Archived notes ───────────────────────────────────── */}
      <div className={styles.section}>
        <button
          className={styles.sectionHead}
          data-toggle=""
          onClick={() => setShowArchived(v => !v)}
        >
          <span className={styles.sectionTitle}>Archived</span>
          <span className={styles.sectionCount}>{archived.length}</span>
          <span className={styles.toggleIcon}>{showArchived ? '▴' : '▾'}</span>
        </button>

        {showArchived && (
          archived.length === 0 ? (
            <div className={styles.empty}>No archived notes.</div>
          ) : (
            <div className={styles.noteList}>
              {archived.map(n => <NoteCard key={n.id} note={n} isArchived />)}
            </div>
          )
        )}
      </div>
    </div>
  );
}
