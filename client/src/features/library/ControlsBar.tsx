import type { BookMetadata, BookStatus } from './data';
import styles from './ControlsBar.module.css';

export type FilterStatus = 'all' | BookStatus;
export type SortBy = 'recently_edited' | 'alphabetical' | 'by_status';

interface ControlsBarProps {
  manuscripts: BookMetadata[];
  filter: FilterStatus;
  sortBy: SortBy;
  searchQuery: string;
  onFilterChange: (f: FilterStatus) => void;
  onSortChange: (s: SortBy) => void;
  onSearchChange: (q: string) => void;
}

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all',         label: 'ALL'         },
  { value: 'drafting',    label: 'DRAFTING'    },
  { value: 'in-revision', label: 'IN REVISION' },
  { value: 'published',   label: 'PUBLISHED'   },
];

export default function ControlsBar({
  manuscripts,
  filter,
  sortBy,
  searchQuery,
  onFilterChange,
  onSortChange,
  onSearchChange,
}: ControlsBarProps) {
  const counts: Record<FilterStatus, number> = {
    'all':         manuscripts.length,
    'drafting':    manuscripts.filter(m => m.status === 'drafting').length,
    'in-revision': manuscripts.filter(m => m.status === 'in-revision').length,
    'published':   manuscripts.filter(m => m.status === 'published').length,
  };

  return (
    <div className={styles.bar}>
      <div className={styles.filters}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={styles.chip}
            data-active={filter === opt.value ? '' : undefined}
            onClick={() => onFilterChange(opt.value)}
          >
            {opt.label} · {counts[opt.value]}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.sortWrap}>
          <select
            className={styles.sort}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortBy)}
            aria-label="Sort manuscripts"
          >
            <option value="recently_edited">Recently edited</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="by_status">By status</option>
          </select>
          <span className={styles.sortChevron}>▾</span>
        </div>

        <input
          type="text"
          className={styles.search}
          value={searchQuery}
          placeholder="SEARCH TITLES"
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search manuscripts"
        />
      </div>
    </div>
  );
}
