/**
 * app/bookmarks/page.tsx
 *
 * User's saved bookmarks page (Protected route).
 * Grounded in Paper & Ink editorial design.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import BookmarksFeed from "./BookmarksFeed"
import type { OpportunityRow } from "@/lib/supabase/types"

export const metadata: Metadata = {
  title: "Saved Bookmarks — HackFeed",
  description: "View and manage your saved hackathons and internships.",
}

export default async function BookmarksPage() {
  const { user } = await getUser()

  if (!user || !user.id) {
    redirect("/login?redirectTo=/bookmarks")
  }

  const supabase = await createClient()

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

  const opportunities: OpportunityRow[] = []
  for (const record of records) {
    const op = record?.opportunities as OpportunityRow | null
    if (op && op.id && op.is_active) {
      opportunities.push(op)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-20">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-serif italic text-ink-muted">Personal archive</p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
                Saved Bookmarks
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-xl leading-relaxed">
                Track your saved hackathons and internships with their upcoming application deadlines.
              </p>
            </div>
            <div className="border border-hairline bg-paper px-4 py-2.5 text-right">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Saved</p>
              <p className="font-serif text-2xl font-normal text-ink mt-0.5">{opportunities.length}</p>
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
