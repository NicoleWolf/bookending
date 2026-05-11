import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { ManuscriptStatus, Visibility } from '@prisma/client';
import betaReadersRouter from './beta-readers';
import chapterNotesRouter from './chapterNotes';
import versionsRouter from './manuscriptVersions';
import { parseBody } from '../lib/validate';
import { CreateManuscriptSchema, UpdateManuscriptSchema } from '@bookending/shared';

const router = Router();

// GET /api/manuscripts — list the authed user's manuscripts
router.get('/', async (req, res) => {
  const authorId = req.user!.id;
  try {
    const manuscripts = await prisma.manuscript.findMany({
      where: { authorId }, orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { chapters: true } },
        chapters: { select: { title: true }, orderBy: { number: 'asc' } },
      },
    });
    res.json({ data: manuscripts });
  } catch {
    res.status(500).json({ error: 'Failed to fetch manuscripts' });
  }
});

// POST /api/manuscripts — create a manuscript
router.post('/', async (req, res) => {
  const authorId = req.user!.id;
  const body = parseBody(CreateManuscriptSchema, req.body, res);
  if (!body) return;

  try {
    const manuscript = await prisma.manuscript.create({
      data: {
        ...(body.id ? { id: body.id } : {}),
        title:          body.title,
        subtitle:       body.subtitle       ?? null,
        status:         (body.status        as ManuscriptStatus) ?? 'DRAFTING',
        visibility:     (body.visibility    as Visibility)       ?? 'PRIVATE',
        seriesName:     body.seriesName     ?? null,
        seriesNumber:   body.seriesNumber   ?? null,
        genre:          body.genre          ?? null,
        subgenre:       body.subgenre       ?? null,
        description:    body.description    ?? null,
        targetAudience: body.targetAudience ?? null,
        contentRating:  body.contentRating  ?? null,
        keywords:       body.keywords       ?? null,
        isbnEbook:      body.isbnEbook      ?? null,
        isbnPrint:      body.isbnPrint      ?? null,
        isbnPending:    body.isbnPending    ?? false,
        priceEbook:     body.priceEbook     ?? null,
        pricePaperback: body.pricePaperback ?? null,
        language:       body.language       ?? 'English',
        estimatedPages: body.estimatedPages ?? null,
        spineColor:     body.spineColor     ?? 'spine-amber',
        coverUrl:       body.coverUrl       ?? null,
        authorId,
      },
    });
    res.status(201).json({ data: manuscript });
  } catch {
    res.status(500).json({ error: 'Failed to create manuscript' });
  }
});

// PATCH /api/manuscripts/:id — update (owner only)
router.patch('/:id', async (req, res) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.manuscript.findUnique({ where: { id } });
  if (!existing)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(UpdateManuscriptSchema, req.body, res);
  if (!body) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manuscript = await prisma.manuscript.update({ where: { id }, data: body as any });
    res.json({ data: manuscript });
  } catch {
    res.status(500).json({ error: 'Failed to update manuscript' });
  }
});

// DELETE /api/manuscripts/:id — delete (owner only)
router.delete('/:id', async (req, res) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.manuscript.findUnique({ where: { id } });
  if (!existing)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.manuscript.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch {
    res.status(500).json({ error: 'Failed to delete manuscript' });
  }
});

// GET /api/manuscripts/:id/notes?status=ACTIVE|ARCHIVED|all
router.get('/:id/notes', async (req, res) => {
  const { id }   = req.params;
  const authorId = req.user!.id;
  const statusFilter = (req.query.status as string | undefined) ?? 'all';

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const chapters = await prisma.chapter.findMany({
      where: { manuscriptId: id },
      include: {
        notes: {
          where: statusFilter === 'all' ? undefined : { status: statusFilter as 'ACTIVE' | 'ARCHIVED' },
          orderBy: { updatedAt: 'desc' },
        },
      },
      orderBy: { number: 'asc' },
    });

    const data = chapters.flatMap(ch =>
      ch.notes.map(n => ({
        id: n.id, chapterId: n.chapterId, chapterNum: ch.number, chapterTitle: ch.title,
        body: n.body, anchor: n.anchor, status: n.status,
        createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
      }))
    );

    res.json({ data });
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ── Chapter content endpoints ─────────────────────────────────────────────

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text.split(' ').filter(Boolean).length : 0;
}

// GET /api/manuscripts/:id/chapters
router.get('/:id/chapters', async (req, res) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const chapters = await prisma.chapter.findMany({
      where:   { manuscriptId: id },
      orderBy: { number: 'asc' },
      select:  { id: true, number: true, title: true, content: true, wordCount: true },
    });
    res.json({ data: chapters });
  } catch {
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// PUT /api/manuscripts/:id/chapters/:chapterNum — upsert content + roll up word count
router.put('/:id/chapters/:chapterNum', async (req, res) => {
  const { id, chapterNum: raw } = req.params;
  const authorId    = req.user!.id;
  const chapterNum  = parseInt(raw, 10);

  if (isNaN(chapterNum)) { res.status(400).json({ error: 'chapterNum must be an integer' }); return; }

  const { title, content } = req.body as { title?: string; content?: string };
  if (content === undefined) { res.status(400).json({ error: 'content is required' }); return; }

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const wc = countWords(content);

  try {
    const existing = await prisma.chapter.findFirst({ where: { manuscriptId: id, number: chapterNum } });
    const chapter = existing
      ? await prisma.chapter.update({
          where: { id: existing.id },
          data:  { content, wordCount: wc, ...(title ? { title } : {}) },
        })
      : await prisma.chapter.create({
          data: { manuscriptId: id, number: chapterNum, title: title ?? `Chapter ${chapterNum + 1}`, content, wordCount: wc },
        });
    const allChapters = await prisma.chapter.findMany({
      where: { manuscriptId: id }, select: { wordCount: true },
    });
    await prisma.manuscript.update({
      where: { id },
      data:  { wordCount: allChapters.reduce((s, c) => s + c.wordCount, 0) },
    });
    res.json({ data: chapter });
  } catch (err) {
    console.error('[chapters PUT]', err);
    res.status(500).json({ error: 'Failed to save chapter' });
  }
});

// DELETE /api/manuscripts/:id/chapters/:chapterNum — remove a chapter
router.delete('/:id/chapters/:chapterNum', async (req, res) => {
  const { id, chapterNum: raw } = req.params;
  const authorId   = req.user!.id;
  const chapterNum = parseInt(raw, 10);

  if (isNaN(chapterNum)) { res.status(400).json({ error: 'chapterNum must be an integer' }); return; }

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const chapter = await prisma.chapter.findFirst({ where: { manuscriptId: id, number: chapterNum } });
    if (!chapter) { res.status(404).json({ error: 'Chapter not found' }); return; }
    await prisma.chapter.delete({ where: { id: chapter.id } });
    const allChapters = await prisma.chapter.findMany({
      where: { manuscriptId: id }, select: { wordCount: true },
    });
    await prisma.manuscript.update({
      where: { id },
      data:  { wordCount: allChapters.reduce((s, c) => s + c.wordCount, 0) },
    });
    res.json({ data: { deleted: true } });
  } catch (err) {
    console.error('[chapters DELETE]', err);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

router.use('/:id/readers', betaReadersRouter);
router.use('/:id/chapters', chapterNotesRouter);
router.use('/:id/versions', versionsRouter);

export default router;
