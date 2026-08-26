/**
 * components/RecommendedSection.tsx
 *
 * Personalized recommendations section for the homepage.
 * - Shows curated picks based on user_preferences (preferred_tags + preferred_type)
 * - If no preferences set, shows an engaging prompt linking to /settings
 * - Zero-emoji design with clean developer aesthetic
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
      <section className="py-10 border-t border-white/[0.06] bg-gradient-to-b from-violet-950/20 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 px-3 py-1 text-xs font-bold text-violet-300 mb-2">
                Curated For You
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Recommended Opportunities
              </h2>
            </div>
            <Link
              href="/settings"
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition flex items-center gap-1"
            >
              <span>Edit interests &amp; preferences →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

  // Case 2: Logged in user without preferences OR guest user -> show inline prompt
  return (
    <section className="py-6 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-950/40 via-purple-950/25 to-[#0d0d16] p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-bold text-violet-300 mb-3">
                Personalized Discovery
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight sm:text-xl">
                Get tailored hackathon and internship recommendations
              </h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                Select your tech interests (AI, Web3, Mobile, Cloud) and preferred listings to receive custom picks and deadline reminders.
              </p>
            </div>

            <Link
              href={userId ? "/settings" : "/login?redirectTo=/settings"}
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-95"
            >
              <span>Configure Interests →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
