export type ReaderAvailability = 'open' | 'closed';
export type ReaderTone = 'accent' | 'gold' | 'muted' | 'ink' | 'paper';

export interface ReaderStats {
  booksCompleted: number;
  completionRate: number;      // 0–100
  avgInlineComments: number;
  authorsWorkedWith: number;
  avgTurnaroundDays: number;
}

export interface ReaderProfile {
  id: string;
  name: string;
  initials: string;
  tone: ReaderTone;
  location: string;
  bio: string;
  availability: ReaderAvailability;
  genrePreferences: string[];
  stats: ReaderStats;
  joinedAt: string; // ISO
  email: string;
}
