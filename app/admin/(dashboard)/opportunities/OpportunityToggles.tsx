"use client"

/**
 * app/admin/opportunities/OpportunityToggles.tsx
 *
 * Client component that renders the is_active and is_featured toggle pills
 * with optimistic UI updates — state flips immediately on click without
 * waiting for the server action to resolve.
 */

import { useOptimistic, useTransition } from "react"
import { toggleIsActive, toggleIsFeatured } from "@/app/admin/actions"

interface Props {
  id: string
  isActive: boolean
  isFeatured: boolean
}

function Toggle({
  checked,
  label,
  onLabel,
  offLabel,
  onClick,
  disabled,
}: {
  checked: boolean
  label: string
  onLabel: string
  offLabel: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
        checked
          ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30 hover:bg-zinc-500/25"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${checked ? "bg-emerald-400" : "bg-zinc-500"}`}
        aria-hidden="true"
      />
      {checked ? onLabel : offLabel}
    </button>
  )
}

export default function OpportunityToggles({ id, isActive, isFeatured }: Props) {
  const [isPending, startTransition] = useTransition()

  // Optimistic state for active
  const [optimisticActive, setOptimisticActive] = useOptimistic(isActive)
  // Optimistic state for featured
  const [optimisticFeatured, setOptimisticFeatured] = useOptimistic(isFeatured)

  const handleToggleActive = () => {
    startTransition(async () => {
      setOptimisticActive(!optimisticActive)
      await toggleIsActive(id, optimisticActive)
    })
  }

  const handleToggleFeatured = () => {
    startTransition(async () => {
      setOptimisticFeatured(!optimisticFeatured)
      await toggleIsFeatured(id, optimisticFeatured)
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Toggle
        checked={optimisticActive}
        label="Toggle active status"
        onLabel="Active"
        offLabel="Inactive"
        onClick={handleToggleActive}
        disabled={isPending}
      />
      <Toggle
        checked={optimisticFeatured}
        label="Toggle featured status"
        onLabel="Featured"
        offLabel="—"
        onClick={handleToggleFeatured}
        disabled={isPending}
      />
    </div>
  )
}
