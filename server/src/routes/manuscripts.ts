import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { ManuscriptStatus, BetaMode } from '@prisma/client';
import betaReadersRouter from './beta-readers';
import chapterNotesRouter from './chapterNotes';
import versionsRouter from './manuscriptVersions';
import arcProgramRouter from './arc-program';
import { parseBody } from '../lib/validate';
import { CreateManuscriptSchema, UpdateManuscriptSchema } from '@bookending/shared';

const router = Router();

// GET /api/manuscripts â€” list the authed user's manuscripts
router.get('/', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// POST /api/manuscripts â€” create a manuscript
router.post('/', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id â€” update (owner only)
router.patch('/:id', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id â€” delete (owner only)
router.delete('/:id', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.manuscript.findUnique({ where: { id } });
  if (!existing)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.manuscript.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/instructions
router.get('/:id/instructions', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id }, select: { authorId: true, readerInstructions: true } });
    if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }
    res.json({ data: { readerInstructions: ms.readerInstructions } });
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/notes?status=ACTIVE|ARCHIVED|all
router.get('/:id/notes', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// â”€â”€ Chapter content endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text.split(' ').filter(Boolean).length : 0;
}

// GET /api/manuscripts/:id/chapters
router.get('/:id/chapters', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// PUT /api/manuscripts/:id/chapters/:chapterNum â€” upsert content + roll up word count
router.put('/:id/chapters/:chapterNum', async (req, res, next: NextFunction) => {
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

  function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

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

    // Annotation graduation: during IN_REVISION, check if anchors still exist in the revised text
    if (ms.status === 'IN_REVISION') {
      const plainText = stripHtml(content);
      const anchored = await prisma.annotation.findMany({
        where: { manuscriptRef: id, chapterId: chapterNum, status: 'archived_in_revision' },
        select: { id: true, selectedText: true },
      });
      const toGraduate = anchored
        .filter(a => a.selectedText && !plainText.includes(a.selectedText.toLowerCase()))
        .map(a => a.id);
      if (toGraduate.length > 0) {
        await prisma.annotation.updateMany({
          where: { id: { in: toGraduate } },
          data:  { status: 'graduated' },
        });
      }
    }

    const allChapters = await prisma.chapter.findMany({
      where: { manuscriptId: id }, select: { wordCount: true },
    });
    await prisma.manuscript.update({
      where: { id },
      data:  { wordCount: allChapters.reduce((s, c) => s + c.wordCount, 0) },
    });
    res.json({ data: chapter });
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/chapters/:chapterNum â€” remove a chapter
router.delete('/:id/chapters/:chapterNum', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/reader-annotations â€” submitted beta reader annotations (author only)
router.get('/:id/reader-annotations', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const { id }   = req.params;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const annotations = await prisma.annotation.findMany({
      where:   { manuscriptRef: id, status: { in: ['submitted', 'archived_in_revision'] } },
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
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/reader-impressions â€” per-reader impression curves (author only)
router.get('/:id/reader-impressions', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/reader-chapter-notes — all submitted reader chapter notes (author only)
router.get('/:id/reader-chapter-notes', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const { id }   = req.params;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const notes = await prisma.readerChapterNote.findMany({
      where:   { manuscriptRef: id, status: { in: ['submitted', 'archived_in_revision'] } },
      orderBy: [{ chapterNum: 'asc' }, { createdAt: 'asc' }],
      include: { user: { select: { name: true } } },
    });
    res.json({ data: notes.map(n => ({
      id:         n.id,
      chapterNum: n.chapterNum,
      body:       n.body,
      readerName: n.user.name,
      createdAt:  n.createdAt.toISOString(),
    })) });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/enter-revision — transition to IN_REVISION, archive reader feedback
router.post('/:id/enter-revision', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                         { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId)    { res.status(403).json({ error: 'Forbidden' }); return; }
  if (ms.status === 'IN_REVISION') { res.status(400).json({ error: 'Already in revision' }); return; }

  try {
    const [updated] = await Promise.all([
      prisma.manuscript.update({
        where: { id },
        data:  { status: 'IN_REVISION', revisionPausedAt: new Date() },
      }),
      prisma.annotation.updateMany({
        where: { manuscriptRef: id, status: 'submitted' },
        data:  { status: 'archived_in_revision' },
      }),
      prisma.readerChapterNote.updateMany({
        where: { manuscriptRef: id, status: 'submitted' },
        data:  { status: 'archived_in_revision' },
      }),
      prisma.betaReader.updateMany({
        where: { manuscriptId: id },
        data:  { devotionQueued: true },
      }),
    ]);
    res.json({ data: { ...updated, revisionPausedAt: updated.revisionPausedAt?.toISOString() ?? null } });
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/editorial-note — update or clear the author's note to readers
router.patch('/:id/editorial-note', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;
  const { note } = req.body as { note?: string };

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const updated = await prisma.manuscript.update({
      where: { id },
      data:  { editorialNote: note ?? null },
    });
    res.json({ data: { editorialNote: updated.editorialNote } });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/open-door — exit IN_REVISION, apply queued devotion + ARC reservation
router.post('/:id/open-door', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                         { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId)    { res.status(403).json({ error: 'Forbidden' }); return; }
  if (ms.status !== 'IN_REVISION') { res.status(400).json({ error: 'Manuscript is not in revision' }); return; }

  try {
    const [updated] = await Promise.all([
      prisma.manuscript.update({
        where: { id },
        data:  { status: 'DRAFTING', revisionPausedAt: null },
      }),
      prisma.betaReader.updateMany({
        where: { manuscriptId: id, devotionQueued: true },
        data:  { devotionQueued: false, arcReservationEarned: true },
      }),
    ]);
    res.json({ data: { status: updated.status, revisionPausedAt: null } });
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/notes-from-before — writer's view of archived reader feedback
router.get('/:id/notes-from-before', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const [annotations, chapterNotes] = await Promise.all([
      prisma.annotation.findMany({
        where:   { manuscriptRef: id, status: 'archived_in_revision' },
        orderBy: [{ chapterId: 'asc' }, { createdAt: 'asc' }],
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.readerChapterNote.findMany({
        where:   { manuscriptRef: id, status: 'archived_in_revision' },
        orderBy: [{ chapterNum: 'asc' }, { createdAt: 'asc' }],
        include: { user: { select: { name: true } } },
      }),
    ]);

    const data = [
      ...annotations.map(a => ({
        id:           a.id,
        kind:         'annotation' as const,
        chapterNum:   a.chapterId,
        readerName:   a.user.name,
        selectedText: a.selectedText,
        body:         a.note,
        revisionTag:  a.revisionTag,
        createdAt:    a.createdAt.toISOString(),
      })),
      ...chapterNotes.map(n => ({
        id:           n.id,
        kind:         'chapter_note' as const,
        chapterNum:   n.chapterNum,
        readerName:   n.user.name,
        selectedText: null,
        body:         n.body,
        revisionTag:  n.revisionTag,
        createdAt:    n.createdAt.toISOString(),
      })),
    ].sort((a, b) => a.chapterNum - b.chapterNum);

    res.json({ data });
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/notes-from-before/:noteId — tag an archived note (Open/Addressed/Themed)
router.patch('/:id/notes-from-before/:noteId', async (req, res, next: NextFunction) => {
  const { id, noteId } = req.params;
  const authorId       = req.user!.id;
  const { kind, revisionTag } = req.body as { kind: 'annotation' | 'chapter_note'; revisionTag: string | null };

  const ms = await prisma.manuscript.findUnique({ where: { id } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    if (kind === 'annotation') {
      const updated = await prisma.annotation.update({
        where: { id: noteId },
        data:  { revisionTag: revisionTag ?? null },
      });
      res.json({ data: { id: updated.id, revisionTag: updated.revisionTag } });
    } else {
      const updated = await prisma.readerChapterNote.update({
        where: { id: noteId },
        data:  { revisionTag: revisionTag ?? null },
      });
      res.json({ data: { id: updated.id, revisionTag: updated.revisionTag } });
    }
  } catch (err) { next(err); }
});

// GET /api/manuscripts/:id/revision-changelog — list changelog entries
router.get('/:id/revision-changelog', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({ where: { id }, select: { authorId: true, revisionChangelog: true } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const entries = JSON.parse(ms.revisionChangelog ?? '[]') as unknown[];
    res.json({ data: entries });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/revision-changelog — add a changelog entry
router.post('/:id/revision-changelog', async (req, res, next: NextFunction) => {
  const { id }   = req.params;
  const authorId = req.user!.id;
  const { noteId, noteKind, chapterNum, description } = req.body as {
    noteId?: string; noteKind?: string; chapterNum?: number; description: string;
  };
  if (!description?.trim()) { res.status(400).json({ error: 'description is required' }); return; }

  const ms = await prisma.manuscript.findUnique({ where: { id }, select: { authorId: true, revisionChangelog: true } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const entries = JSON.parse(ms.revisionChangelog ?? '[]') as unknown[];
    const newEntry = { noteId: noteId ?? null, noteKind: noteKind ?? null, chapterNum: chapterNum ?? null, description: description.trim(), addedAt: new Date().toISOString() };
    entries.push(newEntry);
    await prisma.manuscript.update({ where: { id }, data: { revisionChangelog: JSON.stringify(entries) } });
    res.status(201).json({ data: newEntry });
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/revision-changelog/:idx — remove a changelog entry by index
router.delete('/:id/revision-changelog/:idx', async (req, res, next: NextFunction) => {
  const { id, idx: rawIdx } = req.params;
  const authorId = req.user!.id;
  const idx = parseInt(rawIdx, 10);
  if (isNaN(idx)) { res.status(400).json({ error: 'idx must be an integer' }); return; }

  const ms = await prisma.manuscript.findUnique({ where: { id }, select: { authorId: true, revisionChangelog: true } });
  if (!ms)                      { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    const entries = JSON.parse(ms.revisionChangelog ?? '[]') as unknown[];
    entries.splice(idx, 1);
    await prisma.manuscript.update({ where: { id }, data: { revisionChangelog: JSON.stringify(entries) } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

router.use('/:id/readers', betaReadersRouter);
router.use('/:id/chapters', chapterNotesRouter);
router.use('/:id/versions', versionsRouter);
router.use('/:id/arc', arcProgramRouter);

export default router;
