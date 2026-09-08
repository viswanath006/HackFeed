"use client"

/**
 * components/FilterSidebar.tsx
 *
 * Editorial filter sidebar for HackFeed.
 * - Clean serif headings (no all-caps eyebrows)
 * - Plain text toggles with underline / left-accent on active state
 * - Hairline dividers between sections
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
  { value: "prize",    label: "Highest reward / stipend" },
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
    <div className="flex flex-col gap-6 text-xs font-sans">
      {/* Reset Action */}
      {hasFilters && (
        <div className="pb-2 border-b border-hairline">
          <button
            onClick={clearAll}
            className="text-xs text-signal underline hover:text-signal-hover transition-colors"
          >
            Reset all active filters
          </button>
        </div>
      )}

      {/* Sort Section */}
      <section>
        <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
          Order by
        </h3>
        <div className="space-y-1">
          {SORTS.map((s) => {
            const isSelected = filters.sort === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange({ ...filters, sort: s.value })}
                className={`block w-full text-left py-1 transition-colors ${
                  isSelected
                    ? "font-semibold text-ink border-l-2 border-ink pl-2"
                    : "text-ink-muted hover:text-ink pl-2 border-l-2 border-transparent"
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Opportunity Type */}
      <section className="border-t border-hairline pt-4">
        <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
          Opportunity type
        </h3>
        <div className="space-y-1">
          {[
            { value: "", label: "All listings" },
            { value: "hackathon", label: "Hackathons" },
            { value: "internship", label: "Internships & roles" },
          ].map((t) => {
            const isSelected = filters.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ ...filters, type: t.value as Filters["type"] })}
                className={`block w-full text-left py-1 transition-colors ${
                  isSelected
                    ? "font-semibold text-ink border-l-2 border-ink pl-2"
                    : "text-ink-muted hover:text-ink pl-2 border-l-2 border-transparent"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Mode Section */}
      <section className="border-t border-hairline pt-4">
        <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
          Attendance format
        </h3>
        <div className="space-y-1">
          {MODES.map((m) => {
            const isSelected = filters.mode.includes(m)
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggle("mode", m)}
                className={`flex items-center justify-between w-full text-left py-1 transition-colors capitalize ${
                  isSelected ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span>{m}</span>
                <span className={`text-[11px] ${isSelected ? "text-ink font-bold" : "text-hairline-dark"}`}>
                  {isSelected ? "✓" : "+"}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Platform Section */}
      <section className="border-t border-hairline pt-4">
        <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
          Source platform
        </h3>
        <div className="space-y-1">
          {displayPlatforms.map((p) => {
            const isSelected = filters.platform.includes(p)
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle("platform", p)}
                className={`flex items-center justify-between w-full text-left py-1 transition-colors ${
                  isSelected ? "font-semibold text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span>{p}</span>
                <span className={`text-[11px] ${isSelected ? "text-ink font-bold" : "text-hairline-dark"}`}>
                  {isSelected ? "✓" : "+"}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Skills & Themes */}
      {allTags.length > 0 && (
        <section className="border-t border-hairline pt-4">
          <h3 className="mb-2 font-serif text-sm font-semibold text-ink">
            Topic tags
          </h3>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
            {allTags.slice(0, 24).map((tag) => (
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
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <div className="sticky top-20 border-r border-hairline pr-6 py-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
            <h2 className="font-serif text-base font-bold text-ink">
              Filter index
            </h2>
            {props.activeCount > 0 && (
              <span className="text-[11px] font-medium text-signal">
                {props.activeCount} applied
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
          className="flex items-center gap-2 border border-ink bg-ink px-4 py-2.5 text-xs font-medium text-paper shadow-md"
        >
          <span>Filters</span>
          {props.activeCount > 0 && (
            <span className="text-signal font-bold">({props.activeCount})</span>
          )}
        </button>
      </div>

      {/* ── Mobile bottom-sheet drawer ──────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter Index"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto border-t border-hairline bg-paper p-6 shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
              <h2 className="font-serif text-lg font-bold text-ink">
                Filter index
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-xs text-ink-muted hover:text-ink font-medium"
                aria-label="Close filters"
              >
                Close
              </button>
            </div>
            <FilterContent {...props} />
            <div className="mt-6 pt-4 border-t border-hairline">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full border border-ink bg-ink py-2.5 text-xs font-medium text-paper"
              >
                View listings
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
