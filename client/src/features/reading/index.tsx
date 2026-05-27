import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { HubResponse } from '@bookending/shared';
import ReadingRoom from './ReadingRoom';
import HouseSuggests from './HouseSuggests';
import WarmCard from './WarmCard';
import ShelfCard from './ShelfCard';
import FinishedCard from './FinishedCard';
import FollowingRow from './FollowingRow';
import FollowingFeed from './FollowingFeed';
import AuthorMessages from './AuthorMessages';
import BetaDirectory from './BetaDirectory';
import ExclusiveContent from './ExclusiveContent';
import HouseRail from './HouseRail';
import styles from './Hub.module.css';

interface ReadingProps {
  onViewListing?:  (msRef: string) => void;
  onGoToProfile?:  (authorId: string, tab?: string) => void;
}

export default function Reading({ onViewListing, onGoToProfile }: ReadingProps = {}) {
  const { session } = useAuth();

  const [hub,             setHub]             = useState<HubResponse | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [selectedMsRef,   setSelectedMsRef]   = useState<string | null>(null);
  const [dismissedTiers,  setDismissedTiers]  = useState<number[]>([]);

  useEffect(() => {
    if (!session?.token) { setLoading(false); return; }
    void api.get<HubResponse>('/api/reading/hub')
      .then(data => { setHub(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session?.token]);

  // Open a manuscript in the reading room
  const openMs = (msRef: string) => setSelectedMsRef(msRef);
  const closeMs = () => {
    setSelectedMsRef(null);
    // Refresh hub data when returning from reading room
    if (session?.token) {
      void api.get<HubResponse>('/api/reading/hub').then(setHub).catch(() => {});
    }
  };

  // Dismiss house suggestion
  const dismissSuggestion = () => {
    if (!hub?.houseSuggests) return;
    const tier = hub.houseSuggests.tier;
    setDismissedTiers(prev => [...prev, tier]);
    void api.post('/api/reading/recommendation/dismiss', {
      tier,
      manuscriptRef: hub.houseSuggests.manuscriptRef,
    }).catch(() => {});
  };

  const handleHouseAction = (msRef: string | null, verb: string) => {
    if (msRef && (verb === 'continue' || verb === 'begin')) {
      openMs(msRef);
    }
    // 'browse' -> navigate to Discover (future)
  };

  const handleShelfRemove = (msRef: string) => {
    void api.del(`/api/reading/shelf/${msRef}`)
      .then(() => {
        setHub(prev => prev ? { ...prev, shelf: prev.shelf.filter(s => s.manuscriptRef !== msRef) } : prev);
      })
      .catch(() => {});
  };

  // If a manuscript is selected, show the reading room
  if (selectedMsRef !== null) {
    return <ReadingRoom msRef={selectedMsRef} onBack={closeMs} />;
  }

  // Compute effective house suggestion (filter dismissed tiers)
  const effectiveSuggestion = hub?.houseSuggests && !dismissedTiers.includes(hub.houseSuggests.tier)
    ? hub.houseSuggests
    : null;

  const displayWarm      = hub?.warm ?? [];
  const shelfItems       = hub?.shelf ?? [];
  const finishedItems    = hub?.finished ?? [];
  const followingAuthors = hub?.followingAuthors ?? [];
  const railItems        = hub?.houseRail ?? [];
  const readerProfile    = hub?.readerProfile ?? 'new';

  const hasRail = railItems.length > 0;

  return (
    <div className={styles.hubPage}>
      {/* Masthead */}
      <div className={styles.hubMasthead}>
        <div className={styles.hubEyebrow}>§ · Reading Room</div>
        <h1 className={styles.hubTitle}>Your reading</h1>
      </div>

      {/* House Suggests */}
      <HouseSuggests
        recommendation={loading ? null : effectiveSuggestion}
        readerProfile={readerProfile}
        onDismiss={dismissSuggestion}
        onAction={handleHouseAction}
      />

      {/* Two-column grid */}
      <div
        className={styles.contentGrid}
        style={!hasRail ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}
      >
        {/* Left: main content */}
        <div className={styles.mainCol}>

          {/* What's warm */}
          {displayWarm.length > 0 && (
            <section>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>What's warm</span>
                {displayWarm.length > 5 && (
                  <span className={styles.sectionMeta}>See all warm reading &rarr;</span>
                )}
              </div>
              {displayWarm.slice(0, 5).map(item => (
                <WarmCard key={item.manuscriptRef} item={item} onOpen={openMs} />
              ))}
            </section>
          )}

          {/* On your shelf */}
          <section>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>On your shelf</span>
              {shelfItems.length > 6 && (
                <span className={styles.sectionMeta}>See all &rarr;</span>
              )}
            </div>
            {shelfItems.length === 0 ? (
              <p className={`serif ${styles.shelfEmpty}`}>
                Save manuscripts from Discover, or accept a house recommendation, to build your shelf.
              </p>
            ) : (
              <div className={styles.shelfGrid}>
                {shelfItems.slice(0, 6).map(item => (
                  <ShelfCard
                    key={item.manuscriptRef}
                    item={item}
                    onBegin={openMs}
                    onRemove={handleShelfRemove}
                    onViewListing={onViewListing}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Finished */}
          {finishedItems.length > 0 && (
            <section>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>Finished</span>
                <span className={styles.sectionMeta}>
                  {hub?.finishedThisSeason ?? 0} this season &middot; {hub?.finishedAllTime ?? 0} all-time &rarr;
                </span>
              </div>
              <FinishedCard item={finishedItems[0]} />
            </section>
          )}

          {/* Exclusive posts from authors of books the reader has reviewed */}
          <ExclusiveContent onGoToProfile={onGoToProfile} />

          {/* Beta programmes matching reader's genres */}
          <BetaDirectory onGoToProfile={onGoToProfile} />

          {/* Messages from authors (post-read check-ins) */}
          <AuthorMessages />

          {/* From authors you follow */}
          <section>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>From authors you follow</span>
            </div>
            {followingAuthors.length > 0 && (
              <FollowingRow authors={followingAuthors} />
            )}
            <FollowingFeed
              onViewListing={onViewListing}
              onGoToProfile={onGoToProfile}
            />
          </section>

        </div>

        {/* Right: The House rail */}
        {hasRail && <HouseRail items={railItems} />}
      </div>
    </div>
  );
}
