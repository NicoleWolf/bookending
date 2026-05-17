import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import notificationsRouter from './routes/notifications';
import coversRouter from './routes/covers';
import manuscriptsRouter from './routes/manuscripts';
import distributionRouter from './routes/distribution';
import subscribersRouter from './routes/subscribers';
import ordersRouter from './routes/orders';
import dispatchesRouter from './routes/dispatches';
import productsRouter from './routes/products';
import readingRouter from './routes/reading';
import browseRouter from './routes/browse';
import dashboardRouter from './routes/dashboard';
import storefrontSettingsRouter from './routes/storefrontSettings';
import authorsRouter from './routes/authors';
import formatterRouter from './routes/formatter';
import adminRouter from './routes/admin';
import readerProfileRouter from './routes/reader-profile';
import authorProfileRouter from './routes/author-profile';
import authRouter from './routes/auth';
import arcRouter from './routes/arc';
import { requireAuth, optionalAuth } from './middleware/auth';
import { zodErrorHandler } from './middleware/zodError';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  logger.error('CLIENT_URL must be set in production — refusing to start with open CORS');
  process.exit(1);
}

export const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts — try again later' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bookending-api' });
});

app.use('/api/auth', authRouter);

app.use('/api/manuscripts', requireAuth, manuscriptsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/covers',       coversRouter);
app.use('/api/distribution', requireAuth, distributionRouter);
app.use('/api/subscribers',  requireAuth, subscribersRouter);
app.use('/api/orders',       requireAuth, ordersRouter);
app.use('/api/dispatches',   requireAuth, dispatchesRouter);
app.use('/api/products',     requireAuth, productsRouter);
app.use('/api/reading',             requireAuth, readingRouter);
app.use('/api/browse',             optionalAuth, browseRouter);
app.use('/api/dashboard',          requireAuth, dashboardRouter);
app.use('/api/storefront/settings', requireAuth, storefrontSettingsRouter);
app.use('/api/authors',   authorsRouter);
app.use('/api/formatter',      requireAuth, formatterRouter);
app.use('/api/admin',          requireAuth, adminRouter);
app.use('/api/reader-profile',  requireAuth, readerProfileRouter);
app.use('/api/author-profile',  requireAuth, authorProfileRouter);
app.use('/api/arc',             requireAuth, arcRouter);

app.use(zodErrorHandler);
app.use(errorHandler);
