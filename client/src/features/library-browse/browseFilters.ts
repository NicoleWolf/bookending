import type { CatalogManuscript } from './data';
import { deriveSlotState } from './data';
import { CONTENT_WARNINGS } from '../library/data';
export { CONTENT_WARNINGS };

/* ── Types ────────────────────────────────────────────────────────── */

export type SortKey = 'newest' | 'closing-soon' | 'most-read' | 'az';

export interface BrowseFilterState {
  genre:           string | null;
  status:          Set<'open' | 'filling' | 'full'>;
  mechanism:       Set<'open' | 'invitation'>;
  length:          'short' | 'medium' | 'long' | null;
  avoidList:       string[];
  excludeWarnings: string[];
  availableToMe:   boolean;
  sort:            SortKey;
  showHidden:      boolean;
}

export interface FilterResult {
  visible:              CatalogManuscript[];
  hiddenByNotes:        CatalogManuscript[];
  hiddenByAvailability: number;
  outsideFilters:       number;
  totalListed:          number;
  openCount:            number;
  closingSoon:          number;
  fullCount:            number;
}

export interface TitleParts {
  prefix?: string;
  count:   number;
  suffix:  string;
}

export interface CountItem {
  text:    string;
  accent?: boolean;
  muted?:  boolean;
}

export interface ActiveChip {
  key:         string;
  label:       string;
  removeLabel: string;
}

/* ── Constants ────────────────────────────────────────────────────── */

export const DEFAULT_FILTER_STATE: BrowseFilterState = {
  genre:           null,
  status:          new Set(['open']),
  mechanism:       new Set(),
  length:          null,
  avoidList:       [],
  excludeWarnings: [],
  availableToMe:   false,
  sort:            'newest',
  showHidden:      false,
};

/* ── Filter pipeline ──────────────────────────────────────────────── */

function sortManuscripts(ms: CatalogManuscript[], sort: SortKey): CatalogManuscript[] {
  const copy = [...ms];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
    case 'closing-soon':
      return copy.sort((a, b) => {
        const fullA = deriveSlotState(a) === 'full' ? 1 : 0;
        const fullB = deriveSlotState(b) === 'full' ? 1 : 0;
        if (fullA !== fullB) return fullA - fullB;
        return ((a.maxBetaReaders ?? Infinity) - a.readerCount) - ((b.maxBetaReaders ?? Infinity) - b.readerCount);
      });
    case 'most-read':
      return copy.sort((a, b) => b.readerCount - a.readerCount);
    case 'az':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function applyFilters(
  manuscripts: CatalogManuscript[],
  state: BrowseFilterState,
): FilterResult {
  const totalListed = manuscripts.length;

  /* 1 — Genre */
  const afterGenre = state.genre
    ? manuscripts.filter(m => m.genre === state.genre)
    : manuscripts;

  /* Whole-catalog stats (post-genre, pre-other-filters) */
  const openCount    = afterGenre.filter(m => deriveSlotState(m) === 'open').length;
  const closingSoon  = afterGenre.filter(m => deriveSlotState(m) === 'filling').length;
  const fullCount    = afterGenre.filter(m => deriveSlotState(m) === 'full').length;

  /* 2 — Status */
  const afterStatus = state.status.size === 0
    ? afterGenre
    : afterGenre.filter(m => state.status.has(deriveSlotState(m) as 'open' | 'filling' | 'full'));

  /* 3 — Mechanism */
  const afterMechanism = state.mechanism.size === 0
    ? afterStatus
    : afterStatus.filter(m => state.mechanism.has(m.betaMode === 'PUBLIC' ? 'open' : 'invitation'));

  /* 4 — Length */
  const afterLength = (() => {
    if (!state.length) return afterMechanism;
    return afterMechanism.filter(m => {
      if (state.length === 'short')  return m.wordCount < 60_000;
      if (state.length === 'medium') return m.wordCount >= 60_000 && m.wordCount <= 90_000;
      return m.wordCount > 90_000;
    });
  })();

  const outsideFilters = totalListed - afterLength.length;

  /* 5 — Available to me (invitation-only hidden, count only) */
  let hiddenByAvailability = 0;
  const afterAvailability = state.availableToMe
    ? afterLength.filter(m => {
        if (m.betaMode !== 'PUBLIC') {
          hiddenByAvailability++;
          return false;
        }
        return true;
      })
    : afterLength;

  /* 6 — Content notes avoid list */
  const avoidSet = new Set(state.avoidList.map(s => s.toLowerCase()));
  const hiddenByNotes: CatalogManuscript[] = [];
  const afterNotes = afterAvailability.filter(m => {
    if (avoidSet.size === 0) return true;
    if (!m.contentNotes) return true;
    if (m.contentNotes.items.some(item => avoidSet.has(item.toLowerCase()))) {
      hiddenByNotes.push(m);
      return false;
    }
    return true;
  });

  /* 7 — Content warnings exclude */
  const excludeSet = new Set(state.excludeWarnings.map(s => s.toLowerCase()));
  const afterWarnings = excludeSet.size === 0
    ? afterNotes
    : afterNotes.filter(m => {
        if (!m.contentWarnings || m.contentWarnings.length === 0) return true;
        return !m.contentWarnings.some(w => excludeSet.has(w.toLowerCase()));
      });

  /* 8 — Sort */
  const visible = sortManuscripts(afterWarnings, state.sort);

  return {
    visible,
    hiddenByNotes,
    hiddenByAvailability,
    outsideFilters,
    totalListed,
    openCount,
    closingSoon,
    fullCount,
  };
}

/* ── Title ────────────────────────────────────────────────────────── */

export function buildTitleParts(state: BrowseFilterState, result: FilterResult): TitleParts {
  const count = result.visible.length;
  const hasGenre  = state.genre !== null;
  const hasStatus = state.status.size > 0;
  const hasAvail  = state.availableToMe;

  // No non-default filters at all
  if (!hasGenre && !hasStatus && !hasAvail && state.mechanism.size === 0 && !state.length) {
    return { prefix: 'All ', count, suffix: '.' };
  }

  const parts: string[] = [];
  if (hasGenre) parts.push(`in ${state.genre}`);

  if (hasStatus) {
    if (state.status.has('open') && hasAvail) {
      parts.push('open and available to you');
    } else if (state.status.has('open')) {
      parts.push('open for readers');
    } else if (state.status.has('filling')) {
      parts.push('filling quickly');
    } else if (state.status.has('full')) {
      parts.push('full');
    } else {
      parts.push('matching filters');
    }
  } else if (hasAvail) {
    parts.push('available to you');
  }

  return { count, suffix: (parts.length > 0 ? ' ' + parts.join(', ') : '') + '.' };
}

/* ── Counts row ───────────────────────────────────────────────────── */

export function buildCountsRow(state: BrowseFilterState, result: FilterResult): CountItem[] {
  const { totalListed, openCount, closingSoon, fullCount, hiddenByNotes, hiddenByAvailability } = result;
  const hasAnyFilter =
    state.genre !== null ||
    state.status.size > 0 ||
    state.mechanism.size > 0 ||
    state.length !== null ||
    state.availableToMe;

  if (!hasAnyFilter) {
    const items: CountItem[] = [];
    if (openCount > 0)   items.push({ text: `${openCount} OPEN FOR READERS`, accent: true });
    if (closingSoon > 0) items.push({ text: `${closingSoon} CLOSING SOON` });
    if (fullCount > 0)   items.push({ text: `${fullCount} FULL`, muted: true });
    return items;
  }

  const items: CountItem[] = [{ text: `FROM ${totalListed} LISTED` }];
  if (closingSoon > 0) items.push({ text: `${closingSoon} CLOSING SOON` });
  if (hiddenByAvailability > 0 && hiddenByNotes.length > 0) {
    items.push({ text: `${hiddenByAvailability} BY INVITATION HIDDEN` });
    items.push({ text: `${hiddenByNotes.length} HIDDEN BY CONTENT NOTES`, accent: true });
  } else if (hiddenByNotes.length > 0 && !state.showHidden) {
    items.push({ text: `${hiddenByNotes.length} HIDDEN`, accent: true });
  } else if (hiddenByAvailability > 0) {
    items.push({ text: `${hiddenByAvailability} BY INVITATION HIDDEN` });
  }
  return items;
}

/* ── Active filter chips ──────────────────────────────────────────── */

export function getActiveChips(state: BrowseFilterState): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (state.genre) {
    chips.push({
      key: 'genre',
      label: `Genre: ${state.genre}`,
      removeLabel: `Remove filter: Genre ${state.genre}`,
    });
  }

  state.status.forEach(s => {
    const word = s === 'open' ? 'Open' : s === 'filling' ? 'Filling' : 'Full';
    chips.push({
      key: `status-${s}`,
      label: `Status: ${word}`,
      removeLabel: `Remove filter: Status ${word}`,
    });
  });

  state.mechanism.forEach(m => {
    const word = m === 'open' ? 'Open application' : 'By invitation';
    chips.push({
      key: `mechanism-${m}`,
      label: `Mechanism: ${word}`,
      removeLabel: `Remove filter: Mechanism ${word}`,
    });
  });

  if (state.length) {
    const word = state.length === 'short' ? 'Short < 60K' : state.length === 'medium' ? 'Medium 60–90K' : 'Long 90K+';
    chips.push({ key: 'length', label: `Length: ${word}`, removeLabel: `Remove filter: Length ${word}` });
  }

  if (state.availableToMe) {
    chips.push({ key: 'availableToMe', label: 'Available to me', removeLabel: 'Remove filter: Available to me' });
  }

  return chips;
}

/* Count filters that are non-default (drives "Clear all" visibility) */
export function countActiveFilters(state: BrowseFilterState): number {
  let n = 0;
  if (state.genre !== null)    n++;
  if (state.status.size > 0)   n++;
  if (state.mechanism.size > 0) n++;
  if (state.length !== null)   n++;
  if (state.availableToMe)     n++;
  return n;
}

/* Remove a chip by key and return new state */
export function removeChip(state: BrowseFilterState, key: string): BrowseFilterState {
  if (key === 'genre')         return { ...state, genre: null };
  if (key === 'length')        return { ...state, length: null };
  if (key === 'availableToMe') return { ...state, availableToMe: false };

  if (key.startsWith('status-')) {
    const val = key.replace('status-', '') as 'open' | 'filling' | 'full';
    const next = new Set(state.status);
    next.delete(val);
    return { ...state, status: next };
  }
  if (key.startsWith('mechanism-')) {
    const val = key.replace('mechanism-', '') as 'open' | 'invitation';
    const next = new Set(state.mechanism);
    next.delete(val);
    return { ...state, mechanism: next };
  }
  return state;
}
