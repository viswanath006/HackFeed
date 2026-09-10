"use client"

/**
 * components/CourseCard.tsx
 *
 * Editorial bulletin-row listing card for a course.
 * Matches OpportunityCard aesthetic — hairline dividers, serif title,
 * left accent line by provider, price_type badge (free=green, paid=neutral, free+cert=amber).
 */

import Link from "next/link"
import TagChip from "./TagChip"
import CourseBookmarkButton from "./CourseBookmarkButton"
import type { CourseRow, CoursePriceType } from "@/lib/supabase/types"
import { sanitizeExternalUrl } from "@/lib/utils"

// ── Provider accent colors ──────────────────────────────────────────────────

const PROVIDER_ACCENTS: Record<string, { accentBorder: string }> = {
  coursera:        { accentBorder: "border-l-2 border-blue-600" },
  udemy:           { accentBorder: "border-l-2 border-purple-600" },
  freecodecamp:    { accentBorder: "border-l-2 border-orange-500" },
  "freeCodeCamp":  { accentBorder: "border-l-2 border-orange-500" },
  nptel:           { accentBorder: "border-l-2 border-red-600" },
  google:          { accentBorder: "border-l-2 border-green-600" },
  "aws skill builder": { accentBorder: "border-l-2 border-amber-500" },
  aws:             { accentBorder: "border-l-2 border-amber-500" },
  linkedin:        { accentBorder: "border-l-2 border-blue-700" },
  edx:             { accentBorder: "border-l-2 border-red-700" },
  mit:             { accentBorder: "border-l-2 border-ink" },
}

function getProviderAccent(provider: string) {
  const key = provider.toLowerCase().replace(/\s+/g, "")
  const full = provider.toLowerCase()
  return PROVIDER_ACCENTS[key] ?? PROVIDER_ACCENTS[full] ?? { accentBorder: "border-l-2 border-hairline-dark" }
}

// ── Price type badge ────────────────────────────────────────────────────────

function PriceTypeBadge({ priceType, price }: { priceType: CoursePriceType; price?: string | null }) {
  if (priceType === "free") {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-forest">
        Free
      </span>
    )
  }
  if (priceType === "free_with_paid_certificate") {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-500">
        Free • Paid cert{price ? ` (${price})` : ""}
      </span>
    )
  }
  // paid
  return (
    <span className="inline-flex items-center gap-1 font-medium text-ink">
      {price ?? "Paid"}
    </span>
  )
}

// ── Level badge ─────────────────────────────────────────────────────────────

function LevelLabel({ level }: { level: string | null }) {
  if (!level) return null
  const colors: Record<string, string> = {
    beginner: "text-forest",
    intermediate: "text-amber-700 dark:text-amber-500",
    advanced: "text-signal",
  }
  return (
    <span className={`capitalize ${colors[level] ?? "text-ink-muted"}`}>
      {level}
    </span>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

interface CourseCardProps {
  course: CourseRow
  userId?: string | null
  isBookmarked?: boolean
  showTags?: boolean
  onBookmarkToggle?: (isBookmarked: boolean) => void
  /** compact = no bookmark button, used for cross-link "Prep for this" sections */
  compact?: boolean
}

export default function CourseCard({
  course,
  userId = null,
  isBookmarked = false,
  showTags = false,
  onBookmarkToggle,
  compact = false,
}: CourseCardProps) {
  const providerMeta = getProviderAccent(course.provider)
  const externalUrl = sanitizeExternalUrl(course.course_url)

  return (
    <article className="group relative border-b border-hairline py-4 transition-colors duration-150 hover:bg-paper-muted/40 px-3 sm:px-4 -mx-3 sm:-mx-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5 justify-between">

        {/* Left: Provider accent + content */}
        <div className="flex-1 min-w-0">
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted mb-1.5">
            <span className={`pl-2 font-medium text-ink ${providerMeta.accentBorder}`}>
              {course.provider}
            </span>

            <span className="text-hairline-dark">/</span>

            <span className="font-medium text-ink-muted">{course.domain}</span>

            {course.level && (
              <>
                <span className="text-hairline-dark">/</span>
                <LevelLabel level={course.level} />
              </>
            )}

            {course.duration && (
              <>
                <span className="text-hairline-dark">/</span>
                <span>{course.duration}</span>
              </>
            )}

            {course.is_featured && (
              <span className="border-b border-signal text-[11px] font-semibold text-signal">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-ink font-serif leading-snug">
            <Link
              href={`/courses/${course.id}`}
              className="hover:underline hover:text-ink focus:underline outline-none"
            >
              {course.title}
            </Link>
          </h3>

          {/* Rating */}
          {course.rating && (
            <p className="mt-1 text-xs text-ink-muted">
              <span className="text-amber-500">★</span>{" "}
              <span className="font-medium text-ink">{course.rating.toFixed(1)}</span>
              <span className="text-ink-muted/60"> rating</span>
            </p>
          )}

          {/* Tags */}
          {showTags && course.tags && course.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {course.tags.slice(0, 4).map((tag) => (
                <TagChip key={tag} tag={tag} size="xs" />
              ))}
            </div>
          )}
        </div>

        {/* Right: Price badge + actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2.5 flex-shrink-0 pt-2 sm:pt-1 border-t border-hairline/60 sm:border-0">
          {/* Price Type badge */}
          <div className="text-xs">
            <PriceTypeBadge priceType={course.price_type} price={course.price} />
          </div>

          {/* Actions */}
          {!compact && (
            <div className="flex items-center gap-2">
              <CourseBookmarkButton
                courseId={course.id}
                userId={userId}
                initialBookmarked={isBookmarked}
                variant="icon"
                onToggle={onBookmarkToggle}
              />
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-ink bg-ink text-paper px-3 py-1.5 text-xs font-medium transition-colors hover:bg-ink-muted hover:border-ink-muted focus-visible:outline-none"
                title={`View course on ${course.provider}`}
                onClick={(e) => e.stopPropagation()}
              >
                View Course
              </a>
            </div>
          )}

          {compact && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-hairline bg-paper text-ink px-3 py-1.5 text-xs font-medium transition-colors hover:border-ink focus-visible:outline-none"
            >
              View
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
