/*
 * Rate limiting via Supabase service role. Requires this table (run once in the SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS public.rate_limits (
 *   id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
 *   identifier  TEXT        NOT NULL,
 *   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 * CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
 *   ON public.rate_limits (identifier, created_at);
 * ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
 * -- No RLS policies needed — only accessed via service role key.
 *
 * Old rows accumulate; add a pg_cron job or Supabase scheduled function to
 * DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';
 */

import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'

const CONFIGS = {
  signIn:        { maxAttempts: 5,  windowMs: 15 * 60 * 1000 },  // 5 per 15 min
  signUp:        { maxAttempts: 10, windowMs: 60 * 60 * 1000 },  // 10 per hour
  resetPassword: { maxAttempts: 3,  windowMs: 60 * 60 * 1000 },  // 3 per hour
} as const

type Action = keyof typeof CONFIGS

export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Returns true if the request is within the rate limit, false if it should be blocked.
 * Fails open (returns true) if the rate_limits table is unavailable, so auth still works
 * if the table hasn't been created yet.
 */
export async function checkRateLimit(
  action: Action,
  identifier: string,
): Promise<boolean> {
  const { maxAttempts, windowMs } = CONFIGS[action]
  const windowStart = new Date(Date.now() - windowMs).toISOString()
  const key = `${action}:${identifier}`

  try {
    const supabase = createServiceClient()

    const { count, error } = await supabase
      .from('rate_limits')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', key)
      .gte('created_at', windowStart)

    if (error) {
      console.error('Rate limit check error:', error.message)
      return true // fail open
    }

    if ((count ?? 0) >= maxAttempts) {
      return false
    }

    await supabase.from('rate_limits').insert({ identifier: key })

    return true
  } catch (err) {
    console.error('Rate limit unexpected error:', err)
    return true // fail open
  }
}
