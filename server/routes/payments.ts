import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { paymentConfig, generatePaymentId, getRequesterProfile, isOrderAccessibleToExpert, getAdminCutPercent } from '../lib/utils.js';
import { db } from '../lib/supabase.js';
import { safeString } from '../lib/validation.js';

const router = Router();

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

  const adminCutPercent = getAdminCutPercent();
  const admin_cut = Number((amount * adminCutPercent / 100).toFixed(2));
  const expert_amount = Number((amount * (100 - adminCutPercent) / 100).toFixed(2));
  const payId = generatePaymentId();

  const newPayment = {
    id: payId,
    order_id,
    provider_id,
    amount,
    admin_cut,
    expert_amount,
    currency,
    status: 'pending',
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

  const orderUpdates: Record<string, any> = {
    payment_status: 'pending',
    payment_method: provider_id,
    payment_ref_number: reference_id,
    payment_id: payId
  };

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

    // Verify the authenticated user owns this order (admins can pay for any order)
    if (requester.role === 'client' &&
        order.client_email?.toLowerCase() !== requester.email.toLowerCase()) {
      return res.status(403).json({ error: 'You can only submit payments for your own orders' });
    }
    // Experts cannot submit payments — only clients and admins can
    if (requester.role === 'expert') {
      return res.status(403).json({ error: 'Experts cannot submit payments' });
    }

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
    const referenceId = `${provider_id.toUpperCase()}-REF-${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;

    // Validate the submitted amount is within a reasonable range of the order total.
    // The agreed_price (payment-after-delivery) takes precedence over total_amount.
    const expectedAmount: number = order.agreed_price ?? order.total_amount ?? 0;
    if (expectedAmount > 0 && finalAmount < expectedAmount * 0.5) {
      return res.status(400).json({
        error: `Payment amount (${finalAmount}) is too low. Expected approximately ${expectedAmount} ${finalCurrency}.`,
      });
    }
    if (expectedAmount > 0 && finalAmount > expectedAmount * 1.5) {
      return res.status(400).json({
        error: `Payment amount (${finalAmount}) is too high. Expected approximately ${expectedAmount} ${finalCurrency}.`,
      });
    }

    const payment = await processPaymentRecord({
      order_id, provider_id, amount: finalAmount, currency: finalCurrency,
      reference_id: referenceId, phone_number: phone_number || null
    });

    res.json({ success: true, status: 'pending', reference_id: referenceId, payment });
  } catch (err: any) {
    console.error('POST /api/payments exception:', err);
    res.status(500).json({ error: 'Internal server error during payment processing' });
  }
});

// GET payment configuration (public — full account details)
router.get('/config', (_req: Request, res: Response) => {
  const fullConfig = paymentConfig();
  res.json({
    providers: fullConfig.providers,
    ethiopia: fullConfig.ethiopia,
    crypto: {
      discountPercent: fullConfig.crypto.discountPercent,
      assets: fullConfig.crypto.assets.map(a => ({
        ...a,
        networks: a.networks.map(n => ({ name: n.name, address: n.address })),
      })),
    },
    card: fullConfig.card,
  });
});

// GET full payment config (admin only — includes account details)
router.get('/config/full', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json(paymentConfig());
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all payments (admin sees all; experts see only payments for their assigned orders)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    if (requester.role === 'admin') {
      const { data, error } = await db
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch payments' });
      return res.json(data || []);
    }

    // Expert: fetch all orders and filter using fuzzy matching (same logic as orders endpoint)
    const { data: allOrders, error: ordersErr } = await db
      .from('orders')
      .select('id');
    if (ordersErr) return res.status(500).json({ error: 'Failed to fetch orders' });

    const orderIds = (allOrders || [])
      .filter((o: any) => isOrderAccessibleToExpert(o, requester.email))
      .map((o: any) => o.id);
    if (orderIds.length === 0) return res.json([]);

    const { data, error } = await db
      .from('payments')
      .select('*')
      .in('order_id', orderIds)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch payments' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
