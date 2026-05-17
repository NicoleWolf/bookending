import { Router } from 'express';
import type { NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
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
  UpsertReaderChapterNoteSchema,
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

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ GET /api/reading/hub â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/hub', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const now = new Date();
  try {

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

  const warmProgress     = progressRows.filter(p => !p.finishedAt);
  const finishedProgress = progressRows.filter(p => !!p.finishedAt);

  // Batch-load all referenced manuscripts in one query
  const allMsRefs = [
    ...new Set([
      ...warmProgress.slice(0, 10).map(p => p.manuscriptRef),
      ...shelfRows.slice(0, 10).map(s => s.manuscriptRef),
      ...finishedProgress.slice(0, 5).map(p => p.manuscriptRef),
    ]),
  ];
  type MsRow = Prisma.ManuscriptGetPayload<{
    include: { author: { select: { name: true } }; chapters: { select: { id: true; number: true } } };
  }>;
  let manuscriptRows: MsRow[] = [];
  if (allMsRefs.length > 0) {
    try {
      manuscriptRows = await prisma.manuscript.findMany({
        where:   { id: { in: allMsRefs } },
        include: {
          author:   { select: { name: true } },
          chapters: { select: { id: true, number: true } },
        },
      });
    } catch { /* tolerate — returns empty, hub degrades gracefully */ }
  }
  const msMap = new Map(manuscriptRows.map(m => [m.id, m]));

  // Batch-load chapters with active notes for warm manuscripts that have doneChapters
  const warmMsRefsWithDone = warmProgress.slice(0, 10)
    .filter(p => (JSON.parse(p.doneChapters ?? '[]') as number[]).length > 0)
    .map(p => p.manuscriptRef);

  type ChRow = Prisma.ChapterGetPayload<{ include: { notes: true } }>;
  let chaptersWithNotes: ChRow[] = [];
  if (warmMsRefsWithDone.length > 0) {
    try {
      chaptersWithNotes = await prisma.chapter.findMany({
        where:   { manuscriptId: { in: warmMsRefsWithDone } },
        include: { notes: { where: { status: 'ACTIVE' }, take: 1 } },
      });
    } catch { /* tolerate */ }
  }
  const chaptersByMs = new Map<string, ChRow[]>();
  for (const ch of chaptersWithNotes) {
    const list = chaptersByMs.get(ch.manuscriptId) ?? [];
    list.push(ch);
    chaptersByMs.set(ch.manuscriptId, list);
  }

  // Build warm items
  const warm: HubWarmItem[] = warmProgress.slice(0, 10).map(p => {
    const msInfo      = msMap.get(p.manuscriptRef) ?? null;
    const doneChapters = JSON.parse(p.doneChapters ?? '[]') as number[];
    const newChapterCount = 0;

    let newNoteCount = 0;
    let newAuthorNote: HubWarmItem['newAuthorNote'] = null;
    if (msInfo && doneChapters.length > 0) {
      const msChapters = chaptersByMs.get(p.manuscriptRef) ?? [];
      for (const ch of msChapters) {
        if (doneChapters.includes(ch.number) && ch.notes.length > 0) {
          newNoteCount++;
          if (!newAuthorNote) {
            const firstName = msInfo.author.name.split(' ')[0] ?? 'the author';
            newAuthorNote = {
              chapterNum:      ch.number,
              authorFirstName: firstName,
              body:            ch.notes[0].body,
            };
          }
        }
      }
    }

    return {
      manuscriptRef:  p.manuscriptRef,
      title:          msInfo?.title ?? null,
      authorName:     msInfo?.author?.name ?? null,
      draftLabel:     null,
      genre:          msInfo?.genre ?? null,
      totalChapters:  msInfo?.chapters?.length ?? 0,
      doneChapters,
      mood:           p.mood,
      lastOpenedAt:   p.lastOpenedAt?.toISOString() ?? null,
      lastActivityAt: p.lastActivityAt?.toISOString() ?? null,
      isDormant:      isDormant(p.lastOpenedAt, p.lastActivityAt),
      newChapterCount,
      newNoteCount,
      newAuthorNote,
    };
  });

  // Build shelf items
  const shelf: HubShelfItem[] = shelfRows.slice(0, 10).map(s => {
    const msInfo = msMap.get(s.manuscriptRef) ?? null;
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
  });

  // Build finished items
  const finished: HubFinishedItem[] = finishedProgress.slice(0, 5).map(p => {
    const msInfo = msMap.get(p.manuscriptRef) ?? null;
    return {
      manuscriptRef: p.manuscriptRef,
      title:         msInfo?.title ?? null,
      authorName:    msInfo?.author?.name ?? null,
      finishedAt:    p.finishedAt!.toISOString(),
      verdict:       p.verdict,
      impression:    p.message,
      totalChapters: msInfo?.chapters?.length ?? 0,
    };
  });

  // Season = current year's Q-based quarters (Janâ€“Mar, Aprâ€“Jun, Julâ€“Sep, Octâ€“Dec)
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

  // House Suggests â€” priority ranked
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
      label: `${firstName} left a note on chapter ${chNum} of <em>${title}</em> â€” and you've already read it.`,
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

  // Tier 3: warm ms not opened in 7â€“28 days
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
  } catch (err) { next(err); }
});

// â”€â”€ GET /api/reading/:msRef â€” progress + annotations + cohort â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/:msRef', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  try {

  const [progress, annotations, cohortCount, chapterNotes] = await Promise.all([
    prisma.readingProgress.findUnique({ where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } } }),
    prisma.annotation.findMany({
      where: { userId, manuscriptRef: msRef },
      orderBy: { createdAt: 'asc' },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    }),
    prisma.betaReader.count({ where: { manuscriptId: msRef } }),
    prisma.readerChapterNote.findMany({
      where: { userId, manuscriptRef: msRef },
      orderBy: { chapterNum: 'asc' },
    }),
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

  res.json({ data: { progress, annotations: annotationsWithReplies, cohortCount, chapterNotes } });
  } catch (err) { next(err); }
});

// â”€â”€ PUT /api/reading/:msRef/progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.put('/:msRef/progress', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(PatchProgressSchema, req.body, res);
  if (!body) return;
  try {
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
  } catch (err) { next(err); }
});

// â”€â”€ PATCH /api/reading/:msRef/finish â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.patch('/:msRef/finish', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(FinishReadingSchema, req.body, res);
  if (!body) return;
  try {
    const progress = await prisma.readingProgress.upsert({
      where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
      update: { finishedAt: new Date(), verdict: body.verdict },
      create: { userId, manuscriptRef: msRef, finishedAt: new Date(), verdict: body.verdict },
    });
    res.json({ data: progress });
  } catch (err) { next(err); }
});

// â”€â”€ POST /api/reading/shelf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.post('/shelf', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const body = parseBody(AddToShelfSchema, req.body, res);
  if (!body) return;
  try {
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
  } catch (err) { next(err); }
});

// â”€â”€ DELETE /api/reading/shelf/:msRef â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.delete('/shelf/:msRef', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  try {
    const existing = await prisma.shelfEntry.findUnique({
      where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    });
    if (!existing) { res.status(404).json({ error: 'Shelf entry not found' }); return; }

    await prisma.shelfEntry.delete({
      where: { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
    });
    res.json({ data: { manuscriptRef: msRef } });
  } catch (err) { next(err); }
});

// â”€â”€ POST /api/reading/recommendation/dismiss â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.post('/recommendation/dismiss', async (req, res) => {
  const body = parseBody(DismissRecommendationSchema, req.body, res);
  if (!body) return;
  // Dismissed tier is tracked client-side (sessionStorage) for now.
  res.json({ data: { dismissed: body.tier } });
});

// â”€â”€ POST /api/reading/:msRef/annotations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.post('/:msRef/annotations', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  const body = parseBody(CreateAnnotationSchema, req.body, res);
  if (!body) return;
  try {
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
    await prisma.readingProgress.upsert({
      where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
      update: { lastActivityAt: new Date() },
      create: { userId, manuscriptRef: msRef, lastActivityAt: new Date() },
    }).catch(() => {});
    res.status(201).json({ data: annotation });
  } catch (err) { next(err); }
});

// â”€â”€ PATCH /api/reading/:msRef/annotations/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.patch('/:msRef/annotations/:id', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const body = parseBody(PatchAnnotationSchema, req.body, res);
  if (!body) return;
  try {
    const existing = await prisma.annotation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Annotation not found' }); return;
    }
    const data: Record<string, unknown> = {};
    if (body.note !== undefined) data.note = body.note;
    const updated = await prisma.annotation.update({
      where: { id }, data,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// â”€â”€ DELETE /api/reading/:msRef/annotations/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.delete('/:msRef/annotations/:id', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const existing = await prisma.annotation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Annotation not found' }); return;
    }
    await prisma.annotation.delete({ where: { id } });
    res.json({ data: { id } });
  } catch (err) { next(err); }
});

// â”€â”€ POST /api/reading/:msRef/annotations/:id/replies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.post('/:msRef/annotations/:id/replies', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef, id } = req.params;
  const body = parseBody(CreateReplySchema, req.body, res);
  if (!body) return;
  try {
    const existing = await prisma.annotation.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      res.status(404).json({ error: 'Annotation not found' }); return;
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
  } catch (err) { next(err); }
});

// â”€â”€ POST /api/reading/:msRef/chapters/:chapterNum/submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.post('/:msRef/chapters/:chapterNum/submit', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef, chapterNum } = req.params;
  const chNum = parseInt(chapterNum, 10);
  if (isNaN(chNum)) { res.status(400).json({ error: 'invalid chapterNum' }); return; }
  try {
    const [result] = await Promise.all([
      prisma.annotation.updateMany({
        where: { userId, manuscriptRef: msRef, chapterId: chNum, status: 'draft' },
        data:  { status: 'submitted' },
      }),
      prisma.readerChapterNote.updateMany({
        where: { userId, manuscriptRef: msRef, chapterNum: chNum, status: 'draft' },
        data:  { status: 'submitted' },
      }),
    ]);
    await prisma.readingProgress.upsert({
      where:  { userId_manuscriptRef: { userId, manuscriptRef: msRef } },
      update: { lastActivityAt: new Date() },
      create: { userId, manuscriptRef: msRef, lastActivityAt: new Date() },
    }).catch(() => {});
    res.json({ data: { submitted: result.count } });
  } catch (err) { next(err); }
});

// â”€â”€ GET /api/reading/:msRef/impression â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/:msRef/impression', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef } = req.params;
  try {
    const points = await prisma.impressionPoint.findMany({
      where:   { userId, manuscriptRef: msRef },
      orderBy: { chapterNum: 'asc' },
      select:  { id: true, chapterNum: true, stance: true, createdAt: true },
    });
    res.json({ data: points.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) });
  } catch (err) { next(err); }
});

// â”€â”€ PUT /api/reading/:msRef/impression/:chapterNum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.put('/:msRef/impression/:chapterNum', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef, chapterNum } = req.params;
  const chNum = parseInt(chapterNum, 10);
  if (isNaN(chNum)) { res.status(400).json({ error: 'invalid chapterNum' }); return; }
  const body = parseBody(UpsertImpressionSchema, req.body, res);
  if (!body) return;
  try {
    const point = await prisma.impressionPoint.upsert({
      where:  { userId_manuscriptRef_chapterNum: { userId, manuscriptRef: msRef, chapterNum: chNum } },
      update: { stance: body.stance },
      create: { userId, manuscriptRef: msRef, chapterNum: chNum, stance: body.stance },
    });
    res.json({ data: { ...point, createdAt: point.createdAt.toISOString() } });
  } catch (err) { next(err); }
});

// â”€â”€ GET /api/reading/:msRef/manuscript â€” chapter content for enrolled readers â”€

router.get('/:msRef/manuscript', async (req, res, next: NextFunction) => {
  const { msRef } = req.params;
  const userId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({
      where: { id: msRef },
      include: {
        chapters:    { orderBy: { number: 'asc' } },
        betaReaders: { where: { userId }, select: { id: true } },
      },
    });

    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }

    const isAuthor = ms.authorId === userId;
    const isReader = ms.betaReaders.length > 0;
    if (!isAuthor && !isReader) { res.status(403).json({ error: 'Forbidden' }); return; }

    function htmlToParas(html: string | null): { id: number; text: string }[] {
      if (!html) return [];
      const matches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) ?? [];
      return matches
        .map((tag, idx) => {
          const inner = tag
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#\d+;/g, ' ')
            .replace(/\s+/g, ' ').trim();
          return { id: idx + 1, text: inner };
        })
        .filter(p => p.text.length > 0);
    }

    const hasReleaseDates = ms.chapters.some(ch => ch.releasedAt !== null);
    const mode = hasReleaseDates ? 'serialized' : 'complete';
    const accessibleChapters = (isAuthor || !hasReleaseDates)
      ? ms.chapters
      : ms.chapters.filter(ch => ch.releasedAt !== null);

    res.json({ data: {
      id:               ms.id,
      title:            ms.title,
      draft:            ms.wordCount > 0 ? `${ms.wordCount.toLocaleString()} words` : 'Draft 1',
      instructions:     ms.readerInstructions ?? '',
      status:           ms.status,
      editorialNote:    ms.editorialNote ?? null,
      revisionPausedAt: ms.revisionPausedAt?.toISOString() ?? null,
      mode,
      chapters: accessibleChapters.map(ch => ({
        id:         ch.number,
        number:     ch.number,
        title:      ch.title,
        paras:      htmlToParas(ch.content),
        releasedAt: ch.releasedAt?.toISOString() ?? null,
        expectedAt: ch.expectedAt?.toISOString() ?? null,
      })),
    }});
  } catch (err) { next(err); }
});

// â”€â”€ GET /api/reading/:msRef/chapter-notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/:msRef/chapter-notes', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// ── PUT /api/reading/:msRef/chapters/:chapterNum/reader-note ──────────────────

router.put('/:msRef/chapters/:chapterNum/reader-note', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { msRef, chapterNum } = req.params;
  const chNum = parseInt(chapterNum, 10);
  if (isNaN(chNum)) { res.status(400).json({ error: 'invalid chapterNum' }); return; }
  const body = parseBody(UpsertReaderChapterNoteSchema, req.body, res);
  if (!body) return;
  try {
    const note = await prisma.readerChapterNote.upsert({
      where:  { userId_manuscriptRef_chapterNum: { userId, manuscriptRef: msRef, chapterNum: chNum } },
      update: { body: body.body },
      create: { userId, manuscriptRef: msRef, chapterNum: chNum, body: body.body },
    });
    res.json({ data: note });
  } catch (err) { next(err); }
});

export default router;
