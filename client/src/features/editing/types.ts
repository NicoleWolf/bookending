export type ReaderTone  = 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
export type CommentType = 'pacing' | 'character' | 'prose' | 'plot' | 'other' | 'continuity' | 'praise';

export interface Manuscript {
  id: string; title: string; draft: string; date: string;
  words: number; chapters: number; pages: number;
}

export interface Reader {
  id: string; name: string; email?: string; initials: string; tone: ReaderTone;
  progress: number; chapter: string; verdict: string;
  last: string; notes: number; since: string;
}

export interface ReaderRating { stars: number; tags: string[]; note: string; }

export interface BetaReader {
  id: string;
  name: string;
  initials: string;
  tone: ReaderTone;
  email: string;
  genres: string[];
  booksRead: number;
  avgRating: number;
  responseTime: string;
  bio: string;
  availability: 'available' | 'busy';
}

export interface Comment {
  id: number; manuscriptId: number;
  reader: { name: string; initials: string; tone: ReaderTone };
  chapter: string; page: number; passage: string; note: string;
  type: CommentType; resolvedDefault: boolean; flaggedBy: number; time: string;
}

export interface CorrespondenceMessage {
  id: number;
  author: 'reader' | 'writer';
  authorName: string;
  body: string;
  sentAt: string;
}

export interface CorrespondenceThread {
  id: number;
  manuscriptId: string;
  draftVersion: string;
  reader: { id: string; name: string; initials: string; tone: ReaderTone };
  messages: CorrespondenceMessage[];
  openedAt: string;
}
