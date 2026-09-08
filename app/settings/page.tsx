/**
 * app/settings/page.tsx
 *
 * User Account & Notification Settings Page (Protected route).
 * Server Component: checks auth via getUser(), loads available tags and current preferences.
 * Zero-emoji developer aesthetic.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import SettingsForm from "./SettingsForm"
import type { UserPreferencesRow } from "@/lib/supabase/types"
import { MOCK_OPPORTUNITIES } from "@/lib/mockData"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Preferences & Notifications — HackFeed",
  description: "Manage your interests, deadline reminders, and newsletter digest settings.",
}

export default async function SettingsPage() {
  const { user } = await getUser()

  if (!user || !user.id) {
    redirect("/login?redirectTo=/settings")
  }

  let preferences: UserPreferencesRow | null = null
  let availableTags: string[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      const [prefRes, tagRes] = await Promise.allSettled([
        (supabase as any).from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("opportunities").select("tags").eq("is_active", true).not("tags", "is", null),
      ])

      if (prefRes.status === "fulfilled" && prefRes.value && (prefRes.value as any).data) {
        preferences = (prefRes.value as any).data as UserPreferencesRow
      }
      if (tagRes.status === "fulfilled" && tagRes.value && (tagRes.value as any).data) {
        availableTags = Array.from(
          new Set(
            (tagRes.value as any).data
              .flatMap((r: { tags: string[] | null }) => r.tags ?? [])
              .filter(Boolean)
          )
        ).sort() as string[]
      }
    } catch (err) {
      console.warn("SettingsPage data notice:", err)
    }
  }

  // Fallback defaults if not set
  if (availableTags.length === 0) {
    availableTags = Array.from(
      new Set(MOCK_OPPORTUNITIES.flatMap((op) => op.tags ?? []))
    ).sort()
  }

  if (!preferences) {
    preferences = {
      user_id: user.id,
      preferred_tags: [],
      preferred_type: "both",
      reminder_enabled: true,
      digest_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preferences &amp; Alerts
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Personalize your recommendations feed, email deadline alerts, and weekly digest briefings.
          </p>
        </div>
      </div>

      {/* ── Form Container ── */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <SettingsForm
          initialPreferences={preferences}
          availableTags={availableTags}
          userEmail={user.email ?? "student@hackfeed.dev"}
        />
      </main>
    </div>
  )
}
