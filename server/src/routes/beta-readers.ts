import { Router } from 'express';
import { prisma } from '../lib/prisma';

// mergeParams exposes :id (manuscriptId) from the parent manuscripts router
const router = Router({ mergeParams: true });

async function ownerCheck(manuscriptId: string, userId: string): Promise<boolean> {
  const ms = await prisma.manuscript.findUnique({ where: { id: manuscriptId } });
  return !!ms && ms.authorId === userId;
}

// GET /api/manuscripts/:id/readers
router.get('/', async (req, res) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    const readers = await prisma.betaReader.findMany({
      where:   { manuscriptId },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({ data: readers });
  } catch {
    res.status(500).json({ error: 'Failed to fetch readers' });
  }
});

// POST /api/manuscripts/:id/readers
router.post('/', async (req, res) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'name and email are required' }); return;
  }
  try {
    const reader = await prisma.betaReader.create({
      data: { name: name.trim(), email: email.trim(), manuscriptId },
    });
    res.status(201).json({ data: reader });
  } catch {
    res.status(500).json({ error: 'Failed to add reader' });
  }
});

// PATCH /api/manuscripts/:id/readers/:readerId
router.patch('/:readerId', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const readerId     = params.readerId;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  const { progress, verdict, notesCount } = req.body as {
    progress?: number; verdict?: string; notesCount?: number;
  };
  try {
    const reader = await prisma.betaReader.update({
      where: { id: readerId },
      data: {
        ...(progress    !== undefined ? { progress, lastSeenAt: new Date() } : {}),
        ...(verdict     !== undefined ? { verdict }     : {}),
        ...(notesCount  !== undefined ? { notesCount }  : {}),
      },
    });
    res.json({ data: reader });
  } catch {
    res.status(500).json({ error: 'Failed to update reader' });
  }
});

// DELETE /api/manuscripts/:id/readers/:readerId
router.delete('/:readerId', async (req, res) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const readerId     = params.readerId;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    await prisma.betaReader.delete({ where: { id: readerId } });
    res.json({ data: { deleted: true } });
  } catch {
    res.status(500).json({ error: 'Failed to remove reader' });
  }
});

export default router;
