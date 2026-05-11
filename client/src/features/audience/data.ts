import type { Dispatch, Subscriber, SubscriberSegment, PKAsset, SocialLink, PlatformSignal, ReaderEvent, ReaderMatch, Season } from './types';

export const SEGMENTS = [
  { key: 'devout' as const, label: 'Devout',  sub: 'Opens every issue, often replies', n: 1284, pct: 0.42, color: 'var(--accent)' },
  { key: 'warm'   as const, label: 'Warm',    sub: 'Opens roughly half',               n:  947, pct: 0.31, color: 'var(--paper)' },
  { key: 'cool'   as const, label: 'Cool',    sub: 'Drifting — last opened 60+ days',  n:  580, pct: 0.19, color: 'var(--muted)' },
  { key: 'new'    as const, label: 'New',     sub: 'Joined in the last 30 days',       n:  244, pct: 0.08, color: '#c9a84c' },
];

export const GROWTH_SPARK = [2811,2830,2858,2872,2890,2910,2924,2948,2965,2974,2989,3010,3031,3055];

export const DISPATCHES: Dispatch[] = [
  { id: 'static-d1', issue: 'No. 47', subject: 'On finishing the second draft — and the small grief of it',  date: '26 Apr 2026', status: 'sent',  opens: 1905, openRate: '62.4%', replies: 148, clickRate: '24.1%', unsubs: 9,  recipients: 3055 },
  { id: 'static-d2', issue: 'No. 46', subject: 'The lighthouse problem',                                      date: '12 Apr 2026', status: 'sent',  opens: 1657, openRate: '54.3%', replies:  89, clickRate: '18.2%', unsubs: 14, recipients: 3051 },
  { id: 'static-d3', issue: 'No. 45', subject: 'What I\'ve been reading — spring list',                       date: '29 Mar 2026', status: 'sent',  opens: 1468, openRate: '48.1%', replies:  61, clickRate: '12.4%', unsubs: 7,  recipients: 3050 },
  { id: 'static-d4', issue: 'No. 44', subject: 'A note on revision: when to stop tightening',                 date: '15 Mar 2026', status: 'sent',  opens: 1577, openRate: '51.7%', replies:  74, clickRate: '15.8%', unsubs: 11, recipients: 3048 },
  { id: 'static-d5', issue: 'No. 43', subject: 'Beginning again — first pages of Hollow Meridian',            date: '1 Mar 2026',  status: 'sent',  opens: 1379, openRate: '45.2%', replies:  52, clickRate: '11.1%', unsubs: 6,  recipients: 3047 },
  { id: 'static-d6', issue: 'No. 42', subject: 'The beta-reader problem and how I\'m solving it',             date: '15 Feb 2026', status: 'sent',  opens: 1424, openRate: '46.7%', replies:  68, clickRate: '13.3%', unsubs: 9,  recipients: 3046 },
  { id: 'static-d7', issue: 'Draft',  subject: 'On collaboration and the fear of losing your voice',          date: '—',           status: 'draft', opens: null, openRate: null,   replies: null, clickRate: null,   unsubs: null, recipients: null },
  { id: 'static-d8', issue: 'Draft',  subject: 'The cover story (literal and otherwise)',                     date: '—',           status: 'draft', opens: null, openRate: null,   replies: null, clickRate: null,   unsubs: null, recipients: null },
];

export const SUBSCRIBERS: Subscriber[] = [
  { id: 'static-1',  name: 'Aoife Brennan',    initials: 'AB', tone: 'gold',   location: 'Dublin, IE',      joined: 'Mar 2024', segment: 'devout', opens: 47, replies: 11, spent: '$28', channels: ['email', 'goodreads'], isChampion: true  },
  { id: 'static-2',  name: 'Wendell Park',     initials: 'WP', tone: 'accent', location: 'Portland, US',    joined: 'Jan 2024', segment: 'devout', opens: 44, replies:  4, spent: '$92', channels: ['email', 'instagram', 'bookshop'], isChampion: true  },
  { id: 'static-3',  name: 'Sade Adebayo',     initials: 'SA', tone: 'paper',  location: 'Lagos, NG',       joined: 'Feb 2024', segment: 'devout', opens: 46, replies:  8, spent: '$36', channels: ['email', 'goodreads'], isChampion: true  },
  { id: 'static-4',  name: 'Joon Park',        initials: 'JP', tone: 'muted',  location: 'Seoul, KR',       joined: 'Apr 2024', segment: 'devout', opens: 43, replies: 12, spent: '$0',  channels: ['email']  },
  { id: 'static-5',  name: 'Beatriz Costa',    initials: 'BC', tone: 'ink',    location: 'Lisbon, PT',      joined: 'May 2024', segment: 'devout', opens: 45, replies:  6, spent: '$46', channels: ['email', 'goodreads', 'bookshop'], isChampion: true  },
  { id: 'static-6',  name: 'Hiroshi Tanaka',   initials: 'HT', tone: 'accent', location: 'Tokyo, JP',       joined: 'Jun 2024', segment: 'warm',   opens: 28, replies:  2, spent: '$18', channels: ['email', 'bookshop']  },
  { id: 'static-7',  name: 'Fatima Al-Rashid', initials: 'FA', tone: 'gold',   location: 'Dubai, AE',       joined: 'Jul 2024', segment: 'warm',   opens: 24, replies:  1, spent: '$0',  channels: ['email']  },
  { id: 'static-8',  name: 'Lars Eriksson',    initials: 'LE', tone: 'paper',  location: 'Gothenburg, SE',  joined: 'Aug 2024', segment: 'warm',   opens: 31, replies:  3, spent: '$28', channels: ['email', 'bookshop']  },
  { id: 'static-9',  name: 'Nour Mansour',     initials: 'NM', tone: 'muted',  location: 'Cairo, EG',       joined: 'Sep 2024', segment: 'cool',   opens:  8, replies:  0, spent: '$0',  channels: ['email']  },
  { id: 'static-10', name: 'Pita Havili',      initials: 'PH', tone: 'ink',    location: 'Auckland, NZ',    joined: 'Oct 2024', segment: 'cool',   opens: 11, replies:  0, spent: '$0',  channels: ['email']  },
  { id: 'static-11', name: 'Elif Şahin',       initials: 'ES', tone: 'accent', location: 'Istanbul, TR',    joined: 'Apr 2026', segment: 'new',    opens:  2, replies:  1, spent: '$0',  channels: ['email']  },
  { id: 'static-12', name: 'Kofi Mensah',      initials: 'KM', tone: 'gold',   location: 'Accra, GH',       joined: 'May 2026', segment: 'new',    opens:  1, replies:  0, spent: '$0',  channels: ['email']  },
];

export const READER_EVENTS: Record<string, ReaderEvent[]> = {
  'static-1': [
    { date: 'Mar 2024', body: 'Joined The Margin Letter.' },
    { date: 'Sep 2024', body: 'Rated The Salt Roads 5 stars on Goodreads.' },
    { date: 'Oct 2024', body: 'Left a Goodreads review: "Prose of quiet precision — I\'ve read it twice."' },
    { date: 'Jan 2025', body: 'Replied to No. 32: "This made me re-read it twice."' },
    { date: 'Mar 2025', body: 'Forwarded No. 38 to two people.' },
    { date: 'Apr 2026', body: 'Replied to No. 46: "I cried at the lighthouse line."' },
  ],
  'static-2': [
    { date: 'Jan 2024', body: 'Joined The Margin Letter.' },
    { date: 'Apr 2024', body: 'Ordered The Salt Roads on Bookshop.org.' },
    { date: 'Jun 2024', body: 'Tagged the author on Instagram: "finally started The Salt Roads."' },
    { date: 'Mar 2026', body: 'Pre-ordered Hollow Meridian on Bookshop.org.' },
  ],
  'static-3': [
    { date: 'Feb 2024', body: 'Joined The Margin Letter.' },
    { date: 'Jul 2024', body: 'Rated The Salt Roads 5 stars on Goodreads.' },
    { date: 'Jul 2024', body: 'Left a Goodreads review: "A debut that asks more of you than most."' },
    { date: 'Nov 2024', body: 'Replied to No. 41: "My mother felt this too."' },
  ],
  'static-5': [
    { date: 'May 2024', body: 'Joined The Margin Letter.' },
    { date: 'Aug 2024', body: 'Ordered The Salt Roads on Bookshop.org.' },
    { date: 'Sep 2024', body: 'Rated The Salt Roads 4 stars on Goodreads.' },
    { date: 'Feb 2025', body: 'Replied to No. 36: "Please don\'t stop writing."' },
    { date: 'Jan 2026', body: 'Ordered a second copy of The Salt Roads as a gift.' },
  ],
};

export const READER_MATCHES: Record<string, ReaderMatch[]> = {
  'static-1': [
    { platform: 'goodreads', handle: 'aoife_reads',    confidence: 'high',   detail: 'Reviewer of The Salt Roads, matched by name and review timing.' },
  ],
  'static-2': [
    { platform: 'instagram', handle: '@wendellreads',  confidence: 'high',   detail: 'Tagged the author in a post, account matched by name.' },
    { platform: 'bookshop',  handle: 'wendell-park',   confidence: 'high',   detail: 'Two Bookshop.org purchases matched by name and email domain.' },
  ],
  'static-3': [
    { platform: 'goodreads', handle: 'sade_adebayo',   confidence: 'medium', detail: 'This Goodreads reviewer might be Sade Adebayo. Confirm?' },
  ],
  'static-5': [
    { platform: 'goodreads', handle: 'beatriz.c',      confidence: 'medium', detail: 'This Goodreads reviewer might be Beatriz Costa. Confirm?' },
    { platform: 'bookshop',  handle: 'beatriz-costa',  confidence: 'high',   detail: 'Bookshop.org purchases matched by name and email.' },
  ],
};

export const ACTIVE_SEASON: Season = {
  id:         'hollow-meridian-launch',
  title:      'Hollow Meridian',
  objective:  'launch',
  startDate:  'Mar 2026',
  launchDate: 'Jun 2026',
  channels:   ['email', 'instagram', 'x', 'goodreads', 'bookshop'],
  weeksOut:   6,
  tasks: [
    { week: 'Week minus 8', task: 'Press kit complete, cover reveal copy finalised.',                                    status: 'done'        },
    { week: 'Week minus 7', task: 'Goodreads listing updated, giveaway setup begun.',                                    status: 'done'        },
    { week: 'Week minus 6', task: 'Goodreads giveaway live. Advance copies to Champions.',                               status: 'in-progress', dueDate: 'This week', action: 'Confirm Champions list' },
    { week: 'Week minus 5', task: 'Cover reveal dispatch to full list.',                                                 status: 'upcoming',    dueDate: 'May 4'    },
    { week: 'Week minus 4', task: 'First dispatch about the book — what it cost, what it is.',                           status: 'upcoming',    dueDate: 'May 11',    action: 'Draft dispatch'       },
    { week: 'Week minus 2', task: 'Pre-order push to Patrons — personal note, early access.',                            status: 'upcoming',    dueDate: 'May 25',    action: 'Draft patron note'    },
    { week: 'Launch week',  task: 'Dispatch, Instagram, X, and Goodreads in coordinated sequence.',                      status: 'upcoming',    dueDate: 'Jun 8',     action: 'View schedule'        },
  ],
};

// Mock engagement metrics keyed by name — filled by email provider in production
export const SUBSCRIBER_DISPLAY: Record<string, {
  opens: number; replies: number; spent: string;
  tone: Subscriber['tone']; initials: string;
}> = {
  'Aoife Brennan':    { opens: 47, replies: 11, spent: '$28', tone: 'gold',   initials: 'AB' },
  'Wendell Park':     { opens: 44, replies:  4, spent: '$92', tone: 'accent', initials: 'WP' },
  'Sade Adebayo':     { opens: 46, replies:  8, spent: '$36', tone: 'paper',  initials: 'SA' },
  'Joon Park':        { opens: 43, replies: 12, spent: '$0',  tone: 'muted',  initials: 'JP' },
  'Beatriz Costa':    { opens: 45, replies:  6, spent: '$46', tone: 'ink',    initials: 'BC' },
  'Hiroshi Tanaka':   { opens: 28, replies:  2, spent: '$18', tone: 'accent', initials: 'HT' },
  'Fatima Al-Rashid': { opens: 24, replies:  1, spent: '$0',  tone: 'gold',   initials: 'FA' },
  'Lars Eriksson':    { opens: 31, replies:  3, spent: '$28', tone: 'paper',  initials: 'LE' },
  'Nour Mansour':     { opens:  8, replies:  0, spent: '$0',  tone: 'muted',  initials: 'NM' },
  'Pita Havili':      { opens: 11, replies:  0, spent: '$0',  tone: 'ink',    initials: 'PH' },
  'Elif Şahin':       { opens:  2, replies:  1, spent: '$0',  tone: 'accent', initials: 'ES' },
  'Kofi Mensah':      { opens:  1, replies:  0, spent: '$0',  tone: 'gold',   initials: 'KM' },
};

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

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'Author website',
    handle:   'billiewolf.com',
    followers: null,
    status:   'live',
  },
  {
    platform: 'The Margin Letter',
    handle:   'bookending.press/billiewolf',
    followers: 3055,
    status:   'live',
    spark:    GROWTH_SPARK,
    delta:    244,
  },
  {
    platform: 'Instagram',
    handle:   '@billiewolf.writes',
    followers: 2841,
    status:   'live',
    spark:    [2794, 2800, 2805, 2811, 2818, 2822, 2825, 2828, 2830, 2833, 2835, 2837, 2839, 2841],
    delta:    47,
  },
  {
    platform:    'Goodreads',
    handle:      'Billie Wolf',
    followers:   412,
    status:      'live',
    spark:       [388, 392, 394, 396, 398, 400, 403, 405, 407, 408, 409, 410, 411, 412],
    delta:       24,
    rating:      4.0,
    ratingDelta: -0.2,
  },
  {
    platform:    'Bookshop.org',
    handle:      'billiewolf',
    followers:   null,
    status:      'live',
    spark:       [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 2, 7, 7],
    salesWindow: 14,
  },
  {
    platform: 'X / Twitter',
    handle:   '@billiewolf',
    followers: 1204,
    status:   'live',
    spark:    [1192, 1194, 1196, 1197, 1198, 1199, 1200, 1200, 1201, 1201, 1202, 1202, 1203, 1204],
    delta:    12,
  },
  {
    platform: 'Substack',
    handle:   '—',
    followers: null,
    status:   'not-set-up',
  },
];

export const PLATFORM_SIGNALS: PlatformSignal[] = [
  {
    platform: 'goodreads',
    type:     'rating_drop',
    value:    4.0,
    baseline: 4.2,
    delta:    -0.2,
    window:   'since March',
    context:  'two are 2-star',
    severity: 'note',
  },
  {
    platform: 'instagram',
    type:     'engagement_dip',
    value:    3.2,
    baseline: 6.8,
    delta:    -3.6,
    window:   'last three posts',
    context:  "haven't mentioned Hollow Meridian in 18 days",
    severity: 'observe',
  },
  {
    platform: 'bookshop',
    type:     'sales_spike',
    value:    14,
    baseline: 1.2,
    delta:    11.6,
    window:   '48 hours',
    context:  'The Salt Roads',
    severity: 'act',
  },
];

export const MEDIA_MENTIONS = [
  { outlet: 'The Literary Review',  piece: '"Prose of quiet precision" — review of The Salt Roads',    date: 'Mar 2026', kind: 'Review'    },
  { outlet: 'Words & Worlds',       piece: '"A debut that demands attention" — starred review',         date: 'Feb 2026', kind: 'Review'    },
  { outlet: 'Shelf Awareness',      piece: 'Interview: On writing The Salt Roads and what comes next',  date: 'Jan 2026', kind: 'Interview' },
  { outlet: 'The Newcomer Prize',   piece: 'Longlist — The Salt Roads',                                 date: 'Dec 2025', kind: 'Award'     },
  { outlet: 'The Bookseller',       piece: 'Ones to Watch: 10 debuts worth your attention',             date: 'Nov 2025', kind: 'Feature'   },
  { outlet: 'Electric Literature',  piece: '"The 15 Best Sentences We Read This Month"',                date: 'Oct 2025', kind: 'Feature'   },
];

export const BIO_SHORT = `Billie Wolf writes literary and speculative fiction from Portland, Oregon. Her debut novel, The Salt Roads, was shortlisted for the Newcomer Prize. Hollow Meridian is forthcoming.`;

export const BIO_LONG = `Billie Wolf writes literary and speculative fiction from Portland, Oregon. Her debut novel, The Salt Roads, was shortlisted for the Newcomer Prize and praised for its "prose of quiet precision" (The Literary Review). Her second novel, Hollow Meridian, is forthcoming.\n\nShe writes The Margin Letter, a fortnightly dispatch on craft and the writing life, read by over 3,000 independent readers. She has been published in Electric Literature, The Kenyon Review, and elsewhere.\n\nShe lives in Portland with her two cats and more unfinished manuscripts than she will admit to.`;

export const KIND_TONE: Record<string, 'good' | 'accent' | 'neutral' | 'paper'> = {
  Review: 'good', Interview: 'accent', Award: 'accent', Feature: 'neutral',
};

export const PK_ASSETS: PKAsset[] = [
  { id: 'headshot',      name: 'Author headshot',          kind: 'image',        format: 'JPG · 2400×2400',   status: 'ready', group: 'Photos'    },
  { id: 'headshot-bw',   name: 'Author headshot (B&W)',    kind: 'image',        format: 'JPG · 2400×2400',   status: 'ready', group: 'Photos'    },
  { id: 'cover-salt',    name: 'The Salt Roads — cover',   kind: 'image',        format: 'PNG · 2400×3600',   status: 'ready', group: 'Covers',   bookId: 1 },
  { id: 'cover-hollow',  name: 'Hollow Meridian — cover',  kind: 'image',        format: 'PNG · 2400×3600',   status: 'draft', group: 'Covers',   bookId: 2 },
  { id: 'bio-short',     name: 'Author bio — short',       kind: 'bio',          format: '~80 words',         status: 'ready', group: 'Text'      },
  { id: 'bio-long',      name: 'Author bio — long',        kind: 'bio',          format: '~250 words',        status: 'ready', group: 'Text'      },
  { id: 'press-release', name: 'Press release — Salt Roads', kind: 'pressrelease', format: 'Structured doc', status: 'ready', group: 'Documents' },
];

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
