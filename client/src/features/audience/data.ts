import type { Subscriber, SubscriberSegment, PKAsset, SocialLink, PlatformSignal, ReaderEvent, ReaderMatch, Season } from './types';

export const SEGMENTS = [
  { key: 'devout' as const, label: 'Devout',  sub: 'Opens every issue, often replies', n: 0, pct: 0, color: 'var(--accent)' },
  { key: 'warm'   as const, label: 'Warm',    sub: 'Opens roughly half',               n: 0, pct: 0, color: 'var(--paper)' },
  { key: 'cool'   as const, label: 'Cool',    sub: 'Drifting — last opened 60+ days',  n: 0, pct: 0, color: 'var(--muted)' },
  { key: 'new'    as const, label: 'New',     sub: 'Joined in the last 30 days',       n: 0, pct: 0, color: '#c9a84c' },
];

export const GROWTH_SPARK: number[] = [];

export const SUBSCRIBERS: Subscriber[] = [];

export const READER_EVENTS: Record<string, ReaderEvent[]> = {};

export const READER_MATCHES: Record<string, ReaderMatch[]> = {};

export const ACTIVE_SEASON: Season | null = null;

export const SUBSCRIBER_DISPLAY: Record<string, {
  opens: number; replies: number; spent: string;
  tone: Subscriber['tone']; initials: string;
}> = {};

const TONE_PALETTE: Subscriber['tone'][] = ['accent', 'gold', 'muted', 'ink', 'paper'];

export function subscriberTone(name: string, idx: number): Subscriber['tone'] {
  return SUBSCRIBER_DISPLAY[name]?.tone ?? TONE_PALETTE[idx % TONE_PALETTE.length];
}

export function subscriberInitials(name: string): string {
  return SUBSCRIBER_DISPLAY[name]?.initials ??
    name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

export const SEGMENT_TONE: Record<SubscriberSegment, 'good' | 'accent' | 'paper' | 'neutral'> = {
  devout: 'good', warm: 'accent', cool: 'paper', new: 'neutral',
};

export const REPLY_SNIPPETS = [
  '"This made me re-read it twice."',
  '"I cried at the lighthouse line."',
  '"Will there be a sequel?"',
  '"My mother felt this too."',
  '"Please don\'t stop writing."',
  '"Forwarded this to six people."',
];

export const SOCIAL_LINKS: SocialLink[] = [];

export const PLATFORM_SIGNALS: PlatformSignal[] = [];

export const MEDIA_MENTIONS: { outlet: string; piece: string; date: string; kind: string }[] = [];

export const BIO_SHORT = '';

export const BIO_LONG = '';

export const KIND_TONE: Record<string, 'good' | 'accent' | 'neutral' | 'paper'> = {
  Review: 'good', Interview: 'accent', Award: 'accent', Feature: 'neutral',
};

export const PK_ASSETS: PKAsset[] = [];

export const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: '1px solid var(--rule)',
  color: 'var(--paper)', padding: '9px 12px', fontSize: 13,
  fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box',
};

export const taStyle: React.CSSProperties = {
  width: '100%', background: 'transparent', border: '1px solid var(--rule)',
  color: 'var(--paper)', padding: '10px 12px', fontSize: 14,
  fontFamily: 'var(--serif)', fontStyle: 'italic', lineHeight: 1.7,
  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
};
