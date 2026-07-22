import { Router, Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { requireEmail, requireText, MAX_LENGTHS, InputError } from '../lib/validation.js';
import { getRequesterProfile } from '../lib/utils.js';

const router = Router();

// GET contact messages (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const { count } = await db
      .from('contact_messages').select('*', { count: 'exact', head: true });

    const { data, error } = await db
      .from('contact_messages').select('*').order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) return res.status(500).json({ error: 'Failed to fetch contact messages' });
    res.json({ data: data || [], total: count || 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching contact messages' });
  }
});

// POST contact form (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    let name: string, email: string, subject: string, message: string;
    try {
      email   = requireEmail(req.body.email);
      name    = requireText(req.body.name, MAX_LENGTHS.name, 'Name');
      subject = requireText(req.body.subject, MAX_LENGTHS.general, 'Subject');
      message = requireText(req.body.message, MAX_LENGTHS.message, 'Message');
    } catch (e: any) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      throw e;
    }

    const newContact = {
      name,
      email,
      subject,
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await db.from('contact_messages').insert([newContact]).select().maybeSingle();
    if (error) {
      console.error('POST /api/contacts error:', error.message);
      return res.status(500).json({ error: 'Failed to save contact message' });
    }

    res.status(201).json(data || newContact);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while saving contact message' });
  }
});

// DELETE contact message (admin only)
router.delete('/:messageId', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    const messageId = req.params.messageId;
    if (!messageId) return res.status(400).json({ error: 'Message ID is required' });

    const { error } = await db.from('contact_messages').delete().eq('id', messageId);
    if (error) return res.status(500).json({ error: 'Failed to delete contact message' });

    res.json({ success: true, message: 'Contact message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while deleting contact message' });
  }
});

export default router;
