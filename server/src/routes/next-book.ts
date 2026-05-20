import { Router } from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const UpsertNextBookSchema = z.object({
  manuscriptId: z.string().nullable().optional(),
  title:        z.string().min(1).max(200),
  description:  z.string().max(1000).nullable().optional(),
  genre:        z.string().max(80).nullable().optional(),
});

const NEXT_BOOK_SELECT = {
  id:          true,
  manuscriptId: true,
  title:       true,
  description: true,
  genre:       true,
  updatedAt:   true,
  _count:      { select: { followers: true } },
} as const;

// GET /api/next-book — author fetches their own entry
router.get('/', requireAuth, async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  try {
    const entry = await prisma.nextBook.findUnique({
      where:  { authorId },
      select: NEXT_BOOK_SELECT,
    });
    res.json({ data: entry ?? null });
  } catch (err) { next(err); }
});

// PUT /api/next-book — upsert (create or replace)
router.put('/', requireAuth, async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const body = parseBody(UpsertNextBookSchema, req.body, res);
  if (!body) return;

  // If linking a manuscript, verify ownership
  if (body.manuscriptId) {
    const ms = await prisma.manuscript.findFirst({
      where: { id: body.manuscriptId, authorId },
      select: { id: true },
    });
    if (!ms) { res.status(400).json({ error: 'Manuscript not found or not yours' }); return; }
  }

  try {
    const entry = await prisma.nextBook.upsert({
      where:  { authorId },
      create: {
        authorId,
        manuscriptId: body.manuscriptId ?? null,
        title:        body.title,
        description:  body.description ?? null,
        genre:        body.genre ?? null,
      },
      update: {
        manuscriptId: body.manuscriptId ?? null,
        title:        body.title,
        description:  body.description ?? null,
        genre:        body.genre ?? null,
        // Clear followers when the entry is replaced with a different book
        ...(body.manuscriptId !== undefined ? {
          followers: { deleteMany: {} },
        } : {}),
      },
      select: NEXT_BOOK_SELECT,
    });
    res.json({ data: entry });
  } catch (err) { next(err); }
});

// DELETE /api/next-book — clear it
router.delete('/', requireAuth, async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  try {
    await prisma.nextBook.delete({ where: { authorId } });
    res.json({ data: null });
  } catch (err: unknown) {
    // If it didn't exist, treat as success
    if ((err as { code?: string }).code === 'P2025') { res.json({ data: null }); return; }
    next(err);
  }
});

export default router;
