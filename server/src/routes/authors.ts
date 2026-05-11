import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { parseBody } from '../lib/validate';
import { SubmitQuestionSchema, PatchQuestionSchema } from '@bookending/shared';

const router = Router();

const AUTHOR_SELECT = {
  id: true, name: true, bio: true, location: true,
  genres: true, writingProcess: true, createdAt: true,
  manuscripts: {
    where: { visibility: 'PUBLIC' as const },
    select: { id: true, title: true },
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
      where: { role: 'AUTHOR' },
      select: AUTHOR_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: authors });
  } catch {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

// GET /api/authors/:id
router.get('/:id', async (req, res) => {
  const id = req.params['id'] as string;
  try {
    const author = await prisma.user.findUnique({ where: { id }, select: AUTHOR_SELECT });
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
