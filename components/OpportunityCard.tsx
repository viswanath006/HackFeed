"use client"

/**
 * components/OpportunityCard.tsx
 *
 * Editorial bulletin listing format for HackFeed.
 * - Left-aligned typographic layout with hairline dividers
 * - Platform indicator as small plain text with subtle left accent line
 * - Bold serif day-count on the right edge
 * - No boxed shadow cards, no hover-lift, no arrow suffixes
 */

import Link from "next/link"
import DeadlineBadge from "./DeadlineBadge"
import BookmarkButton from "./BookmarkButton"
import TagChip from "./TagChip"
import OpportunityCover from "./OpportunityCover"
import type { OpportunityRow } from "@/lib/supabase/types"
import { sanitizeExternalUrl } from "@/lib/utils"

const PLATFORM_ACCENTS: Record<string, { label: string; accentBorder: string }> = {
  unstop: {
    label: "Unstop",
    accentBorder: "border-l-2 border-amber-600",
  },
  devfolio: {
    label: "Devfolio",
    accentBorder: "border-l-2 border-blue-600",
  },
  hackerearth: {
    label: "HackerEarth",
    accentBorder: "border-l-2 border-forest",
  },
  h2skill: {
    label: "H2Skill",
    accentBorder: "border-l-2 border-ink",
  },
  hack2skill: {
    label: "Hack2Skill",
    accentBorder: "border-l-2 border-ink",
  },
}

function getPlatformMeta(platform: string | null) {
  if (!platform) {
    return { label: "Listing", accentBorder: "border-l-2 border-hairline-dark" }
  }
  const key = platform.toLowerCase().replace(/\s+/g, "")
  return PLATFORM_ACCENTS[key] ?? {
    label: platform,
    accentBorder: "border-l-2 border-hairline-dark",
  }
}

interface OpportunityCardProps {
  opportunity: OpportunityRow
  userId?: string | null
  isBookmarked?: boolean
  showTags?: boolean
  bookmarkIconType?: "bookmark" | "heart"
  onBookmarkToggle?: (isBookmarked: boolean) => void
}

export default function OpportunityCard({
  opportunity: op,
  userId = null,
  isBookmarked = false,
  showTags = false,
  bookmarkIconType = "bookmark",
  onBookmarkToggle,
}: OpportunityCardProps) {
  const platformMeta = getPlatformMeta(op.source_platform)
  const rewardLabel = op.prize_pool || op.stipend
  const externalApplyUrl = sanitizeExternalUrl(op.source_url)
  const isHackathon = op.type === "hackathon"

  return (
    <article className="group relative border-b border-hairline py-5 transition-colors duration-150 hover:bg-paper-muted/40 px-3 sm:px-4 -mx-3 sm:-mx-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 justify-between">
        {/* Left side: Thumbnail + Content */}
        <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
          {/* Left Thumbnail (4:3 aspect ratio, compact, scannable) */}
          <div className="flex-shrink-0 w-20 sm:w-28 md:w-32 self-start">
            <Link
              href={`/opportunities/${op.id}`}
              tabIndex={-1}
              aria-hidden="true"
              className="block focus:outline-none"
            >
              <OpportunityCover
                src={op.banner_image_url}
                alt={op.title}
                title={op.title}
                type={op.type}
                platform={op.source_platform}
                aspectRatio="4/3"
                variant="thumbnail"
                className="rounded-xs hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* Main info column: metadata, title, organizer, tags */}
          <div className="min-w-0 flex-1">
            {/* Metadata line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mb-1.5">
              <span className={`pl-2 font-medium text-ink ${platformMeta.accentBorder}`}>
                {platformMeta.label}
              </span>

              <span className="text-hairline-dark">/</span>

              <span className={`font-medium ${isHackathon ? "text-ink" : "text-forest"}`}>
                {op.type === "hackathon" ? "Hackathon" : "Internship"}
              </span>

              {op.mode && (
                <>
                  <span className="text-hairline-dark">/</span>
                  <span className="capitalize">{op.mode}</span>
                </>
              )}

              {rewardLabel && (
                <>
                  <span className="text-hairline-dark">/</span>
                  <span className="font-semibold text-forest font-sans">
                    {rewardLabel}
                  </span>
                </>
              )}

              {op.is_featured && (
                <span className="border-b border-signal text-[11px] font-semibold text-signal">
                  Featured
                </span>
              )}
            </div>

            {/* Title in Fraunces Serif */}
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-ink font-serif leading-snug">
              <Link
                href={`/opportunities/${op.id}`}
                className="hover:underline hover:text-ink focus:underline outline-none"
              >
                {op.title}
              </Link>
            </h3>

            {/* Organizer */}
            {op.organizer && (
              <p className="mt-1 text-xs text-ink-muted">
                Organized by <span className="text-ink font-medium">{op.organizer}</span>
              </p>
            )}

            {/* Tags */}
            {showTags && op.tags && op.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {op.tags.slice(0, 4).map((tag) => (
                  <TagChip key={tag} tag={tag} size="xs" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Typographic deadline count + Action controls */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2.5 flex-shrink-0 pt-2 sm:pt-1 border-t border-hairline/60 sm:border-0">
          {/* Typographic Deadline */}
          <DeadlineBadge deadline={op.application_deadline} variant="prominent" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <BookmarkButton
              opportunityId={op.id}
              userId={userId}
              initialBookmarked={isBookmarked}
              variant="icon"
              iconType={bookmarkIconType}
              onToggle={onBookmarkToggle}
            />

            <a
              href={externalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-ink bg-ink text-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink-muted hover:border-ink-muted focus-visible:outline-none"
              title={`Apply directly on ${platformMeta.label}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>Apply</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
