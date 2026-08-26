"use server"

/**
 * app/actions/preferences.ts
 *
 * Server actions for managing user preferences (preferred tags, type, reminder/digest toggles).
 */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import type { PreferenceOpportunityType, UserPreferencesRow } from "@/lib/supabase/types"

export interface PreferencesActionResult {
  success: boolean
  preferences?: UserPreferencesRow
  error?: string
}

/**
 * Fetch current user preferences (falls back to defaults if not created yet)
 */
export async function getUserPreferencesAction(): Promise<{
  preferences: UserPreferencesRow | null
  userId: string | null
}> {
  const { user } = await getUser()
  if (!user || !user.id) return { preferences: null, userId: null }

  if (!isSupabaseConfigured()) {
    return {
      userId: user.id,
      preferences: {
        user_id: user.id,
        preferred_tags: ["AI/ML", "Web Dev", "Cloud"],
        preferred_type: "both",
        reminder_enabled: true,
        digest_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return {
    userId: user.id,
    preferences: data as UserPreferencesRow | null,
  }
}

/**
 * Save / update user preferences
 */
export async function updateUserPreferencesAction(payload: {
  preferred_tags: string[]
  preferred_type: PreferenceOpportunityType
  reminder_enabled: boolean
  digest_enabled: boolean
}): Promise<PreferencesActionResult> {
  const { user } = await getUser()
  if (!user || !user.id) {
    return { success: false, error: "You must be signed in to save preferences." }
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      preferences: {
        user_id: user.id,
        preferred_tags: payload.preferred_tags,
        preferred_type: payload.preferred_type,
        reminder_enabled: payload.reminder_enabled,
        digest_enabled: payload.digest_enabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  }

  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await (supabase as any)
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        preferred_tags: payload.preferred_tags,
        preferred_type: payload.preferred_type,
        reminder_enabled: payload.reminder_enabled,
        digest_enabled: payload.digest_enabled,
        updated_at: nowIso,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/settings")
  revalidatePath("/")
  return { success: true, preferences: data as UserPreferencesRow }
}
