import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/browse — publicly discoverable manuscripts (PUBLIC or REQUEST betaMode)
// Optional auth: if a valid token is present, we return per-reader pendingRequest state
router.get('/', async (req, res) => {
  const { genre, q } = req.query as { genre?: string; q?: string };
  const callerId = req.user?.id ?? null;

  try {
    const manuscripts = await prisma.manuscript.findMany({
      where: {
        betaMode: { in: ['PUBLIC', 'REQUEST'] },
        ...(genre ? { genre: { contains: genre, mode: 'insensitive' } } : {}),
        ...(q ? {
          OR: [
            { title:       { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { genre:       { contains: q, mode: 'insensitive' } },
            { keywords:    { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: {
        id: true, title: true, subtitle: true, genre: true, subgenre: true,
        description: true, keywords: true, status: true, wordCount: true,
        estimatedPages: true, contentRating: true, createdAt: true,
        betaMode: true, maxBetaReaders: true,
        author: { select: { id: true, name: true } },
        _count: { select: { betaReaders: true } },
        ...(callerId ? {
          betaJoinRequests: {
            where: { userId: callerId, status: 'PENDING' },
            select: { id: true },
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = manuscripts.map(m => {
      const { _count, betaJoinRequests, ...rest } = m as typeof m & {
        betaJoinRequests?: { id: string }[];
      };
      return {
        ...rest,
        readerCount: _count.betaReaders,
        pendingRequest: callerId ? (betaJoinRequests?.length ?? 0) > 0 : false,
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('[browse GET]', err);
    res.status(500).json({ error: 'Failed to fetch manuscripts' });
  }
});

export default router;
