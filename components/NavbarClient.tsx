"use client"

/**
 * components/NavbarClient.tsx
 *
 * Editorial masthead navigation for HackFeed.
 * Grounded in paper and ink design: Fraunces serif wordmark, hairline borders,
 * plain-text links with quiet underlines, and crisp active states.
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
    <nav
      className="sticky top-0 z-50 h-16 border-b border-hairline bg-paper/95 backdrop-blur-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Brand Masthead */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2.5 text-decoration-none group" id="nav-logo">
            <span className="font-serif text-2xl font-normal tracking-tight text-ink">
              HackFeed
            </span>
            <span className="hidden sm:inline-block text-[11px] font-sans uppercase tracking-widest text-ink-muted/80 pl-2.5 border-l border-hairline">
              Bulletin
            </span>
          </Link>

          {/* Editorial Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-ink-muted">
            <Link
              href="/opportunities"
              className="transition hover:text-ink hover:underline decoration-ink/40 decoration-1 underline-offset-4"
            >
              All Listings
            </Link>
            <Link
              href="/opportunities?type=hackathon"
              className="transition hover:text-ink hover:underline decoration-ink/40 decoration-1 underline-offset-4"
            >
              Hackathons
            </Link>
            <Link
              href="/opportunities?type=internship"
              className="transition hover:text-forest hover:underline decoration-forest/40 decoration-1 underline-offset-4"
            >
              Internships
            </Link>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/login"
                className="border border-hairline bg-paper px-3.5 py-1.5 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
                id="nav-signin-btn"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="border border-ink bg-ink px-4 py-1.5 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
                id="nav-signup-btn"
              >
                Join Bulletin
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                id="nav-avatar-btn"
                className="flex h-8 w-8 items-center justify-center overflow-hidden border border-hairline bg-paper-muted text-xs font-serif font-bold text-ink transition hover:border-ink focus:outline-none"
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
                  className="absolute right-0 top-full mt-2 w-56 border border-hairline bg-paper p-1.5 shadow-lg backdrop-blur-md"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="border-b border-hairline px-3.5 py-2.5">
                    <div className="truncate text-xs font-semibold text-ink">{displayName}</div>
                    {user.email && (
                      <div className="truncate text-[11px] text-ink-muted">{user.email}</div>
                    )}
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper-muted"
                      id="nav-bookmarks-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      Saved Bookmarks
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink transition hover:bg-paper-muted"
                      id="nav-settings-link"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Preferences &amp; Alerts
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-paper-muted"
                        id="nav-admin-link"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Admin Console
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-hairline pt-1">
                    <button
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-signal transition hover:bg-paper-muted"
                      id="nav-signout-btn"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
