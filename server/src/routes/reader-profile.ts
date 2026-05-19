import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { PatchReaderProfileSchema } from '@bookending/shared';

const router = Router();

const PROFILE_SELECT = {
  displayName:       true,
  name:              true,
  bio:               true,
  location:          true,
  genres:            true,
  availableForReads: true,
  avatarUrl:         true,
} as const;

// — GET /api/reader-profile ————————————————————————————————————————————

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

// — PATCH /api/reader-profile ——————————————————————————————————————————

router.patch('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const body = parseBody(PatchReaderProfileSchema, req.body, res);
  if (!body) return;

  const data: Record<string, unknown> = {};
  if (body.bio               !== undefined) data.bio               = body.bio;
  if (body.genres            !== undefined) data.genres            = body.genres;
  if (body.availableForReads !== undefined) data.availableForReads = body.availableForReads;

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
