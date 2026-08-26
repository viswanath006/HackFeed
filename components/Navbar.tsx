/**
 * components/Navbar.tsx
 *
 * Server Component wrapper for the HackFeed navigation bar.
 * Reads the current session server-side (no client-state flash) and
 * passes it down to NavbarClient for interactive elements.
 *
 * Usage: drop <Navbar /> in your root layout.tsx
 */

import { getUser } from "@/lib/supabase/getUser"
import NavbarClient from "./NavbarClient"

export default async function Navbar() {
  const { user, isAdmin } = await getUser()

  return (
    <NavbarClient
      user={
        user
          ? {
              id: user.id,
              email: user.email ?? null,
              avatarUrl:
                (user.raw?.user_metadata?.avatar_url as string | undefined) ??
                null,
              fullName:
                (user.raw?.user_metadata?.full_name as string | undefined) ??
                null,
            }
          : null
      }
      isAdmin={isAdmin}
    />
  )
}
