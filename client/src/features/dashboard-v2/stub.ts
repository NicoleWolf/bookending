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

