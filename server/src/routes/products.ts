import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { ProductStatus } from '@prisma/client';
import { parseBody } from '../lib/validate';
import { CreateProductSchema, UpdateProductSchema } from '@bookending/shared';

const router = Router();

// GET /api/products
router.get('/', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  try {
    const products = await prisma.product.findMany({
      where: { authorId }, orderBy: { createdAt: 'asc' },
    });
    res.json({ data: products });
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', async (req, res, next: NextFunction) => {
  const authorId = req.user!.id;
  const body = parseBody(CreateProductSchema, req.body, res);
  if (!body) return;

  try {
    const product = await prisma.product.create({
      data: {
        title:        body.title.trim(),
        type:         body.type.trim(),
        price:        body.price,
        status:       (body.status as ProductStatus) ?? 'DRAFT',
        featured:     body.featured     ?? false,
        digital:      body.digital      ?? false,
        stockCount:   body.stockCount   ?? null,
        manuscriptId: body.manuscriptId ?? null,
        authorId,
      },
    });
    res.status(201).json({ data: product });
  } catch (err) { next(err); }
});

// PATCH /api/products/:id
router.patch('/:id', async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Product not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const body = parseBody(UpdateProductSchema, req.body, res);
  if (!body) return;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.title        !== undefined ? { title: body.title.trim() }             : {}),
        ...(body.type         !== undefined ? { type: body.type.trim() }               : {}),
        ...(body.price        !== undefined ? { price: body.price }                    : {}),
        ...(body.status       !== undefined ? { status: body.status as ProductStatus } : {}),
        ...(body.featured     !== undefined ? { featured: body.featured }              : {}),
        ...(body.digital      !== undefined ? { digital: body.digital }                : {}),
        ...(body.stockCount   !== undefined ? { stockCount: body.stockCount }          : {}),
        ...(body.manuscriptId !== undefined ? { manuscriptId: body.manuscriptId }      : {}),
      },
    });
    res.json({ data: product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id — remove product (owner only)
router.delete('/:id', async (req, res, next: NextFunction) => {
  const { id } = req.params;
  const authorId = req.user!.id;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing)                    { res.status(404).json({ error: 'Product not found' }); return; }
  if (existing.authorId !== authorId) { res.status(403).json({ error: 'Forbidden' }); return; }

  try {
    await prisma.product.delete({ where: { id } });
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
});

export default router;
