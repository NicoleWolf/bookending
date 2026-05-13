import { useState, useMemo, useEffect } from 'react';
import type { CatalogManuscript } from './data';
import { ManuscriptCard } from './ManuscriptCard';
import { FilterRail } from './FilterRail';
import { ResultsHeader } from './ResultsHeader';
import { RequestModal } from './RequestModal';
import { applyFilters, DEFAULT_FILTER_STATE } from './browseFilters';
import type { BrowseFilterState } from './browseFilters';
import { api } from '../../lib/api';
import { useAuth } from '../auth';
import styles from './BrowseView.module.css';

const PAGE_SIZE = 12;

interface Props {
  initialGenre: string | null;
  manuscripts?: CatalogManuscript[];
}

export function BrowseView({ initialGenre, manuscripts = [] }: Props) {
  const { session } = useAuth();
  const [filters,      setFilters]      = useState<BrowseFilterState>({
    ...DEFAULT_FILTER_STATE,
    genre: initialGenre,
  });
  const [showAll,      setShowAll]      = useState(false);
  const [pendingIds,   setPendingIds]   = useState<Set<string | number>>(new Set());
  const [joinedIds,    setJoinedIds]    = useState<Set<string | number>>(new Set());
  const [requestingMs, setRequestingMs] = useState<CatalogManuscript | null>(null);

  /* Sync if parent changes initialGenre (e.g. clicking a genre from Discover) */
  useEffect(() => {
    setFilters(f => ({ ...f, genre: initialGenre }));
  }, [initialGenre]);

  /* Reset pagination when filters change */
  useEffect(() => { setShowAll(false); }, [filters]);

  /* Seed pending state from server data (fires when API data loads) */
  useEffect(() => {
    setPendingIds(new Set(manuscripts.filter(m => m.pendingRequest).map(m => m.id)));
  }, [manuscripts]);

  const result = useMemo(() => applyFilters(manuscripts, filters), [manuscripts, filters]);

  /* Pagination */
  const pagedVisible  = showAll ? result.visible : result.visible.slice(0, PAGE_SIZE);
  const remainingCount = result.visible.length - PAGE_SIZE;

  /* Join flow (PUBLIC manuscripts) */
  async function handleJoinPublic(ms: CatalogManuscript) {
    if (!session) return;
    try {
      await api.post(`/api/manuscripts/${ms.id}/readers/join`, {});
      setJoinedIds(prev => new Set([...prev, ms.id]));
    } catch { /* swallow — card stays joinable */ }
  }

  /* Request flow (REQUEST manuscripts) */
  function handleRequestRead(ms: CatalogManuscript) { setRequestingMs(ms); }

  async function handleSubmitRequest(ms: CatalogManuscript, note: string) {
    if (session) {
      try {
        await api.post(`/api/manuscripts/${ms.id}/readers/requests`, { note });
      } catch { /* optimistic update proceeds regardless */ }
    }
    setPendingIds(prev => new Set([...prev, ms.id]));
    setRequestingMs(null);
  }

  async function handleWithdraw(ms: CatalogManuscript) {
    if (session) {
      try {
        await api.del(`/api/manuscripts/${ms.id}/readers/requests/mine`);
      } catch { /* proceed optimistically */ }
    }
    setPendingIds(prev => { const n = new Set(prev); n.delete(ms.id); return n; });
  }

  /* Shared card props */
  const cardProps = {
    suppressGenreEyebrow: filters.genre !== null,
    showGenreInByline:    filters.genre === null,
    onJoin:               handleJoinPublic,
    onRequestRead:        handleRequestRead,
    onWithdraw:           handleWithdraw,
  };

  /* Empty state variant */
  const isEmptyByAvoidOnly =
    result.visible.length === 0 &&
    result.hiddenByNotes.length > 0 &&
    result.outsideFilters === 0 &&
    result.hiddenByAvailability === 0;

  return (
    <div className={styles.layout}>
      {/* ── Left rail ─────────────────────────────────────────── */}
      <FilterRail
        manuscripts={manuscripts}
        filters={filters}
        onGenreChange={genre => setFilters(f => ({ ...f, genre }))}
        onFilterChange={patch => setFilters(f => ({ ...f, ...patch }))}
      />

      {/* ── Main content ──────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Results header */}
        <ResultsHeader
          filterState={filters}
          result={result}
          onStateChange={setFilters}
          onShowHidden={() => setFilters(f => ({ ...f, showHidden: true }))}
        />

        {/* ── Empty state ───────────────────────────────────── */}
        {result.visible.length === 0 && (
          <div className={styles.emptyState}>
            {isEmptyByAvoidOnly ? (
              <p className={`serif ${styles.emptyMsg}`}>
                All manuscripts in this view match content notes you've asked to avoid.
                You can show hidden manuscripts or{' '}
                <a href="/profile/content-notes" className={styles.emptyLink}>manage your avoid list</a>.
              </p>
            ) : (
              <>
                <p className={`serif ${styles.emptyMsg}`}>
                  {filters.genre
                    ? `Nothing in ${filters.genre} matches your filters. Loosen the filters, or check back — new manuscripts arrive every week.`
                    : 'No manuscripts match your filters. Try loosening them, or check back soon.'}
                </p>
                <button
                  className={styles.emptyClear}
                  onClick={() => setFilters({ ...DEFAULT_FILTER_STATE, genre: filters.genre })}
                  type="button"
                >
                  CLEAR ALL FILTERS <span aria-hidden="true">→</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Card grid ─────────────────────────────────────── */}
        {result.visible.length > 0 && (
          <div className={styles.grid} role="list" aria-label="Manuscripts">
            {pagedVisible.map(ms => (
              <div key={ms.id} role="listitem">
                <ManuscriptCard
                  ms={ms}
                  isPending={pendingIds.has(ms.id)}
                  isJoined={joinedIds.has(ms.id)}
                  {...cardProps}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination handle */}
        {!showAll && remainingCount > 0 && (
          <div className={styles.pagination}>
            <p className={`serif ${styles.paginationText}`}>
              {remainingCount} more manuscript{remainingCount !== 1 ? 's' : ''} below —{' '}
              <button className={styles.loadAll} onClick={() => setShowAll(true)} type="button">
                LOAD ALL <span aria-hidden="true">→</span>
              </button>
            </p>
          </div>
        )}

        {/* ── Hidden section (Show hidden override) ─────────── */}
        {filters.showHidden && result.hiddenByNotes.length > 0 && (
          <section className={styles.hiddenSection} aria-label="Hidden manuscripts">
            <div className={styles.hiddenSectionHead}>
              <span className={styles.hiddenSectionLabel}>
                Hidden by content notes — {result.hiddenByNotes.length} manuscript{result.hiddenByNotes.length !== 1 ? 's' : ''}
              </span>
              <button
                className={styles.hideAgain}
                onClick={() => setFilters(f => ({ ...f, showHidden: false }))}
                type="button"
              >
                Hide again
              </button>
            </div>
            <div className={styles.grid} role="list" aria-label="Hidden manuscripts">
              {result.hiddenByNotes.map(ms => (
                <div key={ms.id} role="listitem">
                  <ManuscriptCard
                    ms={ms}
                    isHiddenByNotes
                    isPending={pendingIds.has(ms.id)}
                    {...cardProps}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Request modal */}
      {requestingMs && (
        <RequestModal
          ms={requestingMs}
          onSubmit={handleSubmitRequest}
          onCancel={() => setRequestingMs(null)}
        />
      )}
    </div>
  );
}
