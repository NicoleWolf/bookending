export type AvatarTone = 'ink' | 'paper' | 'accent' | 'gold' | 'muted'
export type PillTone = 'accent' | 'good' | 'neutral'

export interface DeskPrimaryItem {
  pill: string
  context: string
  headline: string
  reasoning: string
  primaryCta: string
  secondaryCta: string
}

export interface QueueRow {
  label: 'Next' | 'Then'
  headline: string
  supporting: string
  cta: string
}

export interface RailItem {
  dotColor: string
  body: string
  time: string
}

export interface ReaderRow {
  initials: string
  avatarTone: AvatarTone
  name: string
  meta: string
  progress: string
  progressPct: number
  pillLabel: string
  pillTone: PillTone
  noteCount: number
  barMuted?: boolean
}

export interface ManuscriptRow {
  initials: string
  avatarTone: AvatarTone
  title: string
  subtitle: string
  progress: string
  progressPct: number
  pillLabel: string
  pillTone: PillTone
  barMuted?: boolean
}

export interface FeedbackTheme {
  label: string
  count: number
  pct: number
}

export interface WriteLaneData {
  manuscriptTitle: string
  manuscriptMeta: string
  readers: ReaderRow[]
  moreCount: number
  hotspotBars: number[]
  hotspotHotIdx: number
  themes: FeedbackTheme[]
}

export interface PrepareLaneData {
  stepsLabel: string
  stepsProgress: number
  description: string
}

export interface SustainLaneData {
  salesCount: number
  unrepliedQa: number
  description: string
}

export interface DiscoverLaneData {
  openCount: number
  genreCount: number
  manuscripts: { title: string; author: string; status: string }[]
}

export interface ConnectLaneData {
  lettersInDraft: number
  unreadReplies: number
  description: string
}

export interface ReadLaneData {
  manuscriptsMeta: string
  streakLabel: string
  rows: ManuscriptRow[]
  moreLabel: string
  hotspotBars: number[]
  hotspotHotIdx: number
  hotspotTitle: string
  rhythm: { label: string; value: string; accent?: boolean }[]
}

export interface WritingSideStub {
  unreadCount: number
  crossRoleMsg: string
  desk: { count: string; primary: DeskPrimaryItem; queue: QueueRow[] }
  rail: RailItem[]
  writeLane: WriteLaneData
  prepareLane: PrepareLaneData
  sustainLane: SustainLaneData
}

export interface ReadingSideStub {
  unreadCount: number
  crossRoleMsg: string
  desk: { count: string; primary: DeskPrimaryItem; queue: QueueRow[] }
  rail: RailItem[]
  readLane: ReadLaneData
  discoverLane: DiscoverLaneData
  connectLane: ConnectLaneData
}

export const STUB_WRITING: WritingSideStub = {
  unreadCount: 2,
  crossRoleMsg: '2 items waiting on your reading side — Henrik replied to your Ch. 4 note, and Marcus shipped a new chapter of ‘Hollow Meridian.’',
  desk: {
    count: '3 items · sorted by urgency',
    primary: {
      pill: 'Pacing flag · 3 readers',
      context: 'Ch. 17 · p. 184 · 11 min ago',
      headline: 'Three readers flagged the lighthouse scene for pacing. It’s the same passage Tomás called out — worth a look before your next revision pass.',
      reasoning: 'Tomás Reyes, Marisol Vega, and one open reader all paused or commented on pp. 182–186. When 3+ readers converge on a passage, revision usually pays off — your last hotspot at Ch. 9 led to your strongest reader response yet.',
      primaryCta: 'Open the scene →',
      secondaryCta: 'See all 3 notes',
    },
    queue: [
      {
        label: 'Next',
        headline: 'Henrik finished his read — he’s ready for a thank-you letter.',
        supporting: '4★ verdict, sent 2 days ago. Bookending drafted opening lines based on his notes.',
        cta: 'Draft letter →',
      },
      {
        label: 'Then',
        headline: 'Two readers applied to join — review their profiles and decide.',
        supporting: 'Both have public reader profiles. You set the bar for who joins your beta.',
        cta: 'Review applicants →',
      },
    ],
  },
  rail: [
    { dotColor: 'var(--accent)', body: 'Mira H. shared a passage from Ch. 4', time: '2H ago' },
    { dotColor: 'var(--good)', body: '3 new subscribers from your last dispatch', time: '5H ago' },
    { dotColor: 'var(--bk-rule)', body: 'Delphine M. replied to your dispatch', time: '1D ago' },
    { dotColor: 'var(--accent)', body: 'Writing circle — session notes posted', time: '2D ago' },
  ],
  writeLane: {
    manuscriptTitle: 'The Lantern Keeper’s Daughter · Draft 2',
    manuscriptMeta: '96 notes · 5 readers',
    readers: [
      { initials: 'MV', avatarTone: 'accent', name: 'Marisol Vega', meta: '4 books read · public profile', progress: 'Ch. 14 · 78%', progressPct: 78, pillLabel: 'Enthralled', pillTone: 'good', noteCount: 14 },
      { initials: 'TR', avatarTone: 'accent', name: 'Tomás Reyes', meta: '2 books read · invited', progress: 'Ch. 17 · 92%', progressPct: 92, pillLabel: 'Pacing flag', pillTone: 'accent', noteCount: 31 },
      { initials: 'HL', avatarTone: 'ink', name: 'Henrik Lund', meta: '7 books read · public profile', progress: 'Done · 100%', progressPct: 100, pillLabel: '4★ verdict', pillTone: 'good', noteCount: 42, barMuted: true },
    ],
    moreCount: 2,
    hotspotBars: [18, 12, 22, 28, 35, 25, 30, 42, 38, 55, 60, 95, 70, 50, 32, 28, 22, 25, 18, 14, 12, 10],
    hotspotHotIdx: 11,
    themes: [
      { label: 'Pacing', count: 5, pct: 72 },
      { label: 'Character', count: 4, pct: 58 },
      { label: 'Prose', count: 3, pct: 42 },
    ],
  },
  prepareLane: {
    stepsLabel: 'Pre-publish · 1 of 5 done',
    stepsProgress: 0.2,
    description: 'When you’re ready, the next steps are cover, pricing, formatting, and proof. Bookending will walk you through each.',
  },
  sustainLane: {
    salesCount: 147,
    unrepliedQa: 3,
    description: '3 reader Q&As are open on ‘The Salt Roads.’ Replies double review conversion.',
  },
}

export const STUB_READING: ReadingSideStub = {
  unreadCount: 3,
  crossRoleMsg: '3 items waiting on your writing side — Tomás flagged Ch. 17, Henrik is ready for his thank-you letter, and 2 readers applied to join.',
  desk: {
    count: '3 items · sorted by activity',
    primary: {
      pill: 'Active conversation · Henrik replied',
      context: '3h ago · Ch. 4 thread',
      headline: 'Henrik replied to your note on Ch. 4 of ‘The Cartographer’s Wife’ — a question about the framing device. The thread is open, and you’re 41% through.',
      reasoning: 'Picking up where you left off keeps the conversation going while it’s still warm. Henrik tends to revise based on reader threads, so your reply is part of the work.',
      primaryCta: 'Open to Chapter 4 →',
      secondaryCta: 'Reply to Henrik first',
    },
    queue: [
      {
        label: 'Next',
        headline: 'Naomi A. shipped Ch. 9 of ‘Hollow Meridian.’',
        supporting: 'You’re following her serial · 2 chapters since your last read.',
        cta: 'Read Ch. 9 →',
      },
      {
        label: 'Then',
        headline: 'Marisol’s letter is half-drafted in Correspondence.',
        supporting: 'Started 5 days ago · 2 of 4 sections done.',
        cta: 'Finish letter →',
      },
    ],
  },
  rail: [
    { dotColor: 'var(--accent)', body: 'Henrik replied to your note on Ch. 4', time: '3H ago' },
    { dotColor: 'var(--good)', body: 'Naomi A. shipped Ch. 9 of ‘Hollow Meridian’', time: '6H ago' },
    { dotColor: 'var(--bk-rule)', body: 'Mira H. shared a passage with you', time: '1D ago' },
    { dotColor: 'var(--accent)', body: 'Reading circle — Saturday session at 4pm', time: '2D ago' },
  ],
  readLane: {
    manuscriptsMeta: '2 manuscripts open · 1 book in progress',
    streakLabel: '9-day reading streak',
    rows: [
      { initials: 'HL', avatarTone: 'accent', title: 'The Cartographer’s Wife', subtitle: 'Henrik Lund · beta read · invited', progress: 'Ch. 6 of 18 · 41%', progressPct: 41, pillLabel: 'Active thread', pillTone: 'accent' },
      { initials: 'NA', avatarTone: 'ink', title: 'Hollow Meridian', subtitle: 'Naomi A. · serial · following', progress: 'Ch. 7 of 12 · 58%', progressPct: 58, pillLabel: '2 new ch.', pillTone: 'good', barMuted: true },
      { initials: 'DM', avatarTone: 'gold', title: 'The Salt Roads', subtitle: 'Delphine M. · purchased · published Apr 30', progress: 'p. 84 of 312 · 27%', progressPct: 27, pillLabel: 'Reading', pillTone: 'neutral', barMuted: true },
    ],
    moreLabel: '+ 1 paused read · view all →',
    hotspotBars: [25, 35, 60, 45, 80, 30, 15, 12, 10, 8, 8, 6, 6, 5, 5, 5, 5, 5],
    hotspotHotIdx: 4,
    hotspotTitle: 'Where you’ve left notes in ‘Cartographer’s Wife’',
    rhythm: [
      { label: 'Avg. session', value: '38 min' },
      { label: 'Pages / week', value: '94' },
      { label: 'Notes left', value: '22 this month' },
      { label: 'Streak', value: '9 days ↑', accent: true },
    ],
  },
  discoverLane: {
    openCount: 4,
    genreCount: 2,
    manuscripts: [
      { title: 'Margins We Keep', author: 'Wendell P.', status: 'accepting applications' },
      { title: 'The Quiet Hours', author: 'Iris S.', status: 'invite-only · profile match' },
      { title: 'North of Memory', author: 'Jonas T.', status: '3 readers in your circle joined' },
    ],
  },
  connectLane: {
    lettersInDraft: 1,
    unreadReplies: 2,
    description: 'Henrik replied to your Ch. 4 note. Marisol’s letter is half-drafted in Correspondence.',
  },
}
