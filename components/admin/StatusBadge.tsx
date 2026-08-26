/**
 * components/admin/StatusBadge.tsx
 *
 * Pure presentational badge — maps opportunity types, modes, scrape statuses,
 * and boolean active/featured flags to colored Tailwind chips.
 */

import type { OpportunityType, OpportunityMode, ScrapeStatus } from "@/lib/supabase/types"

type BadgeVariant =
  | { kind: "type";   value: OpportunityType }
  | { kind: "mode";   value: OpportunityMode }
  | { kind: "scrape"; value: ScrapeStatus }
  | { kind: "active"; value: boolean }
  | { kind: "featured"; value: boolean }

const CLASSES: Record<string, string> = {
  // type
  hackathon:  "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  internship: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  // mode
  online:  "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  offline: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  hybrid:  "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  // scrape status
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  failed:  "bg-red-500/15 text-red-300 ring-red-500/30",
  partial: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  // active/featured
  active:   "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  inactive: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30",
  featured: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/30",
}

const LABELS: Record<string, string> = {
  hackathon:  "Hackathon",
  internship: "Internship",
  online:     "Online",
  offline:    "Offline",
  hybrid:     "Hybrid",
  success:    "Success",
  failed:     "Failed",
  partial:    "Partial",
  active:     "Active",
  inactive:   "Inactive",
  featured:   "Featured",
}

export default function StatusBadge(props: BadgeVariant) {
  let key: string

  if (props.kind === "active") {
    key = props.value ? "active" : "inactive"
  } else if (props.kind === "featured") {
    key = props.value ? "featured" : "inactive"
  } else {
    key = props.value
  }

  const cls = CLASSES[key] ?? "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30"
  const label = LABELS[key] ?? key

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  )
}
