"use client"

/**
 * app/bookmarks/BookmarksFeed.tsx
 *
 * Client interactive feed for the /bookmarks page:
 * - Section 1: Bookmarked opportunities (All / Hackathons / Internships filters)
 * - Section 2: Bookmarked courses (live unbookmark support)
 * - Export all opportunities to calendar (.ics)
 * - Zero arrow suffixes, paper & ink aesthetic
 */

import { useState } from "react"
import Link from "next/link"
import OpportunityCard from "@/components/OpportunityCard"
import CourseCard from "@/components/CourseCard"
import EmptyState from "@/components/EmptyState"
import type { OpportunityRow, CourseRow } from "@/lib/supabase/types"
import { generateMultiIcs, downloadIcsFile } from "@/lib/calendar"
import { toast } from "@/components/Toast"

interface BookmarksFeedProps {
  initialOpportunities: OpportunityRow[]
  initialCourses: CourseRow[]
  userId: string
}

export default function BookmarksFeed({
  initialOpportunities,
  initialCourses,
  userId,
}: BookmarksFeedProps) {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>(initialOpportunities)
  const [courses, setCourses] = useState<CourseRow[]>(initialCourses)
  const [typeFilter, setTypeFilter] = useState<"all" | "hackathon" | "internship">("all")

  const handleBookmarkToggle = (opId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setOpportunities((prev) => prev.filter((o) => o.id !== opId))
    }
  }

  const handleCourseBookmarkToggle = (courseId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    }
  }

  const filtered = opportunities.filter((op) => {
    if (typeFilter === "all") return true
    return op.type === typeFilter
  })

  const hackathonCount = opportunities.filter((o) => o.type === "hackathon").length
  const internshipCount = opportunities.filter((o) => o.type === "internship").length

  const handleExportAllCalendar = () => {
    if (opportunities.length === 0) {
      toast.error("No saved opportunities to export.")
      return
    }
    try {
      const appUrl = typeof window !== "undefined" ? window.location.origin : ""
      const ics = generateMultiIcs(opportunities, appUrl)
      downloadIcsFile("hackfeed_all_bookmarks.ics", ics)
      toast.success(`Exported ${opportunities.length} opportunities to calendar`)
    } catch {
      toast.error("Failed to export calendar bundle.")
    }
  }

  const hasAnyBookmarks = opportunities.length > 0 || courses.length > 0

  if (!hasAnyBookmarks) {
    return (
      <div className="border border-hairline bg-paper p-8 sm:p-12 text-center">
        <h2 className="font-serif text-2xl font-normal tracking-tight text-ink">
          No saved bookmarks yet
        </h2>
        <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed text-ink-muted">
          Bookmark hackathons, internships, and courses from the bulletin to keep track of opportunities and build your skill plan.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/opportunities"
            className="border border-ink bg-ink px-5 py-2.5 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
          >
            Browse Opportunities
          </Link>
          <Link
            href="/courses"
            className="border border-hairline bg-paper px-5 py-2.5 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
          >
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* ════════════════ OPPORTUNITIES SECTION ════════════════ */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-muted/70 font-medium">Opportunities</p>
            <h2 className="font-serif text-xl font-normal tracking-tight text-ink mt-0.5">
              Hackathons &amp; Internships
            </h2>
          </div>
          <span className="border border-hairline px-3 py-1 text-xs font-medium text-ink-muted">
            {opportunities.length} saved
          </span>
        </div>

        {opportunities.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            {/* Type filter toggles */}
            <div className="flex items-center gap-6 text-xs sm:text-sm">
              <button
                onClick={() => setTypeFilter("all")}
                className={`pb-1 font-medium transition-colors ${
                  typeFilter === "all"
                    ? "text-ink border-b-2 border-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                All ({opportunities.length})
              </button>
              <button
                onClick={() => setTypeFilter("hackathon")}
                className={`pb-1 font-medium transition-colors ${
                  typeFilter === "hackathon"
                    ? "text-ink border-b-2 border-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Hackathons ({hackathonCount})
              </button>
              <button
                onClick={() => setTypeFilter("internship")}
                className={`pb-1 font-medium transition-colors ${
                  typeFilter === "internship"
                    ? "text-forest border-b-2 border-forest font-semibold"
                    : "text-ink-muted hover:text-forest"
                }`}
              >
                Internships ({internshipCount})
              </button>
            </div>

            {/* Export to calendar */}
            <button
              onClick={handleExportAllCalendar}
              className="inline-flex items-center gap-2 border border-hairline bg-paper px-3.5 py-2 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
              title="Export all saved bookmarks into an .ics calendar file"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
                <rect x="3" y="4" width="18" height="18" rx="0" ry="0" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Export to Calendar (.ics)</span>
            </button>
          </div>
        )}

        {opportunities.length === 0 ? (
          <div className="border border-hairline bg-paper p-6 text-center">
            <p className="text-sm text-ink-muted">No saved opportunities yet.</p>
            <Link
              href="/opportunities"
              className="mt-3 inline-block text-xs font-medium text-ink underline decoration-ink/40 underline-offset-4 hover:text-ink-muted transition"
            >
              Browse Opportunities Feed
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${typeFilter === "hackathon" ? "hackathons" : "internships"} bookmarked`}
            description="Try switching the filter above to view other saved opportunities."
            onClear={() => setTypeFilter("all")}
          />
        ) : (
          <div className="border-t border-hairline divide-y divide-hairline">
            {filtered.map((op) => (
              <OpportunityCard
                key={op.id}
                opportunity={op}
                userId={userId}
                isBookmarked={true}
                showTags
                onBookmarkToggle={(isBookmarked) => handleBookmarkToggle(op.id, isBookmarked)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ════════════════ COURSES SECTION ════════════════ */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-muted/70 font-medium">Learning</p>
            <h2 className="font-serif text-xl font-normal tracking-tight text-ink mt-0.5">
              Saved Courses
            </h2>
          </div>
          <span className="border border-hairline px-3 py-1 text-xs font-medium text-ink-muted">
            {courses.length} saved
          </span>
        </div>

        {courses.length === 0 ? (
          <div className="border border-hairline bg-paper p-6 text-center">
            <p className="text-sm text-ink-muted">No saved courses yet.</p>
            <Link
              href="/courses"
              className="mt-3 inline-block text-xs font-medium text-ink underline decoration-ink/40 underline-offset-4 hover:text-ink-muted transition"
            >
              Browse Courses Directory
            </Link>
          </div>
        ) : (
          <div className="border-t border-hairline divide-y divide-hairline">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userId={userId}
                isBookmarked={true}
                showTags
                onBookmarkToggle={(isBookmarked) => handleCourseBookmarkToggle(course.id, isBookmarked)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
