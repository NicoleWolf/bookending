import { useState, useMemo, useEffect } from 'react';
import { SectionHead } from '../../shared/ui/atoms';
import { IconSearch } from '../../shared/ui/icons';
import { MANUSCRIPTS, fuzzySearch } from './data';
import type { CatalogManuscript, ManuscriptStatus } from './data';
import type { BookMetadata, BookStatus } from '../library/data';
import { useAuth } from '../auth';
import { DiscoverView } from './DiscoverView';
import { BrowseView } from './BrowseView';
import { ManuscriptCard } from './ManuscriptCard';
import styles from './LibraryBrowse.module.css';

import { api } from '../../lib/api';

type View = 'discover' | 'browse';

const STATUS_MAP: Record<BookStatus, ManuscriptStatus> = {
  'drafting':    'waitlist',
  'in-revision': 'open',
  'published':   'closed',
};

import type { BrowseRecord } from '@bookending/shared';

function recordToCatalog(r: BrowseRecord, idx: number): CatalogManuscript {
  const status: ManuscriptStatus =
    r.status === 'IN_REVISION' ? 'open' :
    r.status === 'PUBLISHED'   ? 'closed' : 'waitlist';
  return {
    id:            20000 + idx,
    title:         r.title,
    author:        r.author.name,
    genre:         r.genre ?? 'Fiction',
    subgenre:      r.subgenre ?? '',
    description:   r.description ?? '',
    keywords:      r.keywords ? r.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    status,
    wordCount:     r.wordCount,
    estimatedPages: r.estimatedPages ?? 0,
    contentRating: r.contentRating ?? '',
    scheme:        idx % 5,
    readerCount:   r.betaReaders.length,
    maxReaders:    10,
    listedAt:      new Date().toISOString().slice(0, 10),
    themes:        [],
  };
}

function bookToCatalog(book: BookMetadata, index: number): CatalogManuscript {
  return {
    id:            10000 + index,
    title:         book.title,
    author:        'Billie Wolf',
    genre:         book.genre || 'Fiction',
    subgenre:      book.subgenre || '',
    description:   book.description || '',
    keywords:      book.keywords ? book.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
    status:        STATUS_MAP[book.status],
    wordCount:     book.estimatedPages ? book.estimatedPages * 250 : 0,
    estimatedPages: book.estimatedPages ?? 0,
    contentRating: book.contentRating || '',
    scheme:        index % 5,
    readerCount:   0,
    maxReaders:    5,
    listedAt:      new Date().toISOString().slice(0, 10),
    themes:        [],
    ownManuscript: true,
  };
}

interface LibraryBrowseProps {
  savedBooks: Record<string, BookMetadata>;
}

export default function LibraryBrowse({ savedBooks }: LibraryBrowseProps) {
  const { session } = useAuth();
  const [view,            setView]            = useState<View>('discover');
  const [query,           setQuery]           = useState('');
  const [browseGenre,     setBrowseGenre]     = useState<string | null>(null);
  const [apiManuscripts,  setApiManuscripts]  = useState<CatalogManuscript[]>([]);

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
      .filter(b => b.visibility === 'public')
      .map(bookToCatalog);

    // Prefer API results over static MANUSCRIPTS if we got any
    const baseCatalog = apiManuscripts.length > 0 ? apiManuscripts : MANUSCRIPTS;
    return [...publicBooks, ...baseCatalog];
  }, [savedBooks, apiManuscripts]);

  const isSearching = query.trim().length >= 2;

  const results = useMemo(
    () => isSearching ? fuzzySearch(allManuscripts, query) : [],
    [allManuscripts, query, isSearching]
  );

  function openBrowse(genre: string) {
    setBrowseGenre(genre || null);
    setView('browse');
    setQuery('');
  }

  function openDiscover() {
    setView('discover');
    setQuery('');
  }

  const openCount = allManuscripts.filter(m => m.status === 'open').length;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="§ 08 · The Reading Room"
          title="Library"
          kicker="Manuscripts open for beta readers — browse, discover, and request to read."
        />
      </div>

      {/* Action bar */}
      <div className={styles.actionBar}>
        <div className={styles.searchWrap}>
          <IconSearch size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author, genre, or theme…"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>
              ×
            </button>
          )}
        </div>

        <div className={styles.viewTabs}>
          <button
            className={styles.viewTab}
            data-active={!isSearching && view === 'discover' ? 'true' : undefined}
            onClick={openDiscover}
          >
            Discover
          </button>
          <button
            className={styles.viewTab}
            data-active={!isSearching && view === 'browse' ? 'true' : undefined}
            onClick={() => openBrowse('')}
          >
            Browse by genre
          </button>
        </div>

        <span className={styles.openBadge}>{openCount} open</span>
      </div>

      {/* Search results */}
      {isSearching && (
        <div>
          <div className={styles.searchMeta}>
            <span className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </span>
            <span className={styles.resultRule} />
          </div>

          {results.length > 0 ? (
            <div className={styles.searchGrid}>
              {results.map(m => <ManuscriptCard key={m.id} ms={m} />)}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p className="serif">No manuscripts match "{query}".</p>
              <p>Try a genre, theme, author name, or keyword like "grief", "historical", or "diaspora".</p>
            </div>
          )}
        </div>
      )}

      {/* Discover / Browse */}
      {!isSearching && view === 'discover' && (
        <DiscoverView onBrowseGenre={openBrowse} manuscripts={allManuscripts} />
      )}
      {!isSearching && view === 'browse' && (
        <BrowseView initialGenre={browseGenre} manuscripts={allManuscripts} />
      )}
    </div>
  );
}
