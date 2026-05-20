import { Router } from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';

const router = Router();

const PROFILE_SELECT = {
  id:                   true,
  displayName:          true,
  name:                 true,
  authorBio:            true,
  location:             true,
  genres:               true,
  subgenres:            true,
  writingProcess:       true,
  avatarUrl:            true,
  featuredManuscriptId: true,
  showActivityPublicly: true,
  manuscripts: { select: { id: true, title: true, genre: true } },
  authorQa: {
    where:   { answer: { not: null }, publishedAt: { not: null } },
    select:  { id: true, question: true, answer: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' as const },
  },
} as const;

const PatchAuthorProfileSchema = z.object({
  authorBio:            z.string().max(600).nullable().optional(),
  writingProcess:       z.string().max(2000).nullable().optional(),
  genres:               z.string().nullable().optional(),
  subgenres:            z.string().nullable().optional(),
  featuredManuscriptId: z.string().nullable().optional(),
  showActivityPublicly: z.boolean().optional(),
});

// — GET /api/author-profile ————————————————————————————————————————————

router.get('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: PROFILE_SELECT,
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ data: user });
  } catch (err) { next(err); }
});

// — PATCH /api/author-profile ——————————————————————————————————————————

router.patch('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const body = parseBody(PatchAuthorProfileSchema, req.body, res);
  if (!body) return;

  const data: Record<string, unknown> = {};
  if (body.authorBio            !== undefined) data.authorBio            = body.authorBio;
  if (body.genres               !== undefined) data.genres               = body.genres;
  if (body.subgenres            !== undefined) data.subgenres            = body.subgenres;
  if (body.writingProcess       !== undefined) data.writingProcess       = body.writingProcess;
  if (body.featuredManuscriptId !== undefined) data.featuredManuscriptId = body.featuredManuscriptId;
  if (body.showActivityPublicly !== undefined) data.showActivityPublicly = body.showActivityPublicly;

  try {
    const user = await prisma.user.update({
      where:  { id: userId },
      data,
      select: PROFILE_SELECT,
    });
    res.json({ data: user });
  } catch (err) { next(err); }
});

export default router;
