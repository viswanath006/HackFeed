"use server"

/**
 * app/actions/bookmarks.ts
 *
 * Server actions for managing user bookmarks and automated reminder queues.
 * Securely checks auth.uid() using getUser() on the server.
 */

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export interface BookmarkActionResult {
  success: boolean
  isBookmarked: boolean
  error?: string
}

/**
 * Toggle bookmark for the current authenticated user on a given opportunity.
 * Automatically queues deadline reminders at 3 days and 1 day before the deadline.
 */
export async function toggleBookmarkAction(
  opportunityId: string
): Promise<BookmarkActionResult> {
  const { user } = await getUser()

  if (!user || !user.id) {
    return {
      success: false,
      isBookmarked: false,
      error: "You must be signed in to bookmark opportunities.",
    }
  }

  if (!isSupabaseConfigured()) {
    // In local dev without live database, return success optimistically
    return {
      success: true,
      isBookmarked: true,
    }
  }

  const supabase = await createClient()

  // 1. Check if bookmark already exists
  const { data: existing, error: fetchError } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle()

  if (fetchError) {
    return {
      success: false,
      isBookmarked: false,
      error: fetchError.message,
    }
  }

  if (existing) {
    // 2. Remove bookmark & delete unsent reminders
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId)

    if (deleteError) {
      return {
        success: false,
        isBookmarked: true,
        error: deleteError.message,
      }
    }

    // Clean up pending reminders
    await supabase
      .from("reminder_queue")
      .delete()
      .eq("user_id", user.id)
      .eq("opportunity_id", opportunityId)
      .eq("sent", false)

    revalidatePath("/bookmarks")
    revalidatePath(`/opportunities/${opportunityId}`)
    revalidatePath("/opportunities")
    revalidatePath("/")

    return {
      success: true,
      isBookmarked: false,
    }
  } else {
    // 3. Add bookmark
    const { error: insertError } = await (supabase as any)
      .from("bookmarks")
      .insert({
        user_id: user.id,
        opportunity_id: opportunityId,
      })

    if (insertError) {
      return {
        success: false,
        isBookmarked: false,
        error: insertError.message,
      }
    }

    // 4. Check user preferences for reminders
    const { data: pref } = (await supabase
      .from("user_preferences")
      .select("reminder_enabled")
      .eq("user_id", user.id)
      .maybeSingle()) as { data: { reminder_enabled: boolean } | null }

    const reminderEnabled = pref ? pref.reminder_enabled : true

    // 5. Schedule reminders if enabled
    if (reminderEnabled) {
      const { data: opp } = (await supabase
        .from("opportunities")
        .select("application_deadline")
        .eq("id", opportunityId)
        .maybeSingle()) as { data: { application_deadline: string | null } | null }

      if (opp && opp.application_deadline) {
        const deadlineDate = new Date(opp.application_deadline)
        const now = new Date()

        // 3 days before and 1 day before
        const remind3d = new Date(deadlineDate.getTime() - 3 * 24 * 60 * 60 * 1000)
        const remind1d = new Date(deadlineDate.getTime() - 1 * 24 * 60 * 60 * 1000)

        const remindersToQueue = []
        if (remind3d > now) {
          remindersToQueue.push({
            user_id: user.id,
            opportunity_id: opportunityId,
            remind_at: remind3d.toISOString(),
            sent: false,
          })
        }
        if (remind1d > now) {
          remindersToQueue.push({
            user_id: user.id,
            opportunity_id: opportunityId,
            remind_at: remind1d.toISOString(),
            sent: false,
          })
        }

        if (remindersToQueue.length > 0) {
          await (supabase as any)
            .from("reminder_queue")
            .upsert(remindersToQueue, { onConflict: "user_id,opportunity_id,remind_at" })
        }
      }
    }

    revalidatePath("/bookmarks")
    revalidatePath(`/opportunities/${opportunityId}`)
    revalidatePath("/opportunities")
    revalidatePath("/")

    return {
      success: true,
      isBookmarked: true,
    }
  }
}

/**
 * Explicitly remove bookmark for an opportunity.
 */
export async function removeBookmarkAction(
  opportunityId: string
): Promise<BookmarkActionResult> {
  const { user } = await getUser()

  if (!user || !user.id) {
    return {
      success: false,
      isBookmarked: true,
      error: "You must be signed in to manage bookmarks.",
    }
  }

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      isBookmarked: false,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)

  if (error) {
    return {
      success: false,
      isBookmarked: true,
      error: error.message,
    }
  }

  // Clean up pending reminders
  await supabase
    .from("reminder_queue")
    .delete()
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .eq("sent", false)

  revalidatePath("/bookmarks")
  revalidatePath(`/opportunities/${opportunityId}`)
  revalidatePath("/opportunities")
  revalidatePath("/")

  return {
    success: true,
    isBookmarked: false,
  }
}
