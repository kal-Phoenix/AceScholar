import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin, db } from '../lib/supabase.js';
import { safeString, isValidEmail, MAX_LENGTHS } from '../lib/validation.js';
import { deriveRole, getRequesterProfile } from '../lib/utils.js';

const router = Router();

// User cache for admin operations
let userCache: { users: any[]; fetchedAt: number } = { users: [], fetchedAt: 0 };
const USER_CACHE_TTL_MS = 60_000;
const USER_CACHE_MAX_STALE_MS = 300_000; // 5 minutes max staleness

export async function getCachedUsers(): Promise<any[]> {
  const now = Date.now();
  if (userCache.users.length > 0 && (now - userCache.fetchedAt) < USER_CACHE_TTL_MS) {
    return userCache.users;
  }
  // If cache is stale but within max-staleness, serve stale + refresh in background
  const isStale = userCache.users.length > 0 && (now - userCache.fetchedAt) >= USER_CACHE_TTL_MS;
  const isTooOld = userCache.users.length > 0 && (now - userCache.fetchedAt) >= USER_CACHE_MAX_STALE_MS;

  // If too old, block and refresh; if just stale, serve stale and refresh async
  if (isTooOld) {
    try {
      const adminClient = supabaseAdmin || db;
      const listUsersPromise = adminClient.auth.admin.listUsers();
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error('listUsers timeout')), 8000)
      );
      const { data, error } = await Promise.race([listUsersPromise, timeoutPromise]) as any;
      if (!error) {
        userCache.users = data?.users || [];
        userCache.fetchedAt = now;
      }
    } catch (e) {
      console.error('getCachedUsers: listUsers failed (stale refresh):', e);
    }
    return userCache.users;
  }

  if (isStale) {
    // Refresh in background — return stale data immediately
    try {
      const adminClient = supabaseAdmin || db;
      adminClient.auth.admin.listUsers().then(({ data, error }) => {
        if (!error) {
          userCache.users = data?.users || [];
          userCache.fetchedAt = Date.now();
        }
      }).catch(() => {});
    } catch { /* background refresh — ignore */ }
  }

  if (userCache.users.length === 0) {
    // Cold start — must fetch
    try {
      const adminClient = supabaseAdmin || db;
      const listUsersPromise = adminClient.auth.admin.listUsers();
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error('listUsers timeout')), 8000)
      );
      const { data, error } = await Promise.race([listUsersPromise, timeoutPromise]) as any;
      if (error) {
        console.error('getCachedUsers: listUsers failed:', error.message);
        return userCache.users;
      }
      userCache.users = data?.users || [];
      userCache.fetchedAt = now;
    } catch (e) {
      console.error('getCachedUsers: listUsers threw on cold start:', e);
    }
  }

  return userCache.users;
}

export function invalidateUserCache() {
  userCache.fetchedAt = 0;
}

// GET own profile (any authenticated user)
router.get('/me', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Not authenticated' });
    return res.json({
      id: requester.id,
      email: requester.email,
      full_name: requester.full_name,
      role: requester.role,
      created_at: requester.created_at,
    });
  } catch (err) {
    console.error('GET /api/profiles/me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all profiles (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const { count } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { data: profileRows, error: profileErr } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (profileErr) {
      console.error('GET /api/profiles query error:', profileErr.message);
      return res.status(500).json({ error: 'Failed to fetch profiles' });
    }

    const allUsers = await getCachedUsers();
    const authUserMap = new Map(allUsers.map((u: any) => [u.email?.toLowerCase(), u]));

    const profiles = (profileRows || []).map((p: any) => {
      const authUser = authUserMap.get(p.email?.toLowerCase());
      const role = deriveRole(p.email, p.role || authUser?.user_metadata?.role);
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name || authUser?.user_metadata?.full_name || p.email.split('@')[0],
        role,
        whatsapp: p.whatsapp || authUser?.user_metadata?.whatsapp || null,
        country: p.country || authUser?.user_metadata?.country || null,
        gpa: p.gpa || authUser?.user_metadata?.gpa || null,
        qualification: p.qualification || authUser?.user_metadata?.qualification || null,
        subjects: p.subjects || authUser?.user_metadata?.subjects || null,
        expert_proposal: p.expert_proposal || authUser?.user_metadata?.expert_proposal || null,
        expert_signup_at: p.expert_signup_at || authUser?.user_metadata?.expert_signup_at || null,
        expert_documents: p.expert_documents || authUser?.user_metadata?.expert_documents || null,
        expert_status: p.expert_status || authUser?.user_metadata?.expert_status || null,
        institution: p.institution || authUser?.user_metadata?.institution || null,
        graduation_year: p.graduation_year || authUser?.user_metadata?.graduation_year || null,
        field_of_study: p.field_of_study || authUser?.user_metadata?.field_of_study || null,
        software: p.software || authUser?.user_metadata?.software || null,
        experience: p.experience || authUser?.user_metadata?.experience || null,
        languages: p.languages || authUser?.user_metadata?.languages || null,
        portfolio_url: p.portfolio_url || authUser?.user_metadata?.portfolio_url || null,
        availability: p.availability || authUser?.user_metadata?.availability || null,
        referral: p.referral || authUser?.user_metadata?.referral || null,
        created_at: p.created_at
      };
    });
    res.json({ data: profiles, total: count || 0, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while fetching profiles' });
  }
});

// POST create profile (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    const email = safeString(req.body.email);
    const full_name = safeString(req.body.full_name);

    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!full_name) return res.status(400).json({ error: 'Full name is required' });

    const emailLower = email.toLowerCase();
    const roleInput = req.body.role;
    const role: 'admin' | 'client' | 'expert' =
      (roleInput === 'client' || roleInput === 'expert') ? roleInput : 'client';

    const authUsersList = await getCachedUsers();
    const existing = authUsersList.find(u => u.email?.toLowerCase() === emailLower);

    if (existing) {
      return res.json({
        id: existing.id,
        email: existing.email,
        full_name: existing.user_metadata?.full_name || full_name,
        role: deriveRole(emailLower, existing.user_metadata?.role),
        created_at: existing.created_at
      });
    }

    const tempPassword = crypto.randomUUID() + 'A1!';
    const { data, error } = await (supabaseAdmin || db).auth.admin.createUser({
      email: emailLower,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (error) return res.status(500).json({ error: 'Failed to create user' });

    invalidateUserCache();

    res.status(201).json({
      id: data.user.id,
      full_name,
      email: emailLower,
      role,
      created_at: data.user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during profile creation' });
  }
});

// POST become-expert
router.post('/become-expert', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[become-expert] Auth header present:', !!authHeader, 'starts with Bearer:', authHeader?.startsWith('Bearer ') || false);
    const requester = await getRequesterProfile(req);
    console.log('[become-expert] Requester:', requester ? requester.email : 'NULL');
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const email = safeString(req.body.email);
    const userId = safeString(req.body.id);
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    if (requester.id !== userId && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: you can only update your own profile' });
    }

    const emailLower = email.toLowerCase();
    const whatsapp = safeString(req.body.whatsapp);
    const country = safeString(req.body.country);
    const qualification = safeString(req.body.qualification);
    const subjects = Array.isArray(req.body.subjects) ? req.body.subjects : [];
    const proposal = safeString(req.body.proposal, '', MAX_LENGTHS.proposal);
    const gpa = safeString(req.body.gpa);
    const documents = Array.isArray(req.body.documents) ? req.body.documents : [];
    const institution = safeString(req.body.institution);
    const graduationYear = safeString(req.body.graduation_year);
    const fieldOfStudy = safeString(req.body.field_of_study);
    const software = safeString(req.body.software);
    const experience = safeString(req.body.experience);
    const languages = safeString(req.body.languages);
    const portfolioUrl = safeString(req.body.portfolio_url);
    const availability = safeString(req.body.availability);
    const referral = safeString(req.body.referral);

    const cachedList = await getCachedUsers();
    const existingUser = cachedList.find(u => u.id === userId);
    if (!existingUser) return res.status(404).json({ error: 'User not found in Auth' });

    const updates = {
      ...existingUser.user_metadata,
      expert_status: 'pending',
      whatsapp: whatsapp || existingUser.user_metadata?.whatsapp || null,
      country: country || existingUser.user_metadata?.country || null,
      gpa: gpa || null,
      qualification,
      subjects,
      expert_proposal: proposal,
      expert_signup_at: new Date().toISOString(),
      expert_documents: documents,
      institution,
      graduation_year: graduationYear,
      field_of_study: fieldOfStudy,
      software,
      experience,
      languages,
      portfolio_url: portfolioUrl,
      availability,
      referral,
    };

    const { data, error } = await (supabaseAdmin || db).auth.admin.updateUserById(userId, {
      user_metadata: updates
    });

    if (error) {
      console.error('POST /api/profiles/become-expert error:', error.message);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    await db.from('profiles').upsert({
      id: userId,
      full_name: existingUser.user_metadata?.full_name || email.split('@')[0],
      email: emailLower,
      whatsapp: whatsapp || null,
      country: country || null,
      gpa: gpa || null,
      qualification,
      subjects,
      expert_proposal: proposal,
      expert_signup_at: new Date().toISOString(),
      expert_documents: documents,
      expert_status: 'pending',
      institution,
      graduation_year: graduationYear,
      field_of_study: fieldOfStudy,
      software,
      experience,
      languages,
      portfolio_url: portfolioUrl,
      availability,
      referral,
    }, { onConflict: 'id' });

    invalidateUserCache();

    res.json({
      success: true,
      message: 'Your application has been registered and is pending admin approval!',
      profile: {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: deriveRole(emailLower, data.user.user_metadata?.role),
        whatsapp: data.user.user_metadata?.whatsapp,
        country: data.user.user_metadata?.country,
        gpa: data.user.user_metadata?.gpa,
        qualification: data.user.user_metadata?.qualification,
        subjects: data.user.user_metadata?.subjects,
        expert_proposal: data.user.user_metadata?.expert_proposal,
        expert_signup_at: data.user.user_metadata?.expert_signup_at,
        expert_documents: data.user.user_metadata?.expert_documents,
        expert_status: data.user.user_metadata?.expert_status,
        institution: data.user.user_metadata?.institution,
        graduation_year: data.user.user_metadata?.graduation_year,
        field_of_study: data.user.user_metadata?.field_of_study,
        software: data.user.user_metadata?.software,
        experience: data.user.user_metadata?.experience,
        languages: data.user.user_metadata?.languages,
        portfolio_url: data.user.user_metadata?.portfolio_url,
        availability: data.user.user_metadata?.availability,
        referral: data.user.user_metadata?.referral,
        created_at: data.user.created_at
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during expert application' });
  }
});

// POST approve-expert (admin only)
router.post('/approve-expert', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });

    const email = safeString(req.body.email);
    const id = safeString(req.body.id);
    if (!email && !id) return res.status(400).json({ error: 'Email or ID is required' });

    const approveList = await getCachedUsers();
    const targetUser = approveList.find(u => id ? u.id === id : u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const updates = {
      ...targetUser.user_metadata,
      role: 'expert',
      expert_status: 'approved'
    };

    const { error } = await (supabaseAdmin || db).auth.admin.updateUserById(targetUser.id, {
      user_metadata: updates
    });

    if (error) return res.status(500).json({ error: 'Failed to approve expert' });

    await db.from('profiles').upsert({
      id: targetUser.id,
      full_name: targetUser.user_metadata?.full_name || email.split('@')[0],
      email: targetUser.email,
      role: 'expert',
      expert_status: 'approved',
    }, { onConflict: 'id' });

    invalidateUserCache();

    res.json({ success: true, message: 'Expert application approved' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during expert approval' });
  }
});

// POST reject-expert (admin only)
router.post('/reject-expert', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin')
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });

    const email = safeString(req.body.email);
    const id = safeString(req.body.id);
    if (!email && !id) return res.status(400).json({ error: 'Email or ID is required' });

    const rejectList = await getCachedUsers();
    const targetUser = rejectList.find(u => id ? u.id === id : u.email?.toLowerCase() === email.toLowerCase());
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const updates = {
      ...targetUser.user_metadata,
      role: 'client',
      expert_status: 'rejected'
    };

    const { error } = await (supabaseAdmin || db).auth.admin.updateUserById(targetUser.id, {
      user_metadata: updates
    });

    if (error) return res.status(500).json({ error: 'Failed to reject expert' });

    await db.from('profiles').upsert({
      id: targetUser.id,
      full_name: targetUser.user_metadata?.full_name || email.split('@')[0],
      email: targetUser.email,
      role: 'client',
      expert_status: 'rejected',
    }, { onConflict: 'id' });

    invalidateUserCache();

    res.json({ success: true, message: 'Expert application rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during expert rejection' });
  }
});

// PUT update profile role (admin only)
router.put('/:profileId/role', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Admin credentials required.' });
    }

    const targetProfileId = safeString(req.params.profileId);
    const newRole = safeString(req.body.role);

    if (!['admin', 'client', 'expert'].includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role value. Must be client, expert, or admin.' });
    }

    if (requester.id === targetProfileId && newRole !== 'admin') {
      return res.status(400).json({ error: 'Admins cannot change or demote their own role.' });
    }

    const roleList = await getCachedUsers();
    const targetUser = roleList.find(u => u.id === targetProfileId);
    if (!targetUser) return res.status(404).json({ error: 'Profile not found' });

    const updates = {
      ...targetUser.user_metadata,
      role: newRole
    };

    const { data, error } = await (supabaseAdmin || db).auth.admin.updateUserById(targetProfileId, {
      user_metadata: updates
    });

    if (error) return res.status(500).json({ error: 'Failed to update profile role' });

    await db.from('profiles').upsert({
      id: targetProfileId,
      full_name: targetUser.user_metadata?.full_name || targetUser.email?.split('@')[0] || 'User',
      email: targetUser.email,
      role: newRole,
    }, { onConflict: 'id' });

    invalidateUserCache();

    const profile = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name,
      role: newRole,
      created_at: data.user.created_at
    };

    res.json({ success: true, message: `User role updated to ${newRole}`, profile });
  } catch (err) {
    console.error('PUT /api/profiles/:profileId/role exception:', err);
    res.status(500).json({ error: 'Internal server error during profile role update' });
  }
});

// PUT update expert availability
router.put('/:profileId/availability', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const targetProfileId = safeString(req.params.profileId);
    if (requester.id !== targetProfileId && requester.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: you can only update your own availability' });
    }

    // Boolean("false") === true — handle string values from form submissions
    const raw = req.body.is_available;
    const isAvailable = raw === true || raw === 'true' || raw === 1 || raw === '1';

    const { error } = await db
      .from('profiles')
      .update({ is_available: isAvailable, last_active_at: new Date().toISOString() })
      .eq('id', targetProfileId);

    if (error) return res.status(500).json({ error: 'Failed to update availability' });

    res.json({ success: true, is_available: isAvailable });
  } catch (err) {
    console.error('PUT /api/profiles/:profileId/availability exception:', err);
    res.status(500).json({ error: 'Internal server error during availability update' });
  }
});

export default router;
