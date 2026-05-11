import { z } from 'zod';
import type { Response } from 'express';

export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
  res: Response,
): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors
      .map(e => (e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message))
      .join('; ');
    res.status(400).json({ error: message });
    return null;
  }
  return result.data;
}
