import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: { auth: { getUser: vi.fn() } },
}));

// Prevent PrismaClient instantiation (requires prisma generate) during tests.
vi.mock('../lib/prisma', () => ({
  prisma: { goal: {}, notification: {} },
}));

import { app } from '../app'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', service: 'bookending-api' })
  })
})
