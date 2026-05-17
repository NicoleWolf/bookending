export type AuthorTone = 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
export type ProjectStatus = 'drafting' | 'in-revision' | 'complete';
export type ProfileTab = 'overview' | 'activity' | 'qa' | 'arc';

export interface CurrentProject {
  title: string;
  genre: string;
  wordCount: number;
  targetWordCount: number;
  status: ProjectStatus;
  startedAt: string;
}

export type ActivityType =
  | 'started'
  | 'milestone'
  | 'chapter'
  | 'beta_opened'
  | 'revision'
  | 'published';

export interface ActivityEvent {
  id: number;
  type: ActivityType;
  text: string;
  date: string; // ISO
}

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
  askedAt: string;
}

export interface PendingQuestion {
  id: string;
  submitterId: string;
  submitterName: string;
  question: string;
  submittedAt: string;
}

export interface FeaturedProject {
  id: string;
  title: string;
  genre: string | null;
  subgenre: string | null;
  wordCount: number;
  status: string;
  createdAt: string;
  description: string | null;
  betaMode: string;
}

export interface AuthorProfile {
  id: string;
  name: string;
  initials: string;
  tone: AuthorTone;
  location: string;
  bio: string;
  writingProcess: string;
  genres: string[];
  joinedAt: string; // ISO
  followerCount: number;
  titles: number;
  currentProject?: CurrentProject;
  featuredProject?: FeaturedProject;
  activity: ActivityEvent[];
  qa: QAEntry[];
  pendingQuestions?: PendingQuestion[];
}
