import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { PatchNotificationSchema } from '@bookending/shared';

const router = Router();

// GET /api/notifications — all due notifications (PENDING + SENT) for the authed user
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        status:      { in: ['PENDING', 'SENT'] },
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    res.json({ data: notifications });
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id — mark SENT or DISMISSED (owner only)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const body = parseBody(PatchNotificationSchema, req.body, res);
  if (!body) return;

  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Not found' }); return; }
  if (existing.userId !== userId)   { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'SENT' ? { sentAt: new Date() } : {}),
      },
    });
    res.json({ data: notification });
  } catch {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;
