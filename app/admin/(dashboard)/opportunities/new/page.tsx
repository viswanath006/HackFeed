/**
 * app/admin/opportunities/new/page.tsx
 *
 * Create a new opportunity manually.
 */

import type { Metadata } from "next"
import Link from "next/link"
import OpportunityForm from "@/components/admin/OpportunityForm"
import { createOpportunity } from "@/app/admin/actions"

export const metadata: Metadata = { title: "New Opportunity" }

export default function NewOpportunityPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/admin/opportunities" className="hover:text-zinc-200 transition-colors">
          Opportunities
        </Link>
        <span>›</span>
        <span className="text-zinc-300">New</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Add Opportunity</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manually add a hackathon or internship to the HackFeed database.
        </p>
      </div>

      <OpportunityForm mode="new" action={createOpportunity} />
    </div>
  )
}
