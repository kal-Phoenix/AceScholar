import { Router, Request, Response } from 'express';
import { db } from '../lib/supabase.js';
import { requireEmail, requireText, MAX_LENGTHS, InputError } from '../lib/validation.js';
import { deriveRole } from '../lib/utils.js';

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

// GET contact messages (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });

    const { data, error } = await db
      .from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch contact messages' });
    res.json(data || []);
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
