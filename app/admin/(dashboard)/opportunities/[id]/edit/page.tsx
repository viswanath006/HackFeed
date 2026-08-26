/**
 * app/admin/opportunities/[id]/edit/page.tsx
 *
 * Edit an existing opportunity — pre-populated form + delete controls.
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import OpportunityForm from "@/components/admin/OpportunityForm"
import { updateOpportunity, softDeleteOpportunity, hardDeleteOpportunity } from "@/app/admin/actions"
import DeleteControls from "./DeleteControls"
import type { OpportunityRow } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Edit Opportunity" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditOpportunityPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single()

  const opportunity = data as OpportunityRow | null

  if (error || !opportunity) notFound()

  // Bind the server action to this specific id
  const updateAction = updateOpportunity.bind(null, id)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/admin/opportunities" className="hover:text-zinc-200 transition-colors">
          Opportunities
        </Link>
        <span>›</span>
        <span className="text-zinc-300 truncate max-w-xs">{opportunity.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Edit Opportunity</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Last updated:{" "}
            {new Date(opportunity.updated_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        {!opportunity.is_active && (
          <span className="rounded-full border border-zinc-500/30 bg-zinc-500/15 px-3 py-1 text-xs font-medium text-zinc-400">
            Inactive
          </span>
        )}
      </div>

      {/* Edit form */}
      <OpportunityForm mode="edit" initial={opportunity} action={updateAction} />

      {/* Danger zone */}
      <DeleteControls
        id={id}
        title={opportunity.title}
        isActive={opportunity.is_active}
        softDelete={softDeleteOpportunity}
        hardDelete={hardDeleteOpportunity}
      />
    </div>
  )
}
