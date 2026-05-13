import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { DispatchStatus } from '@prisma/client';
import { parseBody } from '../lib/validate';
import { CreateDispatchSchema, PatchDispatchSchema } from '@bookending/shared';

const router = Router();

// GET /api/dispatches
router.get('/', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  try {
    const dispatches = await prisma.dispatch.findMany({
      where: { authorId }, orderBy: { createdAt: 'desc' },
    });
    res.json({ data: dispatches });
  } catch (err) { next(err); }
});

// POST /api/dispatches
router.post('/', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const body = parseBody(CreateDispatchSchema, req.body, res);
  if (!body) return;

  try {
    const dispatch = await prisma.dispatch.create({
      data: {
        issue:      body.issue?.trim()   ?? 'Draft',
        subject:    body.subject.trim(),
        body:       body.body?.trim()    ?? '',
        recipients: body.recipients      ?? 'all',
        status:     (body.status as DispatchStatus) ?? 'DRAFT',
        sentAt:     body.sentAt ? new Date(body.sentAt) : null,
        authorId,
      },
    });
    res.status(201).json({ data: dispatch });
  } catch (err) { next(err); }
});

// PATCH /api/dispatches/:id
router.patch('/:id', async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.dispatch.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Dispatch not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(PatchDispatchSchema, req.body, res);
  if (!body) return;

  try {
    const dispatch = await prisma.dispatch.update({
      where: { id },
      data: {
        ...(body.subject    !== undefined ? { subject: body.subject.trim() }          : {}),
        ...(body.body       !== undefined ? { body: body.body.trim() }                : {}),
        ...(body.recipients !== undefined ? { recipients: body.recipients }            : {}),
        ...(body.status     !== undefined ? { status: body.status as DispatchStatus } : {}),
        ...(body.sentAt     !== undefined ? { sentAt: body.sentAt ? new Date(body.sentAt) : null } : {}),
      },
    });
    res.json({ data: dispatch });
  } catch (err) { next(err); }
});

// DELETE /api/dispatches/:id
router.delete('/:id', async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.dispatch.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Dispatch not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.dispatch.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
