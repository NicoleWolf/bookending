import { Router } from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';

const router = Router();

const PROFILE_SELECT = {
  name:        true,
  displayName: true,
  location:    true,
  avatarUrl:   true,
  email:       true,
} as const;

const PatchProfileSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  displayName: z.string().max(60).nullable().optional(),
  location:    z.string().max(100).nullable().optional(),
  avatarUrl:   z.string().nullable().optional(),
});

// GET /api/profile — identity fields for the User Profile page
router.get('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ data: user });
  } catch (err) { next(err); }
});

// PATCH /api/profile — update identity fields (name, displayName, location, avatarUrl)
router.patch('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const body = parseBody(PatchProfileSchema, req.body, res);
  if (!body) return;

  const data: Record<string, unknown> = {};
  if (body.name        !== undefined) data.name        = body.name;
  if (body.displayName !== undefined) data.displayName = body.displayName;
  if (body.location    !== undefined) data.location    = body.location;
  if (body.avatarUrl   !== undefined) data.avatarUrl   = body.avatarUrl;

  try {
    const user = await prisma.user.update({ where: { id: userId }, data, select: PROFILE_SELECT });
    res.json({ data: user });
  } catch (err) { next(err); }
});

export default router;
