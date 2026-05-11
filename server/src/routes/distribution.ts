import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { CreateChannelSchema, PatchChannelSchema } from '@bookending/shared';

const router = Router();

// GET /api/distribution — list the authed user's channels
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  try {
    const channels = await prisma.distributionChannel.findMany({
      where: { userId }, orderBy: { createdAt: 'asc' },
    });
    res.json({ data: channels });
  } catch {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// POST /api/distribution — create a channel
router.post('/', async (req, res) => {
  const userId = req.user!.id;
  const body = parseBody(CreateChannelSchema, req.body, res);
  if (!body) return;

  try {
    const channel = await prisma.distributionChannel.create({
      data: {
        name:      body.name.trim(),
        kind:      body.kind.trim(),
        status:    body.status    ?? 'draft',
        sku:       body.sku       ?? null,
        royalty:   body.royalty   ?? null,
        listPrice: body.listPrice ?? null,
        formats:   Array.isArray(body.formats) ? body.formats.join(',') : '',
        userId,
      },
    });
    res.status(201).json({ data: channel });
  } catch {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// PATCH /api/distribution/:id — update channel (owner only)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.distributionChannel.findUnique({ where: { id } });
  if (!existing)               { res.status(404).json({ error: 'Channel not found' }); return; }
  if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(PatchChannelSchema, req.body, res);
  if (!body) return;

  try {
    const channel = await prisma.distributionChannel.update({
      where: { id },
      data: {
        ...(body.status    !== undefined ? { status: body.status }                              : {}),
        ...(body.sku       !== undefined ? { sku: body.sku }                                   : {}),
        ...(body.royalty   !== undefined ? { royalty: body.royalty }                           : {}),
        ...(body.listPrice !== undefined ? { listPrice: body.listPrice }                       : {}),
        ...(body.formats   !== undefined ? { formats: body.formats.join(',') }                 : {}),
      },
    });
    res.json({ data: channel });
  } catch {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

export default router;
