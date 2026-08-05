import { Router, Request, Response } from 'express';
import { getRequesterProfile } from '../lib/utils.js';
import { db } from '../lib/supabase.js';

const router = Router();

// GET notifications for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_email', requester.email)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: 'Failed to fetch notifications' });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET unread count
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { count, error } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_email', requester.email)
      .eq('read', false);
    if (error) return res.status(500).json({ error: 'Failed to fetch count' });
    res.json({ count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT mark as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_email', requester.email);
    if (error) return res.status(500).json({ error: 'Failed to mark as read' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT mark all as read
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('user_email', requester.email)
      .eq('read', false);
    if (error) return res.status(500).json({ error: 'Failed to mark all as read' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
