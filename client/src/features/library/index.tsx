import { useState, useRef, useEffect } from 'react';
import { SectionHead, BookCover } from '../../shared/ui/atoms';
import { STATUS_OPTIONS, CONTENT_RATINGS, CONTENT_WARNINGS, LANGUAGES, BETA_MODE_OPTIONS } from './data';
import type { BookMetadata, BetaMode, SpineColor } from './data';
import { extractFromFile } from './extractMetadata';
import { GENRES } from '../../shared/genres';
import { useAuth } from '../auth';
import ManuscriptCard from './ManuscriptCard';
import NewManuscriptTile from './NewManuscriptTile';
import ControlsBar from './ControlsBar';
import type { FilterStatus, SortBy } from './ControlsBar';
import styles from './Library.module.css';

import { api } from '../../lib/api';

type LibraryView = 'landing' | 'edit';
type BookDrafts  = Record<string, BookMetadata>;
type SavedState  = Record<string, boolean>;


interface LibraryProps {
  savedBooks: Record<string, BookMetadata>;
  onSave: (id: string, book: BookMetadata) => void;
  onDelete: (id: string) => void;
  openNewManuscript?: boolean;
  onOpenNewHandled?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const SPINE_PALETTE: SpineColor[] = ['spine-amber', 'spine-slate', 'spine-teal', 'spine-dark', 'spine-muted'];

function blankBook(existingCount = 0): BookMetadata {
  return {
    id: crypto.randomUUID(),
    title: 'Untitled manuscript',
    subtitle: '',
    seriesName: '',
    seriesNumber: null,
    genre: '',
    subgenre: '',
    description: '',
    targetAudience: '',
    contentRating: '',
    keywords: '',
    isbnEbook: '',
    isbnPrint: '',
    isbnPending: false,
    priceEbook: '',
    pricePaperback: '',
    language: 'English',
    estimatedPages: null,
    status: 'drafting',
    betaMode: 'CLOSED',
    maxBetaReaders: null,
    coverUploaded: false,
    spineColor: SPINE_PALETTE[existingCount % SPINE_PALETTE.length],
    contentWarnings: [],
  };
}



function loadCoverUrls(ids: string[]): Record<string, string> {
  const urls: Record<string, string> = {};
  ids.forEach(id => {
    const stored = localStorage.getItem(`bookending_cover_${id}`);
    if (stored) urls[id] = stored;
  });
  return urls;
}

function loadImportMeta(ids: string[]): Record<string, string> {
  const meta: Record<string, string> = {};
  ids.forEach(id => {
    const name = localStorage.getItem(`bookending_import_name_${id}`);
    if (name) meta[id] = name;
  });
  return meta;
}

export default function Library({ savedBooks, onSave, onDelete, openNewManuscript, onOpenNewHandled, onDirtyChange }: LibraryProps) {
  const { currentUser } = useAuth();
  const savedBookList = Object.values(savedBooks)
    .filter(b => typeof b.id === 'string' && b.id.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));

  const [view,      setView]      = useState<LibraryView>('landing');
  const [allBooks,  setAllBooks]  = useState<BookMetadata[]>(savedBookList);
  const [activeId,  setActiveId]  = useState<string>(savedBookList[0]?.id ?? '');
  const [drafts,    setDrafts]    = useState<BookDrafts>(
    () => Object.fromEntries(savedBookList.map(b => [b.id, { ...b }]))
  );
  const [savedMap,  setSavedMap]  = useState<SavedState>(
    () => Object.fromEntries(savedBookList.map(b => [b.id, true]))
  );
  const [isNewEntry,      setIsNewEntry]      = useState(false);
  const [leaveModal,      setLeaveModal]      = useState(false);
  const [deleteTargetId,  setDeleteTargetId]  = useState<string | null>(null);
  const [focusSection,    setFocusSection]    = useState<string | null>(null);
  const [autoFilled,   setAutoFilled]   = useState<string[]>([]);
  const [coverUrls,   setCoverUrls]   = useState<Record<string, string>>(
    () => loadCoverUrls(Object.keys(savedBooks))
  );
  const [importMeta,  setImportMeta]  = useState<Record<string, string>>(
    () => loadImportMeta(Object.keys(savedBooks))
  );

  // Landing page filter / sort / search
  const [filter,      setFilter]      = useState<FilterStatus>('all');
  const [sortBy,      setSortBy]      = useState<SortBy>('recently_edited');
  const [searchQuery, setSearchQuery] = useState('');

  const coverInputRef  = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const book    = drafts[activeId];
  const isSaved = savedMap[activeId] ?? true;

  // Sync internal state when savedBooks prop populates (async API load)
  useEffect(() => {
    const list = Object.values(savedBooks)
      .filter(b => typeof b.id === 'string' && b.id.length > 0)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (list.length === 0) return;
    setAllBooks(list);
    setActiveId(prev => (savedBooks[prev] ? prev : list[0].id));
    setDrafts(prev => {
      const next = { ...prev };
      for (const b of list) {
        if (!next[b.id]) next[b.id] = { ...b };
      }
      return next;
    });
    setSavedMap(prev => {
      const next = { ...prev };
      for (const b of list) {
        if (!(b.id in next)) next[b.id] = true;
      }
      return next;
    });
    setCoverUrls(prev => {
      const next = { ...prev };
      for (const id of Object.keys(savedBooks)) {
        if (!(id in next)) {
          const url = localStorage.getItem(`bookending_cover_${id}`);
          if (url) next[id] = url;
        }
      }
      return next;
    });
  // savedBooks object reference changes when API data arrives; stringify to detect real changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(savedBooks).sort().join(',')]);

  // Notify parent when dirty state changes
  useEffect(() => {
    onDirtyChange?.(view === 'edit' && !isSaved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isSaved]);

  // Scroll to a specific form section when entering edit view via a CTA deep-link
  useEffect(() => {
    if (view === 'edit' && focusSection) {
      const el = document.getElementById(`ms-section-${focusSection}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setFocusSection(null);
    }
  }, [view, focusSection]);

  // Open new manuscript form on mount if masthead button triggered it
  useEffect(() => {
    if (openNewManuscript) {
      const nb = blankBook(allBooks.length);
      setDrafts(prev => ({ ...prev, [nb.id]: nb }));
      setSavedMap(prev => ({ ...prev, [nb.id]: false }));
      setIsNewEntry(true);
      setActiveId(nb.id);
      setView('edit');
      onOpenNewHandled?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof BookMetadata>(field: K, value: BookMetadata[K]) {
    setDrafts(prev => ({ ...prev, [activeId]: { ...prev[activeId], [field]: value } }));
    setSavedMap(prev => ({ ...prev, [activeId]: false }));
  }

  function handleFieldSave(id: string, updates: Partial<BookMetadata>) {
    const current = drafts[id] ?? savedBooks[id];
    if (!current) return;
    const updated = { ...current, ...updates };
    setDrafts(prev => ({ ...prev, [id]: updated }));
    setSavedMap(prev => ({ ...prev, [id]: true }));
    setAllBooks(prev => prev.map(b => b.id === id ? updated : b));
    onSave(id, updated);
  }

  function handleSave() {
    onSave(activeId, book);
    if (isNewEntry) {
      setAllBooks(prev => [...prev, book]);
      setIsNewEntry(false);
    }
    setSavedMap(prev => ({ ...prev, [activeId]: true }));
  }

  function openEditor(id: string, section?: string) {
    setActiveId(id);
    setIsNewEntry(false);
    setFocusSection(section ?? null);
    setView('edit');
  }

  function addManuscript() {
    const nb = blankBook(allBooks.length);
    setDrafts(prev => ({ ...prev, [nb.id]: nb }));
    setSavedMap(prev => ({ ...prev, [nb.id]: false }));
    setIsNewEntry(true);
    setActiveId(nb.id);
    setView('edit');
  }

  function handleBackClick() {
    if (!isSaved) {
      setLeaveModal(true);
    } else {
      setIsNewEntry(false);
      setView('landing');
    }
  }

  function handleLeaveDiscard() {
    setLeaveModal(false);
    if (isNewEntry) {
      setDrafts(prev => { const next = { ...prev }; delete next[activeId]; return next; });
      setSavedMap(prev => { const next = { ...prev }; delete next[activeId]; return next; });
      setIsNewEntry(false);
    } else {
      setDrafts(prev => ({ ...prev, [activeId]: savedBooks[activeId] }));
      setSavedMap(prev => ({ ...prev, [activeId]: true }));
    }
    setView('landing');
  }

  function handleLeaveStay() {
    setLeaveModal(false);
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setAllBooks(prev => prev.filter(b => b.id !== id));
    setDrafts(prev => { const next = { ...prev }; delete next[id]; return next; });
    setSavedMap(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (view === 'edit' && activeId === id) {
      setIsNewEntry(false);
      setView('landing');
    }
    onDelete(id);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverInputRef.current) coverInputRef.current.value = '';

    const form = new FormData();
    form.append('cover', file);
    form.append('manuscriptId', activeId);

    try {
      const result = await api.upload<{ coverUrl: string }>('/api/covers', form);
      if (!result) throw new Error('Upload failed');
      const coverUrl = result.coverUrl;
      try { localStorage.setItem(`bookending_cover_${activeId}`, coverUrl); } catch { /* quota */ }
      setCoverUrls(prev => ({ ...prev, [activeId]: coverUrl }));
      update('coverUploaded', true);
    } catch (err) {
      console.error('Cover upload failed:', err);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importInputRef.current) importInputRef.current.value = '';

    const ext      = file.name.split('.').pop()?.toLowerCase();
    const filename = file.name;

    // Store file content for the Editor
    if (ext === 'txt') {
      const text = await file.text();
      const html = text.split(/\n\n+/)
        .map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
        .join('\n');
      try {
        localStorage.setItem(`bookending_import_${activeId}`, html);
        localStorage.setItem(`bookending_import_name_${activeId}`, filename);
      } catch { /* quota */ }
    } else {
      const placeholder = `<p><em>[${filename} imported — open in Editor to begin working]</em></p>`;
      try {
        localStorage.setItem(`bookending_import_${activeId}`, placeholder);
        localStorage.setItem(`bookending_import_name_${activeId}`, filename);
      } catch { /* quota */ }
    }
    setImportMeta(prev => ({ ...prev, [activeId]: filename }));

    // Extract metadata and pre-fill empty fields
    const extracted = await extractFromFile(file);
    const current   = drafts[activeId];
    if (!current) return;

    const updates: Partial<BookMetadata> = {};
    const filled:  string[]              = [];

    if (extracted.title && current.title === 'Untitled manuscript') {
      updates.title = extracted.title;
      filled.push('title');
    }
    if (extracted.description && !current.description) {
      updates.description = extracted.description;
      filled.push('description');
    }
    if (extracted.keywords && !current.keywords) {
      updates.keywords = extracted.keywords;
      filled.push('keywords');
    }
    if (extracted.estimatedPages) {
      updates.estimatedPages = extracted.estimatedPages;
      filled.push('est. pages');
    }

    if (Object.keys(updates).length > 0) {
      setDrafts(prev => ({
        ...prev,
        [activeId]: { ...prev[activeId], ...updates },
      }));
      setSavedMap(prev => ({ ...prev, [activeId]: false }));
      setAutoFilled(filled);
    }
  }

  const statusLabel = STATUS_OPTIONS.find(s => s.value === book?.status)?.label ?? '—';

  // ── Landing view ──────────────────────────────────────────────────
  const authorName = currentUser?.name ?? 'Author';

  const filtered = allBooks
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
    if (sortBy === 'by_status')    return a.status.localeCompare(b.status);
    return 0;
  });

  const titleCount = allBooks.length;
  const introText = titleCount === 0
    ? 'Add your first manuscript to get started.'
    : `${titleCount === 1 ? 'One work' : `${titleCount} works`} in progress. Each card mirrors what readers and retailers will see.`;

  // ── Edit view ─────────────────────────────────────────────────────
  return (
    <div>
      {deleteTargetId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Delete manuscript?</div>
            <p className={styles.modalBody}>
              <strong>&ldquo;{drafts[deleteTargetId]?.title ?? allBooks.find(b => b.id === deleteTargetId)?.title}&rdquo;</strong> and all its chapters, notes, beta-reader assignments, and associated data will be permanently deleted. This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnStay} onClick={() => setDeleteTargetId(null)}>
                Cancel
              </button>
              <button className={styles.modalBtnDelete} onClick={handleDeleteConfirm}>
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'landing' && (
        <div>
          <div className={styles.sectionHeader}>
            <SectionHead
              eyebrow="§ 07 · MANUSCRIPTS"
              title="Your manuscripts"
              kicker={introText}
            />
          </div>

          <ControlsBar
            manuscripts={allBooks}
            filter={filter}
            sortBy={sortBy}
            searchQuery={searchQuery}
            onFilterChange={setFilter}
            onSortChange={setSortBy}
            onSearchChange={setSearchQuery}
          />

          {allBooks.length === 0 ? (
            <div className={styles.emptyShelf}>
              <NewManuscriptTile onAdd={addManuscript} />
            </div>
          ) : (
            <div className={styles.landingWrap}>
              <div className={styles.landingGrid}>
                {sorted.length === 0 ? (
                  <div className={styles.noResults}>
                    No manuscripts match &ldquo;{searchQuery}&rdquo;.{' '}
                    <button
                      type="button"
                      className={styles.clearSearch}
                      onClick={() => setSearchQuery('')}
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  sorted.map(b => (
                    <ManuscriptCard
                      key={b.id}
                      book={drafts[b.id] ?? b}
                      author={authorName}
                      onOpen={openEditor}
                      onFieldSave={handleFieldSave}
                      onDelete={setDeleteTargetId}
                    />
                  ))
                )}
                <NewManuscriptTile onAdd={addManuscript} />
              </div>
            </div>
          )}
        </div>
      )}

      {leaveModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Unsaved changes</div>
            <p className={styles.modalBody}>
              {isNewEntry
                ? 'This manuscript has not been saved yet. If you leave, it will be discarded.'
                : 'You have unsaved changes. If you leave, all changes will be lost.'}
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnStay} onClick={handleLeaveStay}>
                Stay and save
              </button>
              <button className={styles.modalBtnDiscard} onClick={handleLeaveDiscard}>
                {isNewEntry ? 'Discard draft' : 'Discard changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'edit' && <div>
      <div className={styles.backNav}>
        <button className={styles.backBtn} onClick={handleBackClick}>
          ← Manuscripts
        </button>
        <span className={styles.backTitle}>{book?.title}</span>
      </div>

      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="§ 07 · Manuscripts"
          title={book?.title ?? 'Manuscript'}
          kicker="Title metadata, ISBNs, descriptions, and pricing."
        />
      </div>

      {/* Profile grid */}
      <div className={styles.profileGrid}>

        {/* Cover column */}
        <div className={styles.coverCol}>
          <div className={styles.coverBox} onClick={() => coverInputRef.current?.click()}>
            {coverUrls[activeId] ? (
              <img src={coverUrls[activeId]} alt={book?.title} className={styles.coverImg} />
            ) : (
              <BookCover title={book?.title ?? ''} author="Billie Wolf" spine={book?.spineColor} />
            )}
            <div className={styles.coverBoxOverlay}>
              <span className={styles.uploadHint}>
                {coverUrls[activeId] ? 'Replace cover' : 'Upload cover'}
              </span>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleCoverUpload}
            />
          </div>
          {/* Spine color picker — only visible when no uploaded cover */}
          {!coverUrls[activeId] && (
            <div className={styles.spinePickerWrap}>
              <div className={styles.spinePickerLabel}>Spine color</div>
              <div className={styles.spinePickerRow}>
                {SPINE_PALETTE.map(spine => (
                  <button
                    key={spine}
                    type="button"
                    className={styles.spineSwatch}
                    data-spine={spine}
                    data-active={book?.spineColor === spine ? 'true' : undefined}
                    aria-label={spine.replace('spine-', '')}
                    onClick={() => update('spineColor', spine)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={styles.coverMeta}>
            <div className={styles.coverMetaRow}>
              <span className={styles.coverMetaLabel}>Status</span>
              <span className={styles.coverMetaValue}>{statusLabel}</span>
            </div>
            <div className={styles.coverMetaRow}>
              <span className={styles.coverMetaLabel}>Genre</span>
              <span className={styles.coverMetaValue}>
                {book?.genre
                  ? book.subgenre ? `${book.genre} · ${book.subgenre}` : book.genre
                  : '—'}
              </span>
            </div>
            <div className={styles.coverMetaRow}>
              <span className={styles.coverMetaLabel}>Language</span>
              <span className={styles.coverMetaValue}>{book?.language || '—'}</span>
            </div>
            <div className={styles.coverMetaRow}>
              <span className={styles.coverMetaLabel}>Est. pages</span>
              <span className={styles.coverMetaValue}>
                {book?.estimatedPages ? book.estimatedPages.toLocaleString() : '—'}
              </span>
            </div>
            {book?.isbnEbook && (
              <div className={styles.coverMetaRow}>
                <span className={styles.coverMetaLabel}>ISBN</span>
                <span className={styles.coverMetaValue}>{book.isbnEbook}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form column */}
        <div className={styles.formCol}>

          {/* Identity */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Identity</div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Title</span>
              <input className={styles.fieldInput} value={book?.title ?? ''} onChange={e => update('title', e.target.value)} placeholder="Book title" />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Subtitle</span>
              <input className={styles.fieldInput} value={book?.subtitle ?? ''} onChange={e => update('subtitle', e.target.value)} placeholder="Optional subtitle" />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Genre</span>
              <div className={styles.fieldSelectWrap}>
                <select
                  className={styles.fieldSelect}
                  value={book?.genre ?? ''}
                  data-placeholder={!book?.genre ? '' : undefined}
                  onChange={e => { update('genre', e.target.value); update('subgenre', ''); }}
                >
                  <option value="">— Select genre —</option>
                  {GENRES.map(g => (
                    <option key={g.label} value={g.label}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Sub-genre</span>
              <div className={styles.fieldSelectWrap}>
                <select
                  className={styles.fieldSelect}
                  value={book?.subgenre ?? ''}
                  data-placeholder={!book?.subgenre ? '' : undefined}
                  disabled={!book?.genre}
                  onChange={e => update('subgenre', e.target.value)}
                >
                  <option value="">— Select sub-genre —</option>
                  {GENRES.find(g => g.label === book?.genre)?.subgenres.map(sg => (
                    <option key={sg} value={sg}>{sg}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Series</span>
              <div className={styles.seriesRow}>
                <input className={styles.seriesInput} value={book?.seriesName ?? ''} onChange={e => update('seriesName', e.target.value)} placeholder="Series name (if applicable)" />
                <input className={styles.seriesNumInput} type="number" value={book?.seriesNumber ?? ''} onChange={e => update('seriesNumber', e.target.value ? Number(e.target.value) : null)} placeholder="No." min={1} />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Language</span>
              <div className={styles.fieldSelectWrap}>
                <select
                  className={styles.fieldSelect}
                  value={book?.language ?? ''}
                  data-placeholder={!book?.language ? '' : undefined}
                  onChange={e => update('language', e.target.value)}
                >
                  <option value="">— Select language —</option>
                  {LANGUAGES.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Est. pages</span>
              <input className={styles.fieldInput} type="number" value={book?.estimatedPages ?? ''} onChange={e => update('estimatedPages', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 320" />
            </div>
          </div>

          {/* Description */}
          <div id="ms-section-description" className={styles.formSection}>
            <div className={styles.sectionHead}>Back-cover description</div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Blurb</span>
              <textarea className={styles.fieldTextarea} value={book?.description ?? ''} onChange={e => update('description', e.target.value)} placeholder="Write a compelling 2–4 sentence description for retailers and readers." />
            </div>
          </div>

          {/* Retail metadata */}
          <div id="ms-section-retail" className={styles.formSection}>
            <div className={styles.sectionHead}>Retail metadata</div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Target audience</span>
              <input className={styles.fieldInput} value={book?.targetAudience ?? ''} onChange={e => update('targetAudience', e.target.value)} placeholder="e.g. Adults who enjoyed Demon Copperhead" />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Content rating</span>
              <div className={styles.fieldSelectWrap}>
                <select
                  className={styles.fieldSelect}
                  value={book?.contentRating ?? ''}
                  data-placeholder={!book?.contentRating ? '' : undefined}
                  onChange={e => update('contentRating', e.target.value)}
                >
                  <option value="">— Select rating —</option>
                  {CONTENT_RATINGS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Content warnings</span>
              <details className={styles.cwDropdown}>
                <summary className={styles.cwSummary}>
                  {(book?.contentWarnings ?? []).length === 0
                    ? 'None selected'
                    : (book?.contentWarnings ?? []).join(', ')}
                </summary>
                <div className={styles.cwList}>
                  {CONTENT_WARNINGS.map(w => {
                    const checked = (book?.contentWarnings ?? []).includes(w);
                    return (
                      <label key={w} className={styles.cwItem}>
                        <input
                          type="checkbox"
                          className={styles.cwCheckbox}
                          checked={checked}
                          onChange={() => {
                            const current = book?.contentWarnings ?? [];
                            update('contentWarnings', checked
                              ? current.filter(x => x !== w)
                              : [...current, w]);
                          }}
                        />
                        <span className={styles.cwLabel}>{w}</span>
                      </label>
                    );
                  })}
                </div>
              </details>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Keywords</span>
              <input className={styles.fieldInput} value={book?.keywords ?? ''} onChange={e => update('keywords', e.target.value)} placeholder="Comma-separated — used for retailer search categories" />
            </div>
          </div>

          {/* Identifiers */}
          <div id="ms-section-identifiers" className={styles.formSection}>
            <div className={styles.sectionHead}>Identifiers</div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>ISBN — Ebook</span>
              <input className={styles.fieldInput} value={book?.isbnEbook ?? ''} onChange={e => update('isbnEbook', e.target.value)} placeholder="978-0-000000-00-0" />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>ISBN — Print</span>
              <input className={styles.fieldInput} value={book?.isbnPrint ?? ''} onChange={e => update('isbnPrint', e.target.value)} placeholder="978-0-000000-01-7" />
            </div>
          </div>

          {/* Pricing */}
          <div id="ms-section-pricing" className={styles.formSection}>
            <div className={styles.sectionHead}>Pricing</div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Ebook</span>
              <div className={styles.priceRow}>
                <span className={styles.pricePrefix}>$</span>
                <input className={styles.priceInput} value={book?.priceEbook ?? ''} onChange={e => update('priceEbook', e.target.value)} placeholder="9.99" />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Paperback</span>
              <div className={styles.priceRow}>
                <span className={styles.pricePrefix}>$</span>
                <input className={styles.priceInput} value={book?.pricePaperback ?? ''} onChange={e => update('pricePaperback', e.target.value)} placeholder="17.99" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Status</div>
            <div className={styles.statusRow}>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  className={styles.statusBtn}
                  data-active={book?.status === s.value ? 'true' : undefined}
                  onClick={() => update('status', s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Beta-reading */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Beta-reading</div>
            <div className={styles.betaModeRow}>
              {BETA_MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={styles.betaModeBtn}
                  data-active={book?.betaMode === opt.value ? 'true' : undefined}
                  onClick={() => update('betaMode', opt.value as BetaMode)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className={styles.betaModeHint}>
              {BETA_MODE_OPTIONS.find(o => o.value === book?.betaMode)?.description ?? ''}
            </span>
            {book?.betaMode !== 'CLOSED' && (
              <div className={styles.betaCapRow}>
                <label className={styles.betaCapLabel}>Max readers</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  className={styles.betaCapInput}
                  value={book?.maxBetaReaders ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    update('maxBetaReaders', v);
                  }}
                />
                <span className={styles.betaCapHint}>Leave blank for no limit</span>
              </div>
            )}
          </div>

          {/* Manuscript file */}
          <div className={styles.formSection}>
            <div className={styles.sectionHead}>Manuscript file</div>
            <div
              className={styles.importZone}
              onClick={() => importInputRef.current?.click()}
            >
              <div className={styles.importZoneLabel}>
                {importMeta[activeId]
                  ? importMeta[activeId]
                  : 'Click to import a manuscript file'}
              </div>
              <div className={styles.importZoneSub}>
                {importMeta[activeId]
                  ? 'Click to replace · opens in Editor'
                  : '.TXT · .DOCX · .RTF · PDF'}
              </div>
              <input
                ref={importInputRef}
                type="file"
                accept=".txt,.docx,.rtf,.pdf"
                className={styles.fileInput}
                onChange={handleImport}
              />
            </div>
            {autoFilled.length > 0 && (
              <div className={styles.autoFilledNote}>
                Auto-filled from file: {autoFilled.join(', ')}
                <button
                  className={styles.autoFilledDismiss}
                  onClick={() => setAutoFilled([])}
                  aria-label="Dismiss"
                >×</button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.deleteManuscriptBtn}
              onClick={() => setDeleteTargetId(activeId)}
            >
              Delete manuscript
            </button>
            {!isSaved && (
              <span className={styles.savedIndicator}>Unsaved changes</span>
            )}
            <button type="button" className={styles.saveBtn} disabled={isSaved} onClick={handleSave}>
              Save profile
            </button>
          </div>

        </div>
      </div>
      </div>}
    </div>
  );
}
