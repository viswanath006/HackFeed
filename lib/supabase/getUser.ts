/**
 * lib/supabase/getUser.ts
 *
 * Server-side helper that returns the current authenticated user together
 * with their admin record (if any).  Call this from Server Components,
 * Route Handlers, and Server Actions — never from Client Components.
 *
 * Usage:
 *   import { getUser } from "@/lib/supabase/getUser"
 *   const { user, admin } = await getUser()
 */

import { createClient } from "./server"
import type { AdminRow } from "./types"

export interface AuthUser {
  id: string
  email: string | undefined
  /** Full user object from Supabase Auth */
  raw: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]
}

export interface GetUserResult {
  /** Null when not authenticated */
  user: AuthUser | null
  /** Null when authenticated but not in the admins table */
  admin: AdminRow | null
  /** True when user exists and is in the admins table */
  isAdmin: boolean
  /** True when user is an admin with role 'super_admin' */
  isSuperAdmin: boolean
}

/**
 * Fetches the current session user from Supabase Auth, then checks the
 * `admins` table via an authenticated RLS-respecting query.
 *
 * Uses `getUser()` (not `getSession()`) so the JWT is validated server-side
 * on every call — no stale session data.
 */
export async function getUser(): Promise<GetUserResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, admin: null, isAdmin: false, isSuperAdmin: false }
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      raw: user,
    }

    // Check admins table — RLS will return a row only if the user is an admin
    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    const admin = adminData as AdminRow | null

    return {
      user: authUser,
      admin,
      isAdmin: admin !== null,
      isSuperAdmin: admin?.role === "super_admin",
    }
  } catch (err) {
    return { user: null, admin: null, isAdmin: false, isSuperAdmin: false }
  }
}
