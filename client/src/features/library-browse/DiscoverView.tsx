import { useMemo } from 'react';
import { BookCover } from '../../shared/ui/atoms';
import { MANUSCRIPTS, GENRES } from './data';
import type { CatalogManuscript } from './data';
import { ManuscriptCard } from './ManuscriptCard';
import styles from './DiscoverView.module.css';

interface Props {
  onBrowseGenre: (genre: string) => void;
  manuscripts?: CatalogManuscript[];
}

export function DiscoverView({ onBrowseGenre, manuscripts = MANUSCRIPTS }: Props) {
  const featured = useMemo(() => manuscripts.find(m => m.featured), [manuscripts]);

  const justOpened = useMemo(() =>
    [...manuscripts]
      .filter(m => m.status === 'open')
      .sort((a, b) => b.listedAt.localeCompare(a.listedAt))
      .slice(0, 7),
    [manuscripts]
  );

  const readerPicks = useMemo(() =>
    manuscripts
      .filter(m => m.status !== 'closed')
      .sort((a, b) => (b.readerCount / b.maxReaders) - (a.readerCount / a.maxReaders))
      .slice(0, 3),
    [manuscripts]
  );

  const openCount = manuscripts.filter(m => m.status === 'open').length;

  return (
    <div>
      {/* Dateline strip */}
      <div className={styles.dateline}>
        <span>VOL. I · ISSUE 4</span>
        <span className={styles.datelineSep}>—</span>
        <span>MAY 2026</span>
        <span className={styles.datelineSep}>—</span>
        <span>{manuscripts.length} MANUSCRIPTS LISTED</span>
        <span className={styles.datelineSep}>—</span>
        <span>{openCount} OPEN FOR READERS</span>
      </div>

      {/* Editor's selection */}
      {featured && (
        <div className={styles.featured}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Editor's Selection</span>
            <span className={styles.sectionRule} />
          </div>

          <div className={styles.featuredBody}>
            <div className={styles.featuredCoverWrap}>
              <BookCover title={featured.title} scheme={featured.scheme} />
            </div>

            <div className={styles.featuredContent}>
              <div className={styles.featuredMeta}>
                {featured.genre}
                <span className={styles.featuredMetaSep}>·</span>
                {featured.subgenre}
                <span className={styles.featuredMetaSep}>·</span>
                {featured.contentRating}
              </div>

              <h2 className={`serif ${styles.featuredTitle}`}>{featured.title}</h2>
              <div className={styles.featuredAuthor}>{featured.author}</div>

              <p className={`serif ${styles.featuredDesc}`}>{featured.description}</p>

              {featured.curatorNote && (
                <blockquote className={styles.featuredQuote}>
                  <span className={`serif ${styles.featuredQuoteText}`}>"{featured.curatorNote}"</span>
                  <cite className={styles.featuredCite}>— Bookending editorial</cite>
                </blockquote>
              )}

              <div className={styles.featuredStats}>
                <span className={styles.featuredPages}>{featured.estimatedPages} pp. · {(featured.wordCount / 1000).toFixed(0)}k words</span>
              </div>

              <div className={styles.featuredFooter}>
                <span className={styles.featuredSlots} data-status={featured.status}>
                  {featured.readerCount}/{featured.maxReaders} reader slots · {featured.status.toUpperCase()}
                </span>
                <button className={styles.featuredCta}>Request to read →</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Just opened rail */}
      <div className={styles.railSection}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Just Opened</span>
          <span className={styles.sectionRule} />
          <button className={styles.sectionMore} onClick={() => onBrowseGenre('')}>
            Browse all →
          </button>
        </div>
        <div className={styles.rail}>
          {justOpened.map(m => (
            <div key={m.id} className={styles.railSlot}>
              <ManuscriptCard ms={m} />
            </div>
          ))}
        </div>
      </div>

      {/* Reader Picks */}
      <div className={styles.gridSection}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionLabel}>Reader Picks</span>
          <span className={styles.sectionRule} />
          <span className={styles.sectionSub}>Most requested this month</span>
        </div>
        <div className={styles.grid3} style={{ background: 'var(--rule)' }}>
          {readerPicks.map(m => <ManuscriptCard key={m.id} ms={m} />)}
        </div>
      </div>

      {/* Genre rails */}
      {GENRES.map(genre => {
        const all  = manuscripts.filter(m => m.genre === genre.label);
        const show = all.slice(0, 3);
        if (show.length === 0) return null;
        return (
          <div key={genre.label} className={styles.gridSection}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionLabel}>{genre.label}</span>
              <span className={styles.sectionRule} />
              <span className={styles.sectionCount}>{all.length} manuscripts</span>
              <button className={styles.sectionMore} onClick={() => onBrowseGenre(genre.label)}>
                Browse {genre.label} →
              </button>
            </div>
            <div className={styles.grid3} style={{ background: 'var(--rule)' }}>
              {show.map(m => <ManuscriptCard key={m.id} ms={m} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
