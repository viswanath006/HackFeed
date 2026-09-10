"use client"

/**
 * components/CourseBookmarkButton.tsx
 *
 * Bookmark toggle for courses — mirrors BookmarkButton.tsx
 * but calls toggleCourseBookmarkAction with courseId.
 */

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toggleCourseBookmarkAction } from "@/app/actions/bookmarks"
import { toast } from "@/components/Toast"

interface CourseBookmarkButtonProps {
  courseId: string
  userId?: string | null
  initialBookmarked?: boolean
  variant?: "icon" | "full"
  onToggle?: (isBookmarked: boolean) => void
}

export default function CourseBookmarkButton({
  courseId,
  userId = null,
  initialBookmarked = false,
  variant = "icon",
  onToggle,
}: CourseBookmarkButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isPending, startTransition] = useTransition()

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      toast.info("Sign in to bookmark courses")
      router.push(`/login?redirectTo=${encodeURIComponent(pathname || "/")}`)
      return
    }

    const previousState = bookmarked
    const nextState = !bookmarked
    setBookmarked(nextState)
    if (onToggle) onToggle(nextState)

    if (nextState) {
      toast.success("Course saved to bookmarks!")
    } else {
      toast.info("Removed from bookmarks")
    }

    startTransition(async () => {
      try {
        const res = await toggleCourseBookmarkAction(courseId)
        if (!res.success) {
          setBookmarked(previousState)
          if (onToggle) onToggle(previousState)
          toast.error(res.error || "Failed to update bookmark. Please try again.")
        }
      } catch {
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
        id={`course-bookmark-btn-${courseId}`}
        aria-label={bookmarked ? "Remove course bookmark" : "Bookmark this course"}
        aria-pressed={bookmarked}
        className={`group flex items-center justify-center gap-2 border px-4 py-2.5 text-xs font-medium transition-colors duration-150 ${
          bookmarked
            ? "border-ink bg-ink text-paper"
            : "border-hairline bg-paper text-ink hover:border-ink hover:bg-paper-muted"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <BookmarkIcon filled={bookmarked} />
        <span>{bookmarked ? "Saved" : "Save Course"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      id={`course-bookmark-icon-${courseId}`}
      aria-label={bookmarked ? "Remove course bookmark" : "Bookmark course"}
      aria-pressed={bookmarked}
      className={`flex h-8 w-8 items-center justify-center border transition-colors duration-150 ${
        bookmarked
          ? "border-ink bg-ink text-paper"
          : "border-hairline bg-paper text-ink-muted hover:border-ink hover:text-ink hover:bg-paper-muted"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <BookmarkIcon filled={bookmarked} />
    </button>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="13"
      height="15"
      viewBox="0 0 14 16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h9A1.5 1.5 0 0 1 13 2.5v12l-6-3-6 3V2.5Z" />
    </svg>
  )
}
