/**
 * middleware.ts  (project root)
 *
 * Supabase SSR session refresh + route protection for HackFeed.
 *
 * Rules:
 *  - If Supabase is unconfigured in local dev → pass-through cleanly.
 *  - Every request: refresh the Supabase session via cookie exchange.
 *  - /admin/*         → must be authenticated AND in the admins table.
 *                       Unauthenticated  → /admin/login
 *                       Authenticated non-admin → /admin/login?error=unauthorized
 *  - /bookmarks       → must be authenticated.
 *                       Unauthenticated → /login?redirectTo=/bookmarks
 */

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/types"
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Skip auth checks during local development if Supabase credentials are placeholders
  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  try {
    const { url, anonKey } = getSupabaseEnv()

    // ── 1. Build a server client that reads/writes cookies from this request ──
    const supabase = createServerClient<Database>(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // ── 2. Refresh the session (IMPORTANT: must use getUser, not getSession) ──
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ── 3. Protect /admin/* routes ────────────────────────────────────────────
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!user) {
        // Not logged in → send to admin login
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/admin/login"
        return NextResponse.redirect(loginUrl)
      }

      // Logged in — verify they are in the admins table
      const { data: adminRow } = await supabase
        .from("admins")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      if (!adminRow) {
        // Authenticated but not an admin
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/admin/login"
        loginUrl.searchParams.set("error", "unauthorized")
        return NextResponse.redirect(loginUrl)
      }
    }

    // ── 4. Protect /bookmarks (and any future user-only routes) ───────────────
    if (pathname.startsWith("/bookmarks")) {
      if (!user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/login"
        loginUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  } catch (err) {
    console.warn("[Middleware Warning]", err)
  }

  // ── 5. Return with refreshed session cookies ──────────────────────────────
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimization)
     *  - favicon.ico, site assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
