import { useState, useId } from 'react';
import { GENRES } from './data';
import type { CatalogManuscript } from './data';
import type { BrowseFilterState } from './browseFilters';
import { CONTENT_WARNINGS } from './browseFilters';
import styles from './FilterRail.module.css';

interface FilterRailProps {
  manuscripts:    CatalogManuscript[];
  filters:        BrowseFilterState;
  onGenreChange:  (genre: string | null) => void;
  onFilterChange: (patch: Partial<BrowseFilterState>) => void;
}

/* ── Shared chip ──────────────────────────────────────────────────── */
function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={styles.chip}
      data-active={active ? '' : undefined}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

/* ── Filter group heading ─────────────────────────────────────────── */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return <div className={styles.groupLabel}>{children}</div>;
}

/* ── FilterRail ───────────────────────────────────────────────────── */
export function FilterRail({ manuscripts, filters, onGenreChange, onFilterChange }: FilterRailProps) {
  const [cwExpanded, setCwExpanded] = useState(false);
  const cwListId = useId();

  /* Genre counts */
  const genreCounts = GENRES.reduce<Record<string, number>>((acc, g) => {
    acc[g.label] = manuscripts.filter(m => m.genre === g.label).length;
    return acc;
  }, {});

  /* Status chips */
  function toggleStatus(val: 'open' | 'filling' | 'full') {
    const next = new Set(filters.status);
    next.has(val) ? next.delete(val) : next.add(val);
    onFilterChange({ status: next });
  }

  /* Mechanism chips */
  function toggleMechanism(val: 'open' | 'invitation') {
    const next = new Set(filters.mechanism);
    next.has(val) ? next.delete(val) : next.add(val);
    onFilterChange({ mechanism: next });
  }

  /* Length chips (single-select) */
  function toggleLength(val: 'short' | 'medium' | 'long') {
    onFilterChange({ length: filters.length === val ? null : val });
  }

  /* Content warning chips */
  function toggleWarning(w: string) {
    const current = filters.excludeWarnings;
    const next = current.includes(w)
      ? current.filter(x => x !== w)
      : [...current, w];
    onFilterChange({ excludeWarnings: next });
  }

  const cwSelected = filters.excludeWarnings.length;

  return (
    <aside className={styles.rail} aria-label="Browse filters">
      {/* ── Genre section ──────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>GENRE</div>
        <div className={styles.genreList}>
          <button
            className={styles.genreItem}
            data-active={filters.genre === null ? '' : undefined}
            onClick={() => onGenreChange(null)}
            type="button"
          >
            <span className={styles.genreName}>All manuscripts</span>
            <span className={styles.genreCount}>{manuscripts.length}</span>
          </button>

          {GENRES.map(g => (
            <button
              key={g.label}
              className={styles.genreItem}
              data-active={filters.genre === g.label ? '' : undefined}
              onClick={() => onGenreChange(g.label)}
              type="button"
            >
              <span className={styles.genreName}>{g.label}</span>
              <span className={styles.genreCount}>{genreCounts[g.label] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Filters section ────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>FILTERS</div>

        {/* Status */}
        <GroupLabel>Status</GroupLabel>
        <div className={styles.chipRow}>
          {(['open', 'filling', 'full'] as const).map(s => (
            <Chip
              key={s}
              label={s === 'open' ? 'Open' : s === 'filling' ? 'Filling' : 'Full'}
              active={filters.status.has(s)}
              onClick={() => toggleStatus(s)}
            />
          ))}
        </div>

        {/* Mechanism */}
        <GroupLabel>Mechanism</GroupLabel>
        <div className={styles.chipRow}>
          {(['open', 'invitation'] as const).map(m => (
            <Chip
              key={m}
              label={m === 'open' ? 'Open application' : 'By invitation'}
              active={filters.mechanism.has(m)}
              onClick={() => toggleMechanism(m)}
            />
          ))}
        </div>

        {/* Length */}
        <GroupLabel>Length</GroupLabel>
        <div className={styles.chipRow}>
          {(['short', 'medium', 'long'] as const).map(l => (
            <Chip
              key={l}
              label={l === 'short' ? 'Short' : l === 'medium' ? 'Medium' : 'Long'}
              active={filters.length === l}
              onClick={() => toggleLength(l)}
            />
          ))}
        </div>
        <div className={styles.lengthHelper}>{'< 60K · 60–90K · 90K+'}</div>

        {/* Content warnings — exclude (accordion) */}
        <div className={styles.cnGroup}>
          <button
            className={styles.cnToggle}
            type="button"
            aria-expanded={cwExpanded}
            aria-controls={cwListId}
            onClick={() => setCwExpanded(v => !v)}
          >
            <span className={styles.cnToggleLeft}>
              <span aria-hidden="true">⚠</span>
              {' '}Content warnings
            </span>
            <span className={styles.cnToggleRight}>
              <span
                className={styles.cnCount}
                data-nonzero={cwSelected > 0 ? '' : undefined}
              >
                {cwSelected} excluded
              </span>
              {' '}<span aria-hidden="true">{cwExpanded ? '▾' : '▸'}</span>
            </span>
          </button>

          <div id={cwListId} className={styles.cnBody} data-open={cwExpanded ? '' : undefined}>
            <div className={styles.cnChips}>
              {CONTENT_WARNINGS.map(w => (
                <Chip
                  key={w}
                  label={w}
                  active={filters.excludeWarnings.includes(w)}
                  onClick={() => toggleWarning(w)}
                />
              ))}
            </div>
            <p className={`serif ${styles.cnHelper}`}>
              Manuscripts tagged with selected warnings are excluded from results.
            </p>
          </div>

          {!cwExpanded && cwSelected > 0 && (
            <p className={`serif ${styles.cnHelper}`}>
              {cwSelected} warning{cwSelected > 1 ? 's' : ''} excluded from results.
            </p>
          )}
        </div>

        {/* Available to me toggle */}
        <div className={styles.toggleRow}>
          <button
            className={styles.toggle}
            type="button"
            role="switch"
            aria-checked={filters.availableToMe}
            aria-label="Available to me"
            data-on={filters.availableToMe ? '' : undefined}
            onClick={() => onFilterChange({ availableToMe: !filters.availableToMe })}
          >
            <span className={styles.toggleKnob} />
          </button>
          <div className={styles.toggleLabels}>
            <span className={styles.toggleName}>Available to me</span>
            <span className={`serif ${styles.toggleHelper}`}>
              Hides invitation-only when no profile match.
            </span>
          </div>
        </div>
      </section>
    </aside>
  );
}
