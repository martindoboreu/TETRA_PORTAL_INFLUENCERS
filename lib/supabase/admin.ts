import 'server-only'
import { createClient as createSbClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Service-role client. Server-only — bypasses RLS.
 * Use sparingly: ingestion of clicks/leads/conversions, admin escalations
 * that policies cannot express. Never imported from a "use client" file
 * thanks to the "server-only" guard above.
 */
export function createAdminClient() {
  return createSbClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
