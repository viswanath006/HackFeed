/**
 * app/admin/scrape-logs/page.tsx
 *
 * Scrape logs — filterable by platform and status, with inline error expansion.
 */

import { createClient } from "@/lib/supabase/server"
import type { Metadata } from "next"
import StatusBadge from "@/components/admin/StatusBadge"
import type { ScrapeLogRow } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Scrape Logs" }

interface SearchParams {
  platform?: string
  status?: string
}

export default async function ScrapeLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const platformFilter = sp.platform ?? ""
  const statusFilter   = sp.status ?? ""

  const supabase = await createClient()

  let query = supabase
    .from("scrape_logs")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(200)

  if (platformFilter) query = query.eq("source_platform", platformFilter)
  if (statusFilter)   query = query.eq("status", statusFilter)

  const { data } = await query
  const logs = (data as ScrapeLogRow[] | null) ?? []

  // Distinct platforms
  const { data: allPlatforms } = await supabase
    .from("scrape_logs")
    .select("source_platform")

  const platformData = (allPlatforms as { source_platform: string }[] | null) ?? []
  const uniquePlatforms = Array.from(
    new Set(platformData.map((r) => r.source_platform))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Scrape Logs</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Audit log for each scraper run — most recent first.
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="platform"
          defaultValue={platformFilter}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
          id="log-platform-filter"
        >
          <option value="">All platforms</option>
          {uniquePlatforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500/60"
          id="log-status-filter"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="partial">Partial</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/12"
        >
          Filter
        </button>
        {(platformFilter || statusFilter) && (
          <a
            href="/admin/scrape-logs"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Platform", "Status", "Scraped", "Added", "Updated", "Run At", "Error"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  No scrape logs yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr
                key={log.id}
                className={`transition-colors hover:bg-white/[0.025] ${
                  log.status === "failed" ? "bg-red-500/[0.03]" : ""
                }`}
              >
                <td className="px-4 py-3 font-medium text-zinc-200">{log.source_platform}</td>
                <td className="px-4 py-3">
                  <StatusBadge kind="scrape" value={log.status} />
                </td>
                <td className="px-4 py-3 text-zinc-400 tabular-nums">{log.items_scraped}</td>
                <td className="px-4 py-3 text-emerald-400/80 tabular-nums">+{log.items_added}</td>
                <td className="px-4 py-3 text-sky-400/80 tabular-nums">~{log.items_updated}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                  {new Date(log.run_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {log.error_message ? (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-red-400 hover:text-red-300 list-none flex items-center gap-1">
                        <span className="transition group-open:rotate-90" aria-hidden="true">▶</span>
                        View error
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-red-500/10 p-2 text-[11px] text-red-300 font-mono leading-relaxed">
                        {log.error_message}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-zinc-600 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">Showing up to 200 most recent entries.</p>
    </div>
  )
}
