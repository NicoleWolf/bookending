import { useState, useMemo } from 'react';
import { Avatar, SectionHead } from '../../shared/ui/atoms';
import { AUTHOR_STORES, ALL_STORE_GENRES } from './data';
import type { AuthorStore } from './data';
import { ProductsView } from './ProductsView';
import { AuthorStorefrontPage } from './AuthorStorefrontPage';
import styles from './StorefrontHub.module.css';

// ── Store cover tiles (decorative placeholder) ─────────────

function CoverTiles({ count }: { count: number }) {
  return (
    <div className={styles.coverTiles}>
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <div key={i} className={styles.coverTile} />
      ))}
    </div>
  );
}

// ── Featured store card ────────────────────────────────────

function FeaturedCard({ store, onVisit }: { store: AuthorStore; onVisit: () => void }) {
  return (
    <div className={styles.featuredCard}>
      <div className={styles.featuredCardLeft}>
        <div className={styles.featuredCardHead}>
          <Avatar initials={store.initials} tone={store.tone} size={44} />
          <div>
            <div className={styles.featuredName}>{store.name}</div>
            <div className={styles.featuredLocation}>{store.location}</div>
          </div>
        </div>
        <p className={`serif ${styles.featuredTagline}`}>{store.tagline}</p>
        <div className={styles.featuredGenres}>
          {store.genres.map(g => (
            <span key={g} className={styles.genreTag}>{g}</span>
          ))}
        </div>
        <div className={styles.featuredStats}>
          <span>{store.books} editions</span>
          <span className={styles.statDot}>·</span>
          <span>{store.totalSold.toLocaleString()} sold</span>
        </div>
        <button className={styles.visitBtn} onClick={onVisit}>Visit shop →</button>
      </div>
      <div className={styles.featuredCardRight}>
        <CoverTiles count={store.books} />
        <div className={styles.featuredUrl}>{store.url}</div>
      </div>
    </div>
  );
}

// ── Regular store card ─────────────────────────────────────

function StoreCard({ store, onVisit }: { store: AuthorStore; onVisit: () => void }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <Avatar initials={store.initials} tone={store.tone} size={40} />
        <div className={styles.cardHeadMeta}>
          <div className={styles.cardName}>{store.name}</div>
          <div className={styles.cardLocation}>{store.location}</div>
        </div>
      </div>
      <p className={styles.cardTagline}>{store.tagline}</p>
      <div className={styles.cardGenres}>
        {store.genres.map(g => (
          <span key={g} className={styles.genreTag}>{g}</span>
        ))}
      </div>
      <div className={styles.cardStats}>
        {store.books} editions · {store.totalSold.toLocaleString()} sold
      </div>
      <button className={styles.cardVisitBtn} onClick={onVisit}>Visit shop →</button>
    </div>
  );
}

// ── Hub root ───────────────────────────────────────────────

type HubView = 'shops' | 'products';

export default function StorefrontHub() {
  const [hubView,       setHubView]       = useState<HubView>('shops');
  const [query,         setQuery]         = useState('');
  const [genre,         setGenre]         = useState<string | null>(null);
  const [visitingAuthor, setVisitingAuthor] = useState<AuthorStore | null>(null);

  const featured = AUTHOR_STORES.filter(s => s.featured);

  const directory = useMemo(() => {
    return AUTHOR_STORES.filter(s => {
      if (genre && !s.genres.includes(genre)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.tagline.toLowerCase().includes(q) ||
          s.genres.some(g => g.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [query, genre]);

  if (visitingAuthor) {
    return <AuthorStorefrontPage author={visitingAuthor} onBack={() => setVisitingAuthor(null)} />;
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="Reading · Storefronts"
          title="Author shops, direct"
          kicker={`${AUTHOR_STORES.length} independent shops on the platform`}
        />
      </div>

      {/* ── Hub tabs ── */}
      <div className={styles.hubTabs}>
        <button
          className={styles.hubTab}
          data-active={hubView === 'shops' ? '' : undefined}
          onClick={() => setHubView('shops')}
        >
          Shops
        </button>
        <button
          className={styles.hubTab}
          data-active={hubView === 'products' ? '' : undefined}
          onClick={() => setHubView('products')}
        >
          Products
        </button>
      </div>

      {hubView === 'products' && <ProductsView />}

      {hubView === 'shops' && (
        <>
          {/* ── Filter bar ── */}
          <div className={styles.filterBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search authors, genres…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className={styles.genrePills}>
              <button
                className={styles.genrePill}
                data-active={genre === null ? '' : undefined}
                onClick={() => setGenre(null)}
              >
                All
              </button>
              {ALL_STORE_GENRES.map(g => (
                <button
                  key={g}
                  className={styles.genrePill}
                  data-active={genre === g ? '' : undefined}
                  onClick={() => setGenre(f => f === g ? null : g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Featured ── */}
          {!query && !genre && (
            <div className={styles.featuredSection}>
              <div className={styles.sectionLabel}>Featured</div>
              <div className={styles.featuredGrid}>
                {featured.map(s => <FeaturedCard key={s.id} store={s} onVisit={() => setVisitingAuthor(s)} />)}
              </div>
            </div>
          )}

          {/* ── Directory ── */}
          <div className={styles.directorySection}>
            <div className={styles.sectionLabel}>
              {query || genre ? `${directory.length} result${directory.length !== 1 ? 's' : ''}` : `All shops · ${AUTHOR_STORES.length}`}
            </div>
            {directory.length === 0 ? (
              <div className={styles.empty}>No shops match the current filters.</div>
            ) : (
              <div className={styles.grid}>
                {directory.map(s => <StoreCard key={s.id} store={s} onVisit={() => setVisitingAuthor(s)} />)}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
