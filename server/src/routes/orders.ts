import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { parseBody } from '../lib/validate';
import { CreateOrderSchema, PatchOrderSchema } from '@bookending/shared';

const router = Router();

// GET /api/orders — list the authed user's incoming orders
router.get('/', async (req, res) => {
  const userId = req.user!.id;
  try {
    const orders = await prisma.order.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
    });
    res.json({ data: orders });
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders — create an order (used for seeding and future checkout)
router.post('/', async (req, res) => {
  const userId = req.user!.id;
  const body = parseBody(CreateOrderSchema, req.body, res);
  if (!body) return;

  try {
    const order = await prisma.order.create({
      data: {
        num:             body.num            ?? '',
        customer:        body.customer.trim(),
        location:        body.location       ?? '',
        product:         body.product.trim(),
        amount:          Math.round(body.amount),
        status:          body.status         ?? 'new',
        notes:           body.notes          ?? null,
        signedRequested: body.signedRequested ?? false,
        letterRequested: body.letterRequested ?? false,
        digital:         body.digital        ?? false,
        addressLine1:    body.addressLine1   ?? null,
        addressCity:     body.addressCity    ?? null,
        addressCountry:  body.addressCountry ?? null,
        addressPostal:   body.addressPostal  ?? null,
        userId,
      },
    });
    res.status(201).json({ data: order });
  } catch {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PATCH /api/orders/:id — advance status (owner only)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing)               { res.status(404).json({ error: 'Order not found' }); return; }
  if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(PatchOrderSchema, req.body, res);
  if (!body) return;

  try {
    const order = await prisma.order.update({ where: { id }, data: { status: body.status } });
    res.json({ data: order });
  } catch {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
