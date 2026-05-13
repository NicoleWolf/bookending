import { Router } from 'express';
import type { NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_DOCX_BYTES = 50 * 1024 * 1024; // 50 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCX_BYTES },
  fileFilter(_req, file, cb) {
    const ok = file.mimetype === DOCX_MIME || file.originalname.endsWith('.docx');
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are accepted. Open your document in Word and Save As .docx.'));
    }
  },
});

// GET /api/formatter/:manuscriptId
router.get('/:manuscriptId', async (req, res, next: NextFunction) => {
  const userId       = req.user!.id;
  const manuscriptId = req.params.manuscriptId as string;
  try {
    const project = await prisma.formattingProject.findUnique({
      where: { userId_manuscriptId: { userId, manuscriptId } },
    });
    if (!project) { res.status(404).json({ error: 'No formatting project found for this manuscript.' }); return; }
    res.json({ data: project });
  } catch (err) { next(err); }
});

// POST /api/formatter — create or upsert a FormattingProject
router.post('/', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const { manuscriptId, source, encoding, smartQuotes } = req.body as {
    manuscriptId: string;
    source?: string;
    encoding?: string;
    smartQuotes?: string;
  };

  if (!manuscriptId) { res.status(400).json({ error: 'manuscriptId is required.' }); return; }

  try {
    const manuscript = await prisma.manuscript.findFirst({
      where: { id: manuscriptId, authorId: userId },
    });
    if (!manuscript) { res.status(404).json({ error: 'Manuscript not found.' }); return; }

    const project = await prisma.formattingProject.upsert({
      where:  { userId_manuscriptId: { userId, manuscriptId } },
      update: {
        source:      source      ?? undefined,
        encoding:    encoding    ?? undefined,
        smartQuotes: smartQuotes ?? undefined,
        currentStep: 1,
      },
      create: {
        userId,
        manuscriptId,
        source:      source      ?? null,
        encoding:    encoding    ?? 'AUTO',
        smartQuotes: smartQuotes ?? 'CONVERT',
      },
    });

    res.status(201).json({ data: project });
  } catch (err) { next(err); }
});

// PATCH /api/formatter/:id — update settings
router.patch('/:id', async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const id     = req.params.id as string;
  try {
    const existing = await prisma.formattingProject.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Formatting project not found.' }); return; }

    const { currentStep, source, encoding, smartQuotes, pastedContent, frontMatter } = req.body as {
      currentStep?:   number;
      source?:        string;
      encoding?:      string;
      smartQuotes?:   string;
      pastedContent?: string;
      frontMatter?:   string;
    };

    const updated = await prisma.formattingProject.update({
      where: { id },
      data: {
        currentStep:   currentStep   ?? undefined,
        source:        source        ?? undefined,
        encoding:      encoding      ?? undefined,
        smartQuotes:   smartQuotes   ?? undefined,
        pastedContent: pastedContent ?? undefined,
        frontMatter:   frontMatter   ?? undefined,
      },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
});

// POST /api/formatter/:id/upload — accept a .docx file
router.post('/:id/upload', upload.single('docx'), async (req, res, next: NextFunction) => {
  const userId = req.user!.id;
  const id     = req.params.id as string;
  const file   = req.file;

  if (!file) { res.status(400).json({ error: 'No file uploaded.' }); return; }

  try {
    const project = await prisma.formattingProject.findFirst({ where: { id, userId } });
    if (!project) { res.status(404).json({ error: 'Formatting project not found.' }); return; }

    const storagePath = `${userId}/${id}.docx`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('formatter-uploads')
      .upload(storagePath, file.buffer, { contentType: DOCX_MIME, upsert: true });

    if (uploadError) { res.status(500).json({ error: uploadError.message }); return; }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('formatter-uploads')
      .getPublicUrl(storagePath);

    const updated = await prisma.formattingProject.update({
      where: { id },
      data: { source: 'DOCX', uploadedDocxUrl: publicUrl },
    });

    res.json({ data: updated });
  } catch (err) { next(err); }
});

export default router;
