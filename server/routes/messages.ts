import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/supabase.js';
import { sanitizeText, requireIdParam, InputError } from '../lib/validation.js';
import { isOrderAccessibleToExpert, getRequesterProfile } from '../lib/utils.js';

const router = Router();

// Helper: verify that the requester has access to a given order.
// Returns the order row if authorized, or sends an error response and returns null.
async function requireOrderAccess(
  req: Request,
  res: Response,
  orderId: string
): Promise<any | null> {
  const requester = await getRequesterProfile(req);
  if (!requester) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const { data: order, error: ordErr } = await db
    .from('orders').select('*').eq('id', orderId).maybeSingle();
  if (ordErr) {
    res.status(500).json({ error: 'Failed to fetch order' });
    return null;
  }
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }

  let authorized = false;
  if (requester.role === 'admin') {
    authorized = true;
  } else if (requester.role === 'expert') {
    authorized = isOrderAccessibleToExpert(order, requester.email, requester.full_name);
  } else {
    authorized = typeof order.client_email === 'string' &&
      order.client_email.toLowerCase() === requester.email.toLowerCase();
  }

  if (!authorized) {
    res.status(403).json({ error: 'Access denied to this order thread' });
    return null;
  }

  return { requester, order };
}

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
      // Infer recipient for legacy messages so admin tab filtering works
      const classified = (allMessages || []).map((m: any) => {
        if (!m.recipient) return { ...m, recipient: 'student' };
        return m;
      });
      return res.json({ data: classified, total: count || 0, page, limit });
    }

    // For clients: filter orders by client_email at DB level, then filter messages
    if (requester.role === 'client') {
      const { data: clientOrders, error: ordErr } = await db
        .from('orders').select('id').eq('client_email', requester.email);
      if (ordErr) return res.status(500).json({ error: 'Failed to fetch orders' });

      const orderIds = (clientOrders || []).map((o: any) => o.id);
      if (orderIds.length === 0) return res.json({ data: [], total: 0, page, limit });

      const { data: msgs, error: msgErr } = await db
        .from('messages').select('*').in('order_id', orderIds)
        .order('created_at', { ascending: false });
      if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });

      // Client only sees: admin messages + own messages
      const filtered = (msgs || []).filter((m: any) => m.is_admin === true || m.sender_id === requester.id);
      const total = filtered.length;
      const paginated = filtered.slice(offset, offset + limit);
      return res.json({ data: paginated, total, page, limit });
    }

    // For experts: fetch all orders and filter via fuzzy name match
    const { data: allOrders, error: ordErr } = await db.from('orders').select('id, assigned_to');
    if (ordErr) return res.status(500).json({ error: 'Failed to fetch orders' });

    const allowedIds = (allOrders || [])
      .filter((o: any) => isOrderAccessibleToExpert(o, requester.email, requester.full_name))
      .map((o: any) => o.id);

    if (allowedIds.length === 0) return res.json({ data: [], total: 0, page, limit });

    const { data: msgs, error: msgErr } = await db
      .from('messages').select('*').in('order_id', allowedIds)
      .order('created_at', { ascending: false });
    if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });

    // Expert only sees: admin messages + own messages
    const filtered = (msgs || []).filter((m: any) => m.is_admin === true || m.sender_id === requester.id);
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    res.json({ data: paginated, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching messages' });
  }
});

// GET messages by order ID
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    let orderId: string;
    try {
      orderId = requireIdParam(req.params.orderId, 'orderId');
    } catch (e) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const result = await requireOrderAccess(req, res, orderId);
    if (!result) return;

    const { requester } = result;

    const { data: msgs, error: msgErr } = await db
      .from('messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
    if (msgErr) return res.status(500).json({ error: msgErr.message });

    // Infer recipient for legacy messages that lack the field.
    // Admin-sent messages default to 'student' (expert thread is separate).
    // Non-admin messages also default to 'student'.
    const classified = (msgs || []).map((m: any) => {
      if (!m.recipient) {
        return { ...m, recipient: 'student' };
      }
      return m;
    });

    // Filter messages based on role:
    //   admin   -> see everything
    //   expert  -> see admin messages + own messages only (never student messages)
    //   client  -> see admin messages + own messages only (never expert messages)
    const filtered = classified.filter((m: any) => {
      if (requester.role === 'admin') return true;
      return m.is_admin === true || m.sender_id === requester.id;
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching thread messages' });
  }
});

// POST new chat message
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const order_id = sanitizeText(req.body.order_id, 80);
    const rawContent = req.body.content;
    const rawSenderName = req.body.sender_name;

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    if (!rawContent || !String(rawContent).trim()) return res.status(400).json({ error: 'Message content cannot be empty' });

    // ── Authorization: verify the requester has access to this order ──
    const { data: order, error: ordErr } = await db
      .from('orders').select('*').eq('id', order_id).maybeSingle();
    if (ordErr) return res.status(500).json({ error: 'Failed to verify order access' });
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

    const content = sanitizeText(rawContent, 10000);
    const sender_name = sanitizeText(rawSenderName, 200) || 'Anonymous';

    if (!content) return res.status(400).json({ error: 'Message content is required' });

    // Determine recipient:
    //   admin  -> use the explicitly provided recipient ('student' or 'expert')
    //   client -> always 'student' (messages from students go to student thread)
    //   expert -> always 'expert' (messages from experts go to expert thread)
    const validRecipients = ['student', 'expert'];
    let recipient: string | null = null;
    if (requester.role === 'admin' && validRecipients.includes(req.body.recipient)) {
      recipient = req.body.recipient;
    } else if (requester.role === 'client') {
      recipient = 'student';
    } else if (requester.role === 'expert') {
      recipient = 'expert';
    }

    // Server-generated fields only — never trust client-supplied id, sender_id, or is_admin
    const newMsg = {
      id: crypto.randomUUID(),
      order_id,
      sender_id: requester.id,
      sender_name,
      content,
      is_admin: requester.role === 'admin',
      recipient,
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

    let messageId: string;
    try {
      messageId = requireIdParam(req.params.messageId, 'messageId');
    } catch (e) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const { error } = await db.from('messages').delete().eq('id', messageId);
    if (error) return res.status(500).json({ error: 'Failed to delete message' });

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while deleting message' });
  }
});

export default router;
