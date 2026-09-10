/**
 * app/page.tsx — HackFeed Homepage
 *
 * Editorial live bulletin board for student builders.
 * Grounded in Paper & Ink design:
 * - Fraunces serif headlines & typography
 * - Left-aligned hero with running text platform sources
 * - Live dispatch ticker as the single deliberate visual motif
 * - Bulletin listings with hairline dividers (no generic shadow cards)
 * - Zero arrow suffixes, zero all-caps eyebrow badges
 */

import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import OpportunityCard from "@/components/OpportunityCard"
import CourseCard from "@/components/CourseCard"
import RecommendedSection from "@/components/RecommendedSection"
import HeroVideoBackground from "@/components/HeroVideoBackground"
import type { OpportunityRow, UserPreferencesRow, CourseRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "HackFeed — The live bulletin board for student builders.",
  description: "Engineering challenges, prize hackathons, and high-growth internships aggregated continuously from Unstop, Devfolio, HackerEarth, and H2Skill.",
}

export default async function HomePage() {
  const { user } = await getUser()
  const userId = user?.id ?? null

  let hackathonCount = 0
  let internshipCount = 0
  let featuredRows: OpportunityRow[] = []
  let recentRows: OpportunityRow[] = []
  let recommendedRows: OpportunityRow[] = []
  let bookmarkRows: { opportunity_id: string }[] = []
  let preferences: UserPreferencesRow | null = null
  let featuredCourses: CourseRow[] = []

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
        coursesRes,
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
          .limit(6),
        supabase
          .from("opportunities")
          .select("*")
          .eq("is_active", true)
          .or(`application_deadline.gte.${nowIso},application_deadline.is.null`)
          .order("application_deadline", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(10),
        userId
          ? supabase.from("bookmarks").select("opportunity_id").eq("user_id", userId)
          : Promise.resolve({ data: [] }),
        userId
          ? (supabase as any).from("user_preferences").select("*").eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("courses")
          .select("*")
          .eq("is_active", true)
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6),
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
      if (coursesRes.status === "fulfilled" && coursesRes.value.data && coursesRes.value.data.length > 0) {
        featuredCourses = coursesRes.value.data as CourseRow[]
      }
    } catch (err) {
      console.warn("HomePage Supabase notice:", err)
    }
  }

  // Fallback to seed dataset if database is unpopulated
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

  // Personalized recommendations
  if (preferences && (preferences.preferred_tags?.length || preferences.preferred_type !== "both")) {
    const pTags = preferences.preferred_tags ?? []
    const pType = preferences.preferred_type

    const pool = recentRows.length > 0 ? recentRows : MOCK_OPPORTUNITIES
    recommendedRows = pool.filter((op) => {
      if (pType !== "both" && op.type !== pType) return false
      if (pTags.length > 0) {
        const opTags = op.tags ?? []
        return pTags.some((pt) => opTags.some((ot) => ot.toLowerCase().includes(pt.toLowerCase())))
      }
      return true
    }).slice(0, 6)
  }

  const bookmarkedIds = new Set(bookmarkRows.map((b) => b.opportunity_id))
  const latestItem = recentRows[0] ?? null

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ─────────────────── HERO ──────────────────────── */}
      <section className="relative border-b border-hairline py-16 md:py-24 animate-editorial-fade overflow-hidden">
        {/* Living technical background video */}
        <HeroVideoBackground />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Left-aligned Fraunces headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight text-ink">
              The live bulletin board for student builders.
            </h1>

            {/* Supporting line */}
            <p className="mt-5 text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl">
              Engineering challenges, prize hackathons, and high-growth tech internships. One calm, verified feed without the noise.
            </p>

            {/* Platform sources as plain running text */}
            <p className="mt-4 text-xs sm:text-sm text-ink-muted/80">
              Aggregating continuously from <span className="text-ink font-medium">Unstop</span>, <span className="text-ink font-medium">Devfolio</span>, <span className="text-ink font-medium">HackerEarth</span>, and <span className="text-ink font-medium">H2Skill</span>.
            </p>

            {/* Plain active-voice CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/opportunities"
                id="hero-browse-btn"
                className="border border-ink bg-ink px-5 py-2.5 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
              >
                Explore All Listings
              </Link>
              <Link
                href="/opportunities?type=hackathon"
                className="border border-hairline bg-paper px-4 py-2.5 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
              >
                Hackathons ({hackathonCount})
              </Link>
              <Link
                href="/opportunities?type=internship"
                className="border border-hairline bg-paper px-4 py-2.5 text-xs font-medium text-forest transition hover:border-forest hover:bg-paper-muted"
              >
                Internships ({internshipCount})
              </Link>
            </div>
          </div>
        </div>

        {/* Live Dispatch Ticker — Deliberate single hero visual moment */}
        {latestItem && (
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
            <div className="border border-hairline bg-paper-muted/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-forest flex-shrink-0" />
                <span className="font-serif italic text-ink-muted flex-shrink-0">Latest dispatch</span>
                <span className="text-hairline hidden sm:inline">|</span>
                <span className="font-medium text-ink truncate">{latestItem.title}</span>
                {latestItem.source_platform && (
                  <span className="text-ink-muted/80 hidden md:inline text-[11px]">
                    via {latestItem.source_platform}
                  </span>
                )}
              </div>
              <Link
                href={`/opportunities/${latestItem.id}`}
                className="font-medium text-ink hover:underline decoration-ink/40 underline-offset-4 flex-shrink-0"
              >
                View dispatch
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────── PERSONALIZED RECOMMENDATIONS ───── */}
      <RecommendedSection
        userId={userId}
        preferences={preferences}
        recommendedOpportunities={recommendedRows}
        bookmarkedIds={bookmarkedIds}
      />

      {/* ─────────────── FEATURED LISTINGS ─────────────── */}
      {featuredRows.length > 0 && (
        <section className="py-12 border-t border-hairline">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-xs font-serif italic text-ink-muted">Highlighted opportunities</p>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink mt-1">
                  Featured Listings
                </h2>
              </div>
              <Link
                href="/opportunities?featured=true"
                className="text-xs font-medium text-ink-muted hover:text-ink hover:underline decoration-ink/40 underline-offset-4 transition"
              >
                View all featured
              </Link>
            </div>

            <div className="border-t border-hairline divide-y divide-hairline">
              {featuredRows.slice(0, 5).map((op) => (
                <OpportunityCard
                  key={op.id}
                  opportunity={op}
                  userId={userId}
                  isBookmarked={bookmarkedIds.has(op.id)}
                  showTags
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────── LEVEL UP YOUR SKILLS ────────── */}
      {featuredCourses.length > 0 && (
        <section className="py-12 border-t border-hairline">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-xs font-serif italic text-ink-muted">Curated skill tracks</p>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink mt-1">
                  Level Up Your Skills
                </h2>
              </div>
              <Link
                href="/courses"
                className="text-xs font-medium text-ink-muted hover:text-ink hover:underline decoration-ink/40 underline-offset-4 transition"
              >
                Browse all courses
              </Link>
            </div>

            <div className="border-t border-hairline divide-y divide-hairline">
              {featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  userId={userId}
                  showTags
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────── CURRENT BULLETIN FEED ─────────── */}
      <section className="py-12 pb-24 border-t border-hairline">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-xs font-serif italic text-ink-muted">Continuous aggregation</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink mt-1">
                Current Bulletin
              </h2>
            </div>
            <Link
              href="/opportunities"
              className="text-xs font-medium text-ink-muted hover:text-ink hover:underline decoration-ink/40 underline-offset-4 transition"
            >
              Browse complete feed
            </Link>
          </div>

          <div className="border-t border-hairline divide-y divide-hairline">
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

          <div className="mt-10 text-center">
            <Link
              href="/opportunities"
              className="inline-block border border-hairline bg-paper px-6 py-3 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
            >
              View all active listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
