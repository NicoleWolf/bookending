import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { ArcProgramMode, ArcApplicationStatus } from '@prisma/client';

// mergeParams exposes :id (manuscriptId) from the parent manuscripts router
const router = Router({ mergeParams: true });

// ── writer: program config ────────────────────────────────────────────────────

// GET /api/manuscripts/:id/arc/program
// Writers get full data + application count; readers get public fields + their own application status
router.get('/program', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id }, select: { authorId: true } });
    const isOwner = ms?.authorId === userId;

    const program = await prisma.arcProgram.findUnique({
      where: { manuscriptId: id },
      include: {
        _count: { select: { applications: true } },
        applications: isOwner ? false : {
          where: { readerId: userId },
          select: { id: true, status: true, appliedAt: true, decidedAt: true, readingProgress: true },
        },
      },
    });

    if (!program) { res.json({ data: null }); return; }

    if (isOwner) {
      res.json({ data: program });
    } else {
      // Reader view — public fields + their own application + aggregate counts for social proof
      const [acceptedCount, pendingCount] = await Promise.all([
        prisma.arcApplication.count({ where: { programId: program.id, status: 'ACCEPTED' } }),
        prisma.arcApplication.count({ where: { programId: program.id, status: 'PENDING' } }),
      ]);
      const myApplication = (program.applications as {
        id: string; status: string; appliedAt: Date; decidedAt: Date | null; readingProgress: number;
      }[])[0] ?? null;
      res.json({
        data: {
          id:             program.id,
          isOpen:         program.isOpen,
          mode:           program.mode,
          cap:            program.cap,
          reviewDeadline: program.reviewDeadline,
          launchDate:     program.launchDate,
          openedAt:       program.openedAt,
          acceptedCount,
          pendingCount,
          myApplication,
        },
      });
    }
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/arc/program  — create or update program config
router.post('/program', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id } });
    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { mode, cap, reviewDeadline, launchDate } = req.body as {
      mode?: string; cap?: number | null; reviewDeadline?: string | null; launchDate?: string | null;
    };

    const program = await prisma.arcProgram.upsert({
      where: { manuscriptId: id },
      create: {
        manuscriptId: id,
        mode: (mode as ArcProgramMode) ?? 'MANUAL',
        cap: cap ?? null,
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
        launchDate: launchDate ? new Date(launchDate) : null,
      },
      update: {
        ...(mode ? { mode: mode as ArcProgramMode } : {}),
        ...(cap !== undefined ? { cap } : {}),
        ...(reviewDeadline !== undefined ? { reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null } : {}),
        ...(launchDate !== undefined ? { launchDate: launchDate ? new Date(launchDate) : null } : {}),
      },
      include: { _count: { select: { applications: true } } },
    });
    res.json({ data: program });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/arc/program/open
router.post('/program/open', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id } });
    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }
    if (ms.status === 'DRAFTING') { res.status(400).json({ error: 'ARC programs require manuscript to be In Revision or Published' }); return; }

    const program = await prisma.arcProgram.upsert({
      where: { manuscriptId: id },
      create: { manuscriptId: id, isOpen: true, openedAt: new Date() },
      update: { isOpen: true, openedAt: new Date(), closedAt: null },
    });
    res.json({ data: program });
  } catch (err) { next(err); }
});

// POST /api/manuscripts/:id/arc/program/close
router.post('/program/close', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id } });
    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const program = await prisma.arcProgram.update({
      where: { manuscriptId: id },
      data: { isOpen: false, closedAt: new Date() },
    });
    res.json({ data: program });
  } catch (err) { next(err); }
});

// ── writer: applications queue ────────────────────────────────────────────────

// GET /api/manuscripts/:id/arc/applications
router.get('/applications', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id } });
    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const program = await prisma.arcProgram.findUnique({ where: { manuscriptId: id } });
    if (!program) { res.json({ data: [] }); return; }

    const sort = (req.query.sort as string) ?? 'recency';

    const applications = await prisma.arcApplication.findMany({
      where: { programId: program.id },
      include: {
        reader: {
          select: {
            id: true, name: true, email: true, location: true, genres: true, subgenres: true,
          },
        },
      },
      orderBy: sort === 'progress'
        ? { readingProgress: 'desc' }
        : { appliedAt: 'desc' },
    });

    // Compute genre-match tier for each application
    const msGenres = [ms.genre, ms.subgenre].filter(Boolean).map(g => g!.toLowerCase());
    const withTier = applications.map(app => {
      const readerGenres = [
        ...(app.reader.genres ?? '').split(','),
        ...(app.reader.subgenres ?? '').split(','),
      ].map(g => g.trim().toLowerCase()).filter(Boolean);

      let genreTier: 'wheelhouse' | 'adjacent' | 'stretch' | 'unknown' = 'unknown';
      if (readerGenres.length === 0) {
        genreTier = 'unknown';
      } else {
        const overlap = msGenres.filter(g => readerGenres.includes(g)).length;
        if (overlap >= msGenres.length && msGenres.length > 0) genreTier = 'wheelhouse';
        else if (overlap > 0) genreTier = 'adjacent';
        else genreTier = 'stretch';
      }
      return { ...app, genreTier };
    });

    res.json({ data: withTier });
  } catch (err) { next(err); }
});

// PATCH /api/manuscripts/:id/arc/applications/:appId  — accept or decline
router.patch('/applications/:appId', async (req, res, next: NextFunction) => {
  const params = req.params as Record<string, string>;
  const { id, appId } = params;
  const authorId = req.user!.id;
  try {
    const ms = await prisma.manuscript.findUnique({ where: { id } });
    if (!ms) { res.status(404).json({ error: 'Manuscript not found' }); return; }
    if (ms.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const { status } = req.body as { status: ArcApplicationStatus };
    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      res.status(400).json({ error: 'status must be ACCEPTED or DECLINED' }); return;
    }

    const updated = await prisma.arcApplication.update({
      where: { id: appId },
      data: { status, decidedAt: new Date() },
      include: { reader: { select: { id: true, name: true, email: true } } },
    });
    res.json({ data: updated });
  } catch (err) { next(err); }
});

// ── reader: apply ─────────────────────────────────────────────────────────────

// POST /api/manuscripts/:id/arc/apply
router.post('/apply', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const readerId = req.user!.id;
  try {
    const program = await prisma.arcProgram.findUnique({ where: { manuscriptId: id } });
    if (!program) { res.status(404).json({ error: 'No ARC program found for this manuscript' }); return; }
    if (!program.isOpen) { res.status(400).json({ error: 'ARC program is not currently open' }); return; }

    // Check cap for AUTO mode
    if (program.mode === 'AUTO' && program.cap !== null) {
      const acceptedCount = await prisma.arcApplication.count({
        where: { programId: program.id, status: 'ACCEPTED' },
      });
      if (acceptedCount >= program.cap) {
        res.status(400).json({ error: 'ARC program is full' }); return;
      }
    }

    const { pitch } = req.body as { pitch?: string };
    const initialStatus: ArcApplicationStatus = program.mode === 'AUTO' ? 'ACCEPTED' : 'PENDING';

    const application = await prisma.arcApplication.upsert({
      where: { programId_readerId: { programId: program.id, readerId } },
      create: {
        programId: program.id,
        readerId,
        pitch: pitch?.trim() || null,
        status: initialStatus,
        decidedAt: program.mode === 'AUTO' ? new Date() : null,
      },
      update: {
        pitch: pitch?.trim() || null,
        status: initialStatus,
        decidedAt: program.mode === 'AUTO' ? new Date() : null,
      },
    });
    res.status(201).json({ data: application });
  } catch (err) { next(err); }
});

// ── reader: reading progress ──────────────────────────────────────────────────

// PATCH /api/manuscripts/:id/arc/progress
router.patch('/progress', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const readerId = req.user!.id;
  try {
    const program = await prisma.arcProgram.findUnique({ where: { manuscriptId: id } });
    if (!program) { res.status(404).json({ error: 'No ARC program found' }); return; }

    const { readingProgress } = req.body as { readingProgress: number };
    const app = await prisma.arcApplication.update({
      where: { programId_readerId: { programId: program.id, readerId } },
      data: { readingProgress: Math.min(100, Math.max(0, readingProgress)) },
    });
    res.json({ data: app });
  } catch (err) { next(err); }
});

// ── reader: withdraw ──────────────────────────────────────────────────────────

// POST /api/manuscripts/:id/arc/withdraw
router.post('/withdraw', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const readerId = req.user!.id;
  try {
    const program = await prisma.arcProgram.findUnique({ where: { manuscriptId: id } });
    if (!program) { res.status(404).json({ error: 'No ARC program found' }); return; }

    const app = await prisma.arcApplication.update({
      where: { programId_readerId: { programId: program.id, readerId } },
      data: { status: 'WITHDRAWN', decidedAt: new Date() },
    });
    res.json({ data: app });
  } catch (err) { next(err); }
});

// ── reader: post review ───────────────────────────────────────────────────────

// POST /api/manuscripts/:id/arc/review
router.post('/review', async (req, res, next: NextFunction) => {
  const { id } = req.params as Record<string, string>;
  const readerId = req.user!.id;
  try {
    const program = await prisma.arcProgram.findUnique({ where: { manuscriptId: id } });
    if (!program) { res.status(404).json({ error: 'No ARC program found' }); return; }

    const { body } = req.body as { body: string };
    if (!body?.trim()) { res.status(400).json({ error: 'Review body is required' }); return; }

    const now = new Date();
    const onTime = !program.reviewDeadline || now <= program.reviewDeadline;
    // Late reviews still post and are tagged ARC, but earn no Early Reader credit (enforced at credit-grant time)
    void onTime;

    const app = await prisma.arcApplication.update({
      where: { programId_readerId: { programId: program.id, readerId } },
      data: { reviewBody: body.trim(), reviewPostedAt: now, status: 'FULFILLED' },
    });
    res.json({ data: app });
  } catch (err) { next(err); }
});

export default router;
