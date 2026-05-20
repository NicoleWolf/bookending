import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { GENRES } from '../../shared/genres';
import styles from './NextBookCard.module.css';

interface ManuscriptOption {
  id: string;
  title: string;
  genre: string | null;
}

interface NextBookEntry {
  id: string;
  manuscriptId: string | null;
  title: string;
  description: string | null;
  genre: string | null;
  _count: { followers: number };
}

type Mode = 'linked' | 'freeform';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  manuscripts: ManuscriptOption[];
}

const GENRE_OPTIONS = GENRES.map(g => g.label);

export function NextBookCard({ manuscripts }: Props) {
  const [loaded,      setLoaded]      = useState(false);
  const [hasEntry,    setHasEntry]    = useState(false);
  const [mode,        setMode]        = useState<Mode>('freeform');
  const [msId,        setMsId]        = useState<string | null>(null);
  const [title,       setTitle]       = useState('');
  const [genre,       setGenre]       = useState('');
  const [description, setDescription] = useState('');
  const [followers,   setFollowers]   = useState(0);
  const [saveState,   setSaveState]   = useState<SaveState>('idle');

  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef     = useRef(false);

  useEffect(() => {
    api.get<NextBookEntry | null>('/api/next-book')
      .then(entry => {
        if (entry) {
          setHasEntry(true);
          setMode(entry.manuscriptId ? 'linked' : 'freeform');
          setMsId(entry.manuscriptId);
          setTitle(entry.title);
          setGenre(entry.genre ?? '');
          setDescription(entry.description ?? '');
          setFollowers(entry._count.followers);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoaded(true);
        loadedRef.current = true;
      });
  }, []);

  const save = useCallback(async (payload: {
    manuscriptId: string | null;
    title: string;
    genre: string;
    description: string;
  }) => {
    if (!payload.title.trim()) return;
    setSaveState('saving');
    try {
      const entry = await api.put<NextBookEntry>('/api/next-book', {
        manuscriptId: payload.manuscriptId,
        title:        payload.title.trim(),
        genre:        payload.genre.trim() || null,
        description:  payload.description.trim() || null,
      });
      setHasEntry(true);
      setFollowers(entry._count.followers);
      setSaveState('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(
        () => setSaveState(s => s === 'saved' ? 'idle' : s),
        2500,
      );
    } catch {
      setSaveState('error');
    }
  }, []);

  // Debounced autosave — only fires after initial load
  useEffect(() => {
    if (!loadedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save({ manuscriptId: msId, title, genre, description });
    }, 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [msId, title, genre, description, save]);

  function handleMsChange(id: string) {
    const ms = manuscripts.find(m => m.id === id);
    setMsId(id || null);
    if (ms) {
      setTitle(ms.title);
      setGenre(ms.genre ?? '');
    }
  }

  function handleModeSwitch(next: Mode) {
    if (next === mode) return;
    setMode(next);
    if (next === 'linked') {
      setMsId(null);
      setTitle('');
      setGenre('');
    } else {
      setMsId(null);
    }
  }

  async function handleClear() {
    try {
      await api.del('/api/next-book');
    } catch { /* already-deleted is fine */ }
    setHasEntry(false);
    setMode('freeform');
    setMsId(null);
    setTitle('');
    setGenre('');
    setDescription('');
    setFollowers(0);
    setSaveState('idle');
  }

  if (!loaded) return null;

  const titleOver = title.length > 200;
  const descOver  = description.length > 1000;

  return (
    <div className={styles.card}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className={styles.head}>
        <div className={styles.headRow}>
          <span className={styles.label}>Next Book</span>
          {hasEntry && followers > 0 && (
            <span className={styles.followers}>
              {followers} {followers === 1 ? 'reader' : 'readers'} following
            </span>
          )}
          <span
            className={styles.saveState}
            data-state={saveState}
            aria-live="polite"
            aria-atomic="true"
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved'  && '✓ Saved'}
            {saveState === 'error'  && 'Error saving'}
          </span>
        </div>
        <span className={styles.hint}>
          Signal your next project. Readers can follow to be notified when beta opens or the book publishes.
        </span>
      </div>

      {/* ── Mode segmented control ──────────────────────────────── */}
      <div className={styles.segmented} role="group" aria-label="Entry mode">
        {(['linked', 'freeform'] as Mode[]).map(m => (
          <button
            key={m}
            className={styles.seg}
            type="button"
            data-active={mode === m ? '' : undefined}
            onClick={() => handleModeSwitch(m)}
          >
            {m === 'linked' ? 'Link a manuscript' : 'Free-form'}
          </button>
        ))}
      </div>

      {/* ── Manuscript dropdown (linked mode only) ──────────────── */}
      {mode === 'linked' && (
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="nb-ms">Manuscript</label>
          {manuscripts.length === 0 ? (
            <p className={styles.empty}>No manuscripts yet. Start one in the Editor.</p>
          ) : (
            <select
              id="nb-ms"
              className={styles.select}
              value={msId ?? ''}
              onChange={e => handleMsChange(e.target.value)}
            >
              <option value="">Select a manuscript…</option>
              {manuscripts.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── Title ──────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="nb-title">
          Title <span className={styles.required}>*</span>
        </label>
        <input
          id="nb-title"
          className={styles.input}
          type="text"
          value={title}
          maxLength={220}
          onChange={e => setTitle(e.target.value)}
          placeholder={mode === 'linked' && !msId ? 'Select a manuscript above…' : 'Working title…'}
          disabled={mode === 'linked' && !msId}
          aria-describedby="nb-title-count"
        />
        <span
          id="nb-title-count"
          className={styles.counter}
          data-over={titleOver ? '' : undefined}
        >
          {title.length}/200
        </span>
      </div>

      {/* ── Genre ──────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="nb-genre">Genre</label>
        <input
          id="nb-genre"
          className={styles.input}
          type="text"
          list="nb-genre-list"
          value={genre}
          maxLength={80}
          onChange={e => setGenre(e.target.value)}
          placeholder="e.g. Fantasy"
        />
        <datalist id="nb-genre-list">
          {GENRE_OPTIONS.map(g => <option key={g} value={g} />)}
        </datalist>
      </div>

      {/* ── Description ────────────────────────────────────────── */}
      <div className={styles.field}>
        <label className={styles.fieldLabel} htmlFor="nb-desc">Description / teaser</label>
        <textarea
          id="nb-desc"
          className={styles.textarea}
          value={description}
          rows={4}
          maxLength={1050}
          onChange={e => setDescription(e.target.value)}
          placeholder="A short teaser for your next book…"
          aria-describedby="nb-desc-count"
        />
        <span
          id="nb-desc-count"
          className={styles.counter}
          data-over={descOver ? '' : undefined}
        >
          {description.length}/1000
        </span>
      </div>

      {/* ── Clear ──────────────────────────────────────────────── */}
      {hasEntry && (
        <div className={styles.actions}>
          <button className={styles.clearBtn} type="button" onClick={() => void handleClear()}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
