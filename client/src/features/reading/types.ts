import type { ThreadEntry } from '@bookending/shared';

export interface Para     { id: number; text: string; }
export interface Chapter  { id: number; number: number; title: string; paras: Para[]; releasedAt?: string | null; expectedAt?: string | null; }
export interface Manuscript {
  id: string | number; title: string; draft: string; instructions: string; chapters: Chapter[];
  mode: 'complete' | 'serialized';
  status?: string;
  editorialNote?: string | null;
  revisionPausedAt?: string | null;
}

export interface Highlight {
  id: string; chapterId: number; paraId: number;
  selectedText: string; note: string;
  status: 'draft' | 'submitted' | 'graduated';
  thread: ThreadEntry[];
  time: string;
}
export interface Pending { chapterId: number; paraId: number; text: string; }
export interface Submission { stars: number; message: string; templateAnswers?: import('./data').TemplateAnswers; }

export type { ThreadEntry } from '@bookending/shared';
export type { AnnotationRecord, ProgressRecord, ImpressionPointRecord, ReaderChapterNoteRecord } from '@bookending/shared';
