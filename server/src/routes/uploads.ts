import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { supabaseAdmin } from '../supabase.js';
import { HttpError, requireAuth, currentProfile } from '../middleware/auth.js';
import { detectDocMime, detectImageMime } from '../magicBytes.js';
import { proxyStorageUrl } from '../env.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

type Bucket = 'products' | 'digital-goods' | 'receipts';

type BucketRule = {
  imagesOnly: boolean;
  adminOnly: boolean;
  publicUrl: boolean;
  maxBytes: number;
};

function ruleFor(bucket: Bucket): BucketRule {
  switch (bucket) {
    case 'products':
      return { imagesOnly: true, adminOnly: true, publicUrl: true, maxBytes: MAX_IMAGE_BYTES };
    case 'receipts':
      return { imagesOnly: true, adminOnly: false, publicUrl: false, maxBytes: MAX_RECEIPT_BYTES };
    case 'digital-goods':
      return { imagesOnly: false, adminOnly: true, publicUrl: false, maxBytes: MAX_FILE_BYTES };
  }
}

/**
 * Strips a filename down to something safe for a storage path while
 * keeping the recognizable base name and extension. Admins browsing the
 * bucket see "c32e41ce-Aria-Wireless-Manual.pdf" instead of a wall of
 * hex, so they can tell what they uploaded.
 */
function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : '';

  const cleanBase =
    base
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-_]+|[-_]+$/g, '')
      .slice(0, 60) || 'file';

  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);

  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/api/uploads/:bucket',
    { preHandler: requireAuth },
    async (req: FastifyRequest, reply) => {
      const { bucket: bucketRaw } = req.params as { bucket: string };
      if (bucketRaw !== 'products' && bucketRaw !== 'digital-goods' && bucketRaw !== 'receipts') {
        throw new HttpError(404, 'Unknown bucket');
      }
      const bucket = bucketRaw as Bucket;
      const me = currentProfile(req);
      const rule = ruleFor(bucket);

      if (rule.adminOnly && me.role !== 'admin' && me.role !== 'superadmin') {
        throw new HttpError(403, 'Admin only');
      }

      const part = await req.file({ limits: { fileSize: rule.maxBytes } });
      if (!part) throw new HttpError(400, 'No file part in request');

      const bytes = await part.toBuffer();
      if (bytes.length === 0) throw new HttpError(400, 'Empty file');
      if (bytes.length > rule.maxBytes) {
        throw new HttpError(413, `File too large (max ${Math.round(rule.maxBytes / 1024 / 1024)}MB)`);
      }

      let storedMime: string;
      if (rule.imagesOnly) {
        const detected = detectImageMime(bytes);
        if (!detected) {
          throw new HttpError(400, 'Only JPG, PNG, WebP, GIF or HEIC images are accepted here.');
        }
        storedMime = detected;
      } else {
        const detected = detectDocMime(bytes);
        storedMime = detected ?? (part.mimetype || 'application/octet-stream');
      }

      let path: string;
      if (bucket === 'receipts') {
        const ext = (part.filename?.split('.').pop() ?? 'jpg')
          .toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const fields = part.fields as Record<string, { value?: unknown } | undefined> | undefined;
        const orderIdField = fields?.order_id;
        const orderId = orderIdField && typeof orderIdField === 'object' && 'value' in orderIdField
          ? String(orderIdField.value ?? '') : '';
        if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
          throw new HttpError(400, 'order_id field required for receipts');
        }
        path = `${me.id}/${orderId}.${ext}`;
      } else {
        // Short uuid prefix for uniqueness, sanitized original filename
        // for readability.
        const short = crypto.randomUUID().slice(0, 8);
        const sanitized = sanitizeFilename(part.filename ?? 'file');
        path = `${short}-${sanitized}`;
      }

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, bytes, { contentType: storedMime, upsert: bucket === 'receipts' });
      if (uploadErr) {
        app.log.error(`[uploads] ${bucket}/${path} failed: ${uploadErr.message}`);
        throw new HttpError(500, 'Upload failed');
      }

      const rawPublicUrl = rule.publicUrl
        ? supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl
        : null;
      const publicUrl = proxyStorageUrl(rawPublicUrl);

      return reply.send({ path, public_url: publicUrl, mime: storedMime });
    },
  );
};
