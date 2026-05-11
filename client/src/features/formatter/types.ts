export interface ManuscriptSummary {
  id: string;
  title: string;
  wordCount: number;
  updatedAt: string;
  _count?: { chapters: number };
  chapters?: { title: string }[];
}

export interface FormattingProjectRecord {
  id: string;
  manuscriptId: string;
  userId: string;
  currentStep: number;
  source: string | null;
  encoding: string;
  smartQuotes: string;
  uploadedDocxUrl: string | null;
  pastedContent: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Encoding    = 'auto' | 'utf8' | 'win1252';
export type SmartQuotes = 'convert' | 'passthrough';

export interface IngestSettings {
  encoding:    Encoding;
  smartQuotes: SmartQuotes;
}
