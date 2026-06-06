import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role privileges
 * 
 * IMPORTANT: This bypasses Row Level Security and should ONLY be used
 * for server-side operations like rate limiting, not for user data.
 * 
 * Never expose the service role key to the client.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
