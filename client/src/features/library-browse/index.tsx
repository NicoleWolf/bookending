import { useState, useMemo, useEffect } from 'react';
import { LibraryMasthead } from './LibraryMasthead';
import type { LibraryView } from './LibraryMasthead';
import { ManuscriptCard } from './ManuscriptCard';
import { fuzzySearch } from './data';
import type { CatalogManuscript, ManuscriptStatus } from './data';
import type { BookMetadata, BookStatus } from '../library/data';
import { useAuth } from '../auth';
import { DiscoverView } from './DiscoverView';
import { BrowseView } from './BrowseView';
import styles from './LibraryBrowse.module.css';
import { api } from '../../lib/api';

import type { BrowseRecord } from '@bookending/shared';

const STATUS_MAP: Record<BookStatus, ManuscriptStatus> = {
  'drafting':    'waitlist',
  'in-revision': 'open',
  'published':   'closed',
};

function recordToCatalog(r: BrowseRecord, idx: number): CatalogManuscript {
  const status: ManuscriptStatus =
    r.status === 'IN_REVISION' ? 'open' :
    r.status === 'PUBLISHED'   ? 'closed' : 'waitlist';
  return {
    id:             r.id,
    title:          r.title,
    author:         r.author.name,
    genre:          r.genre ?? 'Fiction',
    subgenre:       r.subgenre ?? '',
    description:    r.description ?? '',
    keywords:       r.keywords ? r.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    status,
    wordCount:      r.wordCount,
    estimatedPages: r.estimatedPages ?? 0,
    contentRating:  r.contentRating ?? '',
    scheme:         idx % 5,
    readerCount:    r.readerCount,
    maxBetaReaders: r.maxBetaReaders,
    listedAt:       new Date().toISOString().slice(0, 10),
    themes:         [],
    betaMode:       r.betaMode as CatalogManuscript['betaMode'],
    pendingRequest: r.pendingRequest,
  };
}

function bookToCatalog(book: BookMetadata, index: number): CatalogManuscript {
  return {
    id:             10000 + index,
    title:          book.title,
    author:         'Billie Wolf',
    genre:          book.genre || 'Fiction',
    subgenre:       book.subgenre || '',
    description:    book.description || '',
    keywords:       book.keywords ? book.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    status:         STATUS_MAP[book.status],
    wordCount:      book.estimatedPages ? book.estimatedPages * 250 : 0,
    estimatedPages: book.estimatedPages ?? 0,
    contentRating:  book.contentRating || '',
    scheme:         index % 5,
    readerCount:    0,
    maxBetaReaders: book.maxBetaReaders,
    listedAt:       new Date().toISOString().slice(0, 10),
    themes:         [],
    betaMode:       book.betaMode as CatalogManuscript['betaMode'],
    ownManuscript:  true,
  };
}

interface LibraryBrowseProps {
  savedBooks:     Record<string, BookMetadata>;
  onEditProfile?: () => void;
}

export default function LibraryBrowse({ savedBooks, onEditProfile }: LibraryBrowseProps) {
  const { session } = useAuth();
  const [view,           setView]           = useState<LibraryView>('discover');
  const [query,          setQuery]          = useState('');
  const [browseGenre,    setBrowseGenre]    = useState<string | null>(null);
  const [apiManuscripts, setApiManuscripts] = useState<CatalogManuscript[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const records = await api.get<BrowseRecord[]>('/api/browse');
        if (records.length > 0) setApiManuscripts(records.map(recordToCatalog));
      } catch { /* API down — static data remains */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const allManuscripts = useMemo<CatalogManuscript[]>(() => {
    const publicBooks = Object.values(savedBooks)
      .filter(b => b.betaMode === 'PUBLIC' || b.betaMode === 'REQUEST')
      .map(bookToCatalog);
    return [...publicBooks, ...apiManuscripts];
  }, [savedBooks, apiManuscripts]);

  const openCount  = allManuscripts.filter(m => m.status === 'open').length;
  const isSearching = query.trim().length >= 2;
  const activeView: LibraryView = isSearching ? 'search' : view;

  const results = useMemo(
    () => isSearching ? fuzzySearch(allManuscripts, query) : [],
    [allManuscripts, query, isSearching],
  );

  function openDiscover() { setView('discover'); setQuery(''); }
  function openBrowse(genre?: string) {
    setBrowseGenre(genre ?? null);
    setView('browse');
    setQuery('');
  }
  function openSearch() { setView('search'); setQuery(''); }

  return (
    <div className={styles.shell}>
      {/* ── Masthead (always visible) ───────────────────────────── */}
      <div className={styles.mastheadWrap}>
        <LibraryMasthead
          totalManuscripts={allManuscripts.length}
          openManuscripts={openCount}
          activeView={activeView}
          onDiscover={openDiscover}
          onBrowse={() => openBrowse()}
          onSearch={openSearch}
        />
      </div>

      {/* ── Search input (shown when Search tab active) ─────────── */}
      {(isSearching || activeView === 'search') && (
        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={query}
            autoFocus
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author, genre, or theme…"
            aria-label="Search manuscripts"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className={styles.content}>
        {/* Search results */}
        {isSearching && (
          <div className={styles.searchResults}>
            <div className={styles.searchMeta}>
              <span className={styles.resultCount}>
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </span>
            </div>
            {results.length > 0 ? (
              <div className={styles.searchGrid}>
                {results.map(m => <ManuscriptCard key={m.id} ms={m} variant="compact" />)}
              </div>
            ) : (
              <p className={`serif ${styles.noResults}`}>
                No manuscripts match &ldquo;{query}&rdquo;. Try a genre, theme, or author name.
              </p>
            )}
          </div>
        )}

        {!isSearching && view === 'discover' && (
          <DiscoverView
            manuscripts={allManuscripts}
            totalCount={allManuscripts.length}
            onBrowseAll={() => openBrowse()}
            onEditProfile={onEditProfile}
          />
        )}
        {!isSearching && view === 'browse' && (
          <BrowseView initialGenre={browseGenre} manuscripts={allManuscripts} />
        )}
      </div>
    </div>
  );
}
