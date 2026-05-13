import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { CreateSubscriberSchema, PatchSubscriberSchema } from '@bookending/shared';

const router = Router();

// GET /api/subscribers
router.get('/', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const limit  = Math.min(Math.max(parseInt(req.query.limit  as string) || 100, 1), 500);
  const page   = Math.max(parseInt(req.query.page as string) || 1, 1);
  try {
    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where: { authorId }, orderBy: { joinedAt: 'asc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.subscriber.count({ where: { authorId } }),
    ]);
    res.json({ data: subscribers, meta: { total, page, limit } });
  } catch (err) { next(err); }
});

// POST /api/subscribers
router.post('/', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// PATCH /api/subscribers/:id â€” update segment (owner only)
router.patch('/:id', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// DELETE /api/subscribers/:id â€” remove subscriber (owner only)
router.delete('/:id', async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Subscriber not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.subscriber.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
