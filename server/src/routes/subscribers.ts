import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { CreateSubscriberSchema, PatchSubscriberSchema } from '@bookending/shared';

const router = Router();

// GET /api/subscribers
router.get('/', async (req, res) => {
  const authorId = req.user!.id;
  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { authorId }, orderBy: { joinedAt: 'asc' },
    });
    res.json({ data: subscribers });
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// POST /api/subscribers
router.post('/', async (req, res) => {
  const authorId = req.user!.id;
  const body = parseBody(CreateSubscriberSchema, req.body, res);
  if (!body) return;

  try {
    const subscriber = await prisma.subscriber.create({
      data: {
        email:    body.email.trim(),
        name:     body.name?.trim()     ?? '',
        location: body.location?.trim() ?? '',
        segment:  body.segment          ?? 'new',
        authorId,
      },
    });
    res.status(201).json({ data: subscriber });
  } catch {
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

// PATCH /api/subscribers/:id — update segment (owner only)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Subscriber not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(PatchSubscriberSchema, req.body, res);
  if (!body) return;

  try {
    const subscriber = await prisma.subscriber.update({
      where: { id }, data: { segment: body.segment },
    });
    res.json({ data: subscriber });
  } catch {
    res.status(500).json({ error: 'Failed to update subscriber' });
  }
});

// DELETE /api/subscribers/:id — remove subscriber (owner only)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Subscriber not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.subscriber.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch {
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

export default router;
