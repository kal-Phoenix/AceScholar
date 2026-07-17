import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/supabase.js';
import { safeString, requireText, MAX_LENGTHS, sanitizeText } from '../lib/validation.js';
import { isOrderAccessibleToExpert, deriveRole } from '../lib/utils.js';

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

// GET all messages (scoped by role)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { data: allMessages, error: msgErr } = await db.from('messages').select('*');
    if (msgErr) return res.status(500).json({ error: 'Failed to fetch messages' });

    const { data: allOrders, error: ordErr } = await db.from('orders').select('*');
    if (ordErr) return res.status(500).json({ error: 'Failed to fetch messages' });

    const messages = allMessages || [];
    const orders = allOrders || [];

    if (requester.role === 'admin') return res.json(messages);

    let allowedOrderIds: Set<string>;
    if (requester.role === 'expert') {
      const expertOrders = orders.filter((o: any) =>
        isOrderAccessibleToExpert(o, requester.email, requester.full_name)
      );
      allowedOrderIds = new Set(expertOrders.map((o: any) => o.id));
    } else {
      allowedOrderIds = new Set(
        orders.filter((o: any) =>
          typeof o.client_email === 'string' &&
          o.client_email.toLowerCase() === requester.email.toLowerCase()
        ).map((o: any) => o.id)
      );
    }

    res.json(messages.filter((m: any) => allowedOrderIds.has(m.order_id)));
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
    const sender_name = safeString(req.body.sender_name);

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    if (!rawContent) return res.status(400).json({ error: 'Message content cannot be empty' });

    const content = sanitizeText(rawContent);

    let sender_id = req.body.sender_id ? safeString(req.body.sender_id) : null;
    if (sender_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sender_id)) {
      sender_id = null;
    }

    const newMsg = {
      id: req.body.id || crypto.randomUUID(),
      order_id,
      sender_id,
      sender_name: sender_name || 'Anonymous',
      content,
      is_admin: Boolean(req.body.is_admin),
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
