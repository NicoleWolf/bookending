import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { prisma } from '../lib/prisma';

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice(7);

  if (process.env.NODE_ENV !== 'production' && token.startsWith('dev:')) {
    const [, mockId, email, encodedName] = token.split(':');
    const name = decodeURIComponent(encodedName ?? 'Unknown');
    if (!email) return next();
    try {
      const user = await prisma.user.upsert({
        where: { email }, update: { lastLoginAt: new Date() },
        create: { id: mockId, email, name, role: 'AUTHOR' },
      });
      req.user = { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin };
    } catch { /* ignore, continue as anonymous */ }
    return next();
  }

  try {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data.user) {
      const metaRole = data.user.user_metadata?.role as string | undefined;
      const role: 'AUTHOR' | 'READER' = metaRole === 'READER' ? 'READER' : 'AUTHOR';
      req.user = { id: data.user.id, email: data.user.email!, role, isAdmin: false };
    }
  } catch { /* ignore, continue as anonymous */ }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = header.slice(7);

  // ── Dev mock bypass ───────────────────────────────────────────────
  // Format: dev:<mockId>:<email>:<encodedName>
  if (process.env.NODE_ENV !== 'production' && token.startsWith('dev:')) {
    const [, mockId, email, encodedName] = token.split(':');
    const name = decodeURIComponent(encodedName ?? 'Unknown');
    if (!email) { res.status(401).json({ error: 'Invalid dev token' }); return; }
    try {
      const user = await prisma.user.upsert({
        where:  { email },
        update: { lastLoginAt: new Date() },
        create: { id: mockId, email, name, role: 'AUTHOR' },
      });
      req.user = { id: user.id, email: user.email, role: user.role, isAdmin: user.isAdmin };
      return next();
    } catch (err) {
      console.error('[dev auth] Prisma upsert failed:', err);
      res.status(500).json({ error: 'Dev auth failed' });
      return;
    }
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const metaRole = data.user.user_metadata?.role as string | undefined;
  const role: 'AUTHOR' | 'READER' = metaRole === 'READER' ? 'READER' : 'AUTHOR';

  // Provision User record on first login; sync role from Supabase metadata
  const dbUser = await prisma.user.upsert({
    where:  { id: data.user.id },
    update: { lastLoginAt: new Date(), role },
    create: {
      id:    data.user.id,
      email: data.user.email!,
      name:  data.user.user_metadata?.name ?? data.user.email!,
      role,
    },
  });

  // Link any BetaReader records that match this user's email
  if (role === 'READER') {
    await prisma.betaReader.updateMany({
      where: { email: data.user.email!, userId: null },
      data:  { userId: data.user.id },
    });
  }

  req.user = { id: data.user.id, email: data.user.email!, role, isAdmin: dbUser.isAdmin };
  next();
}
