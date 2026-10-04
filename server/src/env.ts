import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_JWT_SECRET: z.string().min(16),

  TELEGRAM_BOT_TOKEN: z.string().regex(/^\d+:[A-Za-z0-9_-]+$/, 'Invalid Telegram bot token'),
  ADMIN_TELEGRAM_ID: z.coerce.number().int().positive(),
  TELEGRAM_BOT_USERNAME: z.string().regex(/^[A-Za-z0-9_]+$/).optional(),

  CLIENT_ORIGIN: z.string().url(),
  MINI_APP_URL: z.string().url(),

  // Public URL of this server. Used to rewrite Supabase Storage URLs so
  // the browser loads them from us (reachable) instead of from
  // supabase.co (potentially ISP-blocked).
  PUBLIC_SERVER_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
});

export type Env = z.infer<typeof EnvSchema>;

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    console.error(`\n[env] Missing or invalid environment variables:\n${issues}\n`);
    process.exit(1);
  }
  return parsed.data;
}

export const env: Env = load();

/**
 * Rewrite a Supabase Storage URL so it routes through this server's
 * /sb/* proxy. Safe to call with null/undefined — returns null.
 */
export function proxyStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  return url.replace(base, `${env.PUBLIC_SERVER_URL.replace(/\/+$/, '')}/sb`);
}
