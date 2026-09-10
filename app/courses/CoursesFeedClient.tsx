"use client"

/**
 * app/courses/CoursesFeedClient.tsx
 *
 * Client-side courses listing with domain pill tabs (primary filter),
 * secondary filters (price_type, level, provider), and search bar.
 * Uses URL searchParams via router.push for shareable filter state.
 */

import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import CourseCard from "@/components/CourseCard"
import EmptyState from "@/components/EmptyState"
import type { CourseRow } from "@/lib/supabase/types"
import { COURSE_DOMAINS } from "@/lib/supabase/types"

interface CoursesFeedClientProps {
  initialCourses: CourseRow[]
  userId: string | null
  bookmarkedCourseIds: Set<string>
  /** Current filter state (passed from server) */
  currentDomain: string
  currentPriceType: string
  currentLevel: string
  currentProvider: string
  currentQ: string
  totalCount: number
}

const PRICE_TYPE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "free_with_paid_certificate", label: "Free + Cert" },
]

const LEVEL_OPTIONS = [
  { value: "", label: "Any level" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

export default function CoursesFeedClient({
  initialCourses,
  userId,
  bookmarkedCourseIds,
  currentDomain,
  currentPriceType,
  currentLevel,
  currentProvider,
  currentQ,
  totalCount,
}: CoursesFeedClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [courses] = useState<CourseRow[]>(initialCourses)
  const [bookmarks, setBookmarks] = useState<Set<string>>(bookmarkedCourseIds)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    // Reset page when filter changes
    params.delete("page")
    for (const [k, v] of Object.entries(overrides)) {
      if (v) {
        params.set(k, v)
      } else {
        params.delete(k)
      }
    }
    return `${pathname}?${params.toString()}`
  }

  function navigate(overrides: Record<string, string>) {
    startTransition(() => {
      router.push(buildUrl(overrides))
    })
  }

  const handleBookmarkToggle = (courseId: string, isBookmarked: boolean) => {
    setBookmarks((prev) => {
      const next = new Set(prev)
      if (isBookmarked) next.add(courseId)
      else next.delete(courseId)
      return next
    })
  }

  const activeDomain = currentDomain

  return (
    <div className="space-y-8">
      {/* ── Domain Tabs (Primary Filter) ── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-ink-muted/70 mb-3 font-medium">Browse by domain</p>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by domain">
          <button
            role="tab"
            aria-selected={!activeDomain}
            onClick={() => navigate({ domain: "" })}
            id="domain-tab-all"
            className={`px-4 py-2 text-xs font-semibold border transition-all ${
              !activeDomain
                ? "border-ink bg-ink text-paper"
                : "border-hairline text-ink-muted hover:border-ink hover:text-ink bg-paper"
            }`}
          >
            All Domains
          </button>
          {COURSE_DOMAINS.map((domain) => (
            <button
              key={domain}
              role="tab"
              aria-selected={activeDomain === domain}
              onClick={() => navigate({ domain })}
              id={`domain-tab-${domain.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={`px-4 py-2 text-xs font-semibold border transition-all ${
                activeDomain === domain
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-ink-muted hover:border-ink hover:text-ink bg-paper"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* ── Secondary Filters + Search ── */}
      <div className="flex flex-wrap gap-3 items-center border-b border-hairline pb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            id="courses-search"
            defaultValue={currentQ}
            placeholder="Search courses or providers…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate({ q: (e.target as HTMLInputElement).value.trim() })
              }
            }}
            className="w-full border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder-ink-muted/60 outline-none focus:border-ink transition"
          />
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted/50" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Price Type */}
        <select
          id="courses-price-filter"
          defaultValue={currentPriceType}
          onChange={(e) => navigate({ price_type: e.target.value })}
          className="border border-hairline bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-ink transition"
        >
          {PRICE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Level */}
        <select
          id="courses-level-filter"
          defaultValue={currentLevel}
          onChange={(e) => navigate({ level: e.target.value })}
          className="border border-hairline bg-paper px-3 py-2 text-xs text-ink outline-none focus:border-ink transition"
        >
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Provider search */}
        <input
          type="text"
          id="courses-provider-filter"
          defaultValue={currentProvider}
          placeholder="Provider…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ provider: (e.target as HTMLInputElement).value.trim() })
            }
          }}
          className="border border-hairline bg-paper px-3 py-2 text-xs text-ink placeholder-ink-muted/60 outline-none focus:border-ink transition w-32"
        />

        {/* Active filter count / Clear */}
        {(activeDomain || currentPriceType || currentLevel || currentProvider || currentQ) && (
          <button
            onClick={() => navigate({ domain: "", price_type: "", level: "", provider: "", q: "" })}
            className="text-xs text-ink-muted hover:text-ink transition underline decoration-ink-muted/40 underline-offset-4"
          >
            Clear filters
          </button>
        )}

        {/* Result count */}
        <span className="ml-auto text-xs text-ink-muted">{totalCount} course{totalCount !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Course Listings ── */}
      {courses.length === 0 ? (
        <div className="border border-hairline bg-paper p-8 sm:p-12 text-center">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-ink">
            No courses found
          </h2>
          <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed text-ink-muted">
            Try adjusting your domain, price type, or search filters.
          </p>
          <button
            onClick={() => navigate({ domain: "", price_type: "", level: "", provider: "", q: "" })}
            className="mt-6 inline-block border border-ink bg-ink px-5 py-2.5 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="border-t border-hairline divide-y divide-hairline">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              userId={userId}
              isBookmarked={bookmarks.has(course.id)}
              showTags
              onBookmarkToggle={(isBookmarked) => handleBookmarkToggle(course.id, isBookmarked)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
