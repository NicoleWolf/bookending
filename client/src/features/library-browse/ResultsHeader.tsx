import type { BrowseFilterState, FilterResult, SortKey } from './browseFilters';
import {
  buildTitleParts, buildCountsRow, getActiveChips, countActiveFilters, removeChip,
} from './browseFilters';
import styles from './ResultsHeader.module.css';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest',       label: 'Newest' },
  { key: 'closing-soon', label: 'Closing soon' },
  { key: 'most-read',    label: 'Most read' },
  { key: 'az',           label: 'A–Z' },
];

interface Props {
  filterState:  BrowseFilterState;
  result:       FilterResult;
  onStateChange: (next: BrowseFilterState) => void;
  onShowHidden: () => void;
}

export function ResultsHeader({ filterState, result, onStateChange, onShowHidden }: Props) {
  const title      = buildTitleParts(filterState, result);
  const countItems = buildCountsRow(filterState, result);
  const chips      = getActiveChips(filterState);
  const activeCount = countActiveFilters(filterState);
  const showHiddenHandle = result.hiddenByNotes.length > 0 && !filterState.showHidden;

  function handleRemoveChip(key: string) {
    onStateChange(removeChip(filterState, key));
  }

  function handleClearAll() {
    onStateChange({
      ...filterState,
      genre: null,
      status: new Set(),
      mechanism: new Set(),
      length: null,
      availableToMe: false,
    });
  }

  function handleSortChange(sort: SortKey) {
    onStateChange({ ...filterState, sort });
  }

  return (
    <div className={styles.header}>
      {/* Row 1: title + sort */}
      <div className={styles.titleRow}>
        <h2 className={`serif ${styles.title}`}>
          {title.prefix && <span>{title.prefix}</span>}
          <em>{title.count} manuscript{title.count !== 1 ? 's' : ''}</em>
          {title.suffix}
        </h2>

        <div className={styles.sortRow} role="group" aria-label="Sort results">
          <span className={styles.sortLabel}>SORT</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={styles.sortBtn}
              data-active={filterState.sort === opt.key ? '' : undefined}
              onClick={() => handleSortChange(opt.key)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: counts */}
      {countItems.length > 0 && (
        <div className={styles.countsRow} aria-live="polite" aria-atomic="true">
          {countItems.map((item, i) => (
            <span key={i} className={styles.countGroup}>
              {i > 0 && <span className={styles.countSep} aria-hidden="true">·</span>}
              <span
                className={styles.countItem}
                data-accent={item.accent ? '' : undefined}
                data-muted={item.muted  ? '' : undefined}
              >
                {item.text}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Row 3: active filter chips */}
      {chips.length > 0 && (
        <div className={styles.chipsRow}>
          <span className={styles.filtersLabel}>FILTERS</span>
          <div className={styles.chips}>
            {chips.map(chip => (
              <span key={chip.key} className={styles.chip}>
                {chip.label}
                <button
                  className={styles.chipRemove}
                  aria-label={chip.removeLabel}
                  onClick={() => handleRemoveChip(chip.key)}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {activeCount >= 2 && (
            <button className={styles.clearAll} onClick={handleClearAll} type="button">
              Clear all <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden manuscripts handle */}
      {showHiddenHandle && (
        <div className={styles.hiddenHandle}>
          <p className={`serif ${styles.hiddenText}`}>
            <strong className={styles.hiddenCount}>
              {result.hiddenByNotes.length} manuscript{result.hiddenByNotes.length !== 1 ? 's' : ''} hidden
            </strong>
            {' '}— match content notes you've asked to avoid.
          </p>
          <button className={styles.showHidden} onClick={onShowHidden} type="button">
            Show hidden <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
