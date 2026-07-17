import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, supabaseAdmin, supabaseUrl } from '../lib/supabase.js';
import { safeString, InputError } from '../lib/validation.js';
import { generatePaymentId, deriveRole } from '../lib/utils.js';

const router = Router();

async function getRequesterProfile(req: Request): Promise<any> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      const { supabase } = await import('../lib/supabase.js');
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (error || !authUser) return null;
      const email = authUser.email?.toLowerCase().trim();
      if (!email) return null;
      const role = deriveRole(email, authUser.user_metadata?.role);
      return { id: authUser.id, email, full_name: authUser.user_metadata?.full_name || email.split('@')[0], role, created_at: authUser.created_at };
    }
  }
  return null;
}

async function processPaymentRecord({
  order_id, provider_id, amount, currency, reference_id, phone_number
}: {
  order_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  reference_id: string;
  phone_number?: string | null;
}): Promise<any> {
  if (amount <= 0 || isNaN(amount)) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const admin_cut = Number((amount * 0.10).toFixed(2));
  const expert_amount = Number((amount * 0.90).toFixed(2));
  const payId = generatePaymentId();

  const newPayment = {
    id: payId,
    order_id,
    provider_id,
    amount,
    admin_cut,
    expert_amount,
    currency,
    status: 'completed',
    reference_id,
    phone_number: phone_number || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: insertErr } = await db.from('payments').insert([newPayment]);
  if (insertErr) {
    console.error('Failed to create payment record:', insertErr.message);
    throw new Error('Failed to record payment');
  }

  const { data: currentOrder } = await db.from('orders').select('status').eq('id', order_id).maybeSingle();
  const currentStatus = currentOrder?.status || 'pending';

  const orderUpdates: Record<string, any> = {
    payment_status: 'approved',
    payment_method: provider_id,
    payment_ref_number: reference_id,
    payment_id: payId
  };

  if (currentStatus === 'pending') {
    orderUpdates.status = 'in_progress';
  }

  const { error: updateErr } = await db.from('orders').update(orderUpdates).eq('id', order_id);
  if (updateErr) {
    console.error(`Failed to update order status for ID ${order_id}:`, updateErr.message);
    throw new Error('Failed to update order');
  }

  return newPayment;
}

// POST payment
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const order_id = safeString(req.body.order_id);
    const provider_id = safeString(req.body.provider_id, 'PADDLE');
    const amount = req.body.amount !== undefined ? Number(req.body.amount) : undefined;
    const currency = safeString(req.body.currency);
    const phone_number = safeString(req.body.phone_number);
    const payment_screenshot = req.body.payment_screenshot;
    const payment_method_type = req.body.payment_method_type;

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    const { data: orderData, error: orderErr } = await db
      .from('orders').select('*').eq('id', order_id).maybeSingle();
    if (orderErr) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!orderData) return res.status(404).json({ error: 'Order not found for payment' });

    const order = orderData as any;

    if (payment_screenshot) {
      // Store screenshot, mark payment as pending for admin review
      const { error: updateErr } = await db.from('orders').update({
        payment_screenshot,
        payment_status: 'pending',
        payment_method: payment_method_type === 'crypto' ? 'crypto' : (payment_method_type || 'bank_transfer'),
      }).eq('id', order_id);
      if (updateErr) return res.status(500).json({ error: 'Failed to update order' });
      return res.json({ success: true, status: 'pending' });
    }

    const finalAmount = amount !== undefined && !isNaN(amount) && amount >= 0 ? amount : (order.total_amount || 100);
    const finalCurrency = currency || order.currency || 'USD';
    const referenceId = `${provider_id.toUpperCase()}-REF-${Math.floor(10000 + Math.random() * 90000)}-X`;

    const payment = await processPaymentRecord({
      order_id, provider_id, amount: finalAmount, currency: finalCurrency,
      reference_id: referenceId, phone_number: phone_number || null
    });

    res.json({ success: true, status: 'completed', reference_id: referenceId, payment });
  } catch (err: any) {
    console.error('POST /api/payments exception:', err);
    res.status(500).json({ error: err.message || 'Internal server error during payment processing' });
  }
});

// GET all payments (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    const { data, error } = await db
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch payments' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
