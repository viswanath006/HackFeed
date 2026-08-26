"use client"

/**
 * components/NavbarClient.tsx
 *
 * Minimalist, high-end navigation bar for HackFeed.
 * Zero-emoji aesthetic with SVG iconography and crisp typography.
 */

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface UserProps {
  id: string
  email: string | null
  avatarUrl: string | null
  fullName: string | null
}

interface NavbarClientProps {
  user: UserProps | null
  isAdmin: boolean
}

/** Returns the user's initials (up to 2 chars) for the avatar fallback */
function getInitials(user: UserProps): string {
  if (user.fullName) {
    const parts = user.fullName.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (user.email ?? "U").slice(0, 2).toUpperCase()
}

export default function NavbarClient({ user, isAdmin }: NavbarClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const initials = user ? getInitials(user) : ""
  const displayName = user?.fullName ?? user?.email?.split("@")[0] ?? "User"

  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-white/[0.07] bg-[#07070c]/85 backdrop-blur-xl" role="navigation" aria-label="Main navigation">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 text-decoration-none group" id="nav-logo">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 transition-transform group-hover:scale-105" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Hack<span className="text-violet-400">Feed</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/opportunities"
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
          >
            Explore Feed
          </Link>
          <Link
            href="/opportunities?type=hackathon"
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-violet-300"
          >
            Hackathons
          </Link>
          <Link
            href="/opportunities?type=internship"
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-sky-300"
          >
            Internships
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                id="nav-signin-btn"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition hover:bg-violet-500"
                id="nav-signup-btn"
              >
                Get Started
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                id="nav-avatar-btn"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-gradient-to-tr from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-sm transition hover:border-violet-400 focus:outline-none"
                aria-label="Open user menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d16] p-1.5 shadow-2xl backdrop-blur-2xl"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="border-b border-white/[0.06] px-3.5 py-2.5">
                    <div className="truncate text-xs font-semibold text-zinc-100">{displayName}</div>
                    {user.email && (
                      <div className="truncate text-[11px] text-zinc-500">{user.email}</div>
                    )}
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                      id="nav-bookmarks-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      Saved Bookmarks
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                      id="nav-settings-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Preferences &amp; Alerts
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10"
                        id="nav-admin-link"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Admin Console
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-white/[0.06] pt-1">
                    <button
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
                      id="nav-signout-btn"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      {signingOut ? "Signing out…" : "Sign Out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
