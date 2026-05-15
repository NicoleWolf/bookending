import { useRef, useCallback } from 'react';
import type { CatalogManuscript } from './data';
import { ManuscriptCard } from './ManuscriptCard';
import styles from './Shelf.module.css';

export interface ShelfProps {
  sectionNum:    string;          // "01"
  name:          string;          // "From your circle"
  editorialLine: string;          // italic sentence describing the shelf
  helperLine?:   string;
  seeAllUrl?:    string;
  seeAllCount?:  number;
  cards:         CatalogManuscript[];
  pendingIds?:   Set<string | number>;
  joinedIds?:    Set<string | number>;
  onJoin?:       (ms: CatalogManuscript) => void;
  onRequestRead: (ms: CatalogManuscript) => void;
  onWithdraw?:   (ms: CatalogManuscript) => void;
}

const CARD_WIDTH_APPROX = 280; // px — used for scroll-advance distance

export function Shelf({
  sectionNum, name, editorialLine, helperLine, seeAllUrl, seeAllCount,
  cards, pendingIds, joinedIds, onJoin, onRequestRead, onWithdraw,
}: ShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = useCallback((dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * CARD_WIDTH_APPROX, behavior: 'smooth' });
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollBy(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollBy(-1); }
  }

  return (
    <section className={styles.shelf} aria-label={`§ ${sectionNum} ${name}`}>
      {/* Shelf head */}
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <div className={styles.headEyebrow}>§ {sectionNum} · {name.toUpperCase()}</div>
          <p className={`serif ${styles.headTitle}`}>{editorialLine}</p>
          {helperLine && <p className={`serif ${styles.headHelper}`}>{helperLine}</p>}
        </div>
        <div className={styles.headRight}>
          <button
            className={styles.scrollBtn}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
          >‹</button>
          <button
            className={styles.scrollBtn}
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
          >›</button>
          {seeAllUrl && (
            <a href={seeAllUrl} className={styles.seeAll}>
              See all{seeAllCount ? ` ${seeAllCount}` : ''} →
            </a>
          )}
        </div>
      </div>

      <hr className={styles.headRule} />

      {/* Card rail */}
      <div
        className={styles.rail}
        ref={scrollRef}
        onKeyDown={handleKeyDown}
        role="list"
        aria-label={`${name} manuscripts`}
      >
        {cards.map(ms => (
          <div key={ms.id} className={styles.slot} role="listitem">
            <ManuscriptCard
              ms={ms}
              variant="standard"
              isPending={pendingIds?.has(ms.id)}
              isJoined={joinedIds?.has(ms.id)}
              onJoin={onJoin}
              onRequestRead={onRequestRead}
              onWithdraw={onWithdraw}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
