import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { requireAuth } from './middleware/auth';
import { zodErrorHandler } from './middleware/zodError';

dotenv.config();

export const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bookending-api' });
});

app.use('/api/manuscripts', requireAuth, manuscriptsRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/covers',       coversRouter);
app.use('/api/distribution', requireAuth, distributionRouter);
app.use('/api/subscribers',  requireAuth, subscribersRouter);
app.use('/api/orders',       requireAuth, ordersRouter);
app.use('/api/dispatches',   requireAuth, dispatchesRouter);
app.use('/api/products',     requireAuth, productsRouter);
app.use('/api/reading',             requireAuth, readingRouter);
app.use('/api/browse',             browseRouter);
app.use('/api/dashboard',          requireAuth, dashboardRouter);
app.use('/api/storefront/settings', requireAuth, storefrontSettingsRouter);
app.use('/api/authors',   authorsRouter);
app.use('/api/formatter', requireAuth, formatterRouter);
app.use('/api/admin',     requireAuth, adminRouter);

app.use(zodErrorHandler);
