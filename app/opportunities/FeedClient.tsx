"use client"

/**
 * app/opportunities/FeedClient.tsx
 *
 * Client component handling:
 * - Filter state (type, mode, platform, tags, sort)
 * - Debounced search (300ms)
 * - Client-side queries + resilient local filtering fallback
 * - Infinite scroll via IntersectionObserver
 * - Summary-only OpportunityCard rendering
 */

import { useState, useEffect, useCallback, useRef, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import OpportunityCard from "@/components/OpportunityCard"
import FilterSidebar, { type Filters } from "@/components/FilterSidebar"
import EmptyState from "@/components/EmptyState"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import type { OpportunityRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"

const PAGE_SIZE = 18

interface FeedClientProps {
  initialData:       OpportunityRow[]
  platforms:         string[]
  allTags:           string[]
  userId:            string | null
  bookmarkedIds:     string[]
  initialSearchQ?:   string
  initialType?:      "" | "hackathon" | "internship"
  initialPlatform?:  string[]
  initialMode?:      string[]
}

// ── Search Bar ─────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative flex-1">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        width="16" height="16" viewBox="0 0 16 16" fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        id="feed-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search opportunities by title, organizer, or keywords…"
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-violet-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-violet-500/20"
        aria-label="Search opportunities"
      />
    </div>
  )
}

// ── Result Count Badge ────────────────────────────────────────────────────

function ResultCount({ count, loading }: { count: number; loading: boolean }) {
  if (loading) return <span className="font-mono text-xs text-zinc-500 animate-pulse font-medium">Updating results…</span>
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs text-zinc-400 font-medium">
      Found <span className="font-mono font-bold text-zinc-100">{count}</span> {count === 1 ? "opportunity" : "opportunities"}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function FeedClient({
  initialData,
  platforms,
  allTags,
  userId,
  bookmarkedIds: initialBookmarkedIds,
  initialSearchQ = "",
  initialType = "",
  initialPlatform = [],
  initialMode = [],
}: FeedClientProps) {
  const supabase = createClient()

  const [filters, setFilters] = useState<Filters>({
    type:     initialType || "",
    mode:     initialMode || [],
    platform: initialPlatform || [],
    tags:     [],
    sort:     "deadline",
  })
  const [search, setSearch]           = useState(initialSearchQ)
  const [debouncedSearch, setDS]      = useState(initialSearchQ)
  const [rows, setRows]               = useState<OpportunityRow[]>(initialData)
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(initialData.length >= PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [bookmarkedIds]               = useState(new Set(initialBookmarkedIds))
  const [isPending, startTransition]  = useTransition()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounce search input ───────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDS(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // ── Resilient Local In-Memory Filter Helper ─────────────────────────────
  const filterLocally = useCallback(
    (sourceList: OpportunityRow[]) => {
      let filtered = [...sourceList]

      if (filters.type) {
        filtered = filtered.filter((item) => item.type === filters.type)
      }
      if (filters.mode.length > 0) {
        filtered = filtered.filter((item) => item.mode && filters.mode.includes(item.mode))
      }
      if (filters.platform.length > 0) {
        filtered = filtered.filter((item) =>
          filters.platform.some((p) =>
            item.source_platform?.toLowerCase().includes(p.toLowerCase())
          )
        )
      }
      if (filters.tags.length > 0) {
        filtered = filtered.filter((item) =>
          item.tags?.some((t) => filters.tags.includes(t))
        )
      }
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase()
        filtered = filtered.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.organizer?.toLowerCase().includes(q) ||
            item.tags?.some((t) => t.toLowerCase().includes(q))
        )
      }

      // Sort
      if (filters.sort === "newest") {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (filters.sort === "deadline") {
        filtered.sort((a, b) => {
          if (!a.application_deadline) return 1
          if (!b.application_deadline) return -1
          return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime()
        })
      }

      return filtered
    },
    [filters, debouncedSearch]
  )

  // ── Build Supabase query ────────────────────────────────────────────────
  const buildQuery = useCallback(
    (pageNum: number) => {
      const offset = (pageNum - 1) * PAGE_SIZE
      let q = supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .range(offset, offset + PAGE_SIZE - 1)

      // Sort
      if (filters.sort === "deadline") {
        q = q.order("application_deadline", { ascending: true, nullsFirst: false })
      } else if (filters.sort === "newest") {
        q = q.order("created_at", { ascending: false })
      } else if (filters.sort === "prize") {
        q = q.order("prize_pool", { ascending: false, nullsFirst: false })
      }

      // Type
      if (filters.type) q = q.eq("type", filters.type)

      // Mode
      if (filters.mode.length === 1) q = q.eq("mode", filters.mode[0])
      else if (filters.mode.length > 1) q = q.in("mode", filters.mode)

      // Platform
      if (filters.platform.length === 1) q = q.ilike("source_platform", `%${filters.platform[0]}%`)
      else if (filters.platform.length > 1) {
        const platformOrClause = filters.platform.map(p => `source_platform.ilike.%${p}%`).join(",")
        q = q.or(platformOrClause)
      }

      // Tags
      if (filters.tags.length > 0) q = q.overlaps("tags", filters.tags)

      // Search: title OR organizer
      if (debouncedSearch.trim()) {
        q = q.or(
          `title.ilike.%${debouncedSearch.trim()}%,organizer.ilike.%${debouncedSearch.trim()}%`
        )
      }

      return q
    },
    [filters, debouncedSearch, supabase]
  )

  // ── Fetch when filters or search change ─────────────────────────────────
  useEffect(() => {
    startTransition(async () => {
      try {
        const { data, error } = await buildQuery(1)
        if (!error && data && data.length > 0) {
          setRows(data)
          setPage(1)
          setHasMore(data.length === PAGE_SIZE)
          return
        }
      } catch (err) {
        console.warn("Client query notice, applying local filter fallback:", err)
      }

      // Local filter fallback
      const baseDataset = initialData.length > 0 ? initialData : MOCK_OPPORTUNITIES
      const filtered = filterLocally(baseDataset)
      setRows(filtered)
      setPage(1)
      setHasMore(false)
    })
  }, [filters, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load next page ──────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const { data } = await buildQuery(nextPage)
      if (data && data.length > 0) {
        setRows((prev) => [...prev, ...data])
        setPage(nextPage)
        setHasMore(data.length === PAGE_SIZE)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, buildQuery])

  // ── Infinite scroll sentinel observer ───────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: "300px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // ── Active filter count badge ───────────────────────────────────────────
  const activeCount =
    (filters.type ? 1 : 0) +
    filters.mode.length +
    filters.platform.length +
    filters.tags.length +
    (filters.sort !== "deadline" ? 1 : 0)

  const clearAll = () => {
    setFilters({ type: "", mode: [], platform: [], tags: [], sort: "deadline" })
    setSearch("")
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Filter sidebar ─────────────────────────────── */}
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        platforms={platforms}
        allTags={allTags}
        activeCount={activeCount}
      />

      {/* ── Main Feed ──────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* Search Bar + Result Count */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <ResultCount count={rows.length} loading={isPending} />
        </div>

        {/* Opportunities Grid */}
        {isPending ? (
          <LoadingSkeleton count={9} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No opportunities found"
            description="We couldn't find any opportunities matching your current filters or search keywords."
            onClear={clearAll}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((op) => (
                <OpportunityCard
                  key={op.id}
                  opportunity={op}
                  userId={userId}
                  isBookmarked={bookmarkedIds.has(op.id)}
                  showTags
                />
              ))}
            </div>

            {/* Infinite scroll trigger sentinel */}
            {hasMore && <div ref={sentinelRef} className="h-6" aria-hidden="true" />}

            {/* Loading spinner */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" aria-label="Loading more opportunities" />
              </div>
            )}

            {/* End of Feed message */}
            {rows.length > 0 && !loadingMore && (
              <div className="mt-12 text-center text-xs text-zinc-500 py-6 border-t border-white/[0.06]">
                Showing {rows.length} curated opportunities across Unstop, Devfolio, HackerEarth &amp; H2Skill.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
