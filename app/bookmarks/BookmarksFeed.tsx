"use client"

/**
 * app/bookmarks/BookmarksFeed.tsx
 *
 * Client interactive feed for the /bookmarks page:
 * - Displays all bookmarked opportunities in a card grid
 * - Instant live removal when un-bookmarked from the card
 * - Quick type filter (All, Hackathons, Internships)
 * - "Export All to Calendar (.ics)" bundle export button
 * - Empty state with CTA to browse opportunities
 * - Zero-emoji design with clean SVG iconography
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
      // Remove from list smoothly
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
      {/* ── Top Bar: Filter tabs, count & Export All Action ── */}
      {opportunities.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#12141c] p-3 sm:p-4">
          {/* Type filter tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                typeFilter === "all"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({opportunities.length})
            </button>
            <button
              onClick={() => setTypeFilter("hackathon")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                typeFilter === "hackathon"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Hackathons ({hackathonCount})
            </button>
            <button
              onClick={() => setTypeFilter("internship")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                typeFilter === "internship"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Internships ({internshipCount})
            </button>
          </div>

          {/* Right side: Count & Export Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAllCalendar}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-200 active:scale-95"
              title="Export all saved bookmarks into an .ics calendar file"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Export All to Calendar (.ics)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Feed Grid or Empty State ── */}
      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-100">
              No saved opportunities yet
            </h2>
            <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-400">
              Bookmark hackathons and internships from the feed to keep track of upcoming deadlines,
              stipends, and team registrations.
            </p>
            <Link
              href="/opportunities"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
            >
              Browse Feed Now
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${typeFilter === "hackathon" ? "hackathons" : "internships"} bookmarked`}
          description="Try switching the filter tab above to view other saved opportunities."
          onClear={() => setTypeFilter("all")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
