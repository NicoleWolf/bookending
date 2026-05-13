import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { CreateChapterNoteSchema, UpdateChapterNoteSchema } from '@bookending/shared';

// mergeParams exposes :id (manuscriptId) from the parent manuscripts router
const router = Router({ mergeParams: true });

async function ownerCheck(manuscriptId: string, userId: string): Promise<boolean> {
  const ms = await prisma.manuscript.findUnique({ where: { id: manuscriptId } });
  return !!ms && ms.authorId === userId;
}

async function getOrCreateChapter(manuscriptId: string, num: number, title: string) {
  const existing = await prisma.chapter.findFirst({ where: { manuscriptId, number: num } });
  if (existing) return existing;
  return prisma.chapter.create({ data: { manuscriptId, number: num, title } });
}

// GET /api/manuscripts/:id/chapters/:chapterNum/notes
router.get('/:chapterNum/notes', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  if (!await ownerCheck(params.id, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const chapterNum = parseInt(params.chapterNum, 10);
  if (isNaN(chapterNum)) { res.status(400).json({ error: 'chapterNum must be an integer' }); return; }

  const chapter = await prisma.chapter.findFirst({ where: { manuscriptId: params.id, number: chapterNum } });
  if (!chapter) { res.json({ data: [] }); return; }

  try {
    const notes = await prisma.chapterNote.findMany({
      where: { chapterId: chapter.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ data: notes });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/chapters/:chapterNum/notes
router.post('/:chapterNum/notes', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  if (!await ownerCheck(params.id, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const chapterNum = parseInt(params.chapterNum, 10);
  if (isNaN(chapterNum)) { res.status(400).json({ error: 'chapterNum must be an integer' }); return; }

  const body = parseBody(CreateChapterNoteSchema, req.body, res);
  if (!body) return;

  try {
    const chapter = await getOrCreateChapter(
      params.id, chapterNum, body.chapterTitle ?? `Chapter ${chapterNum + 1}`
    );

    const existing = await prisma.chapterNote.findFirst({
      where: { chapterId: chapter.id, status: 'ACTIVE' },
    });
    if (existing) {
      res.status(409).json({ error: 'A note already exists for this chapter. Update or archive it first.' });
      return;
    }

    const note = await prisma.chapterNote.create({
      data: { chapterId: chapter.id, body: body.body, anchor: body.anchor ?? null },
    });
    res.status(201).json({ data: note });
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId
// Handles both content updates and restore (status: ACTIVE)
router.patch('/:chapterNum/notes/:noteId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  if (!await ownerCheck(params.id, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const body = parseBody(UpdateChapterNoteSchema, req.body, res);
  if (!body) return;

  // Enforce single-active-note when restoring
  if (body.status === 'ACTIVE') {
    const chapterNum = parseInt(params.chapterNum, 10);
    if (!isNaN(chapterNum)) {
      const chapter = await prisma.chapter.findFirst({ where: { manuscriptId: params.id, number: chapterNum } });
      if (chapter) {
        const conflict = await prisma.chapterNote.findFirst({
          where: { chapterId: chapter.id, status: 'ACTIVE', NOT: { id: params.noteId } },
        });
        if (conflict) {
          res.status(409).json({ error: 'A note is already active for this chapter. Archive it first.' });
          return;
        }
      }
    }
  }

  try {
    const note = await prisma.chapterNote.update({ where: { id: params.noteId }, data: body });
    res.json({ data: note });
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId â€” soft delete
router.delete('/:chapterNum/notes/:noteId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  if (!await ownerCheck(params.id, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    const note = await prisma.chapterNote.update({
      where: { id: params.noteId },
      data: { status: 'ARCHIVED' },
    });
    res.json({ data: note });
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId/permanent â€” hard delete
router.delete('/:chapterNum/notes/:noteId/permanent', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  if (!await ownerCheck(params.id, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    await prisma.chapterNote.delete({ where: { id: params.noteId } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
