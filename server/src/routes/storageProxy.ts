import type { FastifyPluginAsync } from 'fastify';
import { env } from '../env.js';

/**
 * Storage proxy.
 *
 * Some ISPs (notably in India, Myanmar, UAE) DNS-block *.supabase.co
 * and *.workers.dev wholesale. This route sits on our own server — which
 * IS reachable — and streams requests through to Supabase Storage.
 *
 * The client never talks to supabase.co directly. All product images,
 * digital downloads, and receipt reads go through /sb/*.
 *
 * Path convention: GET /sb/<rest> → https://<project>.supabase.co/<rest>
 */
export const storageProxyRoutes: FastifyPluginAsync = async (app) => {
  app.all('/sb/*', async (req, reply) => {
    const wildcard = (req.params as Record<string, string>)['*'] ?? '';
    const rawUrl = req.raw.url ?? '';
    const qIndex = rawUrl.indexOf('?');
    const qs = qIndex >= 0 ? rawUrl.slice(qIndex) : '';

    const base = env.SUPABASE_URL.replace(/\/+$/, '');
    const target = `${base}/${wildcard}${qs}`;

    // Forward only the headers Supabase Storage actually uses.
    // Host is dropped — Supabase infers the project from the URL path.
    // Authorization is dropped — the server SDK was the one making auth'd
    // calls; the client only ever reads public or signed resources.
    const fwd: Record<string, string> = {};
    if (req.headers.range) fwd.range = String(req.headers.range);
    if (req.headers.accept) fwd.accept = String(req.headers.accept);
    if (req.headers['if-none-match']) fwd['if-none-match'] = String(req.headers['if-none-match']);
    if (req.headers['if-modified-since']) fwd['if-modified-since'] = String(req.headers['if-modified-since']);

    let upstream: Response;
    try {
      upstream = await fetch(target, { method: req.method, headers: fwd });
    } catch (err) {
      app.log.error(`[storage-proxy] fetch failed: ${target} — ${err}`);
      return reply.code(502).send({ error: 'Storage upstream unreachable' });
    }

    reply.code(upstream.status);

    // Pass through the headers that matter for caching and content.
    for (const h of [
      'cache-control',
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
      'content-disposition',
    ]) {
      const v = upstream.headers.get(h);
      if (v) reply.header(h, v);
    }

    // CORS for the Mini App origin. Public reads + signed reads are safe
    // to expose broadly — Supabase's own public bucket serves the same
    // headers.
    reply.header('Access-Control-Allow-Origin', '*');

    return reply.send(Buffer.from(await upstream.arrayBuffer()));
  });
};
