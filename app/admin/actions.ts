"use server"

/**
 * app/admin/actions.ts
 *
 * All admin server actions for HackFeed.
 *
 * Every action:
 *  1. Re-verifies admin auth via getUser() (never trusts client state).
 *  2. Uses the SERVICE-ROLE client to bypass RLS safely for mutations.
 *  3. Returns { error?: string } — never throws, so the client can handle gracefully.
 */

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import type { OpportunityInsert, OpportunityUpdate } from "@/lib/supabase/types"

// ── Auth guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
  const { user, isAdmin, isSuperAdmin, admin } = await getUser()
  if (!user || !isAdmin) {
    redirect("/admin/login?error=unauthorized")
  }
  return { user, isSuperAdmin, admin }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Parse FormData into an OpportunityInsert / partial object */
function parseOpportunityForm(data: FormData): Omit<OpportunityInsert, "id" | "created_at" | "updated_at"> {
  const str = (key: string) => {
    const v = (data.get(key) as string | null)?.trim()
    return v || null
  }
  const date = (key: string) => {
    const v = str(key)
    return v ? new Date(v).toISOString() : null
  }
  const bool = (key: string) => data.get(key) === "true"
  const tags = (): string[] | null => {
    const raw = str("tags")
    if (!raw) return null
    return raw.split(",").map((t) => t.trim()).filter(Boolean)
  }

  return {
    title: (data.get("title") as string).trim(),
    description: str("description"),
    type: data.get("type") as "hackathon" | "internship",
    source_platform: str("source_platform"),
    source_url: (data.get("source_url") as string).trim(),
    organizer: str("organizer"),
    location: str("location"),
    mode: (str("mode") as "online" | "offline" | "hybrid" | null) || null,
    start_date: date("start_date"),
    end_date: date("end_date"),
    application_deadline: date("application_deadline"),
    prize_pool: str("prize_pool"),
    stipend: str("stipend"),
    tags: tags(),
    eligibility: str("eligibility"),
    team_size: str("team_size"),
    banner_image_url: str("banner_image_url"),
    is_active: bool("is_active"),
    is_featured: bool("is_featured"),
  }
}

// ── Create ────────────────────────────────────────────────────────────────

export async function createOpportunity(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createServiceClient()
  const payload = parseOpportunityForm(formData)

  const { error } = await (supabase as any).from("opportunities").insert(payload)
  if (error) {
    if (error.code === "23505") {
      return { error: "An opportunity with this source URL already exists." }
    }
    return { error: error.message }
  }

  revalidatePath("/admin/opportunities")
  redirect("/admin/opportunities")
}

// ── Update ────────────────────────────────────────────────────────────────

export async function updateOpportunity(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createServiceClient()
  const payload = parseOpportunityForm(formData) as OpportunityUpdate

  const { error } = await (supabase as any)
    .from("opportunities")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/opportunities")
  revalidatePath(`/admin/opportunities/${id}/edit`)
  return {}
}

// ── Soft delete (is_active = false) ───────────────────────────────────────

export async function softDeleteOpportunity(
  id: string
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { error } = await (supabase as any)
    .from("opportunities")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/opportunities")
  revalidatePath(`/admin/opportunities/${id}/edit`)
  return {}
}

// ── Hard delete (super_admin only) ────────────────────────────────────────

export async function hardDeleteOpportunity(
  id: string
): Promise<{ error?: string }> {
  const { isSuperAdmin } = await requireAdmin()

  if (!isSuperAdmin) {
    return { error: "Only super admins can permanently delete opportunities." }
  }

  const supabase = await createServiceClient()
  const { error } = await (supabase as any).from("opportunities").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/opportunities")
  redirect("/admin/opportunities")
}

// ── Toggle is_active ──────────────────────────────────────────────────────

export async function toggleIsActive(
  id: string,
  current: boolean
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { error } = await (supabase as any)
    .from("opportunities")
    .update({ is_active: !current, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/opportunities")
  revalidatePath("/admin")
  return {}
}

// ── Toggle is_featured ────────────────────────────────────────────────────

export async function toggleIsFeatured(
  id: string,
  current: boolean
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { error } = await (supabase as any)
    .from("opportunities")
    .update({ is_featured: !current, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/opportunities")
  return {}
}
