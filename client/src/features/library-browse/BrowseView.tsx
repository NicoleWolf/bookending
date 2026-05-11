import { useState, useMemo } from 'react';
import { MANUSCRIPTS, GENRES } from './data';
import type { CatalogManuscript } from './data';
import { ManuscriptCard } from './ManuscriptCard';
import styles from './BrowseView.module.css';

type SortKey = 'newest' | 'readers' | 'alpha';

interface Props {
  initialGenre: string | null;
  manuscripts?: CatalogManuscript[];
}

export function BrowseView({ initialGenre, manuscripts = MANUSCRIPTS }: Props) {
  const [selectedGenre,    setSelectedGenre]    = useState<string | null>(initialGenre);
  const [selectedSubgenre, setSelectedSubgenre] = useState<string | null>(null);
  const [sort,             setSort]             = useState<SortKey>('newest');

  function selectGenre(genre: string | null) {
    setSelectedGenre(genre);
    setSelectedSubgenre(null);
  }

  function toggleSubgenre(sg: string) {
    setSelectedSubgenre(prev => prev === sg ? null : sg);
  }

  const filtered = useMemo(() => {
    let ms = selectedGenre
      ? manuscripts.filter(m => m.genre === selectedGenre)
      : [...manuscripts];
    if (selectedSubgenre) {
      ms = ms.filter(m => m.subgenre === selectedSubgenre);
    }
    if (sort === 'newest') return ms.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
    if (sort === 'readers') return ms.sort((a, b) => b.readerCount - a.readerCount);
    return ms.sort((a, b) => a.title.localeCompare(b.title));
  }, [selectedGenre, selectedSubgenre, sort]);

  const activeGenreNode = GENRES.find(g => g.label === selectedGenre);

  return (
    <div className={styles.layout}>
      {/* Genre sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.sidebarLabel}>Genres</div>

        <button
          className={styles.genreBtn}
          data-active={!selectedGenre ? 'true' : undefined}
          onClick={() => selectGenre(null)}
        >
          <span className={styles.genreName}>All manuscripts</span>
          <span className={styles.genreCount}>{manuscripts.length}</span>
        </button>

        {GENRES.map(g => {
          const count   = manuscripts.filter(m => m.genre === g.label).length;
          const isOpen  = selectedGenre === g.label;
          const subs    = g.subgenres.filter(sg =>
            manuscripts.some(m => m.genre === g.label && m.subgenre === sg)
          );

          return (
            <div key={g.label}>
              <button
                className={styles.genreBtn}
                data-active={isOpen ? 'true' : undefined}
                onClick={() => selectGenre(isOpen ? null : g.label)}
              >
                <span className={styles.genreName}>{g.label}</span>
                <span className={styles.genreCount}>{count}</span>
              </button>

              {isOpen && subs.length > 0 && (
                <div className={styles.subgenreList}>
                  {subs.map(sg => (
                    <button
                      key={sg}
                      className={styles.subgenreBtn}
                      data-active={selectedSubgenre === sg ? 'true' : undefined}
                      onClick={() => toggleSubgenre(sg)}
                    >
                      {sg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.contentHead}>
          <div>
            <div className={styles.contentTitle}>
              <span className={`serif ${styles.contentTitleText}`}>
                {selectedGenre ?? 'All manuscripts'}
              </span>
              {selectedSubgenre && (
                <span className={styles.contentSubgenre}> · {selectedSubgenre}</span>
              )}
            </div>
            <div className={styles.contentCount}>{filtered.length} manuscript{filtered.length !== 1 ? 's' : ''}</div>
          </div>

          <div className={styles.sortRow}>
            <span className={styles.sortLabel}>Sort:</span>
            {(['newest', 'readers', 'alpha'] as SortKey[]).map(s => (
              <button
                key={s}
                className={styles.sortBtn}
                data-active={sort === s ? 'true' : undefined}
                onClick={() => setSort(s)}
              >
                {s === 'newest' ? 'Newest' : s === 'readers' ? 'Most read' : 'A–Z'}
              </button>
            ))}
          </div>
        </div>

        {/* Subgenre filter chips */}
        {activeGenreNode && (
          <div className={styles.subgenreChips}>
            <button
              className={styles.chip}
              data-active={!selectedSubgenre ? 'true' : undefined}
              onClick={() => setSelectedSubgenre(null)}
            >
              All
            </button>
            {activeGenreNode.subgenres
              .filter(sg => manuscripts.some(m => m.genre === selectedGenre && m.subgenre === sg))
              .map(sg => (
                <button
                  key={sg}
                  className={styles.chip}
                  data-active={selectedSubgenre === sg ? 'true' : undefined}
                  onClick={() => toggleSubgenre(sg)}
                >
                  {sg}
                </button>
              ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className={styles.empty}>No manuscripts in this category yet.</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(m => <ManuscriptCard key={m.id} ms={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}
