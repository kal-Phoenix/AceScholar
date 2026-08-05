import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getRequesterProfile, isOrderAccessibleToExpert } from '../lib/utils.js';
import { db } from '../lib/supabase.js';
import { safeString } from '../lib/validation.js';

const router = Router();

// POST request withdrawal
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'expert') {
      return res.status(403).json({ error: 'Only experts can request withdrawals' });
    }

    const amount = Number(req.body.amount);
    const method = safeString(req.body.method);
    const account_details = safeString(req.body.account_details);
    const currency = safeString(req.body.currency, 'USD');

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
    if (!method) return res.status(400).json({ error: 'Payment method is required' });
    if (!account_details) return res.status(400).json({ error: 'Account details are required' });

    // Retry loop to prevent TOCTOU race — re-fetch balance before insert
    const MAX_RETRIES = 3;
    let lastAvailable = 0;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data: allOrders } = await db.from('orders').select('id, assigned_to');
      const myOrderIds = (allOrders || [])
        .filter((o: any) => isOrderAccessibleToExpert(o, requester.email, requester.full_name))
        .map((o: any) => o.id);

      const { data: payments } = myOrderIds.length > 0
        ? await db.from('payments').select('expert_amount').in('order_id', myOrderIds).eq('status', 'approved')
        : { data: [] };

      const { data: withdrawals } = await db
        .from('withdrawals')
        .select('amount')
        .eq('expert_email', requester.email)
        .eq('status', 'approved');

      const totalEarnings = (payments || []).reduce((s: number, p: any) => s + (p.expert_amount || 0), 0);
      const totalWithdrawn = (withdrawals || []).reduce((s: number, w: any) => s + (w.amount || 0), 0);
      lastAvailable = totalEarnings - totalWithdrawn;

      if (amount > lastAvailable) {
        return res.status(400).json({ error: `Insufficient balance. Available: ${lastAvailable.toFixed(2)} ${currency}` });
      }

      // Try insert — if a concurrent withdrawal snuck in, retry
      const id = 'wd-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      const record = {
        id,
        expert_email: requester.email,
        expert_name: requester.full_name,
        amount,
        currency,
        method,
        account_details,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await db.from('withdrawals').insert([record]);
      if (!error) {
        // Notify admin
        try {
          const { data: admins } = await db.from('profiles').select('email').eq('role', 'admin');
          if (admins && admins.length > 0) {
            const notifications = admins.map((a: any) => ({
              id: 'notif-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
              user_email: a.email,
              type: 'withdrawal_request',
              title: 'New Withdrawal Request',
              message: `${requester.full_name} requested ${amount} ${currency} withdrawal via ${method}`,
              read: false,
              link: '/admin',
              created_at: new Date().toISOString(),
            }));
            await db.from('notifications').insert(notifications);
          }
        } catch (_) { /* notification failure is non-fatal */ }
        return res.status(201).json(record);
      }
    }
    return res.status(500).json({ error: 'Failed to create withdrawal request' });
  } catch (err) {
    console.error('POST /api/withdrawals exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET withdrawals (experts see own, admins see all)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    if (requester.role === 'admin') {
      const { data, error } = await db
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch withdrawals' });
      return res.json(data || []);
    }

    const { data, error } = await db
      .from('withdrawals')
      .select('*')
      .eq('expert_email', requester.email)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET expert balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const email = requester.role === 'admin' ? (req.query.expert_email as string) : requester.email;
    if (!email) return res.status(400).json({ error: 'expert_email is required' });

    // Find payments through orders assigned to this expert
    const { data: allOrders } = await db.from('orders').select('id, assigned_to');
    const myOrderIds = (allOrders || [])
      .filter((o: any) => isOrderAccessibleToExpert(o, email, requester.full_name))
      .map((o: any) => o.id);

    const { data: payments } = myOrderIds.length > 0
      ? await db.from('payments').select('expert_amount, currency').in('order_id', myOrderIds).eq('status', 'approved')
      : { data: [] };

    const { data: withdrawals } = await db
      .from('withdrawals')
      .select('amount, currency')
      .eq('expert_email', email)
      .eq('status', 'approved');

    const totalEarnings = (payments || []).reduce((s: number, p: any) => s + (p.expert_amount || 0), 0);
    const totalWithdrawn = (withdrawals || []).reduce((s: number, w: any) => s + (w.amount || 0), 0);

    res.json({
      total_earnings: totalEarnings,
      total_withdrawn: totalWithdrawn,
      available_balance: totalEarnings - totalWithdrawn,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT approve/reject withdrawal (admin only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { status, admin_note, admin_screenshot } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const updatePayload: Record<string, any> = {
      status,
      admin_note: admin_note || null,
      updated_at: new Date().toISOString(),
    };
    if (admin_screenshot) {
      updatePayload.admin_screenshot = admin_screenshot;
    }

    const { data, error } = await db
      .from('withdrawals')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: 'Failed to update withdrawal' });
    if (!data) return res.status(404).json({ error: 'Withdrawal not found' });

    // Notify expert
    const notifId = 'notif-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    await db.from('notifications').insert({
      id: notifId,
      user_email: (data as any).expert_email,
      type: 'withdrawal_' + status,
      title: `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: status === 'approved'
        ? `Your withdrawal of ${(data as any).amount} ${(data as any).currency} has been approved.`
        : `Your withdrawal of ${(data as any).amount} ${(data as any).currency} was rejected.${admin_note ? ' Reason: ' + admin_note : ''}`,
      read: false,
      created_at: new Date().toISOString(),
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
