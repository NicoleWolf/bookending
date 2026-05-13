import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/dashboard — aggregated author stats
router.get('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const [manuscripts, subscriberCount, sentDispatchCount, orderCount, productCount] = await Promise.all([
      prisma.manuscript.findMany({
        where: { authorId: userId },
        select: {
          id: true, title: true, status: true, wordCount: true,
          betaReaders: { select: { id: true, progress: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.subscriber.count({ where: { authorId: userId } }),
      prisma.dispatch.count({ where: { authorId: userId, status: 'SENT' } }),
      prisma.order.count({ where: { userId } }),
      prisma.product.count({ where: { authorId: userId, status: 'LIVE' } }),
    ]);

    const totalWords = manuscripts.reduce((s, m) => s + m.wordCount, 0);
    const betaReaderTotal = manuscripts.reduce((s, m) => s + m.betaReaders.length, 0);
    const betaReadersComplete = manuscripts.reduce(
      (s, m) => s + m.betaReaders.filter(r => r.progress >= 100).length, 0
    );

    const manuscriptsSummary = manuscripts.map(m => ({
      id:                  m.id,
      title:               m.title,
      status:              m.status,
      wordCount:           m.wordCount,
      betaReaderCount:     m.betaReaders.length,
      betaReadersComplete: m.betaReaders.filter(r => r.progress >= 100).length,
      betaReadersActive:   m.betaReaders.filter(r => r.progress > 0 && r.progress < 100).length,
    }));

    res.json({
      data: {
        manuscripts: manuscriptsSummary,
        totalWords,
        betaReaderTotal,
        betaReadersComplete,
        subscriberCount,
        sentDispatchCount,
        orderCount,
        productCount,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/v2 — new dashboard data (writing + reading sides)
router.get('/v2', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const [manuscripts, subscriberCount, orderCount, unrepliedQaCount] = await Promise.all([
      prisma.manuscript.findMany({
        where: { authorId: userId },
        select: {
          id: true, title: true, subtitle: true, status: true,
          wordCount: true, updatedAt: true,
          betaReaders: {
            select: {
              id: true, name: true, progress: true, verdict: true,
              notesCount: true, joinedAt: true, lastSeenAt: true,
            },
          },
          _count: { select: { chapters: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.subscriber.count({ where: { authorId: userId } }),
      prisma.order.count({ where: { userId } }),
      prisma.authorQA.count({ where: { authorId: userId, answer: null } }),
    ]);

    // Annotation hotspots per chapter for writing side
    const manuscriptIds = manuscripts.map(m => m.id);
    const hotspotGroups = manuscriptIds.length > 0
      ? await prisma.annotation.groupBy({
          by: ['manuscriptRef', 'chapterId'],
          where: { manuscriptRef: { in: manuscriptIds } },
          _count: { id: true },
          orderBy: [{ chapterId: 'asc' }],
        })
      : [];

    const hotspotMap = new Map<string, { chapterId: number; annotationCount: number }[]>();
    for (const g of hotspotGroups) {
      if (!hotspotMap.has(g.manuscriptRef)) hotspotMap.set(g.manuscriptRef, []);
      hotspotMap.get(g.manuscriptRef)!.push({ chapterId: g.chapterId, annotationCount: g._count.id });
    }

    const writingManuscripts = manuscripts.map(m => ({
      id:       m.id,
      title:    m.title,
      subtitle: m.subtitle ?? null,
      status:   m.status as 'DRAFTING' | 'IN_REVISION' | 'PUBLISHED',
      wordCount: m.wordCount,
      updatedAt: m.updatedAt.toISOString(),
      betaReaders: m.betaReaders.map(r => ({
        id:         r.id,
        name:       r.name,
        progress:   r.progress,
        verdict:    r.verdict,
        notesCount: r.notesCount,
        joinedAt:   r.joinedAt.toISOString(),
        lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
      })),
      chapterCount:    m._count.chapters,
      hotspotChapters: hotspotMap.get(m.id) ?? [],
    }));

    // Reading side: beta reads where this user is the reader and progress < 100
    const betaReaderLinks = await prisma.betaReader.findMany({
      where: { userId, progress: { lt: 100 } },
      include: {
        manuscript: {
          select: {
            id: true, title: true,
            author: { select: { id: true, name: true } },
            _count: { select: { chapters: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Reader's own annotations per chapter for each active read
    const readingMsRefs = betaReaderLinks.map(r => r.manuscript.id);
    const myAnnotationGroups = readingMsRefs.length > 0
      ? await prisma.annotation.groupBy({
          by: ['manuscriptRef', 'chapterId'],
          where: { userId, manuscriptRef: { in: readingMsRefs } },
          _count: { id: true },
          orderBy: [{ chapterId: 'asc' }],
        })
      : [];

    const myAnnotationMap = new Map<string, { chapterId: number; count: number }[]>();
    for (const g of myAnnotationGroups) {
      if (!myAnnotationMap.has(g.manuscriptRef)) myAnnotationMap.set(g.manuscriptRef, []);
      myAnnotationMap.get(g.manuscriptRef)!.push({ chapterId: g.chapterId, count: g._count.id });
    }

    // Recent active author notes for manuscripts being beta-read
    const recentNoteData = readingMsRefs.length > 0
      ? await prisma.chapterNote.findMany({
          where: {
            status: 'ACTIVE',
            chapter: { manuscriptId: { in: readingMsRefs } },
          },
          include: {
            chapter: { select: { number: true, title: true, manuscriptId: true } },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : [];

    const authorNotesByMs = new Map<string, { chapterNum: number; chapterTitle: string; body: string; updatedAt: string }[]>();
    for (const n of recentNoteData) {
      const msId = n.chapter.manuscriptId;
      if (!authorNotesByMs.has(msId)) authorNotesByMs.set(msId, []);
      authorNotesByMs.get(msId)!.push({
        chapterNum:   n.chapter.number,
        chapterTitle: n.chapter.title,
        body:         n.body,
        updatedAt:    n.updatedAt.toISOString(),
      });
    }

    const activeBetaReads = betaReaderLinks.map(r => ({
      betaReaderId:      r.id,
      manuscriptId:      r.manuscript.id,
      manuscriptTitle:   r.manuscript.title,
      authorName:        r.manuscript.author.name,
      authorId:          r.manuscript.author.id,
      progress:          r.progress,
      notesCount:        r.notesCount,
      joinedAt:          r.joinedAt.toISOString(),
      lastSeenAt:        r.lastSeenAt?.toISOString() ?? null,
      chapterCount:      r.manuscript._count.chapters,
      myAnnotations:     myAnnotationMap.get(r.manuscript.id) ?? [],
      recentAuthorNotes: (authorNotesByMs.get(r.manuscript.id) ?? []).slice(0, 3),
    }));

    res.json({
      data: {
        writing: { manuscripts: writingManuscripts, subscriberCount, orderCount, unrepliedQaCount },
        reading: { activeBetaReads },
      },
    });
  } catch (err) { next(err); }
});

export default router;
