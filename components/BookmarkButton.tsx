"use client"

/**
 * components/BookmarkButton.tsx
 *
 * Toggles bookmark with optimistic UI & toast feedback.
 * - Logged out → redirects to /login?redirectTo=...
 * - Logged in  → calls toggleBookmarkAction server action
 * - Optimistic rollback on error
 */

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toggleBookmarkAction } from "@/app/actions/bookmarks"
import { toast } from "@/components/Toast"

interface BookmarkButtonProps {
  opportunityId: string
  userId?: string | null
  initialBookmarked?: boolean
  /** "icon" = compact card icon, "full" = full button with label */
  variant?: "icon" | "full"
  /** Icon style: "bookmark" | "heart" */
  iconType?: "bookmark" | "heart"
  /** Callback fired after state changes */
  onToggle?: (isBookmarked: boolean) => void
}

export default function BookmarkButton({
  opportunityId,
  userId = null,
  initialBookmarked = false,
  variant = "icon",
  iconType = "bookmark",
  onToggle,
}: BookmarkButtonProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.info("Sign in to bookmark opportunities")
      router.push(`/login?redirectTo=${encodeURIComponent(pathname || "/")}`)
      return
    }

    const previousState = bookmarked
    const nextState = !bookmarked

    // Optimistic UI update
    setBookmarked(nextState)
    if (onToggle) onToggle(nextState)

    // Immediate user feedback toast
    if (nextState) {
      toast.success("Saved to bookmarks!")
    } else {
      toast.info("Removed from bookmarks")
    }

    startTransition(async () => {
      try {
        const res = await toggleBookmarkAction(opportunityId)
        if (!res.success) {
          // Rollback on failure
          setBookmarked(previousState)
          if (onToggle) onToggle(previousState)
          toast.error(res.error || "Failed to update bookmark. Please try again.")
        }
      } catch (err) {
        // Rollback on network/unexpected error
        setBookmarked(previousState)
        if (onToggle) onToggle(previousState)
        toast.error("Failed to update bookmark. Please try again.")
      }
    })
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        id={`bookmark-btn-${opportunityId}`}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this opportunity"}
        aria-pressed={bookmarked}
        className={`group flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
          bookmarked
            ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25 hover:border-indigo-500/50"
            : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <Icon filled={bookmarked} type={iconType} />
        <span>{bookmarked ? "Saved" : "Save for Later"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      id={`bookmark-icon-${opportunityId}`}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark opportunity"}
      aria-pressed={bookmarked}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 active:scale-95 ${
        bookmarked
          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 shadow-sm"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-slate-200"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <Icon filled={bookmarked} type={iconType} />
    </button>
  )
}

function Icon({ filled, type }: { filled: boolean; type: "bookmark" | "heart" }) {
  if (type === "heart") {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`transition-transform duration-200 ${filled ? "scale-110 text-rose-400" : ""}`}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    )
  }

  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${filled ? "scale-110 text-violet-300" : ""}`}
    >
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h9A1.5 1.5 0 0 1 13 2.5v12l-6-3-6 3V2.5Z" />
    </svg>
  )
}
