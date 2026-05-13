import { Router } from 'express';
import type { NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { requireAdmin } from '../middleware/requireAdmin';
import { logger } from '../lib/logger';

const router = Router();

function serializeUser(u: {
  id: string; name: string; email: string; isAdmin: boolean; status: string;
  role: string; lastLoginAt: Date | null; createdAt: Date;
}) {
  return {
    id: u.id, name: u.name, email: u.email,
    isAdmin: u.isAdmin, status: u.status, role: u.role,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

// â”€â”€ Available to any authenticated user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/admin/whoami â€” sync isAdmin from DB after mock login
router.get('/whoami', (req, res) => {
  res.json({ data: { id: req.user!.id, email: req.user!.email, role: req.user!.role, isAdmin: req.user!.isAdmin } });
});

// Everything below requires admin
router.use(requireAdmin);

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/users', async (_req, res, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, isAdmin: true, status: true, role: true, lastLoginAt: true, createdAt: true },
    });
    res.json({ data: users.map(serializeUser) });
  } catch (err) { next(err); }
});

router.patch('/users/:id', async (req, res, next: NextFunction) => {
  const schema = z.object({
    name:  z.string().min(1).optional(),
    email: z.string().email().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  parsed.data,
    });

    if (parsed.data.email) {
      try { await supabaseAdmin.auth.admin.updateUserById(req.params.id, { email: parsed.data.email }); }
      catch { /* dev-only user, no Supabase account */ }
    }

    res.json({ data: serializeUser(user) });
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req, res, next: NextFunction) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot delete your own account' }); return;
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2003') {
      res.status(409).json({ error: 'User has manuscripts or orders. Delete their content first.' }); return;
    }
    next(err); return;
  }
  try { await supabaseAdmin.auth.admin.deleteUser(req.params.id); } catch { /* dev-only user */ }
  res.json({ data: { deleted: true } });
});

router.patch('/users/:id/role', async (req, res, next: NextFunction) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot modify your own admin status' }); return;
  }
  const parsed = z.object({ isAdmin: z.boolean() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'isAdmin (boolean) is required' }); return; }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { isAdmin: parsed.data.isAdmin },
    });
    res.json({ data: serializeUser(user) });
  } catch (err) { next(err); }
});

router.patch('/users/:id/status', async (req, res, next: NextFunction) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot suspend your own account' }); return;
  }
  const parsed = z.object({ status: z.enum(['active', 'suspended']) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'status must be "active" or "suspended"' }); return; }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data:  { status: parsed.data.status },
    });

    try {
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        ban_duration: parsed.data.status === 'suspended' ? '876000h' : 'none',
      });
    } catch { /* dev-only user */ }

    res.json({ data: serializeUser(user) });
  } catch (err) { next(err); }
});

// POST /api/admin/users/:id/reset-password
// Returns a Supabase recovery link for the admin to share with the user.
router.post('/users/:id/reset-password', async (req, res, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type:    'recovery',
      email:   user.email,
      options: { redirectTo: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/reset-password` },
    });
    if (error || !data.properties) throw error ?? new Error('No link generated');
    res.json({ data: { link: data.properties.action_link } });
  } catch {
    res.status(422).json({
      error: 'This user was created via dev bypass and has no Supabase account. Password reset is unavailable.',
    });
  }
  void next; // satisfy NextFunction signature requirement
});

// â”€â”€ Invites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

router.get('/invites', async (_req, res, next: NextFunction) => {
  try {
    const invites = await prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { invitedBy: { select: { name: true, email: true } } },
    });
    res.json({ data: invites.map(i => ({
      id: i.id, email: i.email, token: i.token,
      expiresAt: i.expiresAt.toISOString(),
      usedAt:    i.usedAt?.toISOString() ?? null,
      invitedBy: i.invitedBy,
      createdAt: i.createdAt.toISOString(),
    })) });
  } catch (err) { next(err); }
});

router.post('/invites', async (req, res, next: NextFunction) => {
  const parsed = z.object({ email: z.string().email('A valid email is required') }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }

  const { email } = parsed.data;
  const token     = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const invite = await prisma.invite.create({
      data:    { email, token, expiresAt, invitedById: req.user!.id },
      include: { invitedBy: { select: { name: true, email: true } } },
    });

    const serialized = {
      id: invite.id, email: invite.email, token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
      usedAt:    null,
      invitedBy: invite.invitedBy,
      createdAt: invite.createdAt.toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
      const devLink = `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/accept-invite?token=${token}`;
      res.json({ data: { ...serialized, devInviteLink: devLink } });
      return;
    }

    try {
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.CLIENT_URL}/accept-invite`,
      });
    } catch (err) {
      logger.warn('Supabase invite email failed â€” invite record created, email not sent', { err });
    }

    res.json({ data: serialized });
  } catch (err) { next(err); }
});

router.delete('/invites/:token', async (req, res, next: NextFunction) => {
  try {
    const invite = await prisma.invite.findUnique({ where: { token: req.params.token } });
    if (!invite) { res.status(404).json({ error: 'Invite not found' }); return; }
    if (invite.usedAt) { res.status(400).json({ error: 'Invite has already been used' }); return; }
    await prisma.invite.delete({ where: { token: req.params.token } });
    res.json({ data: { revoked: true } });
  } catch (err) { next(err); }
});

export default router;
