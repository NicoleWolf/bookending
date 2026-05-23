import type { Manuscript, Reader, CommentType, ReaderTone, BetaReader } from './types';

// Editing-specific metadata keyed by book id (title/id come from the catalog savedBooks).
export type ManuscriptMeta = Omit<Manuscript, 'id' | 'title'>;

export const MANUSCRIPT_META: Record<string, ManuscriptMeta> = {};

export const DEFAULT_EDITING_META: ManuscriptMeta = {
  draft: 'Draft 1', date: '—', words: 0, chapters: 0, pages: 0,
};

export const INTEGRATIONS = [
  { name: 'Grammarly',     tagline: 'Grammar & style checks',  initial: 'G', connected: false },
  { name: 'ProWritingAid', tagline: 'Deep manuscript analysis', initial: 'P', connected: false },
  { name: 'Scrivener',     tagline: 'Export .scriv project',    initial: 'S', connected: false },
  { name: 'Google Docs',   tagline: 'Sync & collaborate',       initial: 'D', connected: true  },
];

// Readers now come from the API — this is intentionally empty.
export const INITIAL_READERS: Record<string, Reader[]> = {};

export const INITIAL_INSTRUCTIONS: Record<string, string> = {};

export const typeTone: Record<CommentType, 'danger' | 'neutral' | 'good' | 'accent'> = {
  pacing: 'danger', character: 'neutral', prose: 'accent', plot: 'neutral',
  other: 'neutral', continuity: 'danger', praise: 'good',
};

export const verdictTone: Record<string, 'good' | 'danger' | 'neutral' | 'accent'> = {
  'enthralled': 'good', 'pacing flag': 'danger', 'on track': 'neutral',
  '4★ — sent letter': 'accent', 'sent letter': 'accent',
  'just started': 'neutral', 'just invited': 'neutral',
};

export const TONES: ReaderTone[] = ['accent', 'gold', 'muted', 'ink', 'paper'];

export const MANUSCRIPT_GENRES: Record<string, string[]> = {};

export const BETA_READER_POOL: BetaReader[] = [];

