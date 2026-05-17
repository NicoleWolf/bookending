import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/arc/my-arcs — reader's ARC commitments, grouped by status
router.get('/my-arcs', async (req, res, next: NextFunction) => {
  const readerId = req.user!.id;
  try {
    const applications = await prisma.arcApplication.findMany({
      where: { readerId },
      include: {
        program: {
          include: {
            manuscript: {
              select: {
                id: true, title: true, genre: true, coverUrl: true,
                author: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    const now = new Date();
    // Auto-mark UNFULFILLED when T+3 grace period has closed (>3 days past deadline, no review)
    const toMarkUnfulfilled = applications
      .filter(app => {
        if (app.status !== 'ACCEPTED') return false;
        if (!app.program.reviewDeadline) return false;
        const daysPast = (now.getTime() - app.program.reviewDeadline.getTime()) / 86_400_000;
        return daysPast > 3;
      })
      .map(a => a.id);

    if (toMarkUnfulfilled.length > 0) {
      await prisma.arcApplication.updateMany({
        where: { id: { in: toMarkUnfulfilled } },
        data: { status: 'UNFULFILLED' },
      });
    }

    const enriched = applications.map(app => {
      const deadlineDaysLeft = app.program.reviewDeadline
        ? Math.ceil((app.program.reviewDeadline.getTime() - now.getTime()) / 86_400_000)
        : null;
      const status = toMarkUnfulfilled.includes(app.id) ? 'UNFULFILLED' : app.status;
      return { ...app, status, deadlineDaysLeft };
    });

    res.json({ data: enriched });
  } catch (err) { next(err); }
});

export default router;
