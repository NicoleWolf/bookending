import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/browse — public manuscripts (no auth required)
router.get('/', async (req, res) => {
  const { genre, q } = req.query as { genre?: string; q?: string };

  const manuscripts = await prisma.manuscript.findMany({
    where: {
      visibility: 'PUBLIC',
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
      author: { select: { id: true, name: true } },
      betaReaders: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: manuscripts });
});

export default router;
