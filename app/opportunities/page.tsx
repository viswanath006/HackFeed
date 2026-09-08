/**
 * app/opportunities/page.tsx
 *
 * /opportunities — full browsable feed.
 * Server Component: fetches initial data + platform options + tags,
 * parses searchParams for shareable URLs, and passes data to FeedClient.
 */

import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import FeedClient from "./FeedClient"
import type { OpportunityRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Browse Opportunities — HackFeed",
  description: "Browse curated hackathons and internships aggregated from Unstop, Devfolio, HackerEarth, and H2Skill.",
}

const PAGE_SIZE = 18

interface OpportunitiesPageProps {
  searchParams: Promise<{
    type?: string
    mode?: string
    platform?: string
    tag?: string
    q?: string
    sort?: string
  }>
}

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const params = await searchParams
  const { user } = await getUser()
  const userId = user?.id ?? null

  let initialRows: OpportunityRow[] = []
  let platforms: string[] = []
  let allTags: string[] = []
  let bookmarkedIds: string[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("is_active", true)

      if (params.type) {
        query = query.eq("type", params.type)
      }
      if (params.platform) {
        query = query.ilike("source_platform", `%${params.platform}%`)
      }
      if (params.mode) {
        query = query.eq("mode", params.mode)
      }
      if (params.tag) {
        query = query.contains("tags", [params.tag])
      }
      if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,organizer.ilike.%${params.q}%`)
      }

      const nowIso = new Date().toISOString()
      if (params.sort === "newest") {
        query = query.order("created_at", { ascending: false })
      } else if (params.sort === "prize") {
        query = query.order("prize_pool", { ascending: false, nullsFirst: false })
      } else {
        // Soonest upcoming deadline first; exclude expired past dates
        query = query
          .or(`application_deadline.gte.${nowIso},application_deadline.is.null`)
          .order("application_deadline", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
      }

      const [
        initRes,
        platRes,
        tagRes,
        bmRes,
      ] = await Promise.allSettled([
        query.limit(PAGE_SIZE),
        supabase
          .from("opportunities")
          .select("source_platform")
          .eq("is_active", true)
          .not("source_platform", "is", null),
        supabase
          .from("opportunities")
          .select("tags")
          .eq("is_active", true)
          .not("tags", "is", null),
        userId
          ? supabase.from("bookmarks").select("opportunity_id").eq("user_id", userId)
          : Promise.resolve({ data: [] }),
      ])

      if (initRes.status === "fulfilled" && initRes.value.data && initRes.value.data.length > 0) {
        initialRows = initRes.value.data as OpportunityRow[]
      }
      if (platRes.status === "fulfilled" && platRes.value.data && platRes.value.data.length > 0) {
        platforms = Array.from(
          new Set(platRes.value.data.map((r: { source_platform: string | null }) => r.source_platform).filter(Boolean))
        ) as string[]
      }
      if (tagRes.status === "fulfilled" && tagRes.value.data && tagRes.value.data.length > 0) {
        allTags = Array.from(
          new Set(
            tagRes.value.data
              .flatMap((r: { tags: string[] | null }) => r.tags ?? [])
              .filter(Boolean)
          )
        ).sort() as string[]
      }
      if (bmRes.status === "fulfilled" && bmRes.value.data) {
        bookmarkedIds = bmRes.value.data.map((b: { opportunity_id: string }) => b.opportunity_id)
      }
    } catch (err) {
      console.warn("Supabase query bypassed, using fallback dataset:", err)
    }
  }

  // Seamless fallback to seed dataset if Supabase is unconfigured or returns empty
  if (initialRows.length === 0) {
    let dataset = [...MOCK_OPPORTUNITIES]
    if (params.type) {
      dataset = dataset.filter((item) => item.type === params.type)
    }
    if (params.platform) {
      dataset = dataset.filter((item) => item.source_platform?.toLowerCase().includes(params.platform!.toLowerCase()))
    }
    if (params.mode) {
      dataset = dataset.filter((item) => item.mode === params.mode)
    }
    if (params.tag) {
      dataset = dataset.filter((item) => item.tags?.includes(params.tag!))
    }
    if (params.q) {
      const qLower = params.q.toLowerCase()
      dataset = dataset.filter(
        (item) => item.title.toLowerCase().includes(qLower) || item.organizer?.toLowerCase().includes(qLower)
      )
    }
    initialRows = dataset
  }

  if (platforms.length === 0) {
    platforms = ["Unstop", "Devfolio", "HackerEarth", "H2Skill"]
  }

  if (allTags.length === 0) {
    allTags = Array.from(
      new Set(MOCK_OPPORTUNITIES.flatMap((op) => op.tags ?? []))
    ).sort()
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header Banner */}
      <div className="border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                Browse Opportunities
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
                Verified hackathons, innovation challenges, and tech internships across Unstop, Devfolio, HackerEarth &amp; H2Skill.
              </p>
            </div>

            {/* Clean platform indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#12141c] px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium text-slate-300">
                4 Platforms Synced Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed + Filter Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FeedClient
          initialData={initialRows}
          platforms={platforms}
          allTags={allTags}
          userId={userId}
          bookmarkedIds={bookmarkedIds}
          initialSearchQ={params.q ?? ""}
          initialType={params.type as "" | "hackathon" | "internship" | undefined}
          initialPlatform={params.platform ? [params.platform] : undefined}
          initialMode={params.mode ? [params.mode] : undefined}
        />
      </div>
    </div>
  )
}
