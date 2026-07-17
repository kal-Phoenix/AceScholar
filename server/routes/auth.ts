import { Router, Request, Response } from 'express';
import { supabase, db } from '../lib/supabase.js';
import { InputError, MAX_LENGTHS, requireEmail, requireText, enforceBodyLimit } from '../lib/validation.js';
import { deriveRole } from '../lib/utils.js';

const router = Router();

// POST signup
router.post('/signup', enforceBodyLimit(10 * 1024), async (req: Request, res: Response) => {
  try {
    let email: string, full_name: string, password: string;
    try {
      email     = requireEmail(req.body.email);
      full_name = requireText(req.body.full_name, MAX_LENGTHS.name, 'Full name');
      if (full_name.length < 2) throw new InputError('Full name must be at least 2 characters');
      password  = requireText(req.body.password, MAX_LENGTHS.password, 'Password');
      if (password.length < 8) throw new InputError('Password must be at least 8 characters');
    } catch (e: any) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      throw e;
    }

    const emailLower = email;
    const role = deriveRole(emailLower);

    const { data, error } = await supabase.auth.signUp({
      email: emailLower,
      password,
      options: { data: { full_name, role } },
    });

    if (error) return res.status(400).json({ error: 'Registration failed. Please try again.' });
    if (!data?.user) return res.status(400).json({ error: 'Signup failed to create a valid user.' });

    await db.from('profiles').upsert({
      id: data.user.id,
      full_name,
      email: emailLower,
      role,
    }, { onConflict: 'id' });

    const profileObj = {
      id: data.user.id,
      full_name,
      email: emailLower,
      role,
      created_at: new Date().toISOString(),
      access_token: data.session?.access_token || null,
    };

    return res.status(201).json(profileObj);
  } catch (err) {
    console.error('POST /api/auth/signup exception:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST login
router.post('/login', enforceBodyLimit(10 * 1024), async (req: Request, res: Response) => {
  try {
    let email: string, password: string;
    try {
      email    = requireEmail(req.body.email);
      password = requireText(req.body.password, MAX_LENGTHS.password, 'Password');
    } catch (e: any) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      throw e;
    }

    const emailLower = email;

    const { data, error } = await supabase.auth.signInWithPassword({ email: emailLower, password });

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        return res.status(403).json({
          error: 'Please verify your email before signing in. Check your inbox for the confirmation link.',
          email_not_confirmed: true,
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!data?.user) return res.status(401).json({ error: 'Invalid email or password' });

    const user = data.user;
    const role = deriveRole(emailLower, user.user_metadata?.role);
    const fullName = user.user_metadata?.full_name || email.split('@')[0];

    const { data: profileRow } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const userProfile = {
      id: user.id,
      full_name: profileRow?.full_name || fullName,
      email: emailLower,
      role,
      created_at: user.created_at,
      whatsapp: profileRow?.whatsapp || user.user_metadata?.whatsapp || null,
      country: profileRow?.country || user.user_metadata?.country || null,
      gpa: profileRow?.gpa || user.user_metadata?.gpa || null,
      qualification: profileRow?.qualification || user.user_metadata?.qualification || null,
      subjects: profileRow?.subjects || user.user_metadata?.subjects || null,
      expert_proposal: profileRow?.expert_proposal || user.user_metadata?.expert_proposal || null,
      expert_status: profileRow?.expert_status || user.user_metadata?.expert_status || null,
      expert_signup_at: profileRow?.expert_signup_at || user.user_metadata?.expert_signup_at || null,
      access_token: data.session?.access_token || null,
    };

    return res.json(userProfile);
  } catch (err) {
    console.error('POST /api/auth/login exception:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// POST resend email verification
router.post('/resend-verification', enforceBodyLimit(10 * 1024), async (req: Request, res: Response) => {
  try {
    let email: string;
    try {
      email = requireEmail(req.body.email);
    } catch (e: any) {
      if (e instanceof InputError) return res.status(400).json({ error: e.message });
      throw e;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('POST /api/auth/resend-verification error:', error.message);
      return res.status(400).json({ error: 'Failed to resend verification email' });
    }

    res.json({ success: true, message: 'Verification email resent. Check your inbox.' });
  } catch (err) {
    console.error('POST /api/auth/resend-verification exception:', err);
    res.status(500).json({ error: 'Internal server error during resend' });
  }
});

export default router;
