import { Router } from 'express';
import type { NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are accepted'));
    }
  },
});

// POST /api/covers
// Body: multipart/form-data — field "cover" (file) + field "manuscriptId" (string)
router.post('/', requireAuth, upload.single('cover'), async (req, res, next: NextFunction) => {
  const file         = req.file;
  const manuscriptId = (req.body as { manuscriptId?: string }).manuscriptId;
  const userId       = req.user!.id;

  if (!file)         { res.status(400).json({ error: 'No file uploaded' }); return; }
  if (!manuscriptId) { res.status(400).json({ error: 'manuscriptId is required' }); return; }

  const storagePath = `${userId}/${manuscriptId}`;
  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from('covers')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) { res.status(500).json({ error: uploadError.message }); return; }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('covers')
      .getPublicUrl(storagePath);

    res.status(201).json({ data: { coverUrl: publicUrl } });
  } catch (err) { next(err); }
});

export default router;
