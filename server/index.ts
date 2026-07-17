import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

// Route imports
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import profileRoutes from './routes/profiles.js';
import messageRoutes from './routes/messages.js';
import contactRoutes from './routes/contacts.js';
import uploadRoutes from './routes/upload.js';

// Load .env file variables manually for Node/tsx environments
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach((line) => {
      if (!line || line.startsWith('#') || !line.includes('=')) return;
      const [key, ...valueParts] = line.split('=');
      const cleanKey = key.trim();
      let cleanVal = valueParts.join('=').trim();
      if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) ||
          (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
        cleanVal = cleanVal.slice(1, -1);
      }
      process.env[cleanKey] = cleanVal;
    });
  }
} catch (error) {
  console.warn('Failed to load .env file:', error);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://knrkywdpjhxcnhevwyad.supabase.co"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: ALLOWED_ORIGIN is not set. CORS will reject all cross-origin requests.');
  }
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigin && origin === allowedOrigin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!allowedOrigin && origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', allowedOrigin || '*');
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

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

  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  });

  const signupRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many signup attempts. Please try again later.' },
  });

  app.use(baseRateLimiter);
  app.use('/api/auth/login', loginRateLimiter);
  app.use('/api/auth/signup', signupRateLimiter);
  app.use('/api/payments', sensitiveRateLimiter);
  app.use('/api/contacts', sensitiveRateLimiter);

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH CHECK (actually pings Supabase)
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    try {
      const { db } = await import('./lib/supabase.js');
      const { error } = await db.from('orders').select('id', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ status: 'ok', timestamp: new Date().toISOString(), supabase: 'connected' });
    } catch (err: any) {
      console.error('Health check failed:', err.message);
      res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString(), supabase: 'disconnected' });
    }
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

  // ─────────────────────────────────────────────────────────────────────────
  // SYNC ENDPOINTS (bulk upsert — kept inline for simplicity)
  // ─────────────────────────────────────────────────────────────────────────
  const { supabase, db } = await import('./lib/supabase.js');
  const { safeString } = await import('./lib/validation.js');

  async function getRequesterFromReq(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token) {
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        if (error || !authUser) return null;
        const { deriveRole } = await import('./lib/utils.js');
        const email = authUser.email?.toLowerCase().trim();
        if (!email) return null;
        const role = deriveRole(email, authUser.user_metadata?.role);
        return { id: authUser.id, email, role };
      }
    }
    return null;
  }

  app.post('/api/orders/sync', async (req, res) => {
    try {
      const requester = await getRequesterFromReq(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of orders' });

      const sanitized = req.body.map((item: any) => ({
        id: safeString(item.id) || 'ord-' + Math.random().toString(36).substring(2, 7),
        client_id: item.client_id || null,
        client_name: safeString(item.client_name, 'Anonymous'),
        client_email: safeString(item.client_email),
        service_type: safeString(item.service_type, 'General / Unspecified'),
        subject: safeString(item.subject, 'General / Unspecified'),
        academic_level: safeString(item.academic_level, 'Undergraduate'),
        deadline: safeString(item.deadline),
        description: safeString(item.description),
        special_instructions: item.special_instructions ? safeString(item.special_instructions) : null,
        budget_range: safeString(item.budget_range, '$50-$100'),
        status: (['pending','in_progress','under_review','delivered','revision_requested'].includes(item.status)) ? item.status : 'pending',
        assigned_to: item.assigned_to ? safeString(item.assigned_to) : null,
        expert_accepted: item.expert_accepted !== undefined ? Boolean(item.expert_accepted) : null,
        file_url: item.file_url ? safeString(item.file_url) : null,
        file_name: item.file_name ? safeString(item.file_name) : null,
        delivery_url: item.delivery_url ? safeString(item.delivery_url) : null,
        delivery_name: item.delivery_name ? safeString(item.delivery_name) : null,
        internal_notes: item.internal_notes ? safeString(item.internal_notes) : null,
        created_at: safeString(item.created_at) || new Date().toISOString(),
        payment_method: item.payment_method ? safeString(item.payment_method) : null,
        payment_screenshot: item.payment_screenshot ? safeString(item.payment_screenshot) : null,
        payment_status: (['pending','approved','rejected'].includes(item.payment_status)) ? item.payment_status : 'pending',
        payment_ref_number: item.payment_ref_number ? safeString(item.payment_ref_number) : null,
        payment_id: item.payment_id ? safeString(item.payment_id) : null,
        total_amount: typeof item.total_amount === 'number' ? item.total_amount : 100,
        currency: safeString(item.currency, 'USD'),
        applicants: Array.isArray(item.applicants) ? item.applicants : null,
        // Payment-after-delivery fields (proper columns)
        agreed_price: typeof item.agreed_price === 'number' ? item.agreed_price : null,
        preview_url: item.preview_url ? safeString(item.preview_url) : null,
        preview_name: item.preview_name ? safeString(item.preview_name) : null,
        payment_awaiting: Boolean(item.payment_awaiting) || false,
        payment_method_type: item.payment_method_type ? safeString(item.payment_method_type) : null,
        crypto_discount_applied: Boolean(item.crypto_discount_applied) || false,
        delivery_released: Boolean(item.delivery_released) || false,
        expert_submission_url: item.expert_submission_url ? safeString(item.expert_submission_url) : null,
        expert_submission_name: item.expert_submission_name ? safeString(item.expert_submission_name) : null,
        admin_screenshots: Array.isArray(item.admin_screenshots) ? item.admin_screenshots : null,
      }));

      const { error: upsertErr } = await db.from('orders').upsert(sanitized);
      if (upsertErr) return res.status(500).json({ error: upsertErr.message });
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'Internal server error during orders sync' });
    }
  });

  app.post('/api/profiles/sync', async (req, res) => {
    try {
      const requester = await getRequesterFromReq(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of profiles' });

      const { invalidateUserCache } = await import('./routes/profiles.js');

      for (const item of req.body) {
        const email = safeString(item.email);
        if (!email) continue;
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const user = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (user) {
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              full_name: safeString(item.full_name, user.user_metadata?.full_name || 'Anonymous'),
              role: item.role || user.user_metadata?.role || 'client',
            }
          });
        }
      }
      invalidateUserCache();
      res.json({ success: true, count: req.body.length });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error during profiles sync' });
    }
  });

  app.post('/api/messages/sync', async (req, res) => {
    try {
      const requester = await getRequesterFromReq(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of messages' });

      const sanitized = req.body.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        order_id: safeString(item.order_id),
        sender_id: item.sender_id || null,
        sender_name: safeString(item.sender_name, 'Anonymous'),
        content: safeString(item.content),
        is_admin: Boolean(item.is_admin),
        created_at: safeString(item.created_at) || new Date().toISOString(),
      }));

      const { error } = await db.from('messages').upsert(sanitized);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error during messages sync' });
    }
  });

  app.post('/api/contacts/sync', async (req, res) => {
    try {
      const requester = await getRequesterFromReq(req);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
      }
      if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Body must be an array of contact messages' });

      const sanitized = req.body.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        name: safeString(item.name, 'Anonymous'),
        email: safeString(item.email),
        subject: safeString(item.subject),
        message: safeString(item.message),
        is_read: Boolean(item.is_read),
        created_at: safeString(item.created_at) || new Date().toISOString(),
      }));

      const { error } = await db.from('contact_messages').upsert(sanitized);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, count: sanitized.length });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error during contacts sync' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // VITE / STATIC SERVING
  // ─────────────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Running in development mode with Vite middleware');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Running in production mode serving static dist/');
  }

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server exception:', err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
