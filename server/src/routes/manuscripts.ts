import { Router } from 'express';
import { prisma } from '../lib/prisma';
import type { ManuscriptStatus, BetaMode } from '@prisma/client';
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
    const data = manuscripts.map(m => ({
      ...m,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentWarnings: JSON.parse((m as any).contentWarnings ?? '[]') as string[],
    }));
    res.json({ data });
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
        betaMode:       (body.betaMode      as BetaMode)         ?? 'CLOSED',
        maxBetaReaders: body.maxBetaReaders ?? null,
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
    const { contentWarnings, ...rest } = body as typeof body & { contentWarnings?: string[] };
    const updateData: Record<string, unknown> = { ...rest };
    if (contentWarnings !== undefined) {
      updateData.contentWarnings = JSON.stringify(contentWarnings);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manuscript = await prisma.manuscript.update({ where: { id }, data: updateData as any });
    res.json({
      data: {
        ...manuscript,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentWarnings: JSON.parse((manuscript as any).contentWarnings ?? '[]') as string[],
      },
    });
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

// GET /api/manuscripts/:id/reader-annotations — submitted beta reader annotations (author only)
router.get('/:id/reader-annotations', async (req, res) => {
  const authorId = req.user!.id;
  const { id }   = req.params;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const annotations = await prisma.annotation.findMany({
      where:   { manuscriptRef: id, status: 'submitted' },
      orderBy: [{ chapterId: 'asc' }, { createdAt: 'asc' }],
      include: {
        user:    { select: { id: true, name: true } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });

    const data = annotations.map(a => {
      const parts    = a.user.name.trim().split(/\s+/);
      const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : a.user.name.slice(0, 2).toUpperCase();
      return {
        id:             a.id,
        readerId:       a.user.id,
        readerName:     a.user.name,
        readerInitials: initials,
        chapterId:      a.chapterId,
        paraId:         a.paraId,
        selectedText:   a.selectedText,
        note:           a.note,
        createdAt:      a.createdAt.toISOString(),
        replies:        a.replies.map(r => ({
          id:         r.id,
          authorRole: r.authorRole,
          body:       r.body,
          createdAt:  r.createdAt.toISOString(),
        })),
      };
    });

    res.json({ data });
  } catch (err) {
    console.error('[reader-annotations GET]', err);
    res.status(500).json({ error: 'Failed to fetch reader annotations' });
  }
});

// GET /api/manuscripts/:id/reader-impressions — per-reader impression curves (author only)
router.get('/:id/reader-impressions', async (req, res) => {
  const authorId = req.user!.id;
  const { id }   = req.params;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const points = await prisma.impressionPoint.findMany({
      where:   { manuscriptRef: id },
      orderBy: { chapterNum: 'asc' },
    });

    const userIds = [...new Set(points.map(p => p.userId))];
    const users   = userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    type ReaderEntry = { readerId: string; readerName: string; readerInitials: string; points: { chapterNum: number; stance: string }[] };
    const readerMap = new Map<string, ReaderEntry>();

    for (const p of points) {
      if (!readerMap.has(p.userId)) {
        const u      = userMap.get(p.userId);
        const name   = u?.name ?? 'Reader';
        const parts  = name.trim().split(/\s+/);
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();
        readerMap.set(p.userId, { readerId: p.userId, readerName: name, readerInitials: initials, points: [] });
      }
      readerMap.get(p.userId)!.points.push({ chapterNum: p.chapterNum, stance: p.stance });
    }

    res.json({ data: Array.from(readerMap.values()) });
  } catch (err) {
    console.error('[reader-impressions GET]', err);
    res.status(500).json({ error: 'Failed to fetch reader impressions' });
  }
});

router.use('/:id/readers', betaReadersRouter);
router.use('/:id/chapters', chapterNotesRouter);
router.use('/:id/versions', versionsRouter);

export default router;
