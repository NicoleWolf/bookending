import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export function zodErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.errors
      .map(e => (e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message))
      .join('; ');
    res.status(400).json({ error: message });
    return;
  }
  next(err);
}
