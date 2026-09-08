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
      <div className="border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-300">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Saved Opportunities
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                My Bookmarks
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Keep track of your saved hackathons &amp; internships and their upcoming deadlines.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#12141c] px-4 py-2.5 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Saved</p>
              <p className="text-xl font-bold text-indigo-300 mt-0.5">{opportunities.length}</p>
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
