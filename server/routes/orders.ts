import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/supabase.js';
import {
  InputError, MAX_LENGTHS, ALLOWED_ORDER_STATUSES, ALLOWED_PAYMENT_STATUSES, ALLOWED_PAYMENT_METHODS,
  requireText, requireEmail, optionalText, safeString, requireIdParam, enforceBodyLimit
} from '../lib/validation.js';
import { isOrderAccessibleToExpert, getRequesterProfile } from '../lib/utils.js';
import { getCachedUsers } from './profiles.js';

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

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    // Admin gets all orders
    if (requester.role === 'admin') {
      const { count } = await db
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { data, error } = await db
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        console.error('GET /api/orders error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      return res.json({ data: data || [], total: count || 0, page, limit });
    }

    // Client: filter by client_email at DB level
    if (requester.role === 'client') {
      const { count } = await db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_email', requester.email);

      const { data, error } = await db
        .from('orders')
        .select('*')
        .eq('client_email', requester.email)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        console.error('GET /api/orders error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }
      return res.json({ data: data || [], total: count || 0, page, limit });
    }

    // Expert: fetch all and filter in JS (fuzzy matching)
    const { data, error } = await db
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET /api/orders error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    const allOrders = data || [];
    const filtered = allOrders.filter((o: any) =>
      isOrderAccessibleToExpert(o, requester.email, requester.full_name)
    );
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    return res.json({ data: paginated, total, page, limit });
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

    const authUsers = await getCachedUsers();
    const clientAuthUser = authUsers?.find((u: any) => u.email?.toLowerCase() === client_email.toLowerCase());
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

// POST apply to order (expert submits application — admin must approve)
router.post('/:orderId/apply', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'expert') {
      return res.status(403).json({ error: 'Only experts can apply to orders' });
    }

    let orderId: string;
    try { orderId = requireIdParam(req.params.orderId, 'Order ID'); }
    catch (e: any) { if (e instanceof InputError) return res.status(400).json({ error: e.message }); throw e; }

    const expert_email = safeString(req.body.expert_email);
    const expert_name = safeString(req.body.expert_name);
    if (!expert_email || !expert_name) {
      return res.status(400).json({ error: 'expert_email and expert_name are required' });
    }

    const { data: order, error: fetchErr } = await db
      .from('orders').select('*').eq('id', orderId).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if already assigned
    if (order.assigned_to && order.assigned_to.trim() && order.assigned_to !== 'Unallocated') {
      return res.status(409).json({ error: 'This order is already assigned to another expert' });
    }

    // Check if already applied
    const applicants = Array.isArray(order.applicants) ? order.applicants : [];
    const alreadyApplied = applicants.some((a: any) =>
      a.expert_email?.toLowerCase() === expert_email.toLowerCase()
    );
    if (alreadyApplied) {
      return res.status(409).json({ error: 'You have already applied to this order' });
    }

    // Add application
    const newApplicant = {
      expert_email,
      expert_name,
      applied_at: new Date().toISOString(),
      status: 'pending',
    };
    const updatedApplicants = [...applicants, newApplicant];

    const { error: updateErr } = await db
      .from('orders').update({ applicants: updatedApplicants }).eq('id', orderId);
    if (updateErr) return res.status(500).json({ error: 'Failed to submit application' });

    res.json({ success: true, applicants: updatedApplicants });
  } catch (err) {
    console.error('POST /api/orders/:orderId/apply exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST approve expert application (admin only)
router.post('/:orderId/approve-expert', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    let orderId: string;
    try { orderId = requireIdParam(req.params.orderId, 'Order ID'); }
    catch (e: any) { if (e instanceof InputError) return res.status(400).json({ error: e.message }); throw e; }

    const { expert_email, expert_name } = req.body;
    if (!expert_email || !expert_name) {
      return res.status(400).json({ error: 'expert_email and expert_name are required' });
    }

    const { data: order, error: fetchErr } = await db
      .from('orders').select('*').eq('id', orderId).maybeSingle();
    if (fetchErr) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Update applicants — mark this one as approved, others as rejected
    const applicants = Array.isArray(order.applicants) ? order.applicants : [];
    const updatedApplicants = applicants.map((a: any) => ({
      ...a,
      status: a.expert_email?.toLowerCase() === expert_email.toLowerCase() ? 'approved' : 'rejected',
    }));

    const { error: updateErr } = await db
      .from('orders').update({
        applicants: updatedApplicants,
        assigned_to: expert_name,
        expert_accepted: true,
        status: 'in_progress',
      }).eq('id', orderId);
    if (updateErr) return res.status(500).json({ error: 'Failed to approve expert' });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/orders/:orderId/approve-expert exception:', err);
    res.status(500).json({ error: 'Internal server error' });
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

export default router;
