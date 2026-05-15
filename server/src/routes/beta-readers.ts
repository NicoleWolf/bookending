import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { JoinBetaRequestSchema, PatchBetaRequestSchema } from '@bookending/shared';
import type { Prisma } from '@prisma/client';
import { logger } from '../lib/logger';

// mergeParams exposes :id (manuscriptId) from the parent manuscripts router
const router = Router({ mergeParams: true });

async function ownerCheck(manuscriptId: string, userId: string): Promise<boolean> {
  const ms = await prisma.manuscript.findUnique({ where: { id: manuscriptId } });
  return !!ms && ms.authorId === userId;
}

// GET /api/manuscripts/:id/readers
router.get('/', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/readers â€” writer manually adds a reader by name+email
router.post('/', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/readers/:readerId
router.patch('/:readerId', async (req, res, next: NextFunction) => {
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
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/readers/:readerId
router.delete('/:readerId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const readerId     = params.readerId;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    await prisma.betaReader.delete({ where: { id: readerId } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

// â”€â”€ Self-enrollment endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/manuscripts/:id/readers/join â€” reader self-joins a PUBLIC manuscript
router.post('/join', async (req, res, next: NextFunction) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  const userId = req.user!.id;

  const ms = await prisma.manuscript.findUnique({
    where: { id: manuscriptId },
    include: { _count: { select: { betaReaders: true } } },
  });
  if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.betaMode !== 'PUBLIC') {
    res.status(400).json({ error: 'This manuscript is not open for direct enrollment' }); return;
  }
  if (ms.maxBetaReaders !== null && ms._count.betaReaders >= ms.maxBetaReaders) {
    res.status(409).json({ error: 'This beta read is full' }); return;
  }

  const existing = await prisma.betaReader.findFirst({ where: { manuscriptId, userId } });
  if (existing) { res.status(409).json({ error: 'Already enrolled' }); return; }

  try {
    // Ensure User row exists — may be missing if DB provisioning failed at login time
    const user = await prisma.user.upsert({
      where:  { id: userId },
      update: {},
      create: {
        id:    userId,
        email: req.user!.email,
        name:  req.user!.email,
        role:  req.user!.role,
      },
    });
    const reader = await prisma.betaReader.create({
      data: {
        name:         user.name,
        email:        user.email,
        manuscriptId,
        userId,
      },
    });

    // Seed a ReadingProgress row so the manuscript appears in the reader's hub
    await prisma.readingProgress.upsert({
      where:  { userId_manuscriptRef: { userId, manuscriptRef: manuscriptId } },
      update: {},
      create: { userId, manuscriptRef: manuscriptId, lastOpenedAt: new Date() },
    });

    res.status(201).json({ data: reader });
  } catch (err) {
    logger.error('JOIN /readers/join failed', { userId, manuscriptId, err });
    next(err);
  }
});

// â”€â”€ Join-request endpoints (REQUEST betaMode) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/manuscripts/:id/readers/requests â€” reader files a request
router.post('/requests', async (req, res, next: NextFunction) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  const userId = req.user!.id;

  const body = parseBody(JoinBetaRequestSchema, req.body, res);
  if (!body) return;

  const ms = await prisma.manuscript.findUnique({
    where: { id: manuscriptId },
    include: { _count: { select: { betaReaders: true } } },
  });
  if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
  if (ms.betaMode !== 'REQUEST') {
    res.status(400).json({ error: 'This manuscript does not accept read requests' }); return;
  }
  if (ms.maxBetaReaders !== null && ms._count.betaReaders >= ms.maxBetaReaders) {
    res.status(409).json({ error: 'This beta read is full' }); return;
  }

  const alreadyEnrolled = await prisma.betaReader.findFirst({ where: { manuscriptId, userId } });
  if (alreadyEnrolled) { res.status(409).json({ error: 'Already enrolled' }); return; }

  try {
    const request = await prisma.betaJoinRequest.create({
      data: { manuscriptId, userId, note: body.note ?? null },
      include: { user: { select: { id: true, name: true } } },
    });
    res.status(201).json({ data: request });
  } catch (err) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ error: 'A request is already pending for this manuscript' }); return;
    }
    next(err);
  }
});

// GET /api/manuscripts/:id/readers/requests â€” author lists pending requests
router.get('/requests', async (req, res, next: NextFunction) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    const requests = await prisma.betaJoinRequest.findMany({
      where: { manuscriptId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json({ data: requests });
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/readers/requests/:requestId â€” author approves or declines
router.patch('/requests/:requestId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const requestId    = params.requestId;

  if (!await ownerCheck(manuscriptId, req.user!.id)) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }

  const body = parseBody(PatchBetaRequestSchema, req.body, res);
  if (!body) return;

  const joinRequest = await prisma.betaJoinRequest.findUnique({ where: { id: requestId } });
  if (!joinRequest || joinRequest.manuscriptId !== manuscriptId) {
    res.status(404).json({ error: 'Request not found' }); return;
  }
  if (joinRequest.status !== 'PENDING') {
    res.status(409).json({ error: 'Request is no longer pending' }); return;
  }

  try {
    if (body.status === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        const ms = await tx.manuscript.findUnique({
          where: { id: manuscriptId },
          include: { _count: { select: { betaReaders: true } } },
        });
        if (!ms) throw new Error('not_found');
        if (ms.maxBetaReaders !== null && ms._count.betaReaders >= ms.maxBetaReaders) {
          throw new Error('full');
        }

        const user = await tx.user.findUnique({ where: { id: joinRequest.userId } });
        await tx.betaReader.create({
          data: {
            name: user?.name ?? 'Reader',
            email: user?.email ?? '',
            manuscriptId,
            userId: joinRequest.userId,
          },
        });
        await tx.betaJoinRequest.update({
          where: { id: requestId },
          data: { status: 'APPROVED', decidedAt: new Date() },
        });
      });
    } else {
      await prisma.betaJoinRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED', decidedAt: new Date() },
      });
    }
    res.json({ data: { status: body.status } });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'full')      { res.status(409).json({ error: 'Beta read is now full' }); return; }
    if (msg === 'not_found') { res.status(404).json({ error: 'Manuscript not found' }); return; }
    next(err);
  }
});

// DELETE /api/manuscripts/:id/readers/requests/mine â€” reader withdraws their own pending request
router.delete('/requests/mine', async (req, res, next: NextFunction) => {
  const manuscriptId = (req.params as Record<string, string>).id;
  const userId = req.user!.id;
  try {
    await prisma.betaJoinRequest.updateMany({
      where: { manuscriptId, userId, status: 'PENDING' },
      data: { status: 'WITHDRAWN' },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

// DELETE /api/manuscripts/:id/readers/requests/:requestId â€” reader withdraws their request
router.delete('/requests/:requestId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  const manuscriptId = params.id;
  const requestId    = params.requestId;
  const userId = req.user!.id;

  const joinRequest = await prisma.betaJoinRequest.findUnique({ where: { id: requestId } });
  if (!joinRequest || joinRequest.manuscriptId !== manuscriptId) {
    res.status(404).json({ error: 'Request not found' }); return;
  }
  if (joinRequest.userId !== userId) {
    res.status(403).json({ error: 'Forbidden' }); return;
  }
  try {
    await prisma.betaJoinRequest.update({
      where: { id: requestId },
      data: { status: 'WITHDRAWN' },
    });
    res.json({ data: { withdrawn: true } });
  } catch (err) { next(err); }
});

export default router;
