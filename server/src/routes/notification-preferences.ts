import { Router } from 'express';
import type { NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Row keys and their default values — single source of truth for the API layer.
// Client mirrors these in row-data.ts.
const ROW_DEFAULTS: Record<string, { emailOn: boolean; inAppOn: boolean; cadence: string }> = {
  // Writer rows
  threaded_margin_replies:  { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  beta_reader_requests:     { emailOn: false, inAppOn: false, cadence: 'instant' },
  beta_reader_submissions:  { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  dispatch_performance:     { emailOn: false, inAppOn: false, cadence: 'daily'   },
  new_subscribers:          { emailOn: false, inAppOn: false, cadence: 'daily'   },
  writing_circle_activity:  { emailOn: false, inAppOn: false, cadence: 'daily'   },
  mentorship_messages:      { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  writing_challenges:       { emailOn: false, inAppOn: false, cadence: 'daily'   },
  reader_qa_submissions:    { emailOn: false, inAppOn: true,  cadence: 'instant' },
  stance_arc_milestones:    { emailOn: false, inAppOn: false, cadence: 'daily'   },
  manuscript_mentions:      { emailOn: false, inAppOn: false, cadence: 'daily'   },
  // Reader rows
  writer_replies_to_notes:  { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  writer_dispatches:        { emailOn: true,  inAppOn: false, cadence: 'instant' },
  beta_read_invitations:    { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  beta_read_deadlines:      { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  mentorship_messages_r:    { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  qa_responses:             { emailOn: true,  inAppOn: true,  cadence: 'instant' },
  reader_qa_invitations:    { emailOn: false, inAppOn: false, cadence: 'daily'   },
  writing_challenge_invites:{ emailOn: false, inAppOn: false, cadence: 'daily'   },
  new_work_subscriptions:   { emailOn: false, inAppOn: true,  cadence: 'instant' },
  recommended_works:        { emailOn: false, inAppOn: false, cadence: 'weekly'  },
};

const VALID_KEYS = new Set(Object.keys(ROW_DEFAULTS));

// GET /api/notification-preferences
// Returns all 21 rows merged with user's saved preferences; unsaved rows use defaults.
router.get('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const saved = await prisma.notificationPreference.findMany({ where: { userId } });
    const savedMap = Object.fromEntries(saved.map(p => [p.rowKey, p]));

    const data = Object.entries(ROW_DEFAULTS).map(([key, defaults]) => {
      const pref = savedMap[key];
      return {
        rowKey:   key,
        emailOn:  pref ? pref.emailOn  : defaults.emailOn,
        inAppOn:  pref ? pref.inAppOn  : defaults.inAppOn,
        cadence:  pref ? pref.cadence  : defaults.cadence,
        isDefault: !pref,
      };
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { writingMode: true, writingModeSince: true },
    });

    res.json({
      data: {
        preferences: data,
        writingMode: user?.writingMode ?? false,
        writingModeSince: user?.writingModeSince?.toISOString() ?? null,
      },
    });
  } catch (err) { next(err); }
});

// PATCH /api/notification-preferences/writing-mode
// Toggle Writing Mode on or off for the authed user.
// Must be registered before /:rowKey to avoid being swallowed by the param route.
router.patch('/writing-mode', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { on } = req.body as { on: boolean };

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        writingMode:      on,
        writingModeSince: on ? new Date() : null,
      },
      select: { writingMode: true, writingModeSince: true },
    });
    res.json({
      data: {
        writingMode:      updated.writingMode,
        writingModeSince: updated.writingModeSince?.toISOString() ?? null,
      },
    });
  } catch (err) { next(err); }
});

// PATCH /api/notification-preferences/:rowKey
// Upsert a single row's preferences.
router.patch('/:rowKey', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { rowKey } = req.params;

  if (!VALID_KEYS.has(rowKey)) {
    res.status(400).json({ error: `Unknown row key: ${rowKey}` });
    return;
  }

  const { emailOn, inAppOn, cadence } = req.body as {
    emailOn?: boolean; inAppOn?: boolean; cadence?: string;
  };

  try {
    const pref = await prisma.notificationPreference.upsert({
      where:  { userId_rowKey: { userId, rowKey } },
      create: {
        userId,
        rowKey,
        emailOn:  emailOn  ?? ROW_DEFAULTS[rowKey]!.emailOn,
        inAppOn:  inAppOn  ?? ROW_DEFAULTS[rowKey]!.inAppOn,
        cadence:  cadence  ?? ROW_DEFAULTS[rowKey]!.cadence,
      },
      update: {
        ...(emailOn  !== undefined ? { emailOn  } : {}),
        ...(inAppOn  !== undefined ? { inAppOn  } : {}),
        ...(cadence  !== undefined ? { cadence  } : {}),
      },
    });
    res.json({ data: pref });
  } catch (err) { next(err); }
});

export default router;
