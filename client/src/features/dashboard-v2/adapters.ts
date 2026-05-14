import type { DashboardV2 } from '@bookending/shared';
import {
  resolveDeskPriority, resolveReaderDeskPriority,
  resolveWriterStage, timeSince,
} from './resolvers';
import type {
  WritingSideStub, ReadingSideStub, RailItem, ReaderRow, ManuscriptRow,
  WriteLaneData, PrepareLaneData, SustainLaneData,
  ReadLaneData, DiscoverLaneData, ConnectLaneData, QueueRow, AvatarTone,
} from './stub';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_TONES: AvatarTone[] = ['accent', 'ink', 'gold', 'muted', 'paper'];

function avatarToneFor(idx: number): AvatarTone {
  return AVATAR_TONES[idx % AVATAR_TONES.length];
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

function buildHotspotBars(
  hotspotChapters: { chapterId: number; annotationCount: number }[],
  chapterCount: number,
): number[] {
  const maxChapter = hotspotChapters.reduce((m, h) => Math.max(m, h.chapterId), 0);
  const n = Math.max(chapterCount || 10, maxChapter + 1, 10);
  const bars = new Array<number>(n).fill(0);
  for (const h of hotspotChapters) {
    const idx = Math.max(0, h.chapterId - 1);
    if (idx < n) bars[idx] = h.annotationCount;
  }
  return bars;
}

// ── Rail builders ─────────────────────────────────────────────────────────────

function buildWritingRail(writing: DashboardV2['writing']): RailItem[] {
  const readers = writing.manuscripts.flatMap(m => m.betaReaders);
  const active = readers
    .filter(r => r.lastSeenAt)
    .sort((a, b) => new Date(b.lastSeenAt!).getTime() - new Date(a.lastSeenAt!).getTime())
    .slice(0, 3);

  const items: RailItem[] = active.map(r => ({
    dotColor: r.notesCount > 0 ? 'var(--accent)' : 'var(--bk-rule)',
    body: r.progress >= 100
      ? `${r.name} finished their read`
      : `${r.name} is at ${Math.round(r.progress)}%`,
    time: timeSince(r.lastSeenAt!),
  }));

  if (writing.subscriberCount > 0) {
    items.push({
      dotColor: 'var(--good)',
      body: `${writing.subscriberCount} subscriber${writing.subscriberCount !== 1 ? 's' : ''} on your list`,
      time: 'now',
    });
  }

  return items.slice(0, 4);
}

function buildReadingRail(reading: DashboardV2['reading']): RailItem[] {
  type Timed = RailItem & { _t: number };

  const readItems: Timed[] = reading.activeBetaReads.map(r => {
    const totalNotes = r.myAnnotations.reduce((s, a) => s + a.count, 0);
    return {
      _t: new Date(r.lastSeenAt ?? r.joinedAt).getTime(),
      dotColor: totalNotes > 0 ? 'var(--accent)' : 'var(--bk-rule)',
      body: `${r.manuscriptTitle} · ${Math.round(r.progress)}% · ${totalNotes} notes`,
      time: timeSince(r.lastSeenAt ?? r.joinedAt),
    };
  });

  const noteItems: Timed[] = reading.activeBetaReads.flatMap(r =>
    r.recentAuthorNotes.map(n => ({
      _t: new Date(n.updatedAt).getTime(),
      dotColor: 'var(--accent)',
      body: `${r.authorName} added a note to Ch. ${n.chapterNum} of "${r.manuscriptTitle}"`,
      time: timeSince(n.updatedAt),
    }))
  );

  const merged = [...readItems, ...noteItems]
    .sort((a, b) => b._t - a._t)
    .slice(0, 4)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _t, ...item }) => item);

  return merged;
}

// ── Queue builders ────────────────────────────────────────────────────────────

function buildWritingQueue(writing: DashboardV2['writing']): QueueRow[] {
  const allReaders = writing.manuscripts.flatMap(m => m.betaReaders);
  const queue: QueueRow[] = [];

  const finished = allReaders.filter(r => r.progress >= 100 && !r.verdict);
  if (finished.length > 0) {
    const r = finished[0];
    queue.push({
      label: 'Next',
      headline: `${r.name} finished their read — ready for a thank-you letter.`,
      supporting: `${r.notesCount} notes left. Finished ${timeSince(r.lastSeenAt ?? r.joinedAt)}.`,
      cta: 'Draft letter →',
    });
  }

  const active = allReaders.filter(r => r.progress > 0 && r.progress < 100);
  if (active.length > 0) {
    queue.push({
      label: queue.length === 0 ? 'Next' : 'Then',
      headline: `${active.length} reader${active.length !== 1 ? 's' : ''} currently in your manuscript.`,
      supporting: `Most active: ${active[0].name} at ${Math.round(active[0].progress)}%.`,
      cta: 'View reading room →',
    });
  }

  return queue.slice(0, 2);
}

function buildReadingQueue(reading: DashboardV2['reading']): QueueRow[] {
  const reads = reading.activeBetaReads;
  if (reads.length === 0) return [];

  return reads.slice(0, 2).map((r, i) => ({
    label: i === 0 ? 'Next' : 'Then',
    headline: `Continue "${r.manuscriptTitle}" by ${r.authorName}.`,
    supporting: `${Math.round(r.progress)}% through · ${r.myAnnotations.reduce((s, a) => s + a.count, 0)} notes left.`,
    cta: 'Continue reading →',
  }));
}

// ── Lane adapters ─────────────────────────────────────────────────────────────

function adaptWriteLane(writing: DashboardV2['writing']): WriteLaneData {
  const ms = writing.manuscripts.find(m => m.status !== 'PUBLISHED') ?? writing.manuscripts[0];
  if (!ms) return { manuscriptTitle: '', manuscriptMeta: '', readers: [], moreCount: 0, hotspotBars: [], hotspotHotIdx: 0, themes: [] };

  const totalNotes = ms.betaReaders.reduce((s, r) => s + r.notesCount, 0);

  const readers: ReaderRow[] = ms.betaReaders.slice(0, 5).map((r, i) => {
    const chapterTotal = ms.chapterCount || 1;
    const approxChapter = Math.round((r.progress / 100) * chapterTotal);
    let pillLabel = `${Math.round(r.progress)}%`;
    let pillTone: ReaderRow['pillTone'] = 'neutral';
    if (r.progress >= 100) {
      pillLabel = r.verdict ? r.verdict.slice(0, 12) : 'Finished';
      pillTone  = 'good';
    } else if (r.notesCount > 10) {
      pillLabel = 'Active notes';
      pillTone  = 'accent';
    }
    return {
      initials:    initialsFor(r.name),
      avatarTone:  avatarToneFor(i),
      name:        r.name,
      meta:        r.verdict ? `verdict: ${r.verdict}` : `joined ${timeSince(r.joinedAt)}`,
      progress:    r.progress >= 100 ? 'Done · 100%' : `Ch. ${approxChapter} · ${Math.round(r.progress)}%`,
      progressPct: r.progress,
      pillLabel,
      pillTone,
      noteCount:   r.notesCount,
      barMuted:    r.progress >= 100,
    };
  });

  const hotspotBars = buildHotspotBars(ms.hotspotChapters, ms.chapterCount);
  const hotspotHotIdx = hotspotBars.length > 0 ? hotspotBars.indexOf(Math.max(...hotspotBars)) : 0;

  return {
    manuscriptTitle: ms.title,
    manuscriptMeta:  `${totalNotes} notes · ${ms.betaReaders.length} reader${ms.betaReaders.length !== 1 ? 's' : ''}`,
    readers,
    moreCount:       Math.max(0, ms.betaReaders.length - 5),
    hotspotBars,
    hotspotHotIdx,
    themes:          [],
  };
}

function adaptPrepareLane(writing: DashboardV2['writing']): PrepareLaneData {
  const stage = resolveWriterStage(writing.manuscripts);
  if (stage === 'sustain') {
    return {
      stepsLabel:    'Published',
      stepsProgress: 1,
      description:   'Your manuscript is published. Keep the conversation going with readers.',
    };
  }
  if (stage === 'prepare') {
    return {
      stepsLabel:    'Pre-publish · in progress',
      stepsProgress: 0.4,
      description:   "You're in revision. When you're ready, the next steps are cover, pricing, formatting, and proof.",
    };
  }
  return {
    stepsLabel:    'Draft in progress',
    stepsProgress: 0,
    description:   "When you're ready, the next steps are cover, pricing, formatting, and proof.",
  };
}

function adaptSustainLane(writing: DashboardV2['writing']): SustainLaneData {
  return {
    salesCount:   writing.orderCount,
    unrepliedQa:  writing.unrepliedQaCount,
    description:  writing.unrepliedQaCount > 0
      ? `${writing.unrepliedQaCount} reader Q&A${writing.unrepliedQaCount !== 1 ? 's' : ''} waiting for a reply.`
      : `${writing.subscriberCount} subscriber${writing.subscriberCount !== 1 ? 's' : ''} on your list.`,
  };
}

function adaptReadLane(reading: DashboardV2['reading']): ReadLaneData {
  const reads = reading.activeBetaReads;
  if (reads.length === 0) return { manuscriptsMeta: 'No manuscripts open', streakLabel: '', rows: [], moreLabel: '', hotspotBars: [], hotspotHotIdx: 0, hotspotTitle: '', rhythm: [] };

  const rows: ManuscriptRow[] = reads.slice(0, 5).map((r, i) => {
    const pct           = Math.round(r.progress);
    const approxChapter = Math.round((r.progress / 100) * (r.chapterCount || 1));
    const totalNotes    = r.myAnnotations.reduce((s, a) => s + a.count, 0);
    let pillLabel: string = `${pct}%`;
    let pillTone: ManuscriptRow['pillTone'] = 'neutral';
    if (totalNotes > 5) { pillLabel = 'Active notes'; pillTone = 'accent'; }
    return {
      initials:    initialsFor(r.authorName),
      avatarTone:  avatarToneFor(i),
      title:       r.manuscriptTitle,
      subtitle:    `${r.authorName} · beta read`,
      progress:    `Ch. ${approxChapter} of ${r.chapterCount || '?'} · ${pct}%`,
      progressPct: pct,
      pillLabel,
      pillTone,
    };
  });

  const primary = reads[0];
  const hotspotBars = buildHotspotBars(
    primary.myAnnotations.map(a => ({ chapterId: a.chapterId, annotationCount: a.count })),
    primary.chapterCount,
  );
  const hotspotHotIdx = hotspotBars.length > 0 ? hotspotBars.indexOf(Math.max(...hotspotBars)) : 0;
  const totalMyNotes      = reads.reduce((s, r) => s + r.myAnnotations.reduce((ss, a) => ss + a.count, 0), 0);
  const totalAuthorNotes  = reads.reduce((s, r) => s + r.recentAuthorNotes.length, 0);

  return {
    manuscriptsMeta: `${reads.length} manuscript${reads.length !== 1 ? 's' : ''} open`,
    streakLabel:     '',
    rows,
    moreLabel:       reads.length > 5 ? `+ ${reads.length - 5} more` : '',
    hotspotBars,
    hotspotHotIdx,
    hotspotTitle:    `Where you've left notes in "${primary.manuscriptTitle}"`,
    rhythm: [
      ...(totalAuthorNotes > 0
        ? [{ label: 'Author notes', value: `${totalAuthorNotes} active`, accent: true }]
        : []),
      { label: 'Notes left',   value: `${totalMyNotes} total` },
      { label: 'Manuscripts',  value: `${reads.length}`       },
    ],
  };
}

function adaptDiscoverLane(): DiscoverLaneData {
  return { openCount: 0, genreCount: 0, manuscripts: [] };
}

function adaptConnectLane(): ConnectLaneData {
  return {
    lettersInDraft: 0,
    unreadReplies:  0,
    description:    'Write to the authors you read. Letters are direct, and authors hear from the readers who shaped their book.',
  };
}

// ── Main adapters ─────────────────────────────────────────────────────────────

export function adaptWritingData(writing: DashboardV2['writing']): WritingSideStub {
  const allReaders   = writing.manuscripts.flatMap(m => m.betaReaders);
  const readerCount  = allReaders.length;

  // Writing-side unread = readers who finished or were recently active (nudge toward writing tab)
  const needsAttention = allReaders.filter(r =>
    (r.progress >= 100 && !r.verdict) ||
    (r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() < 48 * 60 * 60 * 1000)
  ).length;

  const crossRoleMsg = needsAttention > 0
    ? `${needsAttention} item${needsAttention !== 1 ? 's' : ''} need your attention on your writing side.`
    : '';

  return {
    unreadCount:  needsAttention,
    crossRoleMsg,
    desk: {
      count:   readerCount > 0
        ? `${readerCount} reader${readerCount !== 1 ? 's' : ''} · sorted by activity`
        : 'No active readers',
      primary: resolveDeskPriority(writing) ?? { pill: '', context: '', headline: 'No active readers yet.', reasoning: '', primaryCta: '', secondaryCta: '' },
      queue:   buildWritingQueue(writing),
    },
    rail:        buildWritingRail(writing),
    writeLane:   adaptWriteLane(writing),
    prepareLane: adaptPrepareLane(writing),
    sustainLane: adaptSustainLane(writing),
  };
}

export function adaptReadingData(reading: DashboardV2['reading']): ReadingSideStub {
  const total = reading.activeBetaReads.length;

  const crossRoleMsg = total > 0
    ? `${total} manuscript${total !== 1 ? 's' : ''} open on your reading side.`
    : '';

  return {
    unreadCount:  total,
    crossRoleMsg,
    desk: {
      count:   total > 0 ? `${total} manuscript${total !== 1 ? 's' : ''} open` : 'Nothing open',
      primary: resolveReaderDeskPriority(reading) ?? { pill: '', context: '', headline: 'No manuscripts open yet.', reasoning: '', primaryCta: '', secondaryCta: '' },
      queue:   buildReadingQueue(reading),
    },
    rail:         buildReadingRail(reading),
    readLane:     adaptReadLane(reading),
    discoverLane: adaptDiscoverLane(),
    connectLane:  adaptConnectLane(),
  };
}
