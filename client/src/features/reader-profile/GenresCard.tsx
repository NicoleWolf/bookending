import { GENRES } from '../library-browse/data';
import styles from './GenresCard.module.css';

interface Props {
  genresRaw: string;
  onChange: (genresRaw: string) => void;
}

function parseGenres(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch { /* not JSON — fall through to comma-split */ }
  return raw.split(',').map(g => g.trim()).filter(Boolean);
}

function serializeGenres(selected: string[]): string {
  return selected.join(',');
}

export function GenresCard({ genresRaw, onChange }: Props) {
  const selected = parseGenres(genresRaw);

  function toggle(label: string) {
    const next = selected.includes(label)
      ? selected.filter(g => g !== label)
      : [...selected, label];
    onChange(serializeGenres(next));
  }

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={styles.label}>Genres</span>
        <span className={styles.hint}>
          Writers filter readers by genre when sending invites.
        </span>
      </div>

      <div className={styles.chipGrid} role="group" aria-label="Genre selection">
        {GENRES.map(g => {
          const active = selected.includes(g.label);
          return (
            <button
              key={g.label}
              className={styles.chip}
              type="button"
              role="button"
              aria-pressed={active}
              data-active={active ? '' : undefined}
              onClick={() => toggle(g.label)}
            >
              {active && <span className={styles.check} aria-hidden="true">✓</span>}
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <a href="#" className={styles.viewProfile}>View public profile</a>
        <span className={styles.autoSaveNote}>Changes save automatically</span>
      </div>
    </div>
  );
}
