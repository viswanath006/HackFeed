/**
 * app/admin/opportunities/page.tsx
 *
 * Opportunities management table — search, filter by type/platform/status,
 * pagination, and optimistic is_active / is_featured toggles.
 */

import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import Link from "next/link"
import StatusBadge from "@/components/admin/StatusBadge"
import OpportunityToggles from "./OpportunityToggles"
import type { OpportunityRow } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Opportunities" }

const PAGE_SIZE = 20

interface SearchParams {
  q?: string
  type?: string
  platform?: string
  status?: string
  page?: string
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q        = sp.q?.trim() ?? ""
  const typeFilter    = sp.type ?? ""
  const platformFilter = sp.platform ?? ""
  const statusFilter  = sp.status ?? ""
  const page     = Math.max(1, parseInt(sp.page ?? "1", 10))
  const offset   = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from("opportunities")
    .select("id, title, type, source_platform, application_deadline, is_active, is_featured", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q)              query = query.ilike("title", `%${q}%`)
  if (typeFilter)     query = query.eq("type", typeFilter)
  if (platformFilter) query = query.eq("source_platform", platformFilter)
  if (statusFilter === "active")   query = query.eq("is_active", true)
  if (statusFilter === "inactive") query = query.eq("is_active", false)

  const { data, count } = await query
  const rows = (data as OpportunityRow[] | null) ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Distinct platforms for filter dropdown
  const { data: platformData } = await supabase
    .from("opportunities")
    .select("source_platform")
    .not("source_platform", "is", null)

  const platforms = (platformData as { source_platform: string | null }[] | null) ?? []
  const uniquePlatforms = Array.from(
    new Set(platforms.map((p) => p.source_platform).filter(Boolean))
  ) as string[]

  // Build pagination URL helper
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q)              params.set("q", q)
    if (typeFilter)     params.set("type", typeFilter)
    if (platformFilter) params.set("platform", platformFilter)
    if (statusFilter)   params.set("status", statusFilter)
    params.set("page", String(p))
    return `/admin/opportunities?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Opportunities</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{total} total records</p>
        </div>
        <Link
          href="/admin/opportunities/new"
          id="opp-new-btn"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90"
        >
          + Add Opportunity
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition"
          id="opp-search"
        />
        <select name="type" defaultValue={typeFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All types</option>
          <option value="hackathon">Hackathon</option>
          <option value="internship">Internship</option>
        </select>
        <select name="platform" defaultValue={platformFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All platforms</option>
          {uniquePlatforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/12">
          Filter
        </button>
        {(q || typeFilter || platformFilter || statusFilter) && (
          <Link href="/admin/opportunities" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-28">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-28">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-32">Deadline</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-36">Toggles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No opportunities found. Try adjusting your filters.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-white/[0.025]">
                <td className="px-4 py-3 font-medium text-zinc-200 max-w-xs truncate">
                  <Link href={`/admin/opportunities/${row.id}/edit`} className="hover:text-violet-300 transition-colors">
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge kind="type" value={row.type} />
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{row.source_platform ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {row.application_deadline
                    ? new Date(row.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <OpportunityToggles
                    id={row.id}
                    isActive={row.is_active}
                    isFeatured={row.is_featured}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/opportunities/${row.id}/edit`}
                    className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-violet-500/40 hover:text-violet-300"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages} &mdash; {total} results
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 transition hover:border-white/20">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-300 transition hover:border-white/20">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
