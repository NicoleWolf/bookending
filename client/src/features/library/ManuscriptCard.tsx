import { useState, useRef } from 'react';
import type { BookMetadata, BookStatus } from './data';
import { STATUS_OPTIONS } from './data';
import { GENRES } from '../../shared/genres';
import styles from './ManuscriptCard.module.css';

interface ManuscriptCardProps {
  book: BookMetadata;
  author: string;
  onOpen: (id: string, section?: string) => void;
  onFieldSave: (id: string, updates: Partial<BookMetadata>) => void;
  onDelete: (id: string) => void;
}

type EditingField = 'subtitle' | 'blurb' | 'genre' | 'isbns' | 'keywords' | 'status' | null;

function statusDisplay(status: BookMetadata['status']): string {
  if (status === 'in-revision') return 'IN REVISION';
  return status.toUpperCase();
}

export default function ManuscriptCard({ book, author, onOpen, onFieldSave, onDelete }: ManuscriptCardProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftIsbnEbook, setDraftIsbnEbook] = useState('');
  const [draftIsbnPrint, setDraftIsbnPrint] = useState('');

  // Refs for stale-closure-free reads and preventing accidental post-blur navigation
  const editingFieldRef = useRef<EditingField>(null);
  const editCommitRef   = useRef(false);
  const isbnEbookRef    = useRef<HTMLInputElement>(null);
  const isbnPrintRef    = useRef<HTMLInputElement>(null);

  const blurb      = book.description.trim();
  const keywords   = book.keywords ? book.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];
  const isbnDisplay = book.isbnPrint || book.isbnEbook;
  const genreText  = book.genre
    ? book.estimatedPages
      ? `${book.genre.toUpperCase()} · ${book.estimatedPages} PP`
      : book.genre.toUpperCase()
    : null;

  function startEdit(e: React.MouseEvent | React.KeyboardEvent, field: EditingField, value: string) {
    e.stopPropagation();
    editingFieldRef.current = field;
    setEditingField(field);
    setDraftValue(value);
    if (field === 'isbns') {
      setDraftIsbnEbook(book.isbnEbook);
      setDraftIsbnPrint(book.isbnPrint);
    }
  }

  function markCommitted() {
    editCommitRef.current = true;
    requestAnimationFrame(() => { editCommitRef.current = false; });
  }

  function commitField() {
    const field = editingFieldRef.current;
    if (!field || field === 'isbns' || field === 'status') return;
    editingFieldRef.current = null;
    setEditingField(null);
    markCommitted();
    const updates: Partial<BookMetadata> = {};
    if (field === 'subtitle')  updates.subtitle    = draftValue;
    if (field === 'blurb')     updates.description = draftValue;
    if (field === 'genre')     updates.genre       = draftValue;
    if (field === 'keywords')  updates.keywords    = draftValue;
    onFieldSave(book.id, updates);
  }

  function commitIsbn() {
    if (editingFieldRef.current !== 'isbns') return;
    editingFieldRef.current = null;
    setEditingField(null);
    markCommitted();
    onFieldSave(book.id, { isbnEbook: draftIsbnEbook, isbnPrint: draftIsbnPrint });
  }

  function revert() {
    editingFieldRef.current = null;
    setEditingField(null);
    setDraftValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent, isTextarea = false) {
    if (e.key === 'Escape') { e.preventDefault(); revert(); return; }
    if (e.key === 'Enter' && !isTextarea) {
      e.preventDefault();
      if (editingFieldRef.current === 'isbns') commitIsbn();
      else commitField();
    }
  }

  function handleIsbnBlur(e: React.FocusEvent) {
    if (editingFieldRef.current !== 'isbns') return;
    const movingTo = e.relatedTarget as Node | null;
    if (movingTo === isbnEbookRef.current || movingTo === isbnPrintRef.current) return;
    commitIsbn();
  }

  function handleStatusSelect(e: React.MouseEvent, newStatus: BookStatus) {
    e.stopPropagation();
    editingFieldRef.current = null;
    setEditingField(null);
    onFieldSave(book.id, { status: newStatus });
  }

  function handleVisibilityToggle(e: React.MouseEvent) {
    e.stopPropagation();
    onFieldSave(book.id, { visibility: book.visibility === 'private' ? 'public' : 'private' });
  }

  function handleCardClick() {
    if (editCommitRef.current) return;
    if (editingFieldRef.current === 'status') { revert(); return; }
    if (!editingFieldRef.current) onOpen(book.id);
  }

  const isEditing = editingField !== null;

  return (
    <div
      role="link"
      tabIndex={0}
      className={styles.card}
      data-editing={isEditing ? 'true' : undefined}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && editingField) { revert(); return; }
        if ((e.key === 'Enter' || e.key === ' ') && !editingField) {
          e.preventDefault(); onOpen(book.id);
        }
      }}
      aria-label={book.title}
    >
      {/* ── Top half: book cover ── */}
      <div className={styles.cover} data-spine={book.spineColor}>
        <button
          type="button"
          className={styles.cardDeleteBtn}
          aria-label="Delete manuscript"
          onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
        >×</button>
        <span className={styles.byline}>{author.toUpperCase()}</span>
        <div className={styles.titleBlock}>
          <span className={styles.title}>{book.title}</span>

          {editingField === 'subtitle' ? (
            <input
              className={styles.coverInput}
              value={draftValue}
              autoFocus
              onChange={e => setDraftValue(e.target.value)}
              onBlur={commitField}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
              placeholder="Add a subtitle..."
            />
          ) : book.subtitle ? (
            <span
              className={`${styles.subtitle} ${styles.editable}`}
              onClick={(e) => startEdit(e, 'subtitle', book.subtitle)}
              role="button"
              tabIndex={-1}
              aria-label="Edit subtitle"
            >
              {book.subtitle}
            </span>
          ) : (
            <button
              type="button"
              className={`${styles.subtitle} ${styles.invite}`}
              onClick={(e) => startEdit(e, 'subtitle', '')}
              aria-label="Add a subtitle"
            >
              + Add a subtitle
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom half: metadata ── */}
      <div className={styles.meta}>

        {/* Pill row */}
        <div className={styles.pills}>

          {/* Status */}
          {editingField === 'status' ? (
            <div className={styles.statusToggle} onClick={e => e.stopPropagation()}>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={styles.statusToggleBtn}
                  data-active={book.status === s.value ? 'true' : undefined}
                  onClick={(e) => handleStatusSelect(e, s.value)}
                >
                  {s.label.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <span
              className={`${styles.statusPill} ${styles.editable}`}
              onClick={(e) => startEdit(e, 'status', book.status)}
              role="button"
              tabIndex={-1}
              aria-label="Change status"
            >
              {statusDisplay(book.status)}
            </span>
          )}

          {/* Visibility — direct toggle */}
          <span
            className={`${styles.visibilityPill} ${styles.editable}`}
            onClick={handleVisibilityToggle}
            role="button"
            tabIndex={-1}
            aria-label={`Toggle visibility — currently ${book.visibility}`}
          >
            {book.visibility.toUpperCase()}
          </span>

          {/* Genre */}
          {editingField === 'genre' ? (
            <select
              className={styles.genreSelect}
              value={draftValue}
              autoFocus
              onChange={e => setDraftValue(e.target.value)}
              onBlur={commitField}
              onKeyDown={handleKeyDown}
              onClick={e => e.stopPropagation()}
            >
              <option value="">Genre…</option>
              {GENRES.map(g => (
                <option key={g.label} value={g.label}>{g.label}</option>
              ))}
            </select>
          ) : genreText ? (
            <span
              className={`${styles.genreLabel} ${styles.editable}`}
              onClick={(e) => startEdit(e, 'genre', book.genre)}
              role="button"
              tabIndex={-1}
              aria-label="Edit genre"
            >
              {genreText}
            </span>
          ) : (
            <button
              type="button"
              className={`${styles.genreLabel} ${styles.invite}`}
              onClick={(e) => startEdit(e, 'genre', '')}
              aria-label="Add genre"
            >
              + GENRE
            </button>
          )}
        </div>

        {/* Blurb area */}
        <div className={styles.blurbArea} data-editing={editingField === 'blurb' ? 'true' : undefined}>
          {editingField === 'blurb' ? (
            <textarea
              className={styles.blurbTextarea}
              value={draftValue}
              autoFocus
              onChange={e => setDraftValue(e.target.value)}
              onBlur={commitField}
              onKeyDown={(e) => handleKeyDown(e, true)}
              onClick={e => e.stopPropagation()}
              placeholder="Write a back-cover blurb..."
            />
          ) : blurb ? (
            <p
              className={`${styles.blurb} ${styles.editable}`}
              onClick={(e) => startEdit(e, 'blurb', book.description)}
              role="button"
              tabIndex={-1}
              aria-label="Edit blurb"
            >
              &ldquo;{blurb}&rdquo;
            </p>
          ) : (
            <button
              type="button"
              className={styles.blurbInvite}
              onClick={(e) => startEdit(e, 'blurb', '')}
              aria-label="Write a blurb"
            >
              + Write a back-cover blurb to help readers find this book...
            </button>
          )}
        </div>

        {/* Meta row */}
        <div
          className={styles.metaRow}
          data-editing={editingField === 'isbns' || editingField === 'keywords' ? 'true' : undefined}
        >
          {editingField === 'isbns' ? (
            <span className={styles.isbnInputs} onClick={e => e.stopPropagation()}>
              <label className={styles.isbnLabel}>
                <span>EBOOK</span>
                <input
                  ref={isbnEbookRef}
                  className={styles.metaInput}
                  value={draftIsbnEbook}
                  autoFocus
                  onChange={e => setDraftIsbnEbook(e.target.value)}
                  onBlur={handleIsbnBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="978-0-000000-00-0"
                />
              </label>
              <label className={styles.isbnLabel}>
                <span>PRINT</span>
                <input
                  ref={isbnPrintRef}
                  className={styles.metaInput}
                  value={draftIsbnPrint}
                  onChange={e => setDraftIsbnPrint(e.target.value)}
                  onBlur={handleIsbnBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="978-0-000000-01-7"
                />
              </label>
            </span>
          ) : (
            <>
              {isbnDisplay ? (
                <span
                  className={styles.editable}
                  onClick={(e) => startEdit(e, 'isbns', '')}
                  role="button"
                  tabIndex={-1}
                  aria-label="Edit ISBNs"
                >
                  {isbnDisplay}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.invite}
                  onClick={(e) => startEdit(e, 'isbns', '')}
                >
                  + ISBNs
                </button>
              )}
              <span className={styles.metaDot}> · </span>
              {editingField === 'keywords' ? (
                <input
                  className={`${styles.metaInput} ${styles.metaInputKeywords}`}
                  value={draftValue}
                  autoFocus
                  onChange={e => setDraftValue(e.target.value)}
                  onBlur={commitField}
                  onKeyDown={handleKeyDown}
                  onClick={e => e.stopPropagation()}
                  placeholder="comma, separated, keywords"
                />
              ) : keywords.length > 0 ? (
                <span
                  className={`${styles.metaText} ${styles.editable}`}
                  onClick={(e) => startEdit(e, 'keywords', book.keywords)}
                  role="button"
                  tabIndex={-1}
                  aria-label="Edit keywords"
                >
                  {keywords.join(', ')}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.invite}
                  onClick={(e) => startEdit(e, 'keywords', '')}
                >
                  + Keywords
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
