"use client"

/**
 * components/OpportunityCard.tsx
 *
 * Professional summary card for HackFeed.
 * - Entire card navigates to `/opportunities/[id]`
 * - Direct "Apply" link opens external source URL
 * - Bookmark button with optimistic update
 * - Clean, modern SaaS aesthetic inspired by Linear and Vercel
 */

import Link from "next/link"
import Image from "next/image"
import DeadlineBadge from "./DeadlineBadge"
import BookmarkButton from "./BookmarkButton"
import TagChip from "./TagChip"
import type { OpportunityRow } from "@/lib/supabase/types"
import { sanitizeExternalUrl } from "@/lib/utils"

// ── Platform badge styling ────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { label: string; badgeCls: string; dotCls: string; initials: string }> = {
  unstop: {
    label: "Unstop",
    badgeCls: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    dotCls: "bg-amber-400",
    initials: "UN",
  },
  devfolio: {
    label: "Devfolio",
    badgeCls: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    dotCls: "bg-blue-400",
    initials: "DF",
  },
  hackerearth: {
    label: "HackerEarth",
    badgeCls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    dotCls: "bg-emerald-400",
    initials: "HE",
  },
  h2skill: {
    label: "H2Skill",
    badgeCls: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    dotCls: "bg-indigo-400",
    initials: "H2",
  },
  hack2skill: {
    label: "Hack2Skill",
    badgeCls: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    dotCls: "bg-indigo-400",
    initials: "H2",
  },
}

function getPlatformInfo(platform: string | null) {
  if (!platform) {
    return {
      label: "Platform",
      badgeCls: "bg-slate-800/80 text-slate-400 border-slate-700/60",
      dotCls: "bg-slate-500",
      initials: "OP",
    }
  }
  const key = platform.toLowerCase().replace(/\s+/g, "")
  return PLATFORM_CONFIG[key] ?? {
    label: platform,
    badgeCls: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    dotCls: "bg-slate-400",
    initials: platform.slice(0, 2).toUpperCase(),
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
  const platform = getPlatformInfo(op.source_platform)
  const rewardLabel = op.prize_pool || op.stipend
  const externalApplyUrl = sanitizeExternalUrl(op.source_url)
  const isHackathon = op.type === "hackathon"

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#12141c] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-[#151822] hover:shadow-xl hover:shadow-black/50">
      {/* ── Primary Clickable Surface ── */}
      <Link
        href={`/opportunities/${op.id}`}
        className="flex flex-1 flex-col"
        aria-label={`View details for ${op.title}`}
      >
        {/* Card Header / Visual Banner */}
        {op.banner_image_url ? (
          <div className="relative h-36 w-full overflow-hidden flex-shrink-0 bg-slate-900 border-b border-white/[0.06]">
            <Image
              src={op.banner_image_url}
              alt={op.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12141c] via-transparent to-transparent" />

            {/* Top badges over banner */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md ${platform.badgeCls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${platform.dotCls}`} />
                {platform.label}
              </span>

              {op.is_featured && (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-md">
                  Featured
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Sleek compact header when banner image is absent (no ugly blank box!) */
          <div className="relative border-b border-white/[0.06] bg-gradient-to-r from-slate-900/90 via-[#161924] to-[#12141c] p-3.5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-200 shadow-inner">
                {platform.initials}
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${platform.badgeCls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${platform.dotCls}`} />
                {platform.label}
              </span>
            </div>

            {op.is_featured && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                Featured
              </span>
            )}
          </div>
        )}

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-4">
          {/* Metadata Row: Type + Mode */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                isHackathon
                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25"
                  : "bg-sky-500/10 text-sky-300 border-sky-500/25"
              }`}
            >
              {op.type}
            </span>

            {op.mode && (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-slate-300 capitalize">
                {op.mode === "online" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                ) : null}
                {op.mode}
              </span>
            )}

            {rewardLabel && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 truncate max-w-[140px]" title={rewardLabel}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                {rewardLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-sm sm:text-[15px] font-semibold leading-snug text-slate-100 group-hover:text-indigo-300 transition-colors">
            {op.title}
          </h3>

          {/* Organizer */}
          {op.organizer && (
            <p className="mt-1.5 truncate text-xs text-slate-400">
              by <span className="text-slate-300 font-medium">{op.organizer}</span>
            </p>
          )}

          {/* Tags */}
          {showTags && op.tags && op.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {op.tags.slice(0, 3).map((tag) => (
                <TagChip key={tag} tag={tag} size="xs" />
              ))}
              {op.tags.length > 3 && (
                <span className="text-[10px] font-medium text-slate-500 self-center pl-0.5">
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

          <div className="flex items-center gap-1.5 flex-shrink-0 z-10">
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
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/15 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-95"
              title={`Apply directly on ${op.source_platform || "original platform"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <span>Apply</span>
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
