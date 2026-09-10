/**
 * app/admin/(dashboard)/courses/page.tsx
 *
 * Courses management table — search, filter by domain/price_type/status,
 * pagination, and optimistic is_active / is_featured toggles.
 */

import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import Link from "next/link"
import CourseToggles from "./CourseToggles"
import type { CourseRow } from "@/lib/supabase/types"
import { COURSE_DOMAINS } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Courses" }

const PAGE_SIZE = 20

const PRICE_TYPE_LABELS: Record<string, string> = {
  free: "Free",
  paid: "Paid",
  free_with_paid_certificate: "Free + Cert",
}

const PRICE_TYPE_COLORS: Record<string, string> = {
  free: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  paid: "bg-zinc-700/40 text-zinc-300 border border-white/8",
  free_with_paid_certificate: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
}

interface SearchParams {
  q?: string
  domain?: string
  price_type?: string
  status?: string
  page?: string
}

export default async function CoursesAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ""
  const domainFilter = sp.domain ?? ""
  const priceTypeFilter = sp.price_type ?? ""
  const statusFilter = sp.status ?? ""
  const page = Math.max(1, parseInt(sp.page ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = supabase
    .from("courses")
    .select("id, title, provider, domain, price_type, is_active, is_featured, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q) query = (query as any).or(`title.ilike.%${q}%,provider.ilike.%${q}%`)
  if (domainFilter) query = query.eq("domain", domainFilter)
  if (priceTypeFilter) query = query.eq("price_type", priceTypeFilter)
  if (statusFilter === "active") query = query.eq("is_active", true)
  if (statusFilter === "inactive") query = query.eq("is_active", false)

  const { data, count } = await query
  const rows = (data as CourseRow[] | null) ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (domainFilter) params.set("domain", domainFilter)
    if (priceTypeFilter) params.set("price_type", priceTypeFilter)
    if (statusFilter) params.set("status", statusFilter)
    params.set("page", String(p))
    return `/admin/courses?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Courses</h1>
          <p className="mt-0.5 text-sm text-zinc-400">{total} total records</p>
        </div>
        <Link
          href="/admin/courses/new"
          id="course-new-btn"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90"
        >
          + Add Course
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or provider…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition"
          id="course-search"
        />
        <select name="domain" defaultValue={domainFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All domains</option>
          {COURSE_DOMAINS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select name="price_type" defaultValue={priceTypeFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All price types</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="free_with_paid_certificate">Free + Paid Certificate</option>
        </select>
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/12">
          Filter
        </button>
        {(q || domainFilter || priceTypeFilter || statusFilter) && (
          <Link href="/admin/courses" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200">
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-28">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-36">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-36">Price Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-36">Toggles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No courses found. Try adjusting your filters or add a new course.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-white/[0.025]">
                <td className="px-4 py-3 font-medium text-zinc-200 max-w-xs truncate">
                  <Link href={`/admin/courses/${row.id}/edit`} className="hover:text-violet-300 transition-colors">
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{row.provider}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{row.domain}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PRICE_TYPE_COLORS[row.price_type] ?? "bg-zinc-700/40 text-zinc-400"}`}>
                    {PRICE_TYPE_LABELS[row.price_type] ?? row.price_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <CourseToggles
                    id={row.id}
                    isActive={row.is_active}
                    isFeatured={row.is_featured}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/courses/${row.id}/edit`}
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
