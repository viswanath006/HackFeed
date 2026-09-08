"use client"

/**
 * components/FilterSidebar.tsx
 *
 * Professional filter sidebar panel for HackFeed.
 * Desktop: sticky left sidebar panel.
 * Mobile: bottom-sheet modal drawer.
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

  const displayPlatforms = Array.from(new Set([...DEFAULT_PLATFORMS, ...platforms])).filter(Boolean)

  return (
    <div className="flex flex-col gap-5 text-xs">
      {/* Clear Button (if active filters exist) */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors py-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Reset all filters</span>
        </button>
      )}

      {/* Sort Section */}
      <section>
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Sort by
        </h3>
        <div className="space-y-1.5">
          {SORTS.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                filters.sort === s.value ? "bg-white/[0.06] text-slate-100" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <input
                type="radio"
                name="sort"
                value={s.value}
                checked={filters.sort === s.value}
                onChange={() => onChange({ ...filters, sort: s.value })}
                className="h-3.5 w-3.5 accent-indigo-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs ${filters.sort === s.value ? "font-semibold text-slate-100" : "font-normal"}`}>
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Opportunity Type Section */}
      <section className="border-t border-white/[0.06] pt-4">
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Opportunity Type
        </h3>
        <div className="space-y-1.5">
          {[
            { value: "", label: "All Opportunities" },
            { value: "hackathon", label: "Hackathons" },
            { value: "internship", label: "Internships & Jobs" }
          ].map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                filters.type === t.value ? "bg-white/[0.06] text-slate-100" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={filters.type === t.value}
                onChange={() => onChange({ ...filters, type: t.value as Filters["type"] })}
                className="h-3.5 w-3.5 accent-indigo-500 bg-white/5 border-white/20"
              />
              <span className={`text-xs ${filters.type === t.value ? "font-semibold text-slate-100" : "font-normal"}`}>
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Mode Section */}
      <section className="border-t border-white/[0.06] pt-4">
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Format / Mode
        </h3>
        <div className="space-y-1.5">
          {MODES.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                filters.mode.includes(m) ? "bg-white/[0.06] text-slate-100" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={filters.mode.includes(m)}
                onChange={() => toggle("mode", m)}
                className="h-3.5 w-3.5 rounded accent-indigo-500 bg-white/5 border-white/20"
              />
              <span className="text-xs capitalize font-medium">
                {m}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Platform Section */}
      <section className="border-t border-white/[0.06] pt-4">
        <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Source Platform
        </h3>
        <div className="space-y-1.5">
          {displayPlatforms.map((p) => (
            <label
              key={p}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                filters.platform.includes(p) ? "bg-white/[0.06] text-slate-100" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={filters.platform.includes(p)}
                onChange={() => toggle("platform", p)}
                className="h-3.5 w-3.5 rounded accent-indigo-500 bg-white/5 border-white/20"
              />
              <span className="text-xs font-medium">
                {p}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <section className="border-t border-white/[0.06] pt-4">
          <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Skills &amp; Themes
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

  // Close drawer on ESC
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
        <div className="sticky top-24 rounded-xl border border-white/[0.08] bg-[#12141c] p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters &amp; Sort
            </h2>
            {props.activeCount > 0 && (
              <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
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
          className="flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-xs font-semibold text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
            <path d="M1 3h13a.5.5 0 0 0 0-1H1a.5.5 0 0 0 0 1Zm2 4h9a.5.5 0 0 0 0-1H3a.5.5 0 0 0 0 1Zm2 4h5a.5.5 0 0 0 0-1H5a.5.5 0 0 0 0 1Z" />
          </svg>
          <span>Filters</span>
          {props.activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-indigo-950">
              {props.activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile bottom-sheet drawer ──────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#12141c] p-6 shadow-2xl lg:hidden"
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" aria-hidden="true" />
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters &amp; Sort
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg bg-white/5 p-1.5 text-slate-400 hover:text-white"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            <FilterContent {...props} />
            <div className="mt-6">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-lg bg-indigo-600 py-3 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                Show Opportunities
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
