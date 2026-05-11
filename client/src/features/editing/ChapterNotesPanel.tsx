import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ChapterNote } from '@bookending/shared';
import styles from './ChapterNotesPanel.module.css';

interface Props {
  manuscriptId: string;
  chapterIndex: number;
  chapterTitle: string;
}

type PanelStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';
type ViewMode = 'view' | 'edit';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ChapterNotesPanel({ manuscriptId, chapterIndex, chapterTitle }: Props) {
  const [note,     setNote]     = useState<ChapterNote | null>(null);
  const [body,     setBody]     = useState('');
  const [status,   setStatus]   = useState<PanelStatus>('loading');
  const [viewMode, setViewMode] = useState<ViewMode>('view');

  useEffect(() => {
    setStatus('loading');
    setNote(null);
    setBody('');
    setViewMode('view');
    api.get<ChapterNote[]>(`/api/manuscripts/${manuscriptId}/chapters/${chapterIndex}/notes`)
      .then(notes => {
        const active = notes[0] ?? null;
        setNote(active);
        setBody(active?.body ?? '');
        setStatus('idle');
        if (!active) setViewMode('edit');
      })
      .catch(() => setStatus('error'));
  }, [manuscriptId, chapterIndex]);

  const isDirty = note ? body !== note.body : body.trim().length > 0;

  async function save() {
    if (!body.trim() || !isDirty) return;
    setStatus('saving');
    try {
      if (note) {
        const updated = await api.patch<ChapterNote>(
          `/api/manuscripts/${manuscriptId}/chapters/${chapterIndex}/notes/${note.id}`,
          { body: body.trim() }
        );
        setNote(updated);
        setBody(updated.body);
      } else {
        const created = await api.post<ChapterNote>(
          `/api/manuscripts/${manuscriptId}/chapters/${chapterIndex}/notes`,
          { body: body.trim(), chapterTitle }
        );
        setNote(created);
        setBody(created.body);
      }
      setStatus('saved');
      setViewMode('view');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }

  async function archive() {
    if (!note) return;
    setStatus('saving');
    try {
      await api.del(`/api/manuscripts/${manuscriptId}/chapters/${chapterIndex}/notes/${note.id}`);
      setNote(null);
      setBody('');
      setStatus('idle');
      setViewMode('edit');
    } catch {
      setStatus('error');
    }
  }

  const showViewCard = note !== null && viewMode === 'view' && status !== 'loading';

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Chapter note</span>
        {status === 'saving' && <span className={styles.headStatus}>Saving…</span>}
        {status === 'saved'  && <span className={styles.headStatus} data-good="">Saved</span>}
        {status === 'error'  && <span className={styles.headStatus} data-danger="">Error</span>}
      </div>

      <div className={styles.chapterLabel}>
        <span className={styles.chapterLabelText}>{chapterTitle || `Chapter ${chapterIndex}`}</span>
      </div>

      {status === 'loading' ? (
        <div className={styles.loading}>Loading…</div>
      ) : showViewCard ? (
        <div className={styles.noteCard}>
          <p className={styles.noteCardBody}>{note.body}</p>
          <span className={styles.noteCardTime}>{formatDate(note.updatedAt)}</span>
          <div className={styles.noteCardActions}>
            <button className={styles.archiveBtn} onClick={() => void archive()}>
              Archive
            </button>
            <button className={styles.editBtn} onClick={() => setViewMode('edit')}>
              Edit
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.body}>
            <textarea
              className={styles.textarea}
              placeholder="Add a private note for this chapter — intentions, reminders, open questions…"
              value={body}
              rows={6}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save();
              }}
            />
          </div>

          <div className={styles.actions}>
            {note && (
              <button className={styles.archiveBtn} onClick={() => void archive()}>
                Archive
              </button>
            )}
            <button
              className={styles.saveBtn}
              data-disabled={(!isDirty || !body.trim()) ? '' : undefined}
              onClick={(isDirty && body.trim()) ? () => void save() : undefined}
            >
              {note ? 'Update' : 'Save note'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
