"use client"

/**
 * components/admin/AdminSidebar.tsx
 *
 * Sticky sidebar navigation for the admin panel.
 * Zero-emoji design with clean SVG icons and modern developer styling.
 */

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { AdminRole } from "@/lib/supabase/types"

interface AdminSidebarProps {
  displayName: string
  role: AdminRole
}

export default function AdminSidebar({ displayName, role }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/admin/opportunities",
      label: "Opportunities",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      href: "/admin/courses",
      label: "Courses",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
    },
    {
      href: "/admin/scrape-logs",
      label: "Scrape Logs",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="flex h-full w-60 flex-col border-r border-white/8 bg-zinc-950/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <span className="font-display text-sm font-bold tracking-tight text-white">
            HackFeed
          </span>
          <p className="font-mono text-[10px] text-amber-400 font-semibold tracking-wider uppercase">Admin Console</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Management
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive(href)
                    ? "bg-violet-600/20 border border-violet-500/30 text-violet-200 shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100 border border-transparent"
                }`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span className="text-zinc-400" aria-hidden="true">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/8 px-3 py-3 space-y-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5 border border-white/[0.06]">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-200">{displayName}</p>
            <p className="text-[10px] text-zinc-500 capitalize">{role.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          id="admin-sidebar-signout"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
