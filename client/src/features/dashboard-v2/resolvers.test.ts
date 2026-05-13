import { describe, it, expect } from 'vitest';
import type { DashboardV2, DashboardV2Manuscript } from '@bookending/shared';
import {
  isWriterEmpty, isReaderEmpty,
  resolveWriterStage,
  resolveDeskPriority,
  resolveReaderDeskPriority,
  timeSince,
} from './resolvers';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeWriting(overrides?: Partial<DashboardV2['writing']>): DashboardV2['writing'] {
  return {
    manuscripts:      [],
    subscriberCount:  0,
    orderCount:       0,
    unrepliedQaCount: 0,
    ...overrides,
  };
}

function makeReading(overrides?: Partial<DashboardV2['reading']>): DashboardV2['reading'] {
  return { activeBetaReads: [], ...overrides };
}

function makeManuscript(overrides?: Partial<DashboardV2Manuscript>): DashboardV2Manuscript {
  return {
    id:               'ms-1',
    title:            'Test Novel',
    subtitle:         null,
    status:           'DRAFTING',
    wordCount:        42000,
    updatedAt:        new Date().toISOString(),
    betaReaders:      [],
    chapterCount:     18,
    hotspotChapters:  [],
    ...overrides,
  };
}

function makeReader(overrides?: {
  id?: string; name?: string; progress?: number; verdict?: string | null;
  notesCount?: number; joinedAt?: string; lastSeenAt?: string | null;
}) {
  return {
    id:         overrides?.id ?? 'r-1',
    name:       overrides?.name ?? 'Test Reader',
    progress:   overrides?.progress ?? 50,
    verdict:    overrides?.verdict ?? null,
    notesCount: overrides?.notesCount ?? 5,
    joinedAt:   overrides?.joinedAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeenAt: overrides?.lastSeenAt ?? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  };
}

function makeActiveRead(overrides?: Partial<DashboardV2['reading']['activeBetaReads'][number]>) {
  return {
    betaReaderId:    'br-1',
    manuscriptId:    'ms-2',
    manuscriptTitle: 'Borrowed Light',
    authorName:      'Ellis Park',
    authorId:        'author-1',
    progress:        45,
    notesCount:      8,
    joinedAt:        new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeenAt:      new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    chapterCount:      20,
    myAnnotations:     [],
    recentAuthorNotes: [],
    ...overrides,
  };
}

// ── isWriterEmpty ─────────────────────────────────────────────────────────────

describe('isWriterEmpty', () => {
  it('returns true when no manuscripts', () => {
    expect(isWriterEmpty(makeWriting())).toBe(true);
  });

  it('returns false when manuscripts exist', () => {
    expect(isWriterEmpty(makeWriting({ manuscripts: [makeManuscript()] }))).toBe(false);
  });
});

// ── isReaderEmpty ─────────────────────────────────────────────────────────────

describe('isReaderEmpty', () => {
  it('returns true when no active beta reads', () => {
    expect(isReaderEmpty(makeReading())).toBe(true);
  });

  it('returns false when active beta reads exist', () => {
    expect(isReaderEmpty(makeReading({ activeBetaReads: [makeActiveRead()] }))).toBe(false);
  });
});

// ── resolveWriterStage ────────────────────────────────────────────────────────

describe('resolveWriterStage', () => {
  it('returns "write" when all manuscripts are DRAFTING', () => {
    const mss: DashboardV2Manuscript[] = [makeManuscript({ status: 'DRAFTING' })];
    expect(resolveWriterStage(mss)).toBe('write');
  });

  it('returns "write" when manuscript list is empty', () => {
    expect(resolveWriterStage([])).toBe('write');
  });

  it('returns "prepare" when at least one manuscript is IN_REVISION', () => {
    const mss: DashboardV2Manuscript[] = [
      makeManuscript({ status: 'DRAFTING' }),
      makeManuscript({ id: 'ms-2', status: 'IN_REVISION' }),
    ];
    expect(resolveWriterStage(mss)).toBe('prepare');
  });

  it('returns "sustain" when any manuscript is PUBLISHED', () => {
    const mss: DashboardV2Manuscript[] = [
      makeManuscript({ status: 'IN_REVISION' }),
      makeManuscript({ id: 'ms-2', status: 'PUBLISHED' }),
    ];
    expect(resolveWriterStage(mss)).toBe('sustain');
  });

  it('sustain takes precedence over prepare', () => {
    const mss: DashboardV2Manuscript[] = [
      makeManuscript({ status: 'PUBLISHED' }),
      makeManuscript({ id: 'ms-2', status: 'IN_REVISION' }),
    ];
    expect(resolveWriterStage(mss)).toBe('sustain');
  });
});

// ── resolveDeskPriority ───────────────────────────────────────────────────────

describe('resolveDeskPriority', () => {
  it('returns null when no manuscripts or readers', () => {
    expect(resolveDeskPriority(makeWriting())).toBeNull();
  });

  it('returns null when manuscripts have no beta readers', () => {
    const writing = makeWriting({ manuscripts: [makeManuscript()] });
    expect(resolveDeskPriority(writing)).toBeNull();
  });

  it('Priority 1: hotspot when 3+ annotations on same chapter', () => {
    const ms = makeManuscript({
      hotspotChapters: [{ chapterId: 7, annotationCount: 5 }],
      betaReaders: [makeReader()],
    });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    expect(result).not.toBeNull();
    expect(result!.pill).toContain('Pacing flag');
    expect(result!.pill).toContain('5 notes');
    expect(result!.context).toContain('Ch. 7');
  });

  it('Priority 1: hotspot not triggered below 3 annotations', () => {
    const ms = makeManuscript({
      hotspotChapters: [{ chapterId: 7, annotationCount: 2 }],
      betaReaders: [makeReader({ progress: 50 })],
    });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    // Falls through to a lower priority — should not be a pacing flag
    expect(result?.pill).not.toContain('Pacing flag');
  });

  it('Priority 2: finished reader with no verdict', () => {
    const reader = makeReader({ progress: 100, verdict: null });
    const ms = makeManuscript({ betaReaders: [reader] });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    expect(result).not.toBeNull();
    expect(result!.pill).toContain('Finished');
    expect(result!.primaryCta).toBe('Draft letter →');
  });

  it('Priority 2 skipped when reader has a verdict', () => {
    const reader = makeReader({ progress: 100, verdict: '4 stars', lastSeenAt: new Date().toISOString() });
    const ms = makeManuscript({ betaReaders: [reader] });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    // Should not be the "draft letter" item
    expect(result?.primaryCta).not.toBe('Draft letter →');
  });

  it('Priority 3: active reader shown when no hotspot or finished reader', () => {
    const reader = makeReader({ progress: 60, verdict: null });
    const ms = makeManuscript({ betaReaders: [reader] });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    expect(result).not.toBeNull();
    expect(result!.pill).toContain('Active');
  });

  it('Priority 1 outranks Priority 2 (hotspot beats finished reader)', () => {
    const reader = makeReader({ progress: 100, verdict: null });
    const ms = makeManuscript({
      betaReaders: [reader],
      hotspotChapters: [{ chapterId: 3, annotationCount: 4 }],
    });
    const result = resolveDeskPriority(makeWriting({ manuscripts: [ms] }));
    expect(result!.pill).toContain('Pacing flag');
  });
});

// ── resolveReaderDeskPriority ─────────────────────────────────────────────────

describe('resolveReaderDeskPriority', () => {
  it('returns null when no active reads', () => {
    expect(resolveReaderDeskPriority(makeReading())).toBeNull();
  });

  it('returns a desk item for the most recently active read', () => {
    const read = makeActiveRead({ progress: 45, manuscriptTitle: 'Borrowed Light' });
    const result = resolveReaderDeskPriority(makeReading({ activeBetaReads: [read] }));
    expect(result).not.toBeNull();
    expect(result!.primaryCta).toBe('Continue reading →');
    expect(result!.headline).toContain('Borrowed Light');
  });

  it('shows the most recently active read when multiple exist', () => {
    const older = makeActiveRead({
      betaReaderId: 'br-1',
      manuscriptTitle: 'Old Book',
      lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const newer = makeActiveRead({
      betaReaderId: 'br-2',
      manuscriptTitle: 'New Book',
      lastSeenAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    });
    const result = resolveReaderDeskPriority(makeReading({ activeBetaReads: [older, newer] }));
    expect(result!.headline).toContain('New Book');
  });
});

// ── timeSince ─────────────────────────────────────────────────────────────────

describe('timeSince', () => {
  it('returns minutes for recent timestamps', () => {
    const iso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    expect(timeSince(iso)).toBe('15min ago');
  });

  it('returns at least 1min for very recent timestamps', () => {
    const iso = new Date(Date.now() - 10 * 1000).toISOString();
    expect(timeSince(iso)).toBe('1min ago');
  });

  it('returns hours for 2+ hour old timestamps', () => {
    const iso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeSince(iso)).toBe('3H ago');
  });

  it('returns days for 2+ day old timestamps', () => {
    const iso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeSince(iso)).toBe('2D ago');
  });
});
