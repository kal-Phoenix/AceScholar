import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin, supabaseUrl } from '../lib/supabase.js';
import { safeString, InputError } from '../lib/validation.js';
import { deriveRole } from '../lib/utils.js';

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
]);

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf',
  'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip',
]);

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

async function uploadBase64FileToStorage(base64Data: string, fileName: string): Promise<string> {
  let mimeType = 'application/octet-stream';
  let rawBase64 = base64Data;

  if (base64Data.startsWith('data:')) {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches || !matches[2]) throw new Error('Invalid base64 data URL format');
    mimeType = matches[1];
    rawBase64 = matches[2];
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('File type not allowed. Accepted: images, PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP');
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('File extension not allowed. Accepted: jpg, png, gif, webp, svg, pdf, doc, docx, xls, xlsx, txt, zip');
  }

  const storagePath = `uploads/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(rawBase64, 'base64');

  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (!supabaseAdmin) throw new Error('Storage requires service role key');

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('order-files')
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (uploadErr) {
    console.error('Supabase Storage upload error:', uploadErr.message);
    throw new Error('Failed to upload file to storage');
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('order-files')
    .getPublicUrl(storagePath);

  return urlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/order-files/${storagePath}`;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const requester = await getRequesterProfile(req);
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'File upload requires SUPABASE_SERVICE_ROLE_KEY' });
    }

    const file = String(req.body.file || '');
    const fileName = safeString(req.body.fileName, `upload-${Date.now()}.png`);

    if (!file) return res.status(400).json({ error: 'File data is required' });

    if (file.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large. Maximum 15MB after encoding.' });
    }

    const publicUrl = await uploadBase64FileToStorage(file, fileName);
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error('POST /api/upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Please check file type and size.' });
  }
});

export default router;
