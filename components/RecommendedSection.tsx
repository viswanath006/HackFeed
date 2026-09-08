/**
 * components/RecommendedSection.tsx
 *
 * Personalized recommendations section for the homepage.
 * - Shows curated picks based on user_preferences (preferred_tags + preferred_type)
 * - If no preferences set, shows a calm editorial prompt linking to /settings
 * - Strictly eliminates pill badges and arrow suffixes
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
      <section className="py-10 border-t border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-serif italic text-ink-muted">Curated for your profile</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-ink mt-1">
                Recommended for You
              </h2>
            </div>
            <Link
              href="/settings"
              className="text-xs font-medium text-ink-muted hover:text-ink hover:underline decoration-ink/40 underline-offset-4 transition"
            >
              Edit preferences
            </Link>
          </div>

          <div className="border-t border-hairline divide-y divide-hairline">
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

  // Case 2: Logged in user without preferences OR guest user -> calm editorial prompt
  return (
    <section className="py-8 border-t border-hairline bg-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border border-hairline bg-paper p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-serif italic text-ink-muted">Personalized bulletin</p>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-ink tracking-tight mt-1">
                Filter by your specific domains and skills
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
                Select your tech interests (such as AI, Web3, Systems, or Full Stack) to receive personalized feeds and deadline alerts.
              </p>
            </div>

            <Link
              href={userId ? "/settings" : "/login?redirectTo=/settings"}
              className="flex-shrink-0 border border-ink bg-ink px-4 py-2 text-xs font-medium text-paper transition hover:bg-ink/90 active:scale-95"
            >
              Configure Interests
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
