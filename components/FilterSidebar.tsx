"use client"

/**
 * components/FilterSidebar.tsx
 *
 * Desktop: sticky left sidebar panel.
 * Mobile:  bottom-sheet drawer triggered by a floating "Filters" FAB.
 *
 * Props: current filter state + setters passed down from FeedClient.
 */

import { useState, useEffect } from "react"
import TagChip from "./TagChip"

export type SortOption = "deadline" | "newest" | "prize"

export interface Filters {
  type:     "" | "hackathon" | "internship"
  mode:     string[]        // "online" | "offline" | "hybrid"
  platform: string[]
  tags:     string[]
  sort:     SortOption
}

interface FilterSidebarProps {
  filters:     Filters
  onChange:    (f: Filters) => void
  platforms:   string[]
  allTags:     string[]
  activeCount: number
}

const MODES = ["online", "offline", "hybrid"] as const
const DEFAULT_PLATFORMS = ["Unstop", "Devfolio", "HackerEarth", "H2Skill"]
const SORTS: { value: SortOption; label: string }[] = [
  { value: "deadline", label: "Soonest deadline" },
  { value: "newest",   label: "Newest added"     },
  { value: "prize",    label: "Highest prize / stipend" },
]

function FilterContent({
  filters, onChange, platforms, allTags,
}: Omit<FilterSidebarProps, "activeCount">) {
  const toggle = <K extends "mode" | "platform" | "tags">(key: K, val: string) => {
    const arr = filters[key] as string[]
    onChange({
      ...filters,
      [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
    })
  }

  const clearAll = () =>
    onChange({ type: "", mode: [], platform: [], tags: [], sort: "deadline" })

  const hasFilters =
    filters.type ||
    filters.mode.length > 0 ||
    filters.platform.length > 0 ||
    filters.tags.length > 0 ||
    filters.sort !== "deadline"

  // Merge available platforms with default platforms for reliable filter list
  const displayPlatforms = Array.from(new Set([...DEFAULT_PLATFORMS, ...platforms])).filter(Boolean)

  return (
    <div className="flex flex-col gap-6 text-sm">
      {/* Clear Button */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="self-start rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
        >
          Reset All Filters
        </button>
      )}

      {/* Sort Section */}
      <section>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Sort by
        </h3>
        <div className="space-y-2">
          {SORTS.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-center gap-2.5 group">
              <input
                type="radio"
                name="sort"
                value={s.value}
                checked={filters.sort === s.value}
                onChange={() => onChange({ ...filters, sort: s.value })}
                className="h-4 w-4 accent-violet-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs transition-colors ${filters.sort === s.value ? "font-semibold text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Type Section */}
      <section className="border-t border-white/[0.06] pt-5">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Opportunity Type
        </h3>
        <div className="space-y-2">
          {[
            { value: "", label: "All Opportunities" },
            { value: "hackathon", label: "Hackathons" },
            { value: "internship", label: "Internships & Jobs" }
          ].map((t) => (
            <label key={t.value} className="flex cursor-pointer items-center gap-2.5 group">
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={filters.type === t.value}
                onChange={() => onChange({ ...filters, type: t.value as Filters["type"] })}
                className="h-4 w-4 accent-violet-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs transition-colors ${filters.type === t.value ? "font-semibold text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Mode Section */}
      <section className="border-t border-white/[0.06] pt-5">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Format / Mode
        </h3>
        <div className="space-y-2">
          {MODES.map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2.5 group">
              <input
                type="checkbox"
                checked={filters.mode.includes(m)}
                onChange={() => toggle("mode", m)}
                className="h-4 w-4 rounded accent-violet-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs capitalize transition-colors ${filters.mode.includes(m) ? "font-semibold text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                {m}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section className="border-t border-white/[0.06] pt-5">
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Source Platform
        </h3>
        <div className="space-y-2">
          {displayPlatforms.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2.5 group">
              <input
                type="checkbox"
                checked={filters.platform.includes(p)}
                onChange={() => toggle("platform", p)}
                className="h-4 w-4 rounded accent-violet-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs transition-colors ${filters.platform.includes(p) ? "font-semibold text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                {p}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <section className="border-t border-white/[0.06] pt-5">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Popular Tags
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {allTags.slice(0, 25).map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                size="xs"
                active={filters.tags.includes(tag)}
                onClick={() => toggle("tags", tag)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function FilterSidebar(props: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on outside click / ESC
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  return (
    <>
      {/* ── Desktop sidebar (lg+) ───────────────────────── */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-[#0f0f1a]/95 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters &amp; Sort
            </h2>
            {props.activeCount > 0 && (
              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                {props.activeCount} active
              </span>
            )}
          </div>
          <FilterContent {...props} />
        </div>
      </aside>

      {/* ── Mobile FAB ──────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          id="filter-fab"
          aria-label="Open filters"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-violet-500/40 transition hover:scale-105 active:scale-95"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
            <path d="M1 3h13a.5.5 0 0 0 0-1H1a.5.5 0 0 0 0 1Zm2 4h9a.5.5 0 0 0 0-1H3a.5.5 0 0 0 0 1Zm2 4h5a.5.5 0 0 0 0-1H5a.5.5 0 0 0 0 1Z" />
          </svg>
          Filters
          {props.activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-violet-900">
              {props.activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile bottom-sheet drawer ──────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0f0f1a] p-6 shadow-2xl lg:hidden"
          >
            {/* Handle */}
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" aria-hidden="true" />
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl bg-white/5 p-2 text-zinc-400 hover:text-white"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <FilterContent {...props} />
            <div className="mt-8">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
