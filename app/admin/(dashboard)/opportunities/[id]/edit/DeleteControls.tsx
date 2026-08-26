"use client"

/**
 * app/admin/opportunities/[id]/edit/DeleteControls.tsx
 *
 * Client component for the delete danger zone.
 * Soft delete: sets is_active = false.
 * Hard delete: requires typing the opportunity title to confirm, super_admin only.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface Props {
  id: string
  title: string
  isActive: boolean
  softDelete: (id: string) => Promise<{ error?: string }>
  hardDelete: (id: string) => Promise<{ error?: string }>
}

export default function DeleteControls({ id, title, isActive, softDelete, hardDelete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showHardConfirm, setShowHardConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSoftDelete = () => {
    if (!isActive) return // already inactive
    startTransition(async () => {
      const result = await softDelete(id)
      if (result.error) setError(result.error)
      else { router.push("/admin/opportunities"); router.refresh() }
    })
  }

  const handleHardDelete = () => {
    if (confirmText !== title) return
    startTransition(async () => {
      const result = await hardDelete(id)
      if (result.error) { setError(result.error); setShowHardConfirm(false) }
      // Server action redirects on success
    })
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">Danger Zone</h2>

      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-200">Deactivate (soft delete)</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Hides this opportunity from the public feed. Can be reversed.
          </p>
        </div>
        <button
          type="button"
          id="soft-delete-btn"
          disabled={isPending || !isActive}
          onClick={handleSoftDelete}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!isActive ? "Already inactive" : isPending ? "Deactivating…" : "Deactivate"}
        </button>
      </div>

      <div className="border-t border-red-500/15 pt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-200">Permanently delete</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Irreversible. Requires super admin role.
          </p>
        </div>
        {!showHardConfirm ? (
          <button
            type="button"
            id="hard-delete-open-btn"
            onClick={() => setShowHardConfirm(true)}
            disabled={isPending}
            className="rounded-lg bg-red-600/15 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-600/25 disabled:opacity-50"
          >
            Delete permanently
          </button>
        ) : (
          <div className="w-full space-y-3 rounded-lg border border-red-500/30 bg-red-500/8 p-4">
            <p className="text-sm text-red-300">
              Type{" "}
              <code className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-mono text-red-200">
                {title}
              </code>{" "}
              to confirm permanent deletion.
            </p>
            <input
              type="text"
              id="hard-delete-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the opportunity title…"
              className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100 placeholder-red-400/40 outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20"
            />
            <div className="flex gap-2">
              <button
                type="button"
                id="hard-delete-confirm-btn"
                disabled={confirmText !== title || isPending}
                onClick={handleHardDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                type="button"
                onClick={() => { setShowHardConfirm(false); setConfirmText("") }}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
