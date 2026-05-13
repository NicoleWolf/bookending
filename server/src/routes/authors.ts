import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { parseBody } from '../lib/validate';
import { SubmitQuestionSchema, PatchQuestionSchema } from '@bookending/shared';

const router = Router();

const AUTHOR_SELECT = {
  id: true, name: true, bio: true, location: true,
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
router.get('/', async (_req, res) => {
  try {
    const authors = await prisma.user.findMany({
      where: { manuscripts: { some: {} } },
      select: AUTHOR_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: authors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

// GET /api/authors/readers/available — list readers open to beta-read invitations
router.get('/readers/available', requireAuth, async (_req, res) => {
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
  } catch {
    res.status(500).json({ error: 'Failed to fetch available readers' });
  }
});

// GET /api/authors/:id
router.get('/:id', async (req, res) => {
  const id = req.params['id'] as string;
  try {
    const author = await prisma.user.findFirst({
      where: { id, manuscripts: { some: {} } },
      select: AUTHOR_SELECT,
    });
    if (!author) { res.status(404).json({ error: 'Author not found' }); return; }
    res.json({ data: author });
  } catch {
    res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// GET /api/authors/:id/pending-questions — auth required, own profile only
router.get('/:id/pending-questions', requireAuth, async (req, res) => {
  const id = req.params['id'] as string;
  if (req.user!.id !== id) { res.status(403).json({ error: 'Forbidden' }); return; }
  try {
    const pending = await prisma.authorQA.findMany({
      where: { authorId: id, publishedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, question: true, askedByName: true, createdAt: true },
    });
    res.json({ data: pending });
  } catch {
    res.status(500).json({ error: 'Failed to fetch pending questions' });
  }
});

// POST /api/authors/:id/questions — submit a question
router.post('/:id/questions', requireAuth, async (req, res) => {
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
  } catch {
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

// PATCH /api/authors/:id/questions/:qid — publish answer or dismiss
router.patch('/:id/questions/:qid', requireAuth, async (req, res) => {
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
  } catch {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

export default router;
