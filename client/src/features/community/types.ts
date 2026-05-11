export interface Mentor {
  id: number; name: string; initials: string; tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
  books: number; specialties: string[]; bio: string;
  available: 'available' | 'full' | 'paused'; mentees: number;
}

export interface CircleMember {
  name: string; initials: string; tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper'; role?: string;
}

export interface SharedPassage {
  id: number; author: string; initials: string; tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
  source: string; text: string; time: string;
  responses: { author: string; initials: string; tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper'; body: string; }[];
}

export interface WritingCircle {
  id: number;
  name: string;
  description: string;
  genre: string;
  memberCount: number;
  maxMembers: number;
  privacy: 'open' | 'invite';
  frequency: string;
  nextSession: string;
  members: CircleMember[];
  passages: SharedPassage[];
  joined: boolean;
  organiser: string;
}

export interface WritingPrompt {
  id: number;
  kind: 'prompt' | 'challenge';
  title: string;
  body: string;
  author: string;
  initials: string;
  tone: 'accent' | 'gold' | 'muted' | 'ink' | 'paper';
  time: string;
  responses: number;
}
