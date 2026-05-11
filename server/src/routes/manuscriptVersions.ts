import { Router } from 'express';
import { prisma } from '../lib/prisma';

// mergeParams exposes :id (manuscriptId) from the parent manuscripts router
const router = Router({ mergeParams: true });

async function ownerCheck(manuscriptId: string, userId: string): Promise<boolean> {
  const ms = await prisma.manuscript.findUnique({ where: { id: manuscriptId } });
  return !!ms && ms.authorId === userId;
}

// GET /api/manuscripts/:id/versions
// Returns version list (metadata only, no chapter content) for this user, newest first.
router.get('/', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const userId = req.user!.id;

  if (!await ownerCheck(manuscriptId, userId)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const versions = await (prisma as any).manuscriptVersion.findMany({
      where:   { manuscriptId, userId },
      orderBy: { number: 'desc' },
      select:  { id: true, number: true, label: true, createdAt: true },
    });
    res.json({ data: versions });
  } catch {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/manuscripts/:id/versions
// Snapshots all current DB chapters into a new version.
router.post('/', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const userId = req.user!.id;

  if (!await ownerCheck(manuscriptId, userId)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  try {
    const chapters = await prisma.chapter.findMany({
      where:   { manuscriptId },
      orderBy: { number: 'asc' },
      select:  { number: true, title: true, content: true, wordCount: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latest = await (prisma as any).manuscriptVersion.findFirst({
      where:   { manuscriptId, userId },
      orderBy: { number: 'desc' },
      select:  { number: true },
    });
    const nextNumber = ((latest?.number ?? 0) as number) + 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const version = await (prisma as any).manuscriptVersion.create({
      data: {
        manuscriptId,
        userId,
        number: nextNumber,
        label:  `Version ${nextNumber}`,
        chapters: {
          create: chapters.map(ch => ({
            chapterNum: ch.number,
            title:      ch.title,
            content:    ch.content ?? '',
            wordCount:  ch.wordCount,
          })),
        },
      },
      select: { id: true, number: true, label: true, createdAt: true },
    });

    res.status(201).json({ data: version });
  } catch (err) {
    console.error('[versions POST]', err);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// GET /api/manuscripts/:id/versions/:versionId
// Returns a version with its full chapter content.
router.get('/:versionId', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const userId = req.user!.id;

  if (!await ownerCheck(manuscriptId, userId)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const version = await (prisma as any).manuscriptVersion.findFirst({
      where:   { id: params.versionId, manuscriptId, userId },
      include: { chapters: { orderBy: { chapterNum: 'asc' } } },
    });

    if (!version) { res.status(404).json({ error: 'Version not found' }); return; }
    res.json({ data: version });
  } catch {
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

// POST /api/manuscripts/:id/versions/:versionId/restore
// Writes version chapters back to the live Chapter table and rolls up word count.
router.post('/:versionId/restore', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const userId = req.user!.id;

  if (!await ownerCheck(manuscriptId, userId)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const version = await (prisma as any).manuscriptVersion.findFirst({
      where:   { id: params.versionId, manuscriptId, userId },
      include: { chapters: true },
    });
    if (!version) { res.status(404).json({ error: 'Version not found' }); return; }

    for (const vc of version.chapters) {
      const existing = await prisma.chapter.findFirst({
        where: { manuscriptId, number: vc.chapterNum },
      });
      if (existing) {
        await prisma.chapter.update({
          where: { id: existing.id },
          data:  { title: vc.title, wordCount: vc.wordCount },
        });
        await prisma.$executeRaw`UPDATE "Chapter" SET content = ${vc.content} WHERE id = ${existing.id}`;
      } else {
        const created = await prisma.chapter.create({
          data: { manuscriptId, number: vc.chapterNum, title: vc.title, wordCount: vc.wordCount },
        });
        await prisma.$executeRaw`UPDATE "Chapter" SET content = ${vc.content} WHERE id = ${created.id}`;
      }
    }

    const allChapters = await prisma.chapter.findMany({
      where: { manuscriptId }, select: { wordCount: true },
    });
    await prisma.manuscript.update({
      where: { id: manuscriptId },
      data:  { wordCount: allChapters.reduce((s, c) => s + c.wordCount, 0) },
    });

    res.json({ data: { restored: true, versionId: params.versionId } });
  } catch (err) {
    console.error('[versions restore]', err);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

export default router;
