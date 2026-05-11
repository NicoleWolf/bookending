import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';

const { mockManuscript, mockChapter, mockChapterNote } = vi.hoisted(() => ({
  mockManuscript: {
    findUnique: vi.fn(),
  },
  mockChapter: {
    findFirst: vi.fn(),
    create:    vi.fn(),
  },
  mockChapterNote: {
    findFirst: vi.fn(),
    findMany:  vi.fn(),
    create:    vi.fn(),
    update:    vi.fn(),
    delete:    vi.fn(),
  },
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    manuscript:  mockManuscript,
    chapter:     mockChapter,
    chapterNote: mockChapterNote,
  },
}));

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: 'user_1', email: 'author@test.com', role: 'AUTHOR' as const };
    next();
  },
}));

import { app } from '../app';

const MS_ID   = 'ms_1';
const CH_NUM  = 1;
const NOTE_ID = 'note_1';
const BASE    = `/api/manuscripts/${MS_ID}/chapters/${CH_NUM}/notes`;

const mockMs = { id: MS_ID, authorId: 'user_1' };
const mockCh = { id: 'ch_1', manuscriptId: MS_ID, number: CH_NUM, title: 'Chapter 1' };
const mockNote = {
  id: NOTE_ID, chapterId: 'ch_1', body: 'Original body', anchor: null,
  status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
};

// ── POST ─────────────────────────────────────────────────────────────────────

describe('POST /api/manuscripts/:id/chapters/:chapterNum/notes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when body field is missing', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    const res = await request(app).post(BASE).send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 when manuscript is not found', async () => {
    mockManuscript.findUnique.mockResolvedValue(null);
    const res = await request(app).post(BASE).send({ body: 'A note' });
    expect(res.status).toBe(403);
  });

  it('returns 403 when manuscript belongs to another author', async () => {
    mockManuscript.findUnique.mockResolvedValue({ id: MS_ID, authorId: 'other_user' });
    const res = await request(app).post(BASE).send({ body: 'A note' });
    expect(res.status).toBe(403);
  });

  it('returns 409 when an active note already exists for this chapter', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(mockCh);
    mockChapterNote.findFirst.mockResolvedValue(mockNote);

    const res = await request(app).post(BASE).send({ body: 'Another note' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/note already exists/i);
  });

  it('creates a chapter record when none exists yet', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(null);
    mockChapter.create.mockResolvedValue(mockCh);
    mockChapterNote.findFirst.mockResolvedValue(null);
    mockChapterNote.create.mockResolvedValue(mockNote);

    const res = await request(app).post(BASE).send({ body: 'A note', chapterTitle: 'Chapter 1' });
    expect(res.status).toBe(201);
    expect(mockChapter.create).toHaveBeenCalledOnce();
  });

  it('returns 201 with the created note', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(mockCh);
    mockChapterNote.findFirst.mockResolvedValue(null);
    mockChapterNote.create.mockResolvedValue(mockNote);

    const res = await request(app).post(BASE).send({ body: 'A note' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(NOTE_ID);
  });
});

// ── GET ──────────────────────────────────────────────────────────────────────

describe('GET /api/manuscripts/:id/chapters/:chapterNum/notes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when the chapter does not exist yet', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(null);

    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns active notes for an existing chapter', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(mockCh);
    mockChapterNote.findMany.mockResolvedValue([mockNote]);

    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(NOTE_ID);
  });

  it('returns 400 when chapterNum is not an integer', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    const res = await request(app).get(`/api/manuscripts/${MS_ID}/chapters/abc/notes`);
    expect(res.status).toBe(400);
  });
});

// ── PATCH ────────────────────────────────────────────────────────────────────

describe('PATCH /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates note body and returns 200', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapterNote.update.mockResolvedValue({ ...mockNote, body: 'Updated body' });

    const res = await request(app)
      .patch(`${BASE}/${NOTE_ID}`)
      .send({ body: 'Updated body' });
    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe('Updated body');
  });

  it('returns 409 when restoring conflicts with an existing active note', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(mockCh);
    mockChapterNote.findFirst.mockResolvedValue({ id: 'note_other', status: 'ACTIVE' });

    const res = await request(app)
      .patch(`${BASE}/${NOTE_ID}`)
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already active/i);
  });

  it('restores a note when no active note exists for the chapter', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapter.findFirst.mockResolvedValue(mockCh);
    mockChapterNote.findFirst.mockResolvedValue(null);
    mockChapterNote.update.mockResolvedValue({ ...mockNote, status: 'ACTIVE' });

    const res = await request(app)
      .patch(`${BASE}/${NOTE_ID}`)
      .send({ status: 'ACTIVE' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
  });
});

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

describe('DELETE /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('archives the note and returns 200', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapterNote.update.mockResolvedValue({ ...mockNote, status: 'ARCHIVED' });

    const res = await request(app).delete(`${BASE}/${NOTE_ID}`);
    expect(res.status).toBe(200);
    expect(mockChapterNote.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'ARCHIVED' } })
    );
  });
});

// ── DELETE (permanent) ───────────────────────────────────────────────────────

describe('DELETE /api/manuscripts/:id/chapters/:chapterNum/notes/:noteId/permanent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hard-deletes the note and returns { deleted: true }', async () => {
    mockManuscript.findUnique.mockResolvedValue(mockMs);
    mockChapterNote.delete.mockResolvedValue(mockNote);

    const res = await request(app).delete(`${BASE}/${NOTE_ID}/permanent`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ deleted: true });
    expect(mockChapterNote.delete).toHaveBeenCalledWith({ where: { id: NOTE_ID } });
  });
});
