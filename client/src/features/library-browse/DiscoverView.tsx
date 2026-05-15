import { useState, useMemo, useEffect } from 'react';
import type { CatalogManuscript } from './data';
import { ManuscriptCard } from './ManuscriptCard';
import { Shelf } from './Shelf';
import { RequestModal } from './RequestModal';
import { getVisibleShelves, shouldShowNewReaderPrompt, EMPTY_PROFILE } from './personalization';
import type { ReaderProfile } from './personalization';
import { api } from '../../lib/api';
import { useAuth } from '../auth';
import styles from './DiscoverView.module.css';

interface Props {
  manuscripts:     CatalogManuscript[];
  readerProfile?:  ReaderProfile;
  totalCount:      number;
  onBrowseAll:     () => void;
  onEditProfile?:  () => void;
}

export function DiscoverView({
  manuscripts, readerProfile = EMPTY_PROFILE, totalCount, onBrowseAll, onEditProfile,
}: Props) {
  const { session } = useAuth();
  const [pendingIds,   setPendingIds]   = useState<Set<string | number>>(new Set());
  const [joinedIds,    setJoinedIds]    = useState<Set<string | number>>(new Set());
  const [requestingMs, setRequestingMs] = useState<CatalogManuscript | null>(null);

  useEffect(() => {
    setJoinedIds(new Set(manuscripts.filter(m => m.isEnrolled).map(m => m.id)));
  }, [manuscripts]);

  const featured = useMemo(
    () => manuscripts.find(m => m.featured),
    [manuscripts],
  );

  const shelves = useMemo(
    () => getVisibleShelves(manuscripts, readerProfile),
    [manuscripts, readerProfile],
  );

  const showNewReaderPrompt = useMemo(
    () => shouldShowNewReaderPrompt(manuscripts, readerProfile),
    [manuscripts, readerProfile],
  );

  async function handleJoinPublic(ms: CatalogManuscript) {
    if (!session) return;
    try {
      await api.post(`/api/manuscripts/${ms.id}/readers/join`, {});
      setJoinedIds(prev => new Set([...prev, ms.id]));
    } catch { /* swallow — card stays joinable */ }
  }

  function handleRequestRead(ms: CatalogManuscript) {
    setRequestingMs(ms);
  }

  async function handleSubmitRequest(ms: CatalogManuscript, note: string) {
    if (session) {
      try {
        await api.post(`/api/manuscripts/${ms.id}/readers/requests`, { note });
      } catch { /* optimistic update proceeds regardless */ }
    }
    setPendingIds(prev => new Set([...prev, ms.id]));
    setRequestingMs(null);
  }

  function handleWithdraw(ms: CatalogManuscript) {
    setPendingIds(prev => {
      const next = new Set(prev);
      next.delete(ms.id);
      return next;
    });
  }

  /* Split shelves around the new-reader prompt insertion point:
     prompt goes between Editor's Selection and § 02 if § 01 dropped. */
  const beforePrompt = shelves.filter(s => s.sectionNum === '01');
  const afterPrompt  = shelves.filter(s => s.sectionNum !== '01');

  return (
    <main className={styles.page}>
      {/* ── Editor's Selection (hero) ────────────────────────────── */}
      {featured && (
        <section className={styles.hero} aria-label="Editor's Selection">
          <div className={styles.heroHead}>
            <span className={styles.heroEyebrow}>EDITOR'S SELECTION</span>
            <hr className={styles.heroRule} />
          </div>
          <ManuscriptCard
            ms={featured}
            variant="hero"
            isPending={pendingIds.has(featured.id)}
            isJoined={joinedIds.has(featured.id)}
            onJoin={handleJoinPublic}
            onRequestRead={handleRequestRead}
            onWithdraw={handleWithdraw}
          />
        </section>
      )}

      {/* ── § 01 — From your circle (if present) ─────────────────── */}
      {beforePrompt.map(shelf => (
        <Shelf
          key={shelf.sectionNum}
          {...shelf}
          pendingIds={pendingIds}
          joinedIds={joinedIds}
          onJoin={handleJoinPublic}
          onRequestRead={handleRequestRead}
          onWithdraw={handleWithdraw}
        />
      ))}

      {/* ── New reader prompt (§01 AND §03 both absent) ───────────── */}
      {showNewReaderPrompt && (
        <aside className={styles.newReaderPrompt}>
          <p className={`serif ${styles.newReaderText}`}>
            You're new here. Tell us what you read and we'll listen — your shelves
            will fill as you do.
          </p>
          <button type="button" className={styles.newReaderLink} onClick={onEditProfile}>
            Edit reading profile →
          </button>
        </aside>
      )}

      {/* ── Remaining shelves (§02–§05) ───────────────────────────── */}
      {afterPrompt.map(shelf => (
        <Shelf
          key={shelf.sectionNum}
          {...shelf}
          pendingIds={pendingIds}
          joinedIds={joinedIds}
          onJoin={handleJoinPublic}
          onRequestRead={handleRequestRead}
          onWithdraw={handleWithdraw}
        />
      ))}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span className={styles.footerIdentity}>
          Bookending · The Reading Room · § 08 · Vol. I · Issue 4 · MMXXVI
        </span>
        <button className={styles.footerBrowse} onClick={onBrowseAll}>
          Browse all {totalCount} manuscripts →
        </button>
      </footer>

      {/* ── Request modal ─────────────────────────────────────────── */}
      {requestingMs && (
        <RequestModal
          ms={requestingMs}
          onSubmit={handleSubmitRequest}
          onCancel={() => setRequestingMs(null)}
        />
      )}
    </main>
  );
}
