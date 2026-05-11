import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import {
  PatchProgressSchema,
  CreateAnnotationSchema,
  PatchAnnotationSchema,
  AddToShelfSchema,
  FinishReadingSchema,
  DismissRecommendationSchema,
  CreateReplySchema,
  UpsertImpressionSchema,
} from '@bookending/shared';
import type {
  HubWarmItem,
  HubShelfItem,
  HubFinishedItem,
  HubRailItem,
  HubRecommendation,
  HubResponse,
} from '@bookending/shared';

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS    =  7 * 24 * 60 * 60 * 1000;
const TWENTY_EIGHT_DAYS_MS = 28 * 24 * 60 * 60 * 1000;

function isDormant(lastOpenedAt: Date | null, lastActivityAt: Date | null): boolean {
  if (!lastOpenedAt) return false;
  const now = Date.now();
  const openedAgo = now - lastOpenedAt.getTime();
  if (openedAgo <= FOURTEEN_DAYS_MS) return false;
  if (!lastActivityAt) return true;
  return lastActivityAt.getTime() <= lastOpenedAt.getTime();
}

async function getManuscriptInfo(msRef: string) {
  const ms = await prisma.manuscript.findUnique({
    where: { id: msRef },
    include: {
      author:   { select: { name: true } },
      chapters: { select: { id: true, number: true } },
    },
  }).catch(() => null);
  return ms;
}

// ── GET /api/reading/hub ──────────────────────────────────────────────────────

router.get('/hub', async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const [progressRows, shelfRows] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.shelfEntry.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    }),
  ]);

  const warmProgress  = progressRows.filter(p => !p.finishedAt);
  const finishedProgress = progressRows.filter(p => !!p.finishedAt);

  // Build warm items
  const warm: HubWarmItem[] = await Promise.all(
    warmProgress.slice(0, 10).map(async p => {
      const msInfo = await getManuscriptInfo(p.manuscriptRef);
      const doneChapters = (JSON.parse(p.doneChapters ?? '[]') as number[]);

      // releasedAt column added via migration — for now default to 0
      const newChapterCount = 0;

      // Check for unread author notes on read chapters (simplified: count active notes on any chapter)
      let newNoteCount = 0;
      let newAuthorNote: HubWarmItem['newAuthorNote'] = null;
      if (msInfo && doneChapters.length > 0) {
        const msChapters = await prisma.chapter.findMany({
          where: { manuscriptId: p.manuscriptRef },
          include: { notes: { where: { status: 'ACTIVE' }, take: 1 } },
        }).catch(() => []);

        for (const ch of msChapters) {
          if (doneChapters.includes(ch.number) && ch.notes.length > 0) {
            newNoteCount++;
            if (!newAuthorNote) {
              const ms = await prisma.manuscript.findUnique({
                where: { id: p.manuscriptRef },
                select: { author: { select: { name: true } } },
              }).catch(() => null);
              const firstName = ms?.author.name.split(' ')[0] ?? 'the author';
              newAuthorNote = {
                chapterNum:       ch.number,
                authorFirstName:  firstName,
                body:             ch.notes[0].body,
              };
            }
          }
        }
      }

      const dormant = isDormant(p.lastOpenedAt, p.lastActivityAt);

      return {
        manuscriptRef:   p.manuscriptRef,
        title:           msInfo?.title ?? null,
        authorName:      msInfo?.author?.name ?? null,
        draftLabel:      null,
        genre:           msInfo?.genre ?? null,
        totalChapters:   msInfo?.chapters?.length ?? 0,
        doneChapters,
        mood:            p.mood,
        lastOpenedAt:    p.lastOpenedAt?.toISOString() ?? null,
        lastActivityAt:  p.lastActivityAt?.toISOString() ?? null,
        isDormant:       dormant,
        newChapterCount,
        newNoteCount,
        newAuthorNote,
      };
    })
  );

  // Build shelf items
  const shelf: HubShelfItem[] = await Promise.all(
    shelfRows.slice(0, 10).map(async s => {
      const msInfo = await getManuscriptInfo(s.manuscriptRef);
      return {
        manuscriptRef:           s.manuscriptRef,
        title:                   msInfo?.title ?? null,
        authorName:              msInfo?.author?.name ?? null,
        genre:                   msInfo?.genre ?? null,
        totalChapters:           msInfo?.chapters?.length ?? 0,
        draftLabel:              null,
        source:                  s.source,
        recommendationDimension: s.recommendationDimension,
        circleCount:             null,
      };
    })
  );

  // Build finished items (show most recent first)
  const finished: HubFinishedItem[] = await Promise.all(
    finishedProgress.slice(0, 5).map(async p => {
      const msInfo = await getManuscriptInfo(p.manuscriptRef);
      return {
        manuscriptRef: p.manuscriptRef,
        title:         msInfo?.title ?? null,
        authorName:    msInfo?.author?.name ?? null,
        finishedAt:    p.finishedAt!.toISOString(),
        verdict:       p.verdict,
        impression:    p.message,
        totalChapters: msInfo?.chapters?.length ?? 0,
      };
    })
  );

  // Season = current year's Q-based quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)
  const seasonStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const finishedThisSeason = finishedProgress.filter(p => p.finishedAt! >= seasonStart).length;

  // Determine reader profile
  let readerProfile: HubResponse['readerProfile'] = 'new';
  if (progressRows.length > 0 || shelfRows.length > 0) {
    const allCaughtUp = warm.length > 0 && warm.every(w =>
      w.newChapterCount === 0 && w.newNoteCount === 0 && !w.isDormant
    ) && warm.every(w => w.doneChapters.length === w.totalChapters);
    readerProfile = allCaughtUp ? 'all_caught_up' : 'returning';
  }

  // House Suggests — priority ranked
  let houseSuggests: HubRecommendation | null = null;

  // Tier 1: warm ms with unread author note on a read chapter
  const t1 = warm.find(w => w.newAuthorNote !== null);
  if (t1 && t1.newAuthorNote) {
    const chNum = t1.newAuthorNote.chapterNum;
    const firstName = t1.newAuthorNote.authorFirstName;
    const title = t1.title ?? 'your manuscript';
    houseSuggests = {
      tier: 1,
      manuscriptRef: t1.manuscriptRef,
      label: `${firstName} left a note on chapter ${chNum} of <em>${title}</em> — and you've already read it.`,
      action: 'Continue reading',
      actionVerb: 'continue',
    };
  }

  // Tier 2: warm ms with new chapter since last open
  if (!houseSuggests) {
    const t2 = warm.find(w => w.newChapterCount > 0);
    if (t2) {
      const title = t2.title ?? 'a manuscript';
      const newCount = t2.newChapterCount;
      houseSuggests = {
        tier: 2,
        manuscriptRef: t2.manuscriptRef,
        label: `${newCount === 1 ? 'A new chapter' : `${newCount} new chapters`} ${newCount === 1 ? 'has' : 'have'} been added to <em>${title}</em> since you last read.`,
        action: 'Continue reading',
        actionVerb: 'continue',
      };
    }
  }

  // Tier 3: warm ms not opened in 7–28 days
  if (!houseSuggests) {
    const t3 = warm.find(w => {
      if (!w.lastOpenedAt) return false;
      const ago = now.getTime() - new Date(w.lastOpenedAt).getTime();
      return ago >= SEVEN_DAYS_MS && ago <= TWENTY_EIGHT_DAYS_MS;
    });
    if (t3) {
      const daysAgo = Math.floor((now.getTime() - new Date(t3.lastOpenedAt!).getTime()) / (1000 * 60 * 60 * 24));
      const title = t3.title ?? 'a manuscript';
      houseSuggests = {
        tier: 3,
        manuscriptRef: t3.manuscriptRef,
        label: `You left <em>${title}</em> ${daysAgo} days ago. It's still waiting.`,
        action: 'Pick it back up',
        actionVerb: 'continue',
      };
    }
  }

  // Tier 4: shelf ms
  if (!houseSuggests && shelf.length > 0) {
    const s = shelf[0];
    const title = s.title ?? 'a manuscript on your shelf';
    houseSuggests = {
      tier: 4,
      manuscriptRef: s.manuscriptRef,
      label: `<em>${title}</em> has been on your shelf. The house thinks it's time.`,
      action: 'Begin reading',
      actionVerb: 'begin',
    };
  }

  // Tier 5: editorial pick (static for now)
  if (!houseSuggests && (warm.length > 0 || shelf.length > 0)) {
    houseSuggests = {
      tier: 5,
      manuscriptRef: null,
      label: 'A new wave of manuscripts from independent writers opened for early readers this week.',
      action: 'Browse Discover',
      actionVerb: 'browse',
    };
  }

  // Static editorial rail items
  const houseRail: HubRailItem[] = [
    { category: 'editorial_pick', body: 'A new manuscript in literary fiction opened for early readers this week.' },
    { category: 'nudge',          body: 'Readers who annotate three or more times finish at twice the rate. Something to consider.' },
    { category: 'from_circle',    body: 'Activity is up among writers in your circle this month.' },
  ];

  const response: HubResponse = {
    warm:              warm.slice(0, 5),
    shelf:             shelf.slice(0, 6),
    finished:          finished.slice(0, 1),
    finishedAllTime:   finishedProgress.length,
    finishedThisSeason,
    houseSuggests,
    followingAuthors:  [],
    houseRail,
    readerProfile,
  };

  res.json({ data: response });
});

// ── GET /api/reading/:msRef — progress + annotations + cohort ────────────────

router.get('/:msRef', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;

  const [progress, annotations, cohortCount] = await Promise.all([
    prisma.readingProgress.findUnique({ where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } } }),
    prisma.annotation.findMany({
      where: { userId, manuscriptRef: msRef },
      orderBy: { createdAt: 'asc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.betaReader.count({ where: { manuscriptId: msRef } }),
  ]);

  const annotationsWithReplies = annotations.map(a => ({
    ...a,
    replies: a.replies.map(r => ({
      id:         r.id,
      authorRole: r.authorRole,
      body:       r.body,
      readAt:     r.readAt?.toISOString() ?? null,
      createdAt:  r.createdAt.toISOString(),
    })),
  }));

  res.json({ data: { progress, annotations: annotationsWithReplies, cohortCount } });
});

// ── PUT /api/reading/:msRef/progress ─────────────────────────────────────────

router.put('/:msRef/progress', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(PatchProgressSchema, req.body, res);
  if (!body) return;

  const data: Record<string, unknown> = { lastOpenedAt: new Date() };
  if (body.doneChapters !== undefined) data.doneChapters = JSON.stringify(body.doneChapters);
  if (body.mood         !== undefined) data.mood         = body.mood;
  if (body.stars        !== undefined) data.stars        = body.stars;
  if (body.message      !== undefined) data.message      = body.message;
  if (body.submittedAt  !== undefined) data.submittedAt  = body.submittedAt ? new Date(body.submittedAt) : null;

  const progress = await prisma.readingProgress.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    update: data,
    create: { userId, manuscriptRef: msRef, ...data },
  });

  res.json({ data: progress });
});

// ── PATCH /api/reading/:msRef/finish ─────────────────────────────────────────

router.patch('/:msRef/finish', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(FinishReadingSchema, req.body, res);
  if (!body) return;

  const progress = await prisma.readingProgress.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    update: { finishedAt: new Date(), verdict: body.verdict },
    create: { userId, manuscriptRef: msRef, finishedAt: new Date(), verdict: body.verdict },
  });

  res.json({ data: progress });
});

// ── POST /api/reading/shelf ───────────────────────────────────────────────────

router.post('/shelf', async (req, res) => {
  const userId = req.user!.id;
  const body = parseBody(AddToShelfSchema, req.body, res);
  if (!body) return;

  const entry = await prisma.shelfEntry.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: body.manuscriptRef } },
    update: { source: body.source, recommendationDimension: body.recommendationDimension ?? null },
    create: {
      userId,
      manuscriptRef:           body.manuscriptRef,
      source:                  body.source,
      recommendationDimension: body.recommendationDimension ?? null,
    },
  });

  res.status(201).json({ data: entry });
});

// ── DELETE /api/reading/shelf/:msRef ─────────────────────────────────────────

router.delete('/shelf/:msRef', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;

  const existing = await prisma.shelfEntry.findUnique({
    where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Shelf entry not found' });
    return;
  }

  await prisma.shelfEntry.delete({
    where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
  });

  res.json({ data: { manuscriptRef: msRef } });
});

// ── POST /api/reading/recommendation/dismiss ──────────────────────────────────

router.post('/recommendation/dismiss', async (req, res) => {
  const body = parseBody(DismissRecommendationSchema, req.body, res);
  if (!body) return;
  // Dismissed tier is tracked client-side (sessionStorage) for now.
  // Server acknowledges and the client calls GET /hub again, passing dismissed tiers as query params.
  res.json({ data: { dismissed: body.tier } });
});

// ── POST /api/reading/:msRef/annotations ─────────────────────────────────────

router.post('/:msRef/annotations', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(CreateAnnotationSchema, req.body, res);
  if (!body) return;

  const annotation = await prisma.annotation.create({
    data: {
      userId, manuscriptRef: msRef,
      chapterId: body.chapterId, paraId: body.paraId,
      selectedText: body.selectedText,
      note: body.note ?? '',
      status: 'draft',
    },
    include: { replies: true },
  });

  // Bump lastActivityAt on progress
  await prisma.readingProgress.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    update: { lastActivityAt: new Date() },
    create: { userId, manuscriptRef: msRef, lastActivityAt: new Date() },
  }).catch(() => {});

  res.status(201).json({ data: annotation });
});

// ── PATCH /api/reading/:msRef/annotations/:id ────────────────────────────────

router.patch('/:msRef/annotations/:id', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const body = parseBody(PatchAnnotationSchema, req.body, res);
  if (!body) return;

  const existing = await prisma.annotation.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Annotation not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (body.note !== undefined) data.note = body.note;

  const updated = await prisma.annotation.update({
    where: { id },
    data,
    include: { replies: { orderBy: { createdAt: 'asc' } } },
  });
  res.json({ data: updated });
});

// ── DELETE /api/reading/:msRef/annotations/:id ───────────────────────────────

router.delete('/:msRef/annotations/:id', async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const existing = await prisma.annotation.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Annotation not found' });
    return;
  }

  await prisma.annotation.delete({ where: { id } });
  res.json({ data: { id } });
});

// ── POST /api/reading/:msRef/annotations/:id/replies ─────────────────────────

router.post('/:msRef/annotations/:id/replies', async (req, res) => {
  const userId = req.user!.id;
  const { msRef, id } = req.params;
  const body = parseBody(CreateReplySchema, req.body, res);
  if (!body) return;

  const existing = await prisma.annotation.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: 'Annotation not found' });
    return;
  }

  const reply = await prisma.annotationReply.create({
    data: { annotationId: id, authorRole: body.authorRole, body: body.body },
  });

  await prisma.readingProgress.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    update: { lastActivityAt: new Date() },
    create: { userId, manuscriptRef: msRef, lastActivityAt: new Date() },
  }).catch(() => {});

  res.status(201).json({ data: reply });
});

// ── POST /api/reading/:msRef/chapters/:chapterNum/submit ──────────────────────

router.post('/:msRef/chapters/:chapterNum/submit', async (req, res) => {
  const userId = req.user!.id;
  const { msRef, chapterNum } = req.params;
  const chNum = parseInt(chapterNum, 10);
  if (isNaN(chNum)) { res.status(400).json({ error: 'invalid chapterNum' }); return; }

  const result = await prisma.annotation.updateMany({
    where: { userId, manuscriptRef: msRef, chapterId: chNum, status: 'draft' },
    data:  { status: 'submitted' },
  });

  await prisma.readingProgress.upsert({
    where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    update: { lastActivityAt: new Date() },
    create: { userId, manuscriptRef: msRef, lastActivityAt: new Date() },
  }).catch(() => {});

  res.json({ data: { submitted: result.count } });
});

// ── GET /api/reading/:msRef/impression ───────────────────────────────────────

router.get('/:msRef/impression', async (req, res) => {
  const userId = req.user!.id;
  const { msRef } = req.params;

  const points = await prisma.impressionPoint.findMany({
    where:   { userId, manuscriptRef: msRef },
    orderBy: { chapterNum: 'asc' },
    select:  { id: true, chapterNum: true, stance: true, createdAt: true },
  });

  res.json({ data: points.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) });
});

// ── PUT /api/reading/:msRef/impression/:chapterNum ────────────────────────────

router.put('/:msRef/impression/:chapterNum', async (req, res) => {
  const userId = req.user!.id;
  const { msRef, chapterNum } = req.params;
  const chNum = parseInt(chapterNum, 10);
  if (isNaN(chNum)) { res.status(400).json({ error: 'invalid chapterNum' }); return; }

  const body = parseBody(UpsertImpressionSchema, req.body, res);
  if (!body) return;

  const point = await prisma.impressionPoint.upsert({
    where:  { userId_manuscriptRef_chapterNum: { userId, manuscriptRef: msRef, chapterNum: chNum } },
    update: { stance: body.stance },
    create: { userId, manuscriptRef: msRef, chapterNum: chNum, stance: body.stance },
  });

  res.json({ data: { ...point, createdAt: point.createdAt.toISOString() } });
});

// ── GET /api/reading/:msRef/chapter-notes ────────────────────────────────────

router.get('/:msRef/chapter-notes', async (req, res) => {
  const { msRef } = req.params;
  const userId = req.user!.id;
  try {
    let chapters = await prisma.chapter.findMany({
      where: { manuscriptId: msRef },
      include: {
        notes: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });

    if (chapters.length === 0) {
      const betaLinks = await prisma.betaReader.findMany({
        where: { userId },
        select: { manuscriptId: true },
      });
      const msIds = betaLinks.map(b => b.manuscriptId);
      if (msIds.length > 0) {
        chapters = await prisma.chapter.findMany({
          where: { manuscriptId: { in: msIds } },
          include: {
            notes: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 },
          },
        });
      }
    }

    const result = chapters
      .filter(ch => ch.notes.length > 0)
      .map(ch => ({ chapterNum: ch.number, body: ch.notes[0].body }));
    res.json({ data: result });
  } catch {
    res.status(500).json({ error: 'Failed to fetch chapter notes' });
  }
});

export default router;
