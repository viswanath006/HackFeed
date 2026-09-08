"use client"

/**
 * app/opportunities/FeedClient.tsx
 *
 * Professional Feed Client handling:
 * - Filter state (type, mode, platform, tags, sort)
 * - Quick-filter tabs ("All", "Hackathons", "Internships", "Remote")
 * - Debounced search (300ms) with keyboard shortcut
 * - Resilient query with fallback
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

// ── Search Bar Component ───────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative flex-1">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
        width="15" height="15" viewBox="0 0 16 16" fill="none"
        aria-hidden="true"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        id="feed-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search listings by title, organizer, or skill…"
        className="w-full border border-hairline bg-paper py-2.5 pl-10 pr-16 text-xs sm:text-sm text-ink placeholder-ink-muted outline-none transition focus:border-ink focus:bg-paper-muted/30"
        aria-label="Search opportunities"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="pointer-events-auto p-0.5 text-ink-muted hover:text-ink"
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex h-4 items-center justify-center border border-hairline bg-paper-muted px-1.5 text-[10px] font-mono text-ink-muted">
            /
          </kbd>
        )}
      </div>
    </div>
  )
}

// ── Result Count Badge ────────────────────────────────────────────────────

function ResultCount({ count, loading }: { count: number; loading: boolean }) {
  if (loading) {
    return (
      <div className="border border-hairline bg-paper px-3.5 py-2 text-xs text-ink-muted font-medium whitespace-nowrap animate-pulse">
        Updating…
      </div>
    )
  }
  return (
    <div className="border border-hairline bg-paper px-3.5 py-2 text-xs text-ink-muted font-medium whitespace-nowrap">
      Showing <span className="font-semibold text-ink">{count}</span> {count === 1 ? "listing" : "listings"}
    </div>
  )
}

// ── Main Feed Component ───────────────────────────────────────────────────

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

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDS(search), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  // In-memory filter helper fallback
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

      if (filters.sort === "newest") {
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (filters.sort === "deadline") {
        const nowMs = Date.now()
        filtered.sort((a, b) => {
          const aTime = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity
          const bTime = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity
          const aIsExpired = aTime < nowMs
          const bIsExpired = bTime < nowMs

          if (!aIsExpired && bIsExpired) return -1
          if (aIsExpired && !bIsExpired) return 1
          return aTime - bTime
        })
      }

      return filtered
    },
    [filters, debouncedSearch]
  )

  // Supabase query builder
  const buildQuery = useCallback(
    (pageNum: number) => {
      const offset = (pageNum - 1) * PAGE_SIZE
      let q = supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)
        .range(offset, offset + PAGE_SIZE - 1)

      const nowIso = new Date().toISOString()
      if (filters.sort === "deadline") {
        q = q
          .or(`application_deadline.gte.${nowIso},application_deadline.is.null`)
          .order("application_deadline", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
      } else if (filters.sort === "newest") {
        q = q.order("created_at", { ascending: false })
      } else if (filters.sort === "prize") {
        q = q.order("prize_pool", { ascending: false, nullsFirst: false })
      }

      if (filters.type) q = q.eq("type", filters.type)
      if (filters.mode.length === 1) q = q.eq("mode", filters.mode[0])
      else if (filters.mode.length > 1) q = q.in("mode", filters.mode)

      if (filters.platform.length === 1) q = q.ilike("source_platform", `%${filters.platform[0]}%`)
      else if (filters.platform.length > 1) {
        const platformOrClause = filters.platform.map(p => `source_platform.ilike.%${p}%`).join(",")
        q = q.or(platformOrClause)
      }

      if (filters.tags.length > 0) q = q.overlaps("tags", filters.tags)

      if (debouncedSearch.trim()) {
        q = q.or(
          `title.ilike.%${debouncedSearch.trim()}%,organizer.ilike.%${debouncedSearch.trim()}%`
        )
      }

      return q
    },
    [filters, debouncedSearch, supabase]
  )

  // Query on filter change
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

      const baseDataset = initialData.length > 0 ? initialData : MOCK_OPPORTUNITIES
      const filtered = filterLocally(baseDataset)
      setRows(filtered)
      setPage(1)
      setHasMore(false)
    })
  }, [filters, debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll loader
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

  // Quick-select opportunity type tabs
  const handleQuickType = (type: "" | "hackathon" | "internship") => {
    setFilters((prev) => ({ ...prev, type }))
  }

  const handleQuickMode = (modeVal: string) => {
    setFilters((prev) => ({
      ...prev,
      mode: prev.mode.includes(modeVal) ? prev.mode.filter((m) => m !== modeVal) : [...prev.mode, modeVal],
    }))
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
        {/* Quick Filter Plain-Text Toggles with Active Underline */}
        <div className="mb-6 flex flex-wrap items-center gap-6 border-b border-hairline pb-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => handleQuickType("")}
            className={`pb-1 font-medium transition-colors ${
              filters.type === ""
                ? "text-ink border-b-2 border-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            All Listings
          </button>
          <button
            type="button"
            onClick={() => handleQuickType("hackathon")}
            className={`pb-1 font-medium transition-colors ${
              filters.type === "hackathon"
                ? "text-ink border-b-2 border-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Hackathons
          </button>
          <button
            type="button"
            onClick={() => handleQuickType("internship")}
            className={`pb-1 font-medium transition-colors ${
              filters.type === "internship"
                ? "text-forest border-b-2 border-forest font-semibold"
                : "text-ink-muted hover:text-forest"
            }`}
          >
            Internships
          </button>
          <button
            type="button"
            onClick={() => handleQuickMode("online")}
            className={`pb-1 font-medium transition-colors inline-flex items-center gap-1.5 ${
              filters.mode.includes("online")
                ? "text-forest border-b-2 border-forest font-semibold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            Online Only
          </button>
        </div>

        {/* Search Bar + Result Count */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <ResultCount count={rows.length} loading={isPending} />
        </div>

        {/* Opportunities Bulletin Listing */}
        {isPending ? (
          <LoadingSkeleton count={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No opportunities found"
            description="We couldn't find any opportunities matching your current filters or search keywords."
            onClear={clearAll}
          />
        ) : (
          <>
            <div className="border-t border-hairline divide-y divide-hairline">
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
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-ink" aria-label="Loading more opportunities" />
              </div>
            )}

            {/* End of Feed message */}
            {rows.length > 0 && !loadingMore && (
              <div className="mt-12 text-center text-xs text-ink-muted py-6 border-t border-hairline">
                Verified listings synchronized across Unstop, Devfolio, HackerEarth &amp; H2Skill.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
