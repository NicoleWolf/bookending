export type { GenreNode } from '../../shared/genres';
export { GENRES } from '../../shared/genres';

export type ManuscriptStatus = 'open' | 'closed';
export type SlotState       = 'open' | 'filling' | 'full' | 'ongoing';
export type BetaMode        = 'PUBLIC' | 'REQUEST';

export interface PersonalizationSignal {
  kind: 'circle' | 'profile_match';
  text: string;
}

export interface ContentNotes {
  count: number;
  items: string[];
}

export interface CatalogManuscript {
  id:              number | string;
  title:           string;
  author:          string;
  genre:           string;
  subgenre:        string;
  description:     string;
  hook?:           string;
  keywords:        string[];
  status:          ManuscriptStatus;
  wordCount:       number;
  estimatedPages:  number;
  contentRating:   string;
  scheme:          number;
  featured?:       boolean;
  curatorNote?:    string;
  readerCount:     number;
  maxBetaReaders:  number | null;
  listedAt:        string; // ISO date
  themes:          string[];
  ownManuscript?:  boolean;
  coverUrl?:       string;
  betaMode:        BetaMode;
  slotState?:      SlotState;
  slotCounts?:     { filled: number; total: number };
  personalizationSignal?: PersonalizationSignal;
  contentNotes?:   ContentNotes;
  contentWarnings?: string[];
  pendingRequest?: boolean;
  isEnrolled?:    boolean;
}

export function deriveSlotState(ms: CatalogManuscript): SlotState {
  if (ms.slotState) return ms.slotState;
  if (ms.status === 'closed') return 'full';
  if (ms.maxBetaReaders === null) return 'ongoing';
  const remaining = ms.maxBetaReaders - ms.readerCount;
  if (remaining <= 0) return 'full';
  if (remaining <= 1) return 'filling';
  return 'open';
}

export function slotStatusText(state: SlotState, ms: CatalogManuscript): string {
  if (state === 'ongoing') return 'Open · no reader cap';
  if (state === 'full')    return 'Full · applications closed';
  const cap = ms.slotCounts?.total ?? ms.maxBetaReaders ?? 0;
  const filled = ms.slotCounts?.filled ?? ms.readerCount;
  const remaining = cap - filled;
  if (state === 'filling') return remaining === 1 ? 'Filling · 1 slot left' : `Filling · ${remaining} slots left`;
  return `Open · ${filled} of ${cap} slots`;
}



export function fuzzySearch(manuscripts: CatalogManuscript[], query: string): CatalogManuscript[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  return manuscripts
    .map(m => {
      let score = 0;
      const title  = m.title.toLowerCase();
      const author = m.author.toLowerCase();
      const genre  = (m.genre + ' ' + m.subgenre).toLowerCase();
      const body   = [m.description, ...m.keywords, ...m.themes].join(' ').toLowerCase();

      for (const token of tokens) {
        if (title.includes(token))  score += 3;
        if (author.includes(token)) score += 2;
        if (genre.includes(token))  score += 2;
        if (body.includes(token))   score += 1;
      }
      return { m, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ m }) => m);
}
