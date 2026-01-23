import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let browserClient: SupabaseClient<Database> | null = null

/**
 * Safe singleton Supabase client.
 * - Never exposes service role on the client
 * - Uses a single browser instance to avoid "Multiple GoTrueClient" warnings
 */
export function getClientSupabase(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      console.error(
        'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured.'
      )
    }
    return null
  }

  // On the server, create a fresh client per call
  if (typeof window === 'undefined') {
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // In the browser, reuse a single instance
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return browserClient
}

/**
 * Admin Supabase client (SERVICE ROLE) – SERVER ONLY.
 * Criado sob demanda para evitar erro de build com URL inválida.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  try {
    return createClient<Database>(supabaseUrl, serviceRoleKey)
  } catch (e) {
    console.error('Failed to create Supabase admin client. Check SUPABASE URL/keys.', e)
    return null
  }
}
