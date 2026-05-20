import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { parseBody } from '../lib/validate';
import { SubmitQuestionSchema, PatchQuestionSchema } from '@bookending/shared';

const router = Router();

const AUTHOR_SELECT = {
  id: true, name: true, displayName: true, authorBio: true, location: true,
  genres: true, writingProcess: true, createdAt: true,
  featuredManuscriptId: true,
  manuscripts: {
    select: { id: true, title: true, genre: true, subgenre: true, wordCount: true, status: true, createdAt: true, description: true, betaMode: true },
  },
  authorQa: {
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' as const },
    select: { id: true, question: true, answer: true, publishedAt: true },
  },
} as const;

// GET /api/authors
router.get('/', async (_req, res, next: NextFunction) => {
  try {
    const authors = await prisma.user.findMany({
      where: { manuscripts: { some: {} } },
      select: AUTHOR_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: authors });
  } catch (err) { next(err); }
});

// GET /api/authors/readers/available â€” list readers open to beta-read invitations
router.get('/readers/available', requireAuth, async (_req, res, next: NextFunction) => {
  const TONES = ['accent', 'gold', 'muted', 'ink', 'paper'] as const;
  try {
    const readers = await prisma.user.findMany({
      where: { role: 'READER', availableForReads: true },
      select: {
        id: true, name: true, bio: true, genres: true,
        _count: { select: { betaReaders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const data = readers.map((r, idx) => ({
      id:           r.id,
      name:         r.name,
      initials:     r.name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2),
      tone:         TONES[idx % TONES.length],
      email:        '',
      genres:       r.genres ? r.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
      booksRead:    r._count.betaReaders,
      avgRating:    0,
      responseTime: '2 weeks',
      bio:          r.bio ?? '',
      availability: 'available' as const,
    }));
    res.json({ data });
  } catch (err) { next(err); }
});

// GET /api/authors/:id
router.get('/:id', async (req, res, next: NextFunction) => {
  const id = req.params['id'] as string;
  try {
    const author = await prisma.user.findFirst({
      where: { id, manuscripts: { some: {} } },
      select: AUTHOR_SELECT,
    });
    if (!author) { res.status(404).json({ error: 'Author not found' }); return; }
    res.json({ data: author });
  } catch (err) { next(err); }
});

// GET /api/authors/:id/pending-questions â€” auth required, own profile only
router.get('/:id/pending-questions', requireAuth, async (req, res, next: NextFunction) => {
  const id = req.params['id'] as string;
  if (req.user!.id !== id) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const pending = await prisma.authorQA.findMany({
      where: { authorId: id, publishedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, question: true, askedByName: true, createdAt: true },
    });
    res.json({ data: pending });
  } catch (err) { next(err); }
});

// POST /api/authors/:id/questions â€” submit a question
router.post('/:id/questions', requireAuth, async (req, res, next: NextFunction) => {
  const id = req.params['id'] as string;
  const body = parseBody(SubmitQuestionSchema, req.body, res);
  if (!body) return;

  try {
    const submitter = await prisma.user.findUnique({
      where: { id: req.user!.id }, select: { name: true },
    });
    const qa = await prisma.authorQA.create({
      data: { question: body.question.trim(), askedByName: submitter?.name ?? 'Anonymous', authorId: id },
    });
    res.status(201).json({ data: qa });
  } catch (err) { next(err); }
});

// PATCH /api/authors/:id/questions/:qid â€” publish answer or dismiss
router.patch('/:id/questions/:qid', requireAuth, async (req, res, next: NextFunction) => {
  const id  = req.params['id']  as string;
  const qid = req.params['qid'] as string;
  if (req.user!.id !== id) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(PatchQuestionSchema, req.body, res);
  if (!body) return;

  try {
    const qa = await prisma.authorQA.findUnique({ where: { id: qid } });
    if (!qa) { res.status(404).json({ error: 'Question not found' }); return; }

    if (body.dismiss) {
      await prisma.authorQA.delete({ where: { id: qid } });
      res.json({ data: null });
      return;
    }

    if (!body.answer?.trim()) { res.status(400).json({ error: 'answer is required' }); return; }
    const updated = await prisma.authorQA.update({
      where: { id: qid },
      data: { answer: body.answer.trim(), publishedAt: new Date() },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ── Next Book public routes ────────────────────────────────────────────────

const NEXT_BOOK_PUBLIC_SELECT = {
  id:          true,
  manuscriptId: true,
  title:       true,
  description: true,
  genre:       true,
  updatedAt:   true,
  _count:      { select: { followers: true } },
} as const;

// GET /api/authors/:id/next-book
router.get('/:id/next-book', optionalAuth, async (req, res, next: NextFunction) => {
  const authorId = req.params['id'] as string;
  const viewerId = req.user?.id ?? null;
  try {
    const entry = await prisma.nextBook.findUnique({
      where:  { authorId },
      select: {
        ...NEXT_BOOK_PUBLIC_SELECT,
        ...(viewerId ? { followers: { where: { userId: viewerId }, select: { id: true } } } : {}),
      },
    });
    if (!entry) { res.json({ data: null }); return; }
    const { followers, ...rest } = entry as typeof entry & { followers?: { id: string }[] };
    res.json({ data: { ...rest, isFollowing: Array.isArray(followers) && followers.length > 0 } });
  } catch (err) { next(err); }
});

// POST /api/authors/:id/next-book/follow
router.post('/:id/next-book/follow', requireAuth, async (req, res, next: NextFunction) => {
  const authorId = req.params['id'] as string;
  const userId = req.user!.id;
  try {
    const entry = await prisma.nextBook.findUnique({ where: { authorId }, select: { id: true, manuscriptId: true } });
    if (!entry) { res.status(404).json({ error: 'No next book found for this author' }); return; }
    await prisma.nextBookFollower.upsert({
      where:  { nextBookId_userId: { nextBookId: entry.id, userId } },
      create: { nextBookId: entry.id, userId },
      update: {},
    });
    const manuscriptRef = entry.manuscriptId ?? `next-book:${entry.id}`;
    await prisma.shelfEntry.upsert({
      where:  { userId_manuscriptRef: { userId, manuscriptRef } },
      create: { userId, manuscriptRef, source: 'next_book' },
      update: {},
    });
    res.json({ data: { isFollowing: true } });
  } catch (err) { next(err); }
});

// DELETE /api/authors/:id/next-book/follow
router.delete('/:id/next-book/follow', requireAuth, async (req, res, next: NextFunction) => {
  const authorId = req.params['id'] as string;
  const userId = req.user!.id;
  try {
    const entry = await prisma.nextBook.findUnique({ where: { authorId }, select: { id: true, manuscriptId: true } });
    if (!entry) { res.json({ data: { isFollowing: false } }); return; }
    await prisma.nextBookFollower.deleteMany({ where: { nextBookId: entry.id, userId } });
    const manuscriptRef = entry.manuscriptId ?? `next-book:${entry.id}`;
    await prisma.shelfEntry.deleteMany({ where: { userId, manuscriptRef } });
    res.json({ data: { isFollowing: false } });
  } catch (err) { next(err); }
});

export default router;
