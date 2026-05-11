import type { DashboardV2, DashboardV2Manuscript } from '@bookending/shared';
import type { DeskPrimaryItem } from './stub';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function timeSince(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days  >= 1) return `${days}D ago`;
  if (hours >= 1) return `${hours}H ago`;
  return `${Math.max(1, mins)}min ago`;
}

// ── Empty-state detection ─────────────────────────────────────────────────────

export function isWriterEmpty(writing: DashboardV2['writing']): boolean {
  return writing.manuscripts.length === 0;
}

export function isReaderEmpty(reading: DashboardV2['reading']): boolean {
  return reading.activeBetaReads.length === 0;
}

// ── Stage resolver ────────────────────────────────────────────────────────────

export type WriterStage = 'write' | 'prepare' | 'sustain';

export function resolveWriterStage(manuscripts: DashboardV2Manuscript[]): WriterStage {
  if (manuscripts.some(m => m.status === 'PUBLISHED'))   return 'sustain';
  if (manuscripts.some(m => m.status === 'IN_REVISION')) return 'prepare';
  return 'write';
}

// ── Writing-side desk priority resolver ──────────────────────────────────────

export function resolveDeskPriority(writing: DashboardV2['writing']): DeskPrimaryItem | null {
  const allReaders = writing.manuscripts.flatMap(m =>
    m.betaReaders.map(r => ({ ...r, manuscriptId: m.id, manuscriptTitle: m.title }))
  );
  if (allReaders.length === 0) return null;

  // Priority 1: annotation hotspot — 3+ annotations on the same chapter
  for (const ms of writing.manuscripts) {
    const hot = [...ms.hotspotChapters]
      .filter(h => h.annotationCount >= 3)
      .sort((a, b) => b.annotationCount - a.annotationCount)[0];
    if (hot) {
      return {
        pill:         `Pacing flag · ${hot.annotationCount} notes`,
        context:      `Ch. ${hot.chapterId} · ${ms.title}`,
        headline:     `${hot.annotationCount} notes cluster around Chapter ${hot.chapterId} in "${ms.title}" — worth a look before your next revision pass.`,
        reasoning:    'When readers converge on a passage, revision usually pays off.',
        primaryCta:   'Open the chapter →',
        secondaryCta: `See all ${hot.annotationCount} notes`,
      };
    }
  }

  // Priority 2: reader finished with no verdict yet
  const finished = allReaders
    .filter(r => r.progress >= 100 && !r.verdict)
    .sort((a, b) =>
      new Date(b.lastSeenAt ?? b.joinedAt).getTime() -
      new Date(a.lastSeenAt ?? a.joinedAt).getTime()
    );
  if (finished.length > 0) {
    const r = finished[0];
    return {
      pill:         `Finished · ${r.name}`,
      context:      `${r.manuscriptTitle} · ${timeSince(r.lastSeenAt ?? r.joinedAt)}`,
      headline:     `${r.name} finished reading "${r.manuscriptTitle}" — they're ready for a thank-you letter.`,
      reasoning:    `${r.notesCount} notes left. A letter keeps the relationship going and helps future beta reads.`,
      primaryCta:   'Draft letter →',
      secondaryCta: 'View their notes',
    };
  }

  // Priority 3: most recently active reader still in progress
  const active = allReaders
    .filter(r => r.progress > 0 && r.progress < 100 && r.lastSeenAt)
    .sort((a, b) =>
      new Date(b.lastSeenAt!).getTime() - new Date(a.lastSeenAt!).getTime()
    );
  if (active.length > 0) {
    const r = active[0];
    const pct = Math.round(r.progress);
    return {
      pill:         `Active · ${r.name}`,
      context:      `${r.manuscriptTitle} · ${pct}% · ${timeSince(r.lastSeenAt!)}`,
      headline:     `${r.name} is at ${pct}% through "${r.manuscriptTitle}" — ${r.notesCount} notes so far.`,
      reasoning:    'Most recently active reader.',
      primaryCta:   'View their notes →',
      secondaryCta: 'Open reading room',
    };
  }

  // Fallback: first reader just joined
  const r = allReaders[0];
  return {
    pill:         `Reader joined · ${r.name}`,
    context:      `${r.manuscriptTitle} · waiting to start`,
    headline:     `${r.name} joined your beta read for "${r.manuscriptTitle}". They'll start reading soon.`,
    reasoning:    'Beta reading has begun.',
    primaryCta:   'View reading room →',
    secondaryCta: 'Message them',
  };
}

// ── Reading-side desk priority resolver ──────────────────────────────────────

export function resolveReaderDeskPriority(reading: DashboardV2['reading']): DeskPrimaryItem | null {
  const reads = reading.activeBetaReads;
  if (reads.length === 0) return null;

  const sorted = [...reads].sort((a, b) =>
    new Date(b.lastSeenAt ?? b.joinedAt).getTime() -
    new Date(a.lastSeenAt ?? a.joinedAt).getTime()
  );
  const r   = sorted[0];
  const pct = Math.round(r.progress);

  return {
    pill:         `Reading now · ${r.authorName}`,
    context:      `${timeSince(r.lastSeenAt ?? r.joinedAt)} · ${pct}% through`,
    headline:     `You're ${pct}% through "${r.manuscriptTitle}" by ${r.authorName} — ${r.notesCount} notes left so far.`,
    reasoning:    "Picking up where you left off keeps the conversation going while it's still warm.",
    primaryCta:   'Continue reading →',
    secondaryCta: 'View your notes',
  };
}
