/**
 * app/admin/page.tsx
 *
 * Admin dashboard — summary stat cards + per-platform scrape status.
 */

import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import Link from "next/link"
import StatusBadge from "@/components/admin/StatusBadge"
import type { ScrapeLogRow } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Dashboard" }

// ── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  href,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  accent: string
  href?: string
}) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-5 transition hover:bg-white/[0.05] ${href ? "cursor-pointer" : ""}`}
    >
      <div className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg ${accent} text-lg`}>
        {icon}
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-zinc-100">{value}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalCount },
    { count: hackathonCount },
    { count: internshipCount },
    { count: expiringCount },
    { data: scrapeRows },
  ] = await Promise.all([
    supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("type", "hackathon")
      .eq("is_active", true),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("type", "internship")
      .eq("is_active", true),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("application_deadline", now.toISOString())
      .lte("application_deadline", in7Days),
    supabase
      .from("scrape_logs")
      .select("source_platform, status, run_at, items_scraped, items_added, error_message")
      .order("run_at", { ascending: false })
      .limit(50),
  ])

  const scrapeData = (scrapeRows as ScrapeLogRow[] | null) ?? []

  // Get last log per platform
  const platformMap = new Map<string, ScrapeLogRow>()
  for (const row of scrapeData) {
    if (!platformMap.has(row.source_platform)) {
      platformMap.set(row.source_platform, row)
    }
  }
  const platformStatuses = Array.from(platformMap.values())

  const stats = [
    {
      label: "Total Opportunities",
      value: totalCount ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      ),
      accent: "bg-violet-500/20",
      href: "/admin/opportunities"
    },
    {
      label: "Active Hackathons",
      value: hackathonCount ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      accent: "bg-violet-500/20",
      href: "/admin/opportunities?type=hackathon"
    },
    {
      label: "Active Internships",
      value: internshipCount ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      accent: "bg-sky-500/20",
      href: "/admin/opportunities?type=internship"
    },
    {
      label: "Expiring in 7 Days",
      value: expiringCount ?? 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      accent: "bg-amber-500/20",
      href: "/admin/opportunities"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Overview of HackFeed opportunities and scraper health.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/admin/opportunities/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90"
          id="dashboard-new-opportunity-btn"
        >
          <span>+</span> New Opportunity
        </Link>
        <Link
          href="/admin/scrape-logs"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          View Scrape Logs
        </Link>
      </div>

      {/* Platform scrape status */}
      {platformStatuses.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Last Scrape — Per Platform
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Platform", "Status", "Scraped", "Added", "Last Run"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {platformStatuses.map((p) => (
                  <tr key={p.source_platform} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-zinc-200">{p.source_platform}</td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="scrape" value={p.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.items_scraped}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.items_added}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(p.run_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {platformStatuses.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
          No scrape logs yet. Run the scrapers to see platform status here.
        </div>
      )}
    </div>
  )
}
