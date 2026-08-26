"use client"

/**
 * components/OpportunityCard.tsx
 *
 * Compact summary card for HackFeed.
 * - Entire card links to `/opportunities/[id]` for deep overview
 * - "Apply" button links directly out to `source_url` (`target="_blank" rel="noopener noreferrer"`)
 * - "Bookmark" button toggles bookmarks with optimistic feedback
 * - Zero-emoji design with clean SVG iconography
 */

import Link from "next/link"
import Image from "next/image"
import DeadlineBadge from "./DeadlineBadge"
import BookmarkButton from "./BookmarkButton"
import TagChip from "./TagChip"
import type { OpportunityRow } from "@/lib/supabase/types"
import { sanitizeExternalUrl } from "@/lib/utils"

// ── Platform brand styling ────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  unstop:       "bg-orange-500/10 text-orange-300  border-orange-500/25",
  devfolio:     "bg-blue-500/10   text-blue-300    border-blue-500/25",
  hackerearth:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  h2skill:      "bg-purple-500/10 text-purple-300  border-purple-500/25",
  hack2skill:   "bg-purple-500/10 text-purple-300  border-purple-500/25",
}

function platformCls(platform: string | null): string {
  if (!platform) return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  return PLATFORM_COLORS[platform.toLowerCase()] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
}

// ── Type gradient fallback ────────────────────────────────────────────────
const TYPE_GRADIENT: Record<string, string> = {
  hackathon:  "from-violet-950 via-purple-950/40 to-slate-950",
  internship: "from-sky-950 via-blue-950/40 to-slate-950",
}

// ── Badges ────────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  hackathon:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  internship: "bg-sky-500/15    text-sky-300    border-sky-500/30",
}
const MODE_BADGE: Record<string, string> = {
  online:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  offline: "bg-orange-500/10  text-orange-300  border-orange-500/25",
  hybrid:  "bg-amber-500/10   text-amber-300   border-amber-500/25",
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
  const typeCls = TYPE_BADGE[op.type] ?? TYPE_BADGE.hackathon
  const modeCls = op.mode ? (MODE_BADGE[op.mode] ?? "") : ""
  const rewardLabel = op.prize_pool || op.stipend
  const externalApplyUrl = sanitizeExternalUrl(op.source_url)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d16] transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-950/20">
      {/* ── Card Primary Click Area (Navigates to /opportunities/[id]) ── */}
      <Link
        href={`/opportunities/${op.id}`}
        className="block flex-1 flex flex-col"
        aria-label={`View details for ${op.title}`}
      >
        {/* Banner */}
        <div className="relative h-40 w-full overflow-hidden flex-shrink-0">
          {op.banner_image_url ? (
            <Image
              src={op.banner_image_url}
              alt={op.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${TYPE_GRADIENT[op.type] ?? TYPE_GRADIENT.hackathon} flex items-center justify-center`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white/40">
                {op.type === "hackathon" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                )}
              </div>
            </div>
          )}
          {/* Subtle shadow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d16] via-[#0d0d16]/20 to-transparent" />

          {/* Featured badge */}
          {op.is_featured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              Featured
            </div>
          )}

          {/* Top-right platform badge */}
          {op.source_platform && (
            <div className="absolute right-3 top-3">
              <span
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${platformCls(op.source_platform)}`}
              >
                {op.source_platform}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-4">
          {/* Type + Mode row */}
          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold capitalize tracking-wide ${typeCls}`}>
              {op.type}
            </span>
            {op.mode && (
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium capitalize ${modeCls}`}>
                {op.mode}
              </span>
            )}
            {rewardLabel && (
              <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-200 ml-auto truncate max-w-[130px]">
                {rewardLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 font-display text-[15px] font-bold leading-snug text-zinc-100 group-hover:text-violet-300 transition-colors">
            {op.title}
          </h3>

          {/* Organizer */}
          {op.organizer && (
            <p className="mt-1.5 truncate text-xs text-zinc-400">
              by <span className="text-zinc-300 font-medium">{op.organizer}</span>
            </p>
          )}

          {/* Tags */}
          {showTags && op.tags && op.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {op.tags.slice(0, 3).map((tag) => (
                <TagChip key={tag} tag={tag} size="xs" />
              ))}
              {op.tags.length > 3 && (
                <span className="text-[10px] font-medium text-zinc-500 self-center">
                  +{op.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1 min-h-[12px]" />
        </div>
      </Link>

      {/* ── Card Footer: Deadline + Interactive Controls ── */}
      <div className="p-4 pt-0">
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <DeadlineBadge deadline={op.application_deadline} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 z-10">
            <BookmarkButton
              opportunityId={op.id}
              userId={userId}
              initialBookmarked={isBookmarked}
              variant="icon"
              iconType={bookmarkIconType}
              onToggle={onBookmarkToggle}
            />

            {/* Direct outbound link */}
            <a
              href={externalApplyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-600 hover:text-white active:scale-95"
              title={`Apply directly on ${op.source_platform || "original platform"}`}
              onClick={(e) => e.stopPropagation()}
            >
              Apply
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
