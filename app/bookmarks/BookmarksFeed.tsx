"use client"

/**
 * app/bookmarks/BookmarksFeed.tsx
 *
 * Client interactive feed for the /bookmarks page:
 * - Displays all bookmarked opportunities in bulletin listing rows
 * - Instant live removal when un-bookmarked from the card
 * - Quick type filter plain-text toggles (All, Hackathons, Internships)
 * - "Export All to Calendar (.ics)" bundle export action
 * - Zero arrow suffixes, paper & ink aesthetic
 */

import { useState } from "react"
import Link from "next/link"
import OpportunityCard from "@/components/OpportunityCard"
import EmptyState from "@/components/EmptyState"
import type { OpportunityRow } from "@/lib/supabase/types"
import { generateMultiIcs, downloadIcsFile } from "@/lib/calendar"
import { toast } from "@/components/Toast"

interface BookmarksFeedProps {
  initialOpportunities: OpportunityRow[]
  userId: string
}

export default function BookmarksFeed({
  initialOpportunities,
  userId,
}: BookmarksFeedProps) {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>(initialOpportunities)
  const [typeFilter, setTypeFilter] = useState<"all" | "hackathon" | "internship">("all")

  const handleBookmarkToggle = (opId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setOpportunities((prev) => prev.filter((o) => o.id !== opId))
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

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Plain-text Filter toggles & Export All Action ── */}
      {opportunities.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
          {/* Plain-text toggles with underline-on-active */}
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

          {/* Export Action */}
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
            <span>Export All to Calendar (.ics)</span>
          </button>
        </div>
      )}

      {/* ── Bulletin Listings or Empty State ── */}
      {opportunities.length === 0 ? (
        <div className="border border-hairline bg-paper p-8 sm:p-12 text-center">
          <h2 className="font-serif text-2xl font-normal tracking-tight text-ink">
            No saved bookmarks yet
          </h2>
          <p className="mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed text-ink-muted">
            Bookmark hackathons and internships from the bulletin to keep track of upcoming deadlines, stipends, and registrations.
          </p>
          <Link
            href="/opportunities"
            className="mt-6 inline-block border border-ink bg-ink px-5 py-2.5 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
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
    </div>
  )
}
