export type DispatchStatus  = 'sent' | 'draft' | 'scheduled';
export type SignalSeverity  = 'act' | 'note' | 'observe';
export type PlatformKey     = 'goodreads' | 'instagram' | 'x' | 'bookshop';
export type PlatformSignalType =
  | 'rating_drop' | 'engagement_dip' | 'sales_spike'
  | 'mention_spike' | 'follower_delta';

export interface PlatformSignal {
  platform:  PlatformKey;
  type:      PlatformSignalType;
  value:     number;
  baseline:  number;
  delta:     number;
  window:    string;
  context?:  string;
  severity:  SignalSeverity;
}

export interface SocialLink {
  platform:     string;
  handle:       string;
  followers:    number | null;
  status:       'live' | 'not-set-up';
  spark?:       number[];
  delta?:       number;
  rating?:      number;
  ratingDelta?: number;
  salesWindow?: number;
}
export type SubscriberSegment = 'devout' | 'warm' | 'cool' | 'new';

export interface Dispatch {
  id: string; issue: string; subject: string;
  date: string; status: DispatchStatus;
  opens: number | null; openRate: string | null;
  replies: number | null; clickRate: string | null;
  unsubs: number | null; recipients: number | null;
}

export interface Subscriber {
  id: string; name: string; initials: string;
  tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
  location: string; joined: string;
  segment: SubscriberSegment; opens: number; replies: number;
  spent: string;
  channels?:   ('email' | 'goodreads' | 'instagram' | 'bookshop')[];
  isChampion?: boolean;
}

export interface ReaderEvent {
  date: string;
  body: string;
}

export interface ReaderMatch {
  platform:   PlatformKey;
  handle:     string;
  confidence: 'high' | 'medium';
  detail?:    string;
}

export interface SeasonTask {
  week:     string;
  task:     string;
  status:   'done' | 'in-progress' | 'upcoming';
  dueDate?: string;
  action?:  string;
}

export interface Season {
  id:         string;
  title:      string;
  objective:  'launch' | 'preorder' | 'repromotion' | 'seasonal';
  startDate:  string;
  launchDate: string;
  channels:   string[];
  weeksOut:   number;
  tasks:      SeasonTask[];
}

export type AssetKind = 'image' | 'bio' | 'pressrelease';

export interface PKAsset {
  id: string; name: string; kind: AssetKind;
  format: string; status: 'ready' | 'draft';
  group: string;
  bookId?: number;
}
