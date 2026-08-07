import './lib/load-env.js';
import { validateEnv } from './lib/validate-env.js';
validateEnv();
import express from 'express';
import compression from 'compression';
import path from 'path';
import crypto from 'crypto';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

// Global error handlers — must be registered before any async work
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});


// Route imports
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import profileRoutes from './routes/profiles.js';
import messageRoutes from './routes/messages.js';
import contactRoutes from './routes/contacts.js';
import uploadRoutes from './routes/upload.js';
import withdrawalRoutes from './routes/withdrawals.js';
import ratingRoutes from './routes/ratings.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import geoIpRoutes from './routes/geoip.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Fly.io terminates TLS at its edge proxy; trust one hop for correct req.ip / rate-limiting
  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    } : false,
    frameguard: { action: 'deny' },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration (must run BEFORE body parsers and routes)
  const rawAllowedOrigins = process.env.ALLOWED_ORIGIN || '';
  const allowedOriginsList = rawAllowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      const host = req.get('host');
      const requestHostOriginHttp = host ? `http://${host}` : '';
      const requestHostOriginHttps = host ? `https://${host}` : '';

      const isSameHost = origin === requestHostOriginHttp || origin === requestHostOriginHttps;
      const isExplicitlyAllowed =
        allowedOriginsList.length > 0
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

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Disable proxy buffering — helps Fly's HTTP/2 proxy read responses cleanly
  app.use((_req, res, next) => {
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: false }));

  // Rate limiters
  const baseRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    skip: (req) => {
      const url = req.originalUrl || req.url || '';
      if (process.env.NODE_ENV !== 'production') {
        if (url.includes('/@vite/') || url.includes('/@fs/') || url.includes('/@id/') ||
            url.includes('/node_modules/') || url.includes('hot-update')) {
          return true;
        }
      }
      return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(req.path);
    }
  });

  const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts to this endpoint. Please try again later.' },
  });

  const messageRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many messages. Please slow down.' },
  });

  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
  });

  const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many signup attempts. Please try again later.' },
  });

  const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many password reset attempts. Please try again later.' },
  });

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

  const syncRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many sync requests. Please try again later.' },
  });

  const geoipRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });

  app.use('/api/orders/sync', syncRateLimiter);
  app.use('/api/profiles/sync', syncRateLimiter);
  app.use('/api/messages/sync', syncRateLimiter);
  app.use('/api/contacts/sync', syncRateLimiter);
  app.use('/api/geoip', geoipRateLimiter);

  // ─────────────────────────────────────────────────────────────────────────
  // REQUEST LOGGING (only for /api)
  // ─────────────────────────────────────────────────────────────────────────
  app.use('/api', (req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH CHECK — always returns 200 so Docker/Fly health probes pass fast
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // API ROUTES
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC ENDPOINTS (bulk upsert — kept inline for simplicity)
  // ─────────────────────────────────────────────────────────────────────────
  const { supabase, supabaseAdmin, db } = await import('./lib/supabase.js');
  const { sanitizeText, MAX_LENGTHS } = await import('./lib/validation.js');
  const { getRequesterProfile, parseDeadline } = await import('./lib/utils.js');

  app.post('/api/orders/sync', async (req, res) => {
    try {
      const requester = await getRequesterProfile(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of orders' });

      const sanitized = req.body.map((item: any) => ({
        id: sanitizeText(item.id, MAX_LENGTHS.id) || 'ord-' + crypto.randomUUID().replace(/-/g, '').substring(0, 12),
        client_id: item.client_id || null,
        client_name: sanitizeText(item.client_name, MAX_LENGTHS.name) || 'Anonymous',
        client_email: sanitizeText(item.client_email, MAX_LENGTHS.email),
        service_type: sanitizeText(item.service_type, MAX_LENGTHS.service_type) || 'General / Unspecified',
        subject: sanitizeText(item.subject, MAX_LENGTHS.subject) || 'General / Unspecified',
        academic_level: sanitizeText(item.academic_level, MAX_LENGTHS.general) || 'Undergraduate',
        deadline: parseDeadline(item.deadline) || new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
        description: sanitizeText(item.description, MAX_LENGTHS.description),
        special_instructions: item.special_instructions ? sanitizeText(item.special_instructions, MAX_LENGTHS.instructions) : null,
        budget_range: sanitizeText(item.budget_range, MAX_LENGTHS.budget) || '$50-$100',
        status: (['pending','in_progress','under_review','delivered','revision_requested'].includes(item.status)) ? item.status : 'pending',
        assigned_to: item.assigned_to ? sanitizeText(item.assigned_to, MAX_LENGTHS.name) : null,
        expert_accepted: item.expert_accepted !== undefined ? Boolean(item.expert_accepted) : null,
        file_url: item.file_url ? sanitizeText(item.file_url, MAX_LENGTHS.url) : null,
        file_name: item.file_name ? sanitizeText(item.file_name, MAX_LENGTHS.filename) : null,
        delivery_url: item.delivery_url ? sanitizeText(item.delivery_url, MAX_LENGTHS.url) : null,
        delivery_name: item.delivery_name ? sanitizeText(item.delivery_name, MAX_LENGTHS.filename) : null,
        internal_notes: item.internal_notes ? sanitizeText(item.internal_notes, MAX_LENGTHS.notes) : null,
        created_at: sanitizeText(item.created_at, 60) || new Date().toISOString(),
        payment_method: item.payment_method ? sanitizeText(item.payment_method, MAX_LENGTHS.general) : null,
        payment_screenshot: item.payment_screenshot ? sanitizeText(item.payment_screenshot, MAX_LENGTHS.url) : null,
        payment_status: (['pending','approved','rejected'].includes(item.payment_status)) ? item.payment_status : 'pending',
        payment_ref_number: item.payment_ref_number ? sanitizeText(item.payment_ref_number, MAX_LENGTHS.general) : null,
        payment_id: item.payment_id ? sanitizeText(item.payment_id, MAX_LENGTHS.id) : null,
        total_amount: typeof item.total_amount === 'number' ? item.total_amount : 100,
        currency: sanitizeText(item.currency, MAX_LENGTHS.currency) || 'USD',
        applicants: Array.isArray(item.applicants) ? item.applicants : null,
        // Payment-after-delivery fields (proper columns)
        agreed_price: typeof item.agreed_price === 'number' ? item.agreed_price : null,
        preview_url: item.preview_url ? sanitizeText(item.preview_url, MAX_LENGTHS.url) : null,
        preview_name: item.preview_name ? sanitizeText(item.preview_name, MAX_LENGTHS.filename) : null,
        payment_awaiting: Boolean(item.payment_awaiting) || false,
        payment_method_type: item.payment_method_type ? sanitizeText(item.payment_method_type, MAX_LENGTHS.general) : null,
        crypto_discount_applied: Boolean(item.crypto_discount_applied) || false,
        delivery_released: Boolean(item.delivery_released) || false,
        expert_submission_url: item.expert_submission_url ? sanitizeText(item.expert_submission_url, MAX_LENGTHS.url) : null,
        expert_submission_name: item.expert_submission_name ? sanitizeText(item.expert_submission_name, MAX_LENGTHS.filename) : null,
        admin_screenshots: Array.isArray(item.admin_screenshots) ? item.admin_screenshots : null,
      }));

      const { error: upsertErr } = await db.from('orders').upsert(sanitized);
      if (upsertErr) return res.status(500).json({ error: 'Failed to sync orders' });
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Internal server error during orders sync' });
    }
  });

  app.post('/api/profiles/sync', async (req, res) => {
    try {
      const requester = await getRequesterProfile(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of profiles' });

      const { invalidateUserCache, getCachedUsers } = await import('./routes/profiles.js');

      const allUsers = await getCachedUsers();
      for (const item of req.body) {
        const email = sanitizeText(item.email, MAX_LENGTHS.email);
        if (!email) continue;
        const user = allUsers?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (user) {
          const allowedRole = (item.role === 'client' || item.role === 'expert') ? item.role : 'client';
          await (supabaseAdmin || supabase).auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              full_name: sanitizeText(item.full_name, MAX_LENGTHS.name) || user.user_metadata?.full_name || 'Anonymous',
              role: allowedRole,
            }
          });
        }
      }
      invalidateUserCache();
      res.json({ success: true, count: req.body.length });
    } catch (err) {
      console.error('Profiles sync error:', err);
      res.status(500).json({ error: 'Internal server error during profiles sync' });
    }
  });

  app.post('/api/messages/sync', async (req, res) => {
    try {
      const requester = await getRequesterProfile(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of messages' });

      const sanitized = req.body.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        order_id: sanitizeText(item.order_id, MAX_LENGTHS.id),
        sender_id: item.sender_id || null,
        sender_name: sanitizeText(item.sender_name, MAX_LENGTHS.name) || 'Anonymous',
        content: sanitizeText(item.content, MAX_LENGTHS.message),
        is_admin: Boolean(item.is_admin),
        created_at: sanitizeText(item.created_at, 60) || new Date().toISOString(),
      }));

      const { error } = await db.from('messages').upsert(sanitized);
      if (error) {
        console.error('Messages sync error:', error.message);
        return res.status(500).json({ error: 'Failed to sync messages' });
      }
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      console.error('Messages sync error:', err);
      res.status(500).json({ error: 'Internal server error during messages sync' });
    }
  });

  app.post('/api/contacts/sync', async (req, res) => {
    try {
      const requester = await getRequesterProfile(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of contact messages' });

      const sanitized = req.body.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        name: sanitizeText(item.name, MAX_LENGTHS.name) || 'Anonymous',
        email: sanitizeText(item.email, MAX_LENGTHS.email),
        subject: sanitizeText(item.subject, MAX_LENGTHS.subject),
        message: sanitizeText(item.message, MAX_LENGTHS.message),
        is_read: Boolean(item.is_read),
        created_at: sanitizeText(item.created_at, 60) || new Date().toISOString(),
      }));

      const { error } = await db.from('contact_messages').upsert(sanitized);
      if (error) {
        console.error('Contacts sync error:', error.message);
        return res.status(500).json({ error: 'Failed to sync contacts' });
      }
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      console.error('Contacts sync error:', err);
      res.status(500).json({ error: 'Internal server error during contacts sync' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 404 catch-all for unknown API routes — must come BEFORE the SPA fallback
  // so that unknown /api/... paths return JSON, not index.html
  // ─────────────────────────────────────────────────────────────────────────
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VITE / STATIC SERVING
  // ─────────────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running in development mode with Vite middleware');
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    // Aggressively prevent caching of index.html across ALL layers
    const noCacheHtmlHeaders = (res: any) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    };

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          noCacheHtmlHeaders(res);
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));

    // SPA fallback — always serve fresh index.html
    app.get('*', (_req, res) => {
      noCacheHtmlHeaders(res);
      res.sendFile(path.join(distPath, 'index.html'));
    });

    console.log('Running in production mode serving static dist/');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Global Express error handler — catches any unhandled errors in middleware/routes
  // ─────────────────────────────────────────────────────────────────────────
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled Express error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const http = await import('http');
  const httpServer = http.createServer(app);

  httpServer.keepAliveTimeout = 65_000;
  httpServer.headersTimeout = 70_000;

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
