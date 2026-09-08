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
    <div className="min-h-screen bg-paper pb-20">
      {/* Header Banner */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl">
                Browse Opportunities
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm text-ink-muted leading-relaxed">
                Verified hackathons, sprints, and internships aggregated continuously from Unstop, Devfolio, HackerEarth, and H2Skill.
              </p>
            </div>

            {/* Quiet live indicator */}
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-forest" />
              <span>Synced continuously</span>
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
