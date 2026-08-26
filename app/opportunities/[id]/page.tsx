/**
 * app/opportunities/[id]/page.tsx
 *
 * /opportunities/:id — Comprehensive opportunity detail page.
 * - Clean developer aesthetic with SVG iconography & zero emojis
 * - Deep opportunity metadata overview
 * - Direct outbound "Apply Now" link (target="_blank")
 * - Bookmark button & Calendar Export
 * - Related opportunities section
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import DeadlineBadge from "@/components/DeadlineBadge"
import TagChip from "@/components/TagChip"
import BookmarkButton from "@/components/BookmarkButton"
import AddToCalendarButton from "@/components/AddToCalendarButton"
import OpportunityCard from "@/components/OpportunityCard"
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
      // ignore
    }
  }

  if (!data) {
    data = MOCK_OPPORTUNITIES.find((op) => op.id === id) ?? null
  }

  if (!data || !data.title) return { title: "Opportunity not found — HackFeed" }

  return {
    title: `${data.title} — HackFeed`,
    description:
      data.description?.slice(0, 155) ??
      `${data.type === "hackathon" ? "Hackathon" : "Internship"} hosted on ${data.source_platform ?? "HackFeed"}`,
    openGraph: {
      title: data.title,
      description: data.description?.slice(0, 155) ?? "",
      images: data.banner_image_url ? [data.banner_image_url] : [],
      type: "article",
    },
  }
}

// ── Platform Brand Colors ──────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  unstop:       "bg-orange-500/10 text-orange-300 border-orange-500/25",
  devfolio:     "bg-blue-500/10   text-blue-300   border-blue-500/25",
  hackerearth:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  h2skill:      "bg-purple-500/10 text-purple-300 border-purple-500/25",
  hack2skill:   "bg-purple-500/10 text-purple-300 border-purple-500/25",
}

function platformCls(platform: string | null): string {
  if (!platform) return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
  return PLATFORM_COLORS[platform.toLowerCase()] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
}

// ── Type & Mode Badges ─────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  hackathon:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  internship: "bg-sky-500/15    text-sky-300    border-sky-500/30",
}
const MODE_BADGE: Record<string, string> = {
  online:  "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  offline: "bg-orange-500/10  text-orange-300  border-orange-500/25",
  hybrid:  "bg-amber-500/10   text-amber-300   border-amber-500/25",
}
const TYPE_GRADIENT: Record<string, string> = {
  hackathon:  "from-violet-950 via-purple-950/40 to-slate-950",
  internship: "from-sky-950 via-blue-950/40 to-slate-950",
}

// ── Metadata Item Row with SVG Icon ────────────────────────────────────────

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 border border-white/[0.08]" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-0.5 font-mono text-xs font-semibold text-zinc-200 break-words">{value}</p>
      </div>
    </div>
  )
}

// ── Page Component ─────────────────────────────────────────────────────────

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
          .limit(3)
        if (rel && rel.length > 0) relatedOpportunities = rel as OpportunityRow[]
      }
    } catch (err) {
      console.warn("Detail page Supabase query notice:", err)
    }
  }

  // Fallback to seed dataset
  if (!op) {
    op = MOCK_OPPORTUNITIES.find((item) => item.id === id) ?? null
  }

  if (!op) notFound()

  if (relatedOpportunities.length === 0) {
    relatedOpportunities = MOCK_OPPORTUNITIES.filter(
      (item) => item.type === op?.type && item.id !== op?.id
    ).slice(0, 3)
  }

  function formatDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ── Banner Image / Header ───────────────────────── */}
      <div className="relative h-60 w-full overflow-hidden sm:h-72 md:h-80">
        {op.banner_image_url ? (
          <Image
            src={op.banner_image_url}
            alt={op.title}
            fill
            unoptimized
            className="object-cover"
            priority
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${TYPE_GRADIENT[op.type] ?? TYPE_GRADIENT.hackathon} flex items-center justify-center`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-white/30">
              {op.type === "hackathon" ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              )}
            </div>
          </div>
        )}
        {/* Dark gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-[#07070c]/50 to-transparent" />

        {/* Back Link Button */}
        <div className="absolute left-4 top-4 sm:left-8 sm:top-6">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-black/80 hover:text-white border border-white/10"
          >
            ← Back to Feed
          </Link>
        </div>
      </div>

      {/* ── Main Content Container ──────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 mb-8 sm:-mt-16 relative z-10">
          {/* Platform & Type Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold capitalize shadow-sm ${TYPE_BADGE[op.type] ?? ""}`}>
              {op.type}
            </span>
            {op.mode && (
              <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize shadow-sm ${MODE_BADGE[op.mode] ?? ""}`}>
                {op.mode}
              </span>
            )}
            {op.source_platform && (
              <span className={`rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider shadow-sm ${platformCls(op.source_platform)}`}>
                {op.source_platform}
              </span>
            )}
            {op.is_featured && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                Featured
              </span>
            )}
          </div>

          {/* Opportunity Title */}
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
            {op.title}
          </h1>

          {/* Organizer */}
          {op.organizer && (
            <p className="mt-2 text-sm text-zinc-400 font-medium">
              Organized by <span className="text-zinc-200 font-semibold">{op.organizer}</span>
            </p>
          )}
        </div>

        {/* ── Two Column Grid ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Main Content Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deadline Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#0d0d16] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/10 text-zinc-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Application Deadline</p>
                  <p className="text-xs font-semibold text-zinc-200">
                    {op.application_deadline ? formatDate(op.application_deadline) : "Open / Ongoing"}
                  </p>
                </div>
              </div>
              <DeadlineBadge deadline={op.application_deadline} />
            </div>

            {/* Description Section */}
            {op.description && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d16] p-6 sm:p-7">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Overview &amp; Details
                </h2>
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {op.description}
                </div>
              </div>
            )}

            {/* Eligibility Section */}
            {op.eligibility && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d16] p-6 sm:p-7">
                <h2 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  Eligibility
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed">{op.eligibility}</p>
              </div>
            )}

            {/* Tags Section */}
            {op.tags && op.tags.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d16] p-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Skills &amp; Themes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {op.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Column (1 col) */}
          <div className="space-y-5">
            {/* Primary Outbound Action Card */}
            <div className="rounded-2xl border border-violet-500/30 bg-[#0d0d16] p-5 shadow-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Application Gateway</h3>
              
              {/* Outbound link */}
              <a
                href={sanitizeExternalUrl(op.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                id="apply-now-btn"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-violet-500 active:scale-95"
              >
                Apply on {op.source_platform || "Platform"}
                <svg
                  width="13" height="13" viewBox="0 0 14 14" fill="none"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                >
                  <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              {/* Bookmark & Calendar interaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <BookmarkButton
                  opportunityId={op.id}
                  userId={userId}
                  initialBookmarked={isBookmarked}
                  variant="full"
                />
                <AddToCalendarButton opportunity={op} variant="secondary" />
              </div>

              {/* Attribution line */}
              <div className="border-t border-white/[0.06] pt-3.5 text-center">
                <p className="text-xs text-zinc-500">
                  Originally posted on{" "}
                  <a
                    href={sanitizeExternalUrl(op.source_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-violet-400 hover:text-violet-300 underline underline-offset-2"
                  >
                    {op.source_platform || "Original Platform"}
                  </a>
                </p>
                <p className="mt-1 text-[10px] text-zinc-600">
                  Direct platform redirect for registration.
                </p>
              </div>
            </div>

            {/* Quick Metadata Info Card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d16] p-5 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Opportunity Metadata</h3>
              <div className="space-y-3">
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                  label="Location"
                  value={op.location}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  label="Team Size"
                  value={op.team_size}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7.5a1.5 1.5 0 0 1-1.5-1.5V14.66a8 8 0 0 1-2-5.66V4h16v5a8 8 0 0 1-2 5.66V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-.55 0-1-.45-1-1v-2.34"/></svg>}
                  label="Prize Pool"
                  value={op.prize_pool}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  label="Stipend"
                  value={op.stipend}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                  label="Starts On"
                  value={formatDate(op.start_date)}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
                  label="Ends On"
                  value={formatDate(op.end_date)}
                />
                <MetaRow
                  icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  label="Apply By"
                  value={formatDate(op.application_deadline)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Opportunities ────────────────────────── */}
        {relatedOpportunities.length > 0 && (
          <div className="mt-16 border-t border-white/[0.07] pt-10">
            <h2 className="font-display text-xl font-bold tracking-tight text-white mb-6">
              More {op.type === "hackathon" ? "Hackathons" : "Internships"} You Might Like
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedOpportunities.map((related) => (
                <OpportunityCard
                  key={related.id}
                  opportunity={related}
                  userId={userId}
                  showTags
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
