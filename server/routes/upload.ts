import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { safeString } from '../lib/validation.js';
import { getRequesterProfile } from '../lib/utils.js';

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

// Magic-byte signatures for validating actual file content
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [Buffer.from('RIFF')], // RIFF....WEBP
  'application/pdf': [Buffer.from('%PDF')],
  'application/zip': [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
  'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [Buffer.from('PK')],
  'application/vnd.ms-excel': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [Buffer.from('PK')],
};

function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  // SVG is text-based, skip magic byte check
  if (declaredMimeType === 'image/svg+xml') return true;
  // TXT is text-based, skip
  if (declaredMimeType === 'text/plain') return true;

  const signatures = MAGIC_BYTES[declaredMimeType];
  if (!signatures) return true; // No signature defined — allow (we already validated MIME type)

  return signatures.some(sig => buffer.subarray(0, sig.length).equals(sig));
}

async function uploadBase64FileToStorage(base64Data: string, fileName: string, userId: string): Promise<string> {
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

  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
  let buffer = Buffer.from(rawBase64, 'base64');

  // Validate file content matches declared MIME type (magic-byte check)
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error('File content does not match declared type. Upload the actual file, not a renamed one.');
  }

  // Sanitize SVG uploads to prevent stored XSS
  if (mimeType === 'image/svg+xml') {
    let svgContent = buffer.toString('utf-8');
    svgContent = svgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    svgContent = svgContent.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    svgContent = svgContent.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
    svgContent = svgContent.replace(/javascript\s*:/gi, '');
    svgContent = svgContent.replace(/(href|xlink:href)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, '');
    buffer = Buffer.from(svgContent, 'utf-8');
  }

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

  // Generate a signed URL (expires in 1 hour) instead of a permanent public URL
  const { data: signedData, error: signedErr } = await supabaseAdmin.storage
    .from('order-files')
    .createSignedUrl(storagePath, 3600);

  if (signedErr) {
    console.error('Supabase Storage signed URL error:', signedErr.message);
    throw new Error('Failed to generate file URL');
  }

  return signedData?.signedUrl || '';
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

    const publicUrl = await uploadBase64FileToStorage(file, fileName, requester.id);
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error('POST /api/upload error:', err.message);
    res.status(500).json({ error: 'Upload failed. Please check file type and size.' });
  }
});

export default router;
