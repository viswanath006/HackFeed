/**
 * components/RecommendedSection.tsx
 *
 * Personalized recommendations section for the homepage.
 * - Shows curated picks based on user_preferences (preferred_tags + preferred_type)
 * - If no preferences set, shows a clean, modern prompt linking to /settings
 */

import Link from "next/link"
import OpportunityCard from "./OpportunityCard"
import type { OpportunityRow, UserPreferencesRow } from "@/lib/supabase/types"

interface RecommendedSectionProps {
  userId: string | null
  preferences: UserPreferencesRow | null
  recommendedOpportunities: OpportunityRow[]
  bookmarkedIds: Set<string>
}

export default function RecommendedSection({
  userId,
  preferences,
  recommendedOpportunities,
  bookmarkedIds,
}: RecommendedSectionProps) {
  const hasPreferences =
    preferences &&
    ((preferences.preferred_tags && preferences.preferred_tags.length > 0) ||
      preferences.preferred_type !== "both")

  // Case 1: Logged in user with preferences set & matching recommendations
  if (userId && hasPreferences && recommendedOpportunities.length > 0) {
    return (
      <section className="py-8 border-t border-white/[0.06] bg-gradient-to-b from-indigo-950/10 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 mb-2">
                Curated For You
              </div>
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Recommended Opportunities
              </h2>
            </div>
            <Link
              href="/settings"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
            >
              <span>Edit preferences →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedOpportunities.map((op) => (
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
    )
  }

  // Case 2: Logged in user without preferences OR guest user -> show modern clean prompt
  return (
    <section className="py-6 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-r from-[#12141c] via-[#161824] to-[#12141c] p-6 sm:p-7 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 mb-2">
                Personalized Discovery
              </span>
              <h3 className="text-base font-bold text-white tracking-tight sm:text-lg">
                Get tailored hackathon and internship recommendations
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Choose your tech domains (AI/ML, Web3, Full Stack, Cloud) to receive personalized feeds and deadline updates.
              </p>
            </div>

            <Link
              href={userId ? "/settings" : "/login?redirectTo=/settings"}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
            >
              <span>Configure Interests →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
