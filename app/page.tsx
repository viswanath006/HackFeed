/**
 * app/page.tsx — HackFeed Homepage
 *
 * Server Component:
 *  - Hero explaining "All hackathons & internships. One feed."
 *  - Live stats row (hackathons, internships, platforms)
 *  - Platform badges strip (Unstop, Devfolio, HackerEarth, H2Skill)
 *  - Personalized "Recommended for You" section / Preference CTA
 *  - Featured strip (horizontal scroll of is_featured cards)
 *  - Recent feed grid (mixed hackathons + internships, soonest-deadline/recent first)
 *  - "Explore all opportunities" CTA
 */

import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import OpportunityCard from "@/components/OpportunityCard"
import RecommendedSection from "@/components/RecommendedSection"
import type { OpportunityRow, UserPreferencesRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "HackFeed — All hackathons & internships. One feed.",
  description: "Discover curated hackathons and internships aggregated from Unstop, Devfolio, HackerEarth, and H2Skill in real time.",
}

// ── Stat Pill ──────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xl font-bold text-white tracking-tight">{value}</span>
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Section Heading ────────────────────────────────────────────────────────

function SectionHeading({
  title,
  href,
  linkLabel = "View all →",
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-display text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { user } = await getUser()
  const userId = user?.id ?? null

  let hackathonCount = 0
  let internshipCount = 0
  let platformCount = 4
  let featuredRows: OpportunityRow[] = []
  let recentRows: OpportunityRow[] = []
  let recommendedRows: OpportunityRow[] = []
  let bookmarkRows: { opportunity_id: string }[] = []
  let preferences: UserPreferencesRow | null = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      const nowIso = new Date().toISOString()

      const [
        hCountRes,
        iCountRes,
        featRes,
        recRes,
        bmRes,
        prefRes,
      ] = await Promise.allSettled([
        supabase
          .from("opportunities")
          .select("id", { count: "exact", head: true })
          .eq("type", "hackathon")
          .eq("is_active", true),
        supabase
          .from("opportunities")
          .select("id", { count: "exact", head: true })
          .eq("type", "internship")
          .eq("is_active", true),
        supabase
          .from("opportunities")
          .select("*")
          .eq("is_active", true)
          .eq("is_featured", true)
          .or(`application_deadline.gte.${nowIso},application_deadline.is.null`)
          .order("application_deadline", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("opportunities")
          .select("*")
          .eq("is_active", true)
          .or(`application_deadline.gte.${nowIso},application_deadline.is.null`)
          .order("application_deadline", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(12),
        userId
          ? supabase.from("bookmarks").select("opportunity_id").eq("user_id", userId)
          : Promise.resolve({ data: [] }),
        userId
          ? (supabase as any).from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ])

      if (hCountRes.status === "fulfilled" && hCountRes.value.count !== null && hCountRes.value.count > 0) {
        hackathonCount = hCountRes.value.count
      }
      if (iCountRes.status === "fulfilled" && iCountRes.value.count !== null && iCountRes.value.count > 0) {
        internshipCount = iCountRes.value.count
      }
      if (featRes.status === "fulfilled" && featRes.value.data && featRes.value.data.length > 0) {
        featuredRows = featRes.value.data as OpportunityRow[]
      }
      if (recRes.status === "fulfilled" && recRes.value.data && recRes.value.data.length > 0) {
        recentRows = recRes.value.data as OpportunityRow[]
      }
      if (bmRes.status === "fulfilled" && bmRes.value.data) {
        bookmarkRows = bmRes.value.data as { opportunity_id: string }[]
      }
      if (prefRes.status === "fulfilled" && prefRes.value && (prefRes.value as any).data) {
        preferences = (prefRes.value as any).data as UserPreferencesRow
      }
    } catch (err) {
      console.warn("HomePage Supabase notice:", err)
    }
  }

  // Fallback to rich seed dataset if database is unpopulated or disconnected
  if (featuredRows.length === 0) {
    featuredRows = MOCK_OPPORTUNITIES.filter((op) => op.is_featured)
  }
  if (recentRows.length === 0) {
    recentRows = MOCK_OPPORTUNITIES
  }
  if (hackathonCount === 0) {
    hackathonCount = MOCK_OPPORTUNITIES.filter((op) => op.type === "hackathon").length
  }
  if (internshipCount === 0) {
    internshipCount = MOCK_OPPORTUNITIES.filter((op) => op.type === "internship").length
  }

  // Calculate personalized recommendations
  if (preferences && (preferences.preferred_tags?.length || preferences.preferred_type !== "both")) {
    const pTags = preferences.preferred_tags ?? []
    const pType = preferences.preferred_type

    const pool = recentRows.length > 0 ? recentRows : MOCK_OPPORTUNITIES
    recommendedRows = pool.filter((op) => {
      // Type match
      if (pType !== "both" && op.type !== pType) return false
      // Tag match
      if (pTags.length > 0) {
        const opTags = op.tags ?? []
        return pTags.some((pt) => opTags.some((ot) => ot.toLowerCase().includes(pt.toLowerCase())))
      }
      return true
    }).slice(0, 8)
  }

  const bookmarkedIds = new Set(bookmarkRows.map((b) => b.opportunity_id))

  return (
    <div className="min-h-screen">
      {/* ─────────────────── HERO ──────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-grid-pattern">
        {/* Subtle radial ambient highlight */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[380px] w-[700px] rounded-full bg-indigo-600/[0.08] blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090a0f]/80 to-[#090a0f]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span>Real-time Opportunity Intelligence</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl">
            Engineering challenges &amp; tech roles.
            <br />
            <span className="gradient-brand">
              Curated in one verified feed.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400">
            Never miss an application window. Discover verified prize hackathons, open source sprints, and high-growth internships aggregated continuously from{" "}
            <span className="font-medium text-slate-200">Unstop</span>,{" "}
            <span className="font-medium text-slate-200">Devfolio</span>,{" "}
            <span className="font-medium text-slate-200">HackerEarth</span>, and{" "}
            <span className="font-medium text-slate-200">H2Skill</span>.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/opportunities"
              id="hero-browse-btn"
              className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
            >
              <span>Explore Opportunities</span>
              <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </Link>
            <Link
              href="/opportunities?type=hackathon"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/[0.08] hover:border-white/20"
            >
              Hackathons Only
            </Link>
          </div>

          {/* Platform Pills Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1.5">Sources:</span>
            <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              Unstop
            </span>
            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              Devfolio
            </span>
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              HackerEarth
            </span>
            <span className="rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
              H2Skill
            </span>
          </div>

          {/* Stats Bar */}
          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-8 rounded-xl border border-white/[0.08] bg-[#12141c]/90 px-7 py-3.5 backdrop-blur-xl shadow-lg">
            <StatPill value={hackathonCount} label="hackathons" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <StatPill value={internshipCount} label="internships" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <StatPill value={platformCount} label="platforms" />
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── PERSONALIZED RECOMMENDATIONS ───── */}
      <RecommendedSection
        userId={userId}
        preferences={preferences}
        recommendedOpportunities={recommendedRows}
        bookmarkedIds={bookmarkedIds}
      />

      {/* ─────────────── FEATURED STRIP ────────────────── */}
      {featuredRows.length > 0 && (
        <section className="py-8 border-t border-white/[0.06]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Featured Opportunities" href="/opportunities?featured=true" />
            <div className="hide-scrollbar flex gap-5 overflow-x-auto pb-4 -mx-4 px-4">
              {featuredRows.map((op) => (
                <div key={op.id} className="w-72 flex-shrink-0 sm:w-80">
                  <OpportunityCard
                    opportunity={op}
                    userId={userId}
                    isBookmarked={bookmarkedIds.has(op.id)}
                    showTags
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────── RECENT FEED ───────────────────── */}
      <section className="py-12 pb-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Upcoming &amp; Active Feed"
            href="/opportunities"
            linkLabel="View complete feed →"
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentRows.map((op) => (
              <OpportunityCard
                key={op.id}
                opportunity={op}
                userId={userId}
                isBookmarked={bookmarkedIds.has(op.id)}
                showTags
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] active:scale-95"
            >
              Explore all hackathons &amp; internships →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
