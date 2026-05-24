import { useState, useRef, useEffect } from 'react';
import type { BookMetadata, BetaMode } from '../library/data';
import { BETA_MODE_OPTIONS, CONTENT_RATINGS, CONTENT_WARNINGS } from '../library/data';
import { GENRES } from '../../shared/genres';
import { GENRE_KEYWORDS } from '../../shared/keywords';
import { api } from '../../lib/api';
import { ListingPreview, completenessScore } from './ListingPreview';
import type { ListingDraft } from './ListingPreview';
import { TeaserComposer } from './TeaserComposer';
import { PublishCelebration } from './PublishCelebration';
import styles from './PublishChecklist.module.css';

// ── Types ──────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type StepId    = 1 | 2 | 3 | 4;

interface LaunchState {
  arcEnabled:   boolean;
  teaserText:   string;
  teaserPosted: boolean;
  launchDate:   string;
}

export interface PublishChecklistProps {
  manuscript:     BookMetadata;
  coverUrl:       string | null;
  authorName:     string;
  onBack:         () => void;
  onSave:         (updates: Partial<BookMetadata>, newCoverUrl?: string) => void;
  onPublish?:     () => void;
  socialAccounts?: string[];
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
    keywords:        ms.keywords ? ms.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    betaMode:        ms.betaMode        ?? 'CLOSED',
    maxBetaReaders:  ms.maxBetaReaders  ?? null,
    readerCount:     0,
    coverUrl,
    estimatedPages:  ms.estimatedPages  ?? null,
    wordCount:       0,
  };
}

function stepComplete(id: StepId, draft: ListingDraft, launch?: LaunchState): boolean {
  if (id === 1) return !!draft.coverUrl;
  if (id === 2) return !!(draft.genre && draft.description?.trim() && draft.contentRating);
  if (id === 3) return draft.betaMode !== 'CLOSED';
  if (id === 4 && launch) return launch.arcEnabled && launch.teaserPosted && !!launch.launchDate;
  return false;
}

function defaultOpen(draft: ListingDraft): StepId {
  if (!stepComplete(1, draft)) return 1;
  if (!stepComplete(2, draft)) return 2;
  if (!stepComplete(3, draft)) return 3;
  return completenessScore(draft) === 5 ? 4 : 1;
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
  { id: 1, label: 'Cover',           hint: 'Upload a cover image. Recommended: 1600 × 2400 px (2:3 ratio), JPEG or PNG.' },
  { id: 2, label: 'Metadata',        hint: 'Set genre, description, and content rating so readers can find your book.' },
  { id: 3, label: 'Access',          hint: 'Choose how readers discover and join your beta read.' },
  { id: 4, label: 'Launch sequence', hint: 'Build pre-launch momentum. Complete all three actions to activate the Publish button.' },
];

const DESC_MAX = 1000;
const DESC_WARN = 900;

// ── Component ──────────────────────────────────────────────────────
export default function PublishChecklist({ manuscript, coverUrl, authorName, onBack, onSave, onPublish, socialAccounts = [] }: PublishChecklistProps) {
  const initialDraft = toDraft(manuscript, coverUrl, authorName);
  const [draft,     setDraft]     = useState<ListingDraft>(initialDraft);
  const [openStep,  setOpenStep]  = useState<StepId>(() => defaultOpen(initialDraft));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [coverLoading, setCoverLoading] = useState(false);
  const [launch, setLaunch] = useState<LaunchState>({
    arcEnabled:   false,
    teaserText:   '',
    teaserPosted: false,
    launchDate:   '',
  });
  const [teaserComposerOpen, setTeaserComposerOpen] = useState(false);
  const [published, setPublished] = useState(false);

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
    if (JSON.stringify(debouncedDraft.keywords) !== JSON.stringify(prev.keywords)) {
      updates.keywords = debouncedDraft.keywords.join(', ');
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

  // Save launch date to manuscript metadata when it's set
  useEffect(() => {
    if (!launch.launchDate) return;
    onSave({ launchDate: launch.launchDate });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch.launchDate]);

  function handleTeaserPost(caption: string, _socialPlatforms: string[]) {
    setLaunch(l => ({ ...l, teaserText: caption, teaserPosted: true }));
    setTeaserComposerOpen(false);
  }

  function handleCoverRemove() {
    setDraft(d => ({ ...d, coverUrl: null }));
    prevSavedRef.current = { ...prevSavedRef.current, coverUrl: null };
    onSave({ coverUploaded: false }, '');
    markSaved();
  }

  // ── Render ────────────────────────────────────────────────────────
  const prepareComplete = completenessScore(draft) === 5;
  const launchComplete  = stepComplete(4, draft, launch);
  const allDone         = prepareComplete && launchComplete;
  const descLen         = (draft.description ?? '').length;
  const availSubgenres = GENRES.find(g => g.label === draft.genre)?.subgenres ?? [];

  return (
    <>
    {published && (
      <PublishCelebration
        title={draft.title}
        authorName={draft.authorName}
        genre={draft.genre}
        coverUrl={draft.coverUrl}
        onGoToStore={() => { setPublished(false); onPublish?.(); }}
      />
    )}
    <div className={styles.page} {...(published ? { inert: '' } : {})}>

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

          {prepareComplete && !launchComplete && (
            <div className={styles.allDoneBanner}>
              <span className={styles.allDoneMark} aria-hidden="true">✓</span>
              <span className={styles.allDoneText}>
                Listing complete — complete the launch sequence to publish.
              </span>
            </div>
          )}

          <div className={styles.accordion}>
            {STEPS.map(step => {
              const locked = step.id === 4 && !prepareComplete;
              const done   = step.id === 4 ? stepComplete(4, draft, launch) : stepComplete(step.id, draft);
              const open   = openStep === step.id && !locked;
              return (
                <div
                  key={step.id}
                  className={styles.step}
                  data-done={done ? '' : undefined}
                  data-open={open ? '' : undefined}
                  data-locked={locked ? '' : undefined}
                >
                  <button
                    className={styles.stepHeader}
                    type="button"
                    aria-expanded={open}
                    onClick={() => { if (!locked) setOpenStep(step.id); }}
                  >
                    <span className={styles.stepNum}>{step.id}</span>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepCheck} aria-label={done ? 'Complete' : locked ? 'Locked' : 'Incomplete'}>
                      {done ? '✓' : locked ? '⊗' : '○'}
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
                            aria-label="Upload cover image"
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

                          <div className={styles.field}>
                            <span className={styles.fieldLabel}>
                              Keywords
                              {draft.keywords.length > 0 && (
                                <span className={styles.keywordCount}>{draft.keywords.length} selected</span>
                              )}
                            </span>
                            {!draft.genre ? (
                              <p className={styles.modeHint}>Select a genre above to see keyword suggestions.</p>
                            ) : (
                              <>
                                <p className={styles.modeHint}>
                                  Based on top-performing {draft.genre} titles. Click to add or remove.
                                </p>
                                <div className={styles.chipGrid} role="group" aria-label="Keyword suggestions">
                                  {(GENRE_KEYWORDS[draft.genre] ?? []).map(kw => {
                                    const active = draft.keywords.includes(kw);
                                    return (
                                      <button
                                        key={kw}
                                        type="button"
                                        className={styles.chip}
                                        aria-pressed={active}
                                        data-active={active ? '' : undefined}
                                        onClick={() => setDraft(d => ({
                                          ...d,
                                          keywords: active
                                            ? d.keywords.filter(k => k !== kw)
                                            : [...d.keywords, kw],
                                        }))}
                                      >
                                        {active && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
                                        {kw}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {/* ── Step 4: Launch sequence ──────────────────────── */}
                      {step.id === 4 && (
                        <div className={styles.launchActions}>

                          {/* ARC sign-ups */}
                          <div className={styles.launchAction} data-done={launch.arcEnabled ? '' : undefined}>
                            <div className={styles.launchActionHead}>
                              <span className={styles.launchActionMark} aria-hidden="true">
                                {launch.arcEnabled ? '✓' : '○'}
                              </span>
                              <span className={styles.launchActionTitle}>Open ARC sign-ups</span>
                            </div>
                            <p className={styles.launchActionDesc}>
                              Advance reader copies let you gather reviews before launch day.
                            </p>
                            <label className={styles.toggleRow}>
                              <span className={styles.toggleLabel}>Open to waitlist</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={launch.arcEnabled}
                                className={styles.toggle}
                                data-on={launch.arcEnabled ? '' : undefined}
                                onClick={() => setLaunch(l => ({ ...l, arcEnabled: !l.arcEnabled }))}
                              >
                                <span className={styles.toggleThumb} />
                              </button>
                            </label>
                          </div>

                          {/* Community teaser */}
                          <div className={styles.launchAction} data-done={launch.teaserPosted ? '' : undefined}>
                            <div className={styles.launchActionHead}>
                              <span className={styles.launchActionMark} aria-hidden="true">
                                {launch.teaserPosted ? '✓' : '○'}
                              </span>
                              <span className={styles.launchActionTitle}>Post a community teaser</span>
                            </div>
                            <p className={styles.launchActionDesc}>
                              Give your community a first look at what's coming.
                            </p>
                            {launch.teaserPosted ? (
                              <p className={styles.launchPosted}>Posted to community ✓</p>
                            ) : teaserComposerOpen ? (
                              <p className={styles.teaserComposeHint}>Composing in preview panel →</p>
                            ) : (
                              <button
                                type="button"
                                className={styles.postBtn}
                                onClick={() => setTeaserComposerOpen(true)}
                              >
                                Compose teaser →
                              </button>
                            )}
                          </div>

                          {/* Launch countdown */}
                          <div className={styles.launchAction} data-done={launch.launchDate ? '' : undefined}>
                            <div className={styles.launchActionHead}>
                              <span className={styles.launchActionMark} aria-hidden="true">
                                {launch.launchDate ? '✓' : '○'}
                              </span>
                              <span className={styles.launchActionTitle}>Set launch countdown</span>
                            </div>
                            <p className={styles.launchActionDesc}>
                              A countdown appears on your community profile and listing.
                            </p>
                            <div className={styles.field}>
                              <label htmlFor="pc-launch-date" className={styles.fieldLabel}>Launch date</label>
                              <input
                                id="pc-launch-date"
                                type="date"
                                className={styles.input}
                                value={launch.launchDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={e => setLaunch(l => ({ ...l, launchDate: e.target.value }))}
                              />
                            </div>
                          </div>

                        </div>
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

          {/* ── Publish ─────────────────────────────────── */}
          <div className={styles.publishWrap}>
            <button
              type="button"
              className={styles.publishBtn}
              data-active={launchComplete ? '' : undefined}
              disabled={!launchComplete}
              onClick={launchComplete ? () => setPublished(true) : undefined}
            >
              {launchComplete ? 'Publish book →' : 'Complete launch sequence to publish'}
            </button>
            {allDone && (
              <p className={styles.publishHint}>
                Your book will go live on the scheduled launch date.
              </p>
            )}
          </div>

        </div>

        {/* ── Preview column ────────────────────────────── */}
        <div className={styles.previewCol}>
          <div className={styles.previewSticky}>
            {teaserComposerOpen ? (
              <TeaserComposer
                draft={draft}
                launchDate={launch.launchDate}
                socialAccounts={socialAccounts}
                onPost={handleTeaserPost}
                onClose={() => setTeaserComposerOpen(false)}
              />
            ) : (
              <ListingPreview draft={draft} />
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}

export type { ListingDraft, SaveState };
