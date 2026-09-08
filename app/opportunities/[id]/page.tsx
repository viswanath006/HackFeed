/**
 * app/opportunities/[id]/page.tsx
 *
 * /opportunities/:id — Comprehensive opportunity detail page.
 * Full-width editorial layout grounded in Paper & Ink:
 * - Fraunces serif large headline for opportunity title
 * - Inter body text with max ~75 char line length (max-w-prose)
 * - Prominent serif numeral countdown block for deadline urgency
 * - Signal-orange "Apply on [Platform]" CTA with active-voice label (no arrow suffixes)
 * - Hairline metadata borders
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import TagChip from "@/components/TagChip"
import BookmarkButton from "@/components/BookmarkButton"
import AddToCalendarButton from "@/components/AddToCalendarButton"
import OpportunityCard from "@/components/OpportunityCard"
import OpportunityCover from "@/components/OpportunityCover"
import type { OpportunityRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"
import { sanitizeExternalUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"

// ── SEO Metadata ───────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  let data: Partial<OpportunityRow> | null = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: record } = await supabase
        .from("opportunities")
        .select("title, description, banner_image_url, organizer, type, source_platform")
        .eq("id", id)
        .single()

      data = record as Partial<OpportunityRow> | null
    } catch {
      // fallback
    }
  }

  if (!data) {
    data = MOCK_OPPORTUNITIES.find((op) => op.id === id) ?? null
  }

  if (!data || !data.title) return { title: "Listing not found — HackFeed" }

  return {
    title: `${data.title} — HackFeed Bulletin`,
    description:
      data.description?.slice(0, 155) ??
      `${data.type === "hackathon" ? "Hackathon" : "Internship"} aggregated from ${data.source_platform ?? "HackFeed"}`,
    openGraph: {
      title: data.title,
      description: data.description?.slice(0, 155) ?? "",
      images: data.banner_image_url ? [data.banner_image_url] : [],
      type: "article",
    },
  }
}

function platformAccent(platform: string | null): string {
  if (!platform) return "border-ink-muted text-ink-muted"
  const p = platform.toLowerCase()
  if (p.includes("unstop")) return "border-amber-700 text-amber-900"
  if (p.includes("devfolio")) return "border-blue-700 text-blue-900"
  if (p.includes("hackerearth")) return "border-emerald-700 text-emerald-900"
  if (p.includes("h2skill") || p.includes("hack2skill")) return "border-indigo-700 text-indigo-900"
  return "border-ink-muted text-ink-muted"
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user } = await getUser()
  const userId = user?.id ?? null

  let op: OpportunityRow | null = null
  let isBookmarked = false
  let relatedOpportunities: OpportunityRow[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      const { data: opData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single()

      if (opData) op = opData as OpportunityRow

      if (userId && op) {
        const { data: bm } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", userId)
          .eq("opportunity_id", op.id)
          .maybeSingle()
        if (bm) isBookmarked = true
      }

      if (op) {
        const { data: rel } = await supabase
          .from("opportunities")
          .select("*")
          .eq("is_active", true)
          .eq("type", op.type)
          .neq("id", op.id)
          .limit(4)
        if (rel && rel.length > 0) relatedOpportunities = rel as OpportunityRow[]
      }
    } catch (err) {
      console.warn("Detail page Supabase query notice:", err)
    }
  }

  if (!op) {
    op = MOCK_OPPORTUNITIES.find((item) => item.id === id) ?? null
  }

  if (!op) notFound()

  if (relatedOpportunities.length === 0) {
    relatedOpportunities = MOCK_OPPORTUNITIES.filter(
      (item) => item.type === op?.type && item.id !== op?.id
    ).slice(0, 4)
  }

  function formatDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Calculate deadline days
  let deadlineDiffDays: number | null = null
  let isUrgent = false
  let isPast = false
  if (op.application_deadline) {
    const deadlineMs = new Date(op.application_deadline).getTime()
    const nowMs = Date.now()
    deadlineDiffDays = Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24))
    if (deadlineDiffDays <= 0) isPast = true
    else if (deadlineDiffDays <= 2) isUrgent = true
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-24">
      {/* ── Editorial Top Navigation ───────────────────────── */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition"
          >
            <span>Back to Bulletin</span>
          </Link>
        </div>
      </div>

      {/* ── Main Article Layout ───────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Title, Metadata, Body (8 cols) */}
          <article className="lg:col-span-8">
            {/* Platform accent & classification tag */}
            <div className="flex items-center gap-4 text-xs">
              {op.source_platform && (
                <span className={`border-l-2 pl-2 font-medium uppercase tracking-wider ${platformAccent(op.source_platform)}`}>
                  {op.source_platform}
                </span>
              )}
              <span className="text-ink-muted capitalize">
                {op.type}
              </span>
              {op.mode && (
                <span className="text-ink-muted capitalize">
                  {op.mode}
                </span>
              )}
              {op.is_featured && (
                <span className="font-serif italic text-ink">
                  Featured
                </span>
              )}
            </div>

            {/* Opportunity Title: Large Fraunces Serif */}
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.15] tracking-tight text-ink">
              {op.title}
            </h1>

            {/* Organizer */}
            {op.organizer && (
              <p className="mt-3 text-sm text-ink-muted">
                Presented by <span className="text-ink font-medium">{op.organizer}</span>
              </p>
            )}

            {/* Opportunity Hero Cover — original cover image or programmatic editorial fallback */}
            <div className="mt-8">
              <OpportunityCover
                src={op.banner_image_url}
                alt={op.title}
                title={op.title}
                type={op.type}
                platform={op.source_platform}
                aspectRatio="16/7"
                variant="hero"
                priority
                className="w-full rounded-xs"
              />
            </div>

            {/* Hairline Divider */}
            <div className="my-8 border-b border-hairline" />

            {/* Description Body: Inter with ~75 char line length (max-w-prose) */}
            {op.description && (
              <div className="space-y-4">
                <h2 className="font-serif text-lg font-normal text-ink">
                  Overview
                </h2>
                <div className="max-w-prose text-sm sm:text-base text-ink/90 leading-relaxed whitespace-pre-wrap">
                  {op.description}
                </div>
              </div>
            )}

            {/* Eligibility Section */}
            {op.eligibility && (
              <div className="mt-8 space-y-2 border-t border-hairline pt-6">
                <h2 className="font-serif text-lg font-normal text-ink">
                  Eligibility
                </h2>
                <div className="max-w-prose text-sm sm:text-base text-ink/90 leading-relaxed">
                  {op.eligibility}
                </div>
              </div>
            )}

            {/* Tags / Skills */}
            {op.tags && op.tags.length > 0 && (
              <div className="mt-8 border-t border-hairline pt-6">
                <h2 className="font-serif text-xs uppercase tracking-widest text-ink-muted mb-3">
                  Categorized Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {op.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Right Column: Prominent Deadline Numeral Block & Outbound Action (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Prominent Serif Numeral Countdown Block */}
            <div className="border border-hairline bg-paper p-6">
              <p className="text-xs font-serif italic text-ink-muted">Application Window</p>
              
              {isPast ? (
                <div className="mt-3">
                  <span className="font-serif text-3xl font-normal text-ink-muted">Closed</span>
                  <p className="mt-2 text-xs text-ink-muted">
                    This window ended on {formatDate(op.application_deadline)}.
                  </p>
                </div>
              ) : deadlineDiffDays !== null ? (
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-serif text-5xl sm:text-6xl font-semibold tracking-tight ${isUrgent ? "text-signal" : "text-ink"}`}>
                      {deadlineDiffDays}
                    </span>
                    <span className="text-xs text-ink-muted uppercase tracking-wider">
                      {deadlineDiffDays === 1 ? "day left" : "days left"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">
                    Closes on {formatDate(op.application_deadline)}
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <span className="font-serif text-2xl font-normal text-ink">Rolling / Ongoing</span>
                  <p className="mt-2 text-xs text-ink-muted">
                    Applications accepted continuously until filled.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Action Card: Signal Orange Outbound Button */}
            <div className="border border-hairline bg-paper p-6 space-y-4">
              <a
                href={sanitizeExternalUrl(op.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                id="apply-now-btn"
                className="flex w-full items-center justify-center border border-signal bg-signal px-5 py-3.5 text-xs font-medium text-white transition hover:bg-signal/90 active:scale-95 text-center"
              >
                Apply on {op.source_platform || "Platform"}
              </a>

              {/* Bookmark & Calendar Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <BookmarkButton
                  opportunityId={op.id}
                  userId={userId}
                  initialBookmarked={isBookmarked}
                  variant="full"
                />
                <AddToCalendarButton opportunity={op} variant="secondary" />
              </div>

              {/* Verification attribution */}
              <p className="text-[11px] text-ink-muted text-center pt-2 border-t border-hairline">
                Verified listing from {op.source_platform || "original source"}.
              </p>
            </div>

            {/* Key Metadata Table */}
            <div className="border border-hairline bg-paper p-6 space-y-3">
              <h3 className="font-serif text-xs uppercase tracking-widest text-ink-muted pb-2 border-b border-hairline">
                Listing Details
              </h3>
              <dl className="space-y-2.5 text-xs">
                {op.location && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Location</dt>
                    <dd className="font-medium text-ink text-right">{op.location}</dd>
                  </div>
                )}
                {op.team_size && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Team</dt>
                    <dd className="font-medium text-ink text-right">{op.team_size}</dd>
                  </div>
                )}
                {op.prize_pool && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Prize Pool</dt>
                    <dd className="font-medium text-ink text-right">{op.prize_pool}</dd>
                  </div>
                )}
                {op.stipend && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Stipend</dt>
                    <dd className="font-medium text-forest text-right">{op.stipend}</dd>
                  </div>
                )}
                {op.start_date && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Starts</dt>
                    <dd className="font-medium text-ink text-right">{formatDate(op.start_date)}</dd>
                  </div>
                )}
                {op.end_date && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Ends</dt>
                    <dd className="font-medium text-ink text-right">{formatDate(op.end_date)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>

        {/* ── Related Bulletin Listings ───────────────────────── */}
        {relatedOpportunities.length > 0 && (
          <section className="mt-20 border-t border-hairline pt-10">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-xs font-serif italic text-ink-muted">Similar listings</p>
                <h2 className="font-serif text-2xl font-normal tracking-tight text-ink mt-1">
                  More {op.type === "hackathon" ? "Hackathons" : "Internships"}
                </h2>
              </div>
              <Link
                href={op.type === "hackathon" ? "/opportunities?type=hackathon" : "/opportunities?type=internship"}
                className="text-xs font-medium text-ink-muted hover:text-ink hover:underline decoration-ink/40 underline-offset-4 transition"
              >
                View all
              </Link>
            </div>

            <div className="border-t border-hairline divide-y divide-hairline">
              {relatedOpportunities.map((related) => (
                <OpportunityCard
                  key={related.id}
                  opportunity={related}
                  userId={userId}
                  showTags
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
