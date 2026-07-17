import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/supabase.js';
import {
  InputError, MAX_LENGTHS, ALLOWED_ORDER_STATUSES, ALLOWED_PAYMENT_STATUSES, ALLOWED_PAYMENT_METHODS,
  requireText, requireEmail, optionalText, safeString, requireIdParam, enforceBodyLimit
} from '../lib/validation.js';
import { isOrderAccessibleToExpert } from '../lib/utils.js';

const router = Router();

// All columns that can be written to the orders table
const WRITABLE_COLUMNS = [
  'id', 'client_id', 'client_name', 'client_email', 'service_type', 'subject',
  'academic_level', 'deadline', 'description', 'special_instructions',
  'budget_range', 'status', 'assigned_to', 'expert_accepted', 'applicants',
  'file_url', 'file_name', 'delivery_url', 'delivery_name', 'payment_method',
  'payment_screenshot', 'payment_status', 'payment_ref_number', 'payment_id',
  'total_amount', 'currency', 'created_at', 'internal_notes',
  // Payment-after-delivery fields (proper columns, no more metadata hack)
  'agreed_price', 'preview_url', 'preview_name', 'payment_awaiting',
  'payment_method_type', 'crypto_discount_applied', 'delivery_released',
  'expert_submission_url', 'expert_submission_name', 'admin_screenshots',
];

/** Build a DB-safe record from input, only including known columns. */
function buildDbRecord(input: any): Record<string, any> {
  const record: Record<string, any> = {};
  for (const col of WRITABLE_COLUMNS) {
    if (input[col] !== undefined) {
      record[col] = input[col];
    }
  }
  return record;
}

// GET all orders (scoped by role)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { data, error } = await db
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/orders error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    const orders = data || [];

    if (requester.role === 'admin') {
      return res.json(orders);
    }

    if (requester.role === 'expert') {
      return res.json(orders.filter((o: any) =>
        isOrderAccessibleToExpert(o, requester.email, requester.full_name)
      ));
    }

    // Client — only their own orders
    return res.json(orders.filter((o: any) =>
      typeof o.client_email === 'string' &&
      o.client_email.toLowerCase() === requester.email.toLowerCase()
    ));
  } catch (err) {
    console.error('GET /api/orders exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single order by ID
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    let orderId: string;
    try { orderId = requireIdParam(req.params.orderId, 'Order ID'); }
    catch (e: any) { if (e instanceof InputError) return res.status(400).json({ error: e.message }); throw e; }

    const { data, error } = await db.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!data) return res.status(404).json({ error: 'Order not found' });

    if (requester.role !== 'admin') {
      const isClient = typeof data.client_email === 'string' &&
        data.client_email.toLowerCase() === requester.email.toLowerCase();
      const isExpert = requester.role === 'expert' && isOrderAccessibleToExpert(data, requester.email, requester.full_name);
      if (!isClient && !isExpert) {
        return res.status(403).json({ error: 'Access denied to this order' });
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new order
router.post('/', enforceBodyLimit(5 * 1024 * 1024), async (req: Request, res: Response) => {
  try {
    let client_email: string, client_name: string;
    try {
      client_email = requireEmail(req.body.client_email);
      client_name  = requireText(req.body.client_name, MAX_LENGTHS.name, 'Client name');
    } catch (e: any) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      throw e;
    }

    const { supabase } = await import('../lib/supabase.js');
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const clientAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === client_email.toLowerCase());
    const client_id = clientAuthUser?.id || null;

    const orderId = optionalText(req.body.id, MAX_LENGTHS.id).replace(/[^a-zA-Z0-9_\-]/g, '') || 'ord-' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);

    const inputOrder = {
      id: orderId,
      client_id,
      client_name,
      client_email,
      service_type: optionalText(req.body.service_type, MAX_LENGTHS.service_type, 'General / Unspecified'),
      subject: optionalText(req.body.subject, MAX_LENGTHS.subject, 'General / Unspecified'),
      academic_level: optionalText(req.body.academic_level, MAX_LENGTHS.general, 'Undergraduate'),
      deadline: optionalText(req.body.deadline, 60),
      description: optionalText(req.body.description, MAX_LENGTHS.description),
      special_instructions: req.body.special_instructions
        ? optionalText(req.body.special_instructions, MAX_LENGTHS.instructions) || null
        : null,
      budget_range: optionalText(req.body.budget_range, MAX_LENGTHS.budget, '$50-$100'),
      status: (ALLOWED_ORDER_STATUSES as readonly string[]).includes(String(req.body.status ?? ''))
        ? req.body.status : 'pending',
      created_at: new Date().toISOString(),
      payment_status: (ALLOWED_PAYMENT_STATUSES as readonly string[]).includes(String(req.body.payment_status ?? ''))
        ? req.body.payment_status : 'pending',
      payment_method: req.body.payment_method
        ? optionalText(req.body.payment_method, MAX_LENGTHS.general) || null : null,
      payment_screenshot: req.body.payment_screenshot ? safeString(req.body.payment_screenshot) : null,
      payment_ref_number: req.body.payment_ref_number
        ? optionalText(req.body.payment_ref_number, 100) || null : null,
      payment_id: req.body.payment_id ? optionalText(req.body.payment_id, MAX_LENGTHS.id) || null : null,
      total_amount: (typeof req.body.total_amount === 'number' && req.body.total_amount >= 0 && req.body.total_amount <= 9_999_999)
        ? req.body.total_amount : 100,
      currency: optionalText(req.body.currency, MAX_LENGTHS.currency, 'USD').toUpperCase(),
      applicants: Array.isArray(req.body.applicants) ? req.body.applicants.slice(0, 100) : [],
      internal_notes: req.body.internal_notes ? optionalText(req.body.internal_notes, MAX_LENGTHS.notes) : null,
      // Payment-after-delivery fields — stored as proper columns
      agreed_price: (req.body.agreed_price !== undefined && Number(req.body.agreed_price) >= 0 && Number(req.body.agreed_price) <= 9_999_999)
        ? Number(req.body.agreed_price) : null,
      preview_url: req.body.preview_url ? optionalText(req.body.preview_url, MAX_LENGTHS.url) : null,
      preview_name: req.body.preview_name ? optionalText(req.body.preview_name, MAX_LENGTHS.filename) : null,
      payment_awaiting: Boolean(req.body.payment_awaiting) || false,
      payment_method_type: (ALLOWED_PAYMENT_METHODS as readonly string[]).includes(String(req.body.payment_method_type ?? ''))
        ? req.body.payment_method_type : null,
      crypto_discount_applied: Boolean(req.body.crypto_discount_applied) || false,
      delivery_released: Boolean(req.body.delivery_released) || false,
      expert_submission_url: req.body.expert_submission_url ? optionalText(req.body.expert_submission_url, MAX_LENGTHS.url) : null,
      expert_submission_name: req.body.expert_submission_name
        ? optionalText(req.body.expert_submission_name, MAX_LENGTHS.filename) : null,
      admin_screenshots: Array.isArray(req.body.admin_screenshots) ? req.body.admin_screenshots : null,
    };

    const dbRecord = buildDbRecord(inputOrder);

    const { error } = await db.from('orders').insert([dbRecord]);
    if (error) {
      console.error('POST /api/orders insert error:', error.message);
      if (error.message?.toLowerCase().includes('client_id') || error.message?.toLowerCase().includes('foreign key')) {
        const { error: retryErr } = await db.from('orders').insert([{ ...dbRecord, client_id: null }]);
        if (retryErr) return res.status(500).json({ error: 'Failed to create order' });
      } else {
        return res.status(500).json({ error: 'Failed to create order' });
      }
    }

    res.status(201).json(dbRecord);
  } catch (err) {
    console.error('POST /api/orders exception:', err);
    res.status(500).json({ error: 'Internal server error while creating order' });
  }
});

// PUT update order
router.put('/:orderId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    let orderId: string;
    try { orderId = requireIdParam(req.params.orderId, 'Order ID'); }
    catch (e: any) { if (e instanceof InputError) return res.status(400).json({ error: e.message }); throw e; }

    const { data: currentOrderData, error: fetchErr } = await db
      .from('orders').select('*').eq('id', orderId).maybeSingle();

    if (fetchErr) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!currentOrderData) return res.status(404).json({ error: 'Order not found' });

    if (requester.role !== 'admin') {
      const isOwner = typeof currentOrderData.client_email === 'string' &&
        currentOrderData.client_email.toLowerCase() === requester.email.toLowerCase();
      const isExpert = requester.role === 'expert' && isOrderAccessibleToExpert(currentOrderData, requester.email, requester.full_name);
      if (!isOwner && !isExpert) {
        return res.status(403).json({ error: 'Access denied: you cannot modify this order' });
      }
    }

    const dbRecord = buildDbRecord(req.body);

    if (requester.role === 'client') {
      const CLIENT_ALLOWED_FIELDS = [
        'description', 'special_instructions', 'budget_range', 'deadline',
        'service_type', 'subject', 'academic_level', 'file_url', 'file_name',
      ];
      for (const key of Object.keys(dbRecord)) {
        if (!CLIENT_ALLOWED_FIELDS.includes(key)) {
          delete dbRecord[key];
        }
      }
    } else if (requester.role === 'expert') {
      const EXPERT_ALLOWED_FIELDS = [
        'status', 'assigned_to', 'expert_accepted', 'delivery_url', 'delivery_name',
        'expert_submission_url', 'expert_submission_name', 'description',
      ];
      for (const key of Object.keys(dbRecord)) {
        if (!EXPERT_ALLOWED_FIELDS.includes(key)) {
          delete dbRecord[key];
        }
      }
    }

    const { data, error } = await db
      .from('orders').update(dbRecord).eq('id', orderId).select().maybeSingle();

    if (error) {
      console.error('PUT /api/orders error:', error.message);
      return res.status(500).json({ error: 'Failed to update order' });
    }
    if (!data) return res.status(404).json({ error: 'Order not found' });

    res.json(data);
  } catch (err) {
    console.error('PUT /api/orders exception:', err);
    res.status(500).json({ error: 'Internal server error while updating order' });
  }
});

// DELETE order (admin only)
router.delete('/:orderId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    let orderId: string;
    try { orderId = requireIdParam(req.params.orderId, 'Order ID'); }
    catch (e: any) { if (e instanceof InputError) return res.status(400).json({ error: e.message }); throw e; }

    const { error } = await db.from('orders').delete().eq('id', orderId);
    if (error) return res.status(500).json({ error: 'Failed to delete order' });

    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while deleting order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────────────────────

async function getRequesterProfile(req: Request): Promise<any> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      const { supabase } = await import('../lib/supabase.js');
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) return null;
      const { deriveRole } = await import('../lib/utils.js');
      const email = authUser.email?.toLowerCase().trim();
      if (!email) return null;
      const role = deriveRole(email, authUser.user_metadata?.role);
      return { id: authUser.id, email, full_name: authUser.user_metadata?.full_name || email.split('@')[0], role, created_at: authUser.created_at };
    }
  }
  return null;
}

export default router;
