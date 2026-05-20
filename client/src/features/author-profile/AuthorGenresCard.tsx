import { GENRES } from '../library-browse/data';
import styles from './AuthorGenresCard.module.css';

interface Props {
  genres: string[];
  subgenres: string[];
  onGenresChange: (genres: string[]) => void;
  onSubgenresChange: (subgenres: string[]) => void;
}

export function AuthorGenresCard({ genres, subgenres, onGenresChange, onSubgenresChange }: Props) {
  function toggleGenre(label: string) {
    const next = genres.includes(label)
      ? genres.filter(g => g !== label)
      : [...genres, label];

    // Drop any subgenres that belong only to deselected genres
    if (genres.includes(label)) {
      const node = GENRES.find(g => g.label === label);
      const removed = new Set(node?.subgenres ?? []);
      onSubgenresChange(subgenres.filter(s => !removed.has(s)));
    }

    onGenresChange(next);
  }

  function toggleSubgenre(label: string) {
    const next = subgenres.includes(label)
      ? subgenres.filter(s => s !== label)
      : [...subgenres, label];
    onSubgenresChange(next);
  }

  const availableSubgenres = [...new Set(
    GENRES.filter(g => genres.includes(g.label)).flatMap(g => g.subgenres)
  )];

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Genres</span>
        <span className={styles.hint}>
          Select the genres you write in. Sub-genres appear below each selection.
        </span>
      </div>

      {/* Genre chips */}
      <div className={styles.chipGrid} role="group" aria-label="Genre selection">
        {GENRES.map(g => {
          const active = genres.includes(g.label);
          return (
            <button
              key={g.label}
              className={styles.chip}
              type="button"
              aria-pressed={active}
              data-active={active ? '' : undefined}
              onClick={() => toggleGenre(g.label)}
            >
              {active && <span className={styles.check} aria-hidden="true">✓</span>}
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Sub-genre chips — only shown when genres are selected */}
      {availableSubgenres.length > 0 && (
        <div className={styles.subgenreSection}>
          <span className={styles.subgenreLabel}>Sub-genres</span>
          <div className={styles.chipGrid} role="group" aria-label="Sub-genre selection">
            {availableSubgenres.map(s => {
              const active = subgenres.includes(s);
              return (
                <button
                  key={s}
                  className={styles.subChip}
                  type="button"
                  aria-pressed={active}
                  data-active={active ? '' : undefined}
                  onClick={() => toggleSubgenre(s)}
                >
                  {active && <span className={styles.check} aria-hidden="true">✓</span>}
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
