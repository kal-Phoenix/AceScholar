import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import authRoutes from '../server/routes/auth.js';
import orderRoutes from '../server/routes/orders.js';
import paymentRoutes from '../server/routes/payments.js';
import profileRoutes from '../server/routes/profiles.js';
import messageRoutes from '../server/routes/messages.js';
import contactRoutes from '../server/routes/contacts.js';
import uploadRoutes from '../server/routes/upload.js';
import withdrawalRoutes from '../server/routes/withdrawals.js';
import ratingRoutes from '../server/routes/ratings.js';
import notificationRoutes from '../server/routes/notifications.js';
import analyticsRoutes from '../server/routes/analytics.js';
import geoIpRoutes from '../server/routes/geoip.js';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: { action: 'deny' },
  crossOriginEmbedderPolicy: false,
}));

const rawAllowedOrigins = process.env.ALLOWED_ORIGIN || '';
const allowedOriginsList = rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const host = req.get('host');
    const isSameHost = origin === `http://${host}` || origin === `https://${host}`;
    const isExplicitlyAllowed = allowedOriginsList.length > 0
      ? allowedOriginsList.includes(origin) || allowedOriginsList.includes('*')
      : true;
    if (isSameHost || isExplicitlyAllowed || process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

const baseRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests.' } });
const sensitiveRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts.' } });
const messageRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many messages.' } });
const loginRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts.' } });
const signupRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many signup attempts.' } });
const passwordResetRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many password reset attempts.' } });
const syncRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many sync requests.' } });

app.use(baseRateLimiter);
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth/signup', signupRateLimiter);
app.use('/api/auth/forgot-password', passwordResetRateLimiter);
app.use('/api/auth/reset-password', passwordResetRateLimiter);
app.use('/api/payments', sensitiveRateLimiter);
app.use('/api/contacts', sensitiveRateLimiter);
app.use('/api/messages', messageRateLimiter);
app.use('/api/withdrawals', sensitiveRateLimiter);
app.use('/api/ratings', sensitiveRateLimiter);
app.use('/api/notifications', sensitiveRateLimiter);
app.use('/api/analytics', sensitiveRateLimiter);
app.use('/api/orders/sync', syncRateLimiter);
app.use('/api/profiles/sync', syncRateLimiter);
app.use('/api/messages/sync', syncRateLimiter);
app.use('/api/contacts/sync', syncRateLimiter);

app.use('/api', (req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/geoip', geoIpRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled Express error:', err);
  if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
