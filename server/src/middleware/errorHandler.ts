import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const route  = `${req.method} ${req.path}`;
  const userId = req.user?.id;

  logger.error('Unhandled route error', { route, userId, err });

  if (res.headersSent) return;

  res.status(500).json({ error: 'An unexpected error occurred' });
}
