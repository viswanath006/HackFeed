/**
 * app/settings/page.tsx
 *
 * User Account & Notification Settings Page (Protected route).
 * Grounded in Paper & Ink editorial design.
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
  title: "Preferences & Alerts — HackFeed",
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
    <div className="min-h-screen bg-paper text-ink pb-24">
      {/* ── Header ── */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-serif italic text-ink-muted">Preferences &amp; alerts</p>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
            Account Settings
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-2xl leading-relaxed">
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
