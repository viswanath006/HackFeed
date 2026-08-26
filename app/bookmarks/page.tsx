/**
 * app/bookmarks/page.tsx
 *
 * User's saved bookmarks page (Protected route).
 * Server Component: checks auth via getUser(), fetches bookmarked opportunities,
 * and passes them to BookmarksFeed for interactive client management.
 * Zero-emoji design.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import BookmarksFeed from "./BookmarksFeed"
import type { OpportunityRow } from "@/lib/supabase/types"

export const metadata: Metadata = {
  title: "My Bookmarks — HackFeed",
  description: "View and manage your saved hackathons and internships.",
}

export default async function BookmarksPage() {
  const { user } = await getUser()

  if (!user || !user.id) {
    redirect("/login?redirectTo=/bookmarks")
  }

  const supabase = await createClient()

  // Fetch all bookmarks with full opportunity details
  const { data: bookmarkRecords } = await supabase
    .from("bookmarks")
    .select(`
      id,
      created_at,
      opportunity_id,
      opportunities (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const records = (bookmarkRecords as any[] | null) ?? []

  // Extract valid active opportunities
  const opportunities: OpportunityRow[] = []
  for (const record of records) {
    const op = record?.opportunities as OpportunityRow | null
    if (op && op.id && op.is_active) {
      opportunities.push(op)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-[#07070c]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Saved Opportunities
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
                My Bookmarks
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Keep track of your saved hackathons &amp; internships and their application deadlines.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Total Saved</p>
              <p className="font-mono text-xl font-bold text-violet-300">{opportunities.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bookmarks Content ──────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BookmarksFeed
          initialOpportunities={opportunities}
          userId={user.id}
        />
      </main>
    </div>
  )
}
