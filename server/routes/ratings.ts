import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getRequesterProfile } from '../lib/utils.js';
import { db } from '../lib/supabase.js';
import { safeString, sanitizeText } from '../lib/validation.js';

const router = Router();

// POST create rating
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });
    if (requester.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can submit ratings' });
    }

    const order_id = safeString(req.body.order_id);
    const score = Number(req.body.score);
    const comment = safeString(req.body.comment);

    if (!order_id) return res.status(400).json({ error: 'order_id is required' });
    if (!score || score < 1 || score > 5) return res.status(400).json({ error: 'Score must be 1-5' });

    // Verify order exists and is delivered
    const { data: order } = await db
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .maybeSingle();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Check if already rated
    const { data: existing } = await db
      .from('ratings')
      .select('id')
      .eq('order_id', order_id)
      .eq('client_email', requester.email)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: 'You have already rated this order' });

    const id = 'rat-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const record = {
      id,
      order_id,
      expert_email: (order as any).assigned_to || '',
      client_email: requester.email,
      client_name: requester.full_name,
      score,
      comment: comment || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await db.from('ratings').insert([record]);
    if (error) return res.status(500).json({ error: 'Failed to submit rating' });

    // Notify expert
    if ((order as any).assigned_to) {
      const notifId = 'notif-' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
      // Get expert email from profile
      const { data: expertProfile } = await db
        .from('profiles')
        .select('email')
        .eq('full_name', (order as any).assigned_to)
        .maybeSingle();
      if (expertProfile) {
        await db.from('notifications').insert({
          id: notifId,
          user_email: (expertProfile as any).email,
          type: 'new_rating',
          title: 'New Rating Received',
          message: `${requester.full_name} gave you ${score}/5 stars for order ${order_id}`,
          read: false,
          link: '/expert',
          created_at: new Date().toISOString(),
        });
      }
    }

    res.status(201).json(record);
  } catch (err) {
    console.error('POST /api/ratings exception:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ratings for an expert (requires authentication)
router.get('/expert/:email', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const expertEmail = sanitizeText(req.params.email, 254);
    if (!expertEmail) return res.status(400).json({ error: 'Expert email is required' });

    const { data, error } = await db
      .from('ratings')
      .select('*')
      .eq('expert_email', expertEmail)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch ratings' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all ratings (admin) or own ratings (client)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    if (requester.role === 'admin') {
      const { data, error } = await db
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch ratings' });
      return res.json(data || []);
    }

    const { data, error } = await db
      .from('ratings')
      .select('*')
      .eq('client_email', requester.email)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch ratings' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
