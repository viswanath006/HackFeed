/**
 * app/auth/callback/route.ts
 *
 * Handles the redirect back from:
 *  1. Supabase email confirmation links
 *  2. Google OAuth callback
 *
 * Exchanges the one-time `code` for a session, then redirects to the
 * appropriate page.
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/types"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const type = searchParams.get("type") // 'signup', 'recovery', etc.

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For email signups, direct to a "confirmed" page or home
      if (type === "signup") {
        return NextResponse.redirect(`${origin}/login?confirmed=true`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
