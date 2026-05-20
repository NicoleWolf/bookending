import { useState, useRef, useEffect } from 'react';
import type { BookMetadata, BetaMode } from '../library/data';
import { BETA_MODE_OPTIONS, CONTENT_RATINGS, CONTENT_WARNINGS } from '../library/data';
import { GENRES } from '../../shared/genres';
import { api } from '../../lib/api';
import { ListingPreview, completenessScore } from './ListingPreview';
import type { ListingDraft } from './ListingPreview';
import styles from './PublishChecklist.module.css';

// ── Types ──────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type StepId    = 1 | 2 | 3;

export interface PublishChecklistProps {
  manuscript:  BookMetadata;
  coverUrl:    string | null;
  authorName:  string;
  onBack:      () => void;
  onSave:      (updates: Partial<BookMetadata>, newCoverUrl?: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────
export function toDraft(ms: BookMetadata, coverUrl: string | null, authorName: string): ListingDraft {
  return {
    title:           ms.title,
    authorName,
    genre:           ms.genre           || null,
    subgenre:        ms.subgenre        || null,
    description:     ms.description     || null,
    contentRating:   ms.contentRating   || null,
    contentWarnings: ms.contentWarnings ?? [],
    betaMode:        ms.betaMode        ?? 'CLOSED',
    maxBetaReaders:  ms.maxBetaReaders  ?? null,
    readerCount:     0,
    coverUrl,
    estimatedPages:  ms.estimatedPages  ?? null,
    wordCount:       0,
  };
}

function stepComplete(id: StepId, draft: ListingDraft): boolean {
  if (id === 1) return !!draft.coverUrl;
  if (id === 2) return !!(draft.genre && draft.description?.trim() && draft.contentRating);
  if (id === 3) return draft.betaMode !== 'CLOSED';
  return false;
}

function defaultOpen(draft: ListingDraft): StepId {
  if (!stepComplete(1, draft)) return 1;
  if (!stepComplete(2, draft)) return 2;
  if (!stepComplete(3, draft)) return 3;
  return 1;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: 1, label: 'Cover',    hint: 'Upload a cover image. Recommended: 1600 × 2400 px (2:3 ratio), JPEG or PNG.' },
  { id: 2, label: 'Metadata', hint: 'Set genre, description, and content rating so readers can find your book.' },
  { id: 3, label: 'Access',   hint: 'Choose how readers discover and join your beta read.' },
];

const DESC_MAX = 1000;
const DESC_WARN = 900;

// ── Component ──────────────────────────────────────────────────────
export default function PublishChecklist({ manuscript, coverUrl, authorName, onBack, onSave }: PublishChecklistProps) {
  const initialDraft = toDraft(manuscript, coverUrl, authorName);
  const [draft,     setDraft]     = useState<ListingDraft>(initialDraft);
  const [openStep,  setOpenStep]  = useState<StepId>(() => defaultOpen(initialDraft));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [coverLoading, setCoverLoading] = useState(false);

  const savedTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef      = useRef(false);
  const prevSavedRef   = useRef(initialDraft);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Autosave ─────────────────────────────────────────────────────
  const debouncedDraft = useDebounce(draft, 600);

  function markSaved() {
    setSaveState('saved');
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(
      () => setSaveState(s => (s === 'saved' ? 'idle' : s)), 2500
    );
  }

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; return; }

    const prev = prevSavedRef.current;
    const updates: Partial<BookMetadata> = {};

    if (debouncedDraft.genre           !== prev.genre)           updates.genre           = debouncedDraft.genre ?? '';
    if (debouncedDraft.subgenre        !== prev.subgenre)        updates.subgenre        = debouncedDraft.subgenre ?? '';
    if (debouncedDraft.description     !== prev.description)     updates.description     = debouncedDraft.description ?? '';
    if (debouncedDraft.contentRating   !== prev.contentRating)   updates.contentRating   = debouncedDraft.contentRating ?? '';
    if (debouncedDraft.betaMode        !== prev.betaMode)        updates.betaMode        = debouncedDraft.betaMode as BetaMode;
    if (debouncedDraft.maxBetaReaders  !== prev.maxBetaReaders)  updates.maxBetaReaders  = debouncedDraft.maxBetaReaders;
    if (JSON.stringify(debouncedDraft.contentWarnings) !== JSON.stringify(prev.contentWarnings)) {
      updates.contentWarnings = debouncedDraft.contentWarnings;
    }

    prevSavedRef.current = debouncedDraft;
    if (Object.keys(updates).length === 0) return;

    setSaveState('saving');
    onSave(updates);
    markSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);

  // ── Cover upload ─────────────────────────────────────────────────
  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCoverLoading(true);
    setSaveState('saving');
    try {
      const form = new FormData();
      form.append('cover', file);
      form.append('manuscriptId', manuscript.id);
      const result = await api.upload<{ coverUrl: string }>('/api/covers', form);
      const url = result.coverUrl;
      setDraft(d => ({ ...d, coverUrl: url }));
      prevSavedRef.current = { ...prevSavedRef.current, coverUrl: url };
      onSave({ coverUploaded: true }, url);
      markSaved();
    } catch {
      setSaveState('error');
    } finally {
      setCoverLoading(false);
    }
  }

  function handleCoverRemove() {
    setDraft(d => ({ ...d, coverUrl: null }));
    prevSavedRef.current = { ...prevSavedRef.current, coverUrl: null };
    onSave({ coverUploaded: false }, '');
    markSaved();
  }

  // ── Render ────────────────────────────────────────────────────────
  const allDone      = completenessScore(draft) === 5;
  const descLen      = (draft.description ?? '').length;
  const availSubgenres = GENRES.find(g => g.label === draft.genre)?.subgenres ?? [];

  return (
    <div className={styles.page}>

      {/* ── Sticky top bar ────────────────────────────────── */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Library</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbItem}>{manuscript.title}</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">Listing</span>
        </nav>
        <div className={styles.topBarRight}>
          <span
            className={styles.saveIndicator}
            data-state={saveState}
            aria-live="polite"
            aria-atomic="true"
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved'  && '✓ Saved'}
            {saveState === 'error'  && 'Error saving'}
          </span>
          <button className={styles.doneBtn} type="button" onClick={onBack}>Done</button>
        </div>
      </div>

      {/* ── Split pane ────────────────────────────────────── */}
      <div className={styles.splitPane}>

        {/* ── Checklist column ──────────────────────────── */}
        <div className={styles.checklistCol}>

          <div className={styles.checklistHead}>
            <h1 className={styles.checklistTitle}>Complete your listing</h1>
            <p className={styles.checklistHint}>
              Fill in each section to make your book discoverable to beta readers.
              Changes save automatically.
            </p>
          </div>

          {allDone && (
            <div className={styles.allDoneBanner}>
              <span className={styles.allDoneMark} aria-hidden="true">✓</span>
              <span className={styles.allDoneText}>
                Listing complete — your book is visible to readers.
              </span>
            </div>
          )}

          <div className={styles.accordion}>
            {STEPS.map(step => {
              const done = stepComplete(step.id, draft);
              const open = openStep === step.id;
              return (
                <div
                  key={step.id}
                  className={styles.step}
                  data-done={done ? '' : undefined}
                  data-open={open ? '' : undefined}
                >
                  <button
                    className={styles.stepHeader}
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenStep(step.id)}
                  >
                    <span className={styles.stepNum}>{step.id}</span>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepCheck} aria-label={done ? 'Complete' : 'Incomplete'}>
                      {done ? '✓' : '○'}
                    </span>
                    <span className={styles.stepCaret} aria-hidden="true">
                      {open ? '▲' : '▽'}
                    </span>
                  </button>

                  {open && (
                    <div className={styles.stepBody}>
                      <p className={styles.stepBodyHint}>{step.hint}</p>

                      {/* ── Step 1: Cover ───────────────────────────────── */}
                      {step.id === 1 && (
                        <>
                          {draft.coverUrl ? (
                            <div className={styles.coverRow}>
                              <img
                                src={draft.coverUrl}
                                alt="Book cover"
                                className={styles.coverThumb}
                              />
                              <div className={styles.coverActions}>
                                <button
                                  type="button"
                                  className={styles.uploadBtn}
                                  disabled={coverLoading}
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  {coverLoading ? 'Uploading…' : 'Replace cover'}
                                </button>
                                <button
                                  type="button"
                                  className={styles.removeBtn}
                                  onClick={handleCoverRemove}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.uploadBtn}
                              disabled={coverLoading}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {coverLoading ? 'Uploading…' : 'Upload cover'}
                            </button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className={styles.fileInput}
                            onChange={handleCoverChange}
                          />
                        </>
                      )}

                      {/* ── Step 2: Metadata ─────────────────────────────── */}
                      {step.id === 2 && (
                        <>
                          <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="pc-genre">Genre</label>
                            <select
                              id="pc-genre"
                              className={styles.select}
                              value={draft.genre ?? ''}
                              onChange={e => setDraft(d => ({
                                ...d,
                                genre:    e.target.value || null,
                                subgenre: null,
                              }))}
                            >
                              <option value="">Select genre…</option>
                              {GENRES.map(g => (
                                <option key={g.label} value={g.label}>{g.label}</option>
                              ))}
                            </select>
                          </div>

                          {availSubgenres.length > 0 && (
                            <div className={styles.field}>
                              <label className={styles.fieldLabel} htmlFor="pc-subgenre">Sub-genre</label>
                              <select
                                id="pc-subgenre"
                                className={styles.select}
                                value={draft.subgenre ?? ''}
                                onChange={e => setDraft(d => ({
                                  ...d,
                                  subgenre: e.target.value || null,
                                }))}
                              >
                                <option value="">Select sub-genre…</option>
                                {availSubgenres.map(sg => (
                                  <option key={sg} value={sg}>{sg}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="pc-desc">Description</label>
                            <textarea
                              id="pc-desc"
                              className={styles.textarea}
                              value={draft.description ?? ''}
                              maxLength={DESC_MAX}
                              rows={5}
                              placeholder="Write a compelling 2–4 sentence description for readers."
                              onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                            />
                            <span
                              className={styles.counter}
                              data-over={descLen > DESC_WARN ? '' : undefined}
                            >
                              {descLen}/{DESC_MAX}
                            </span>
                          </div>

                          <div className={styles.field}>
                            <span className={styles.fieldLabel}>Content rating</span>
                            <div className={styles.segmented} role="group" aria-label="Content rating">
                              {CONTENT_RATINGS.map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  className={styles.seg}
                                  data-active={draft.contentRating === r ? '' : undefined}
                                  onClick={() => setDraft(d => ({ ...d, contentRating: r }))}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ── Step 3: Access ───────────────────────────────── */}
                      {step.id === 3 && (
                        <>
                          <div className={styles.field}>
                            <span className={styles.fieldLabel}>Beta access</span>
                            <div className={styles.segmented} role="group" aria-label="Beta access mode">
                              {BETA_MODE_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={styles.seg}
                                  data-active={draft.betaMode === opt.value ? '' : undefined}
                                  onClick={() => setDraft(d => ({
                                    ...d,
                                    betaMode: opt.value,
                                    maxBetaReaders: opt.value === 'CLOSED' ? null : d.maxBetaReaders,
                                  }))}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <span className={styles.modeHint}>
                              {BETA_MODE_OPTIONS.find(o => o.value === draft.betaMode)?.description}
                            </span>
                          </div>

                          {draft.betaMode !== 'CLOSED' && draft.betaMode !== 'INVITE_ONLY' && (
                            <div className={styles.field}>
                              <label className={styles.fieldLabel} htmlFor="pc-max-readers">
                                Max readers
                              </label>
                              <input
                                id="pc-max-readers"
                                type="number"
                                min={1}
                                className={styles.input}
                                value={draft.maxBetaReaders ?? ''}
                                placeholder="Unlimited"
                                onChange={e => setDraft(d => ({
                                  ...d,
                                  maxBetaReaders: e.target.value
                                    ? parseInt(e.target.value, 10) : null,
                                }))}
                              />
                            </div>
                          )}

                          <div className={styles.field}>
                            <span className={styles.fieldLabel}>Content warnings</span>
                            <div className={styles.chipGrid} role="group" aria-label="Content warnings">
                              {CONTENT_WARNINGS.map(w => {
                                const active = draft.contentWarnings.includes(w);
                                return (
                                  <button
                                    key={w}
                                    type="button"
                                    className={styles.chip}
                                    aria-pressed={active}
                                    data-active={active ? '' : undefined}
                                    onClick={() => setDraft(d => ({
                                      ...d,
                                      contentWarnings: active
                                        ? d.contentWarnings.filter(x => x !== w)
                                        : [...d.contentWarnings, w],
                                    }))}
                                  >
                                    {active && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
                                    {w}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Preview column ────────────────────────────── */}
        <div className={styles.previewCol}>
          <div className={styles.previewSticky}>
            <ListingPreview draft={draft} />
          </div>
        </div>

      </div>
    </div>
  );
}

export type { ListingDraft, SaveState };
