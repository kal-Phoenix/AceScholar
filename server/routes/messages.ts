import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/supabase.js';
import { safeString, sanitizeText } from '../lib/validation.js';
import { isOrderAccessibleToExpert, getRequesterProfile } from '../lib/utils.js';

const router = Router();

// GET all messages (scoped by role)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 100));
    const offset = (page - 1) * limit;

    if (requester.role === 'admin') {
      const { count } = await db.from('messages').select('*', { count: 'exact', head: true });
      const { data: allMessages, error: msgErr } = await db
        .from('messages').select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });
      return res.json({ data: allMessages || [], total: count || 0, page, limit });
    }

    // For clients: filter orders by client_email at DB level
    if (requester.role === 'client') {
      const { data: clientOrders, error: ordErr } = await db
        .from('orders').select('id').eq('client_email', requester.email);
      if (ordErr) return res.status(500).json({ error: 'Failed to fetch orders' });

      const orderIds = (clientOrders || []).map((o: any) => o.id);
      if (orderIds.length === 0) return res.json({ data: [], total: 0, page, limit });

      const { count } = await db.from('messages').select('*', { count: 'exact', head: true }).in('order_id', orderIds);
      const { data: msgs, error: msgErr } = await db
        .from('messages').select('*').in('order_id', orderIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });
      return res.json({ data: msgs || [], total: count || 0, page, limit });
    }

    // For experts: fetch all orders (fuzzy matching requires JS filtering)
    const { data: allOrders, error: ordErr } = await db.from('orders').select('*');
    if (ordErr) return res.status(500).json({ error: 'Failed to fetch orders' });

    const orders = allOrders || [];
    const expertOrders = orders.filter((o: any) =>
      isOrderAccessibleToExpert(o, requester.email, requester.full_name)
    );
    const allowedOrderIds = new Set(expertOrders.map((o: any) => o.id));

    if (allowedOrderIds.size === 0) return res.json({ data: [], total: 0, page, limit });

    const { count } = await db.from('messages').select('*', { count: 'exact', head: true }).in('order_id', [...allowedOrderIds]);
    const { data: msgs, error: msgErr } = await db
      .from('messages').select('*').in('order_id', [...allowedOrderIds])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });

    res.json({ data: msgs || [], total: count || 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching messages' });
  }
});

// GET messages by order ID
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const orderId = safeString(req.params.orderId);

    const { data: order, error: ordErr } = await db
      .from('orders').select('*').eq('id', orderId).maybeSingle();
    if (ordErr) return res.status(500).json({ error: 'Failed to fetch order' });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let authorized = false;
    if (requester.role === 'admin') {
      authorized = true;
    } else if (requester.role === 'expert') {
      authorized = isOrderAccessibleToExpert(order, requester.email, requester.full_name);
    } else {
      authorized = typeof order.client_email === 'string' &&
        order.client_email.toLowerCase() === requester.email.toLowerCase();
    }

    if (!authorized) return res.status(403).json({ error: 'Access denied to this order thread' });

    const { data: msgs, error: msgErr } = await db
      .from('messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
    if (msgErr) return res.status(500).json({ error: msgErr.message });

    res.json(msgs || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching thread messages' });
  }
});

// POST new chat message
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const order_id = safeString(req.body.order_id);
    const rawContent = safeString(req.body.content);
    const rawSenderName = safeString(req.body.sender_name);

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    if (!rawContent) return res.status(400).json({ error: 'Message content cannot be empty' });

    const content = sanitizeText(rawContent, 10000);
    const sender_name = sanitizeText(rawSenderName, 200) || 'Anonymous';

    // Use authenticated user's ID — never trust client-supplied sender_id
    const sender_id = requester.id;

    const newMsg = {
      id: req.body.id || crypto.randomUUID(),
      order_id,
      sender_id,
      sender_name,
      content,
      is_admin: requester.role === 'admin',
      created_at: new Date().toISOString(),
    };

    const { error } = await db.from('messages').insert([newMsg]);
    if (error) {
      console.error('POST /api/messages insert error:', error.message);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while saving message' });
  }
});

// DELETE message (admin only)
router.delete('/:messageId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    const messageId = safeString(req.params.messageId);
    if (!messageId) return res.status(400).json({ error: 'Message ID is required' });

    const { error } = await db.from('messages').delete().eq('id', messageId);
    if (error) return res.status(500).json({ error: 'Failed to delete message' });

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while deleting message' });
  }
});

export default router;
