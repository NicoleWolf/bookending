import { Router } from 'express';
import type { NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { parseBody } from '../lib/validate';

const router = Router();

const RegisterSchema = z.object({
  name:     z.string().min(1).max(80),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(['AUTHOR', 'READER']).default('AUTHOR'),
});

// — POST /api/auth/register ————————————————————————————————————————————
// Creates a Supabase auth user + DB User record. Client signs in separately.

router.post('/register', async (req, res, next: NextFunction) => {
  const body = parseBody(RegisterSchema, req.body, res);
  if (!body) return;

  const { name, email, password, role } = body;
  try {
    // Check for existing DB user first (avoids a Supabase call on duplicates)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account with that email already exists.' });
      return;
    }

    // Create Supabase auth user with email pre-confirmed
    const { data: sbData, error: sbError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (sbError || !sbData.user) {
      const msg = sbError?.message ?? 'Registration failed';
      res.status(400).json({ error: msg });
      return;
    }

    // Upsert DB User record
    const user = await prisma.user.upsert({
      where:  { id: sbData.user.id },
      update: { name, role },
      create: { id: sbData.user.id, email, name, role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json({ data: user });
  } catch (err) { next(err); }
});

export default router;
