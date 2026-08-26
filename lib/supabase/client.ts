/**
 * lib/supabase/client.ts
 *
 * Browser-side Supabase client for HackFeed.
 * Uses @supabase/ssr's createBrowserClient so auth cookies are handled
 * automatically by the Supabase SSR helpers in the Next.js 14 App Router.
 */

import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"
import { getSupabaseEnv } from "./env"

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient<Database>(url, anonKey)
}
