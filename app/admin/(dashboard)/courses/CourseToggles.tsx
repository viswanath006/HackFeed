"use client"

/**
 * app/admin/(dashboard)/courses/CourseToggles.tsx
 *
 * Optimistic is_active / is_featured toggles for the courses admin table.
 * Mirrors OpportunityToggles pattern.
 */

import { useState, useTransition } from "react"
import { toggleCourseIsActive, toggleCourseIsFeatured } from "@/app/admin/actions"

interface CourseTogglesProps {
  id: string
  isActive: boolean
  isFeatured: boolean
}

export default function CourseToggles({ id, isActive, isFeatured }: CourseTogglesProps) {
  const [active, setActive] = useState(isActive)
  const [featured, setFeatured] = useState(isFeatured)
  const [isPending, startTransition] = useTransition()

  const handleActiveToggle = () => {
    const next = !active
    setActive(next)
    startTransition(async () => {
      const res = await toggleCourseIsActive(id, active)
      if (res?.error) setActive(active) // rollback
    })
  }

  const handleFeaturedToggle = () => {
    const next = !featured
    setFeatured(next)
    startTransition(async () => {
      const res = await toggleCourseIsFeatured(id, featured)
      if (res?.error) setFeatured(featured) // rollback
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Active toggle */}
      <button
        onClick={handleActiveToggle}
        disabled={isPending}
        title={active ? "Deactivate course" : "Activate course"}
        id={`course-active-toggle-${id}`}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          active ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            active ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      {/* Featured toggle */}
      <button
        onClick={handleFeaturedToggle}
        disabled={isPending}
        title={featured ? "Unfeature course" : "Feature on home page"}
        id={`course-featured-toggle-${id}`}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
          featured ? "bg-amber-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            featured ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>

      <div className="text-[10px] text-zinc-500 tabular-nums leading-tight">
        <div>{active ? "Live" : "Off"}</div>
        <div>{featured ? "Feat." : ""}</div>
      </div>
    </div>
  )
}
