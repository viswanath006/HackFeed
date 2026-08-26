/**
 * lib/supabase/server.ts
 *
 * Server-side Supabase client for HackFeed.
 * Uses @supabase/ssr's createServerClient with Next.js 14 App Router cookies()
 * API so the client transparently reads/writes auth session cookies on the
 * server (RSC, Route Handlers, Server Actions, and Middleware).
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./types"
import { getSupabaseEnv } from "./env"

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // set. This is safe to ignore if you have a middleware refreshing
            // sessions — see: https://supabase.com/docs/guides/auth/server-side/nextjs
          }
        },
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Service-role client — use only in trusted server contexts (e.g. scrapers,
// cron jobs, admin API routes). NEVER expose the service role key to the
// browser.
// ---------------------------------------------------------------------------

export async function createServiceClient() {
  const cookieStore = await cookies()
  const { url, serviceKey } = getSupabaseEnv()

  return createServerClient<Database>(
    url,
    serviceKey,   // bypass RLS
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Same reason as above
          }
        },
      },
    }
  )
}
