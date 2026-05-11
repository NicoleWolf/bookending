import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { SettingsPayloadSchema } from '@bookending/shared';

const router = Router();

// GET /api/storefront/settings — fetch or return empty defaults
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  const settings = await prisma.storefrontSettings.findUnique({ where: { userId } });
  res.json({ data: settings ?? null });
});

// PUT /api/storefront/settings — upsert
router.put('/', async (req, res) => {
  const userId = req.user!.id;
  const body = parseBody(SettingsPayloadSchema, req.body, res);
  if (!body) return;

  const data: Record<string, unknown> = {};
  const fields = [
    'shopName', 'shopSlug', 'shopTagline', 'shipsFrom',
    'notifPerOrder', 'notifDigest', 'webhookUrl',
    'collectVat', 'iossNumber', 'ukVatNumber', 'lowStockAt',
    'emailTemplate', 'packingTemplate', 'letterTemplate',
    'refundPolicy', 'returnWindow', 'returnShipping', 'digitalRefunds',
  ] as const;

  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  const settings = await prisma.storefrontSettings.upsert({
    where:  { userId },
    update: data,
    create: { userId, ...data },
  });

  res.json({ data: settings });
});

export default router;
