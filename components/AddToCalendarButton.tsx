"use client"

/**
 * components/AddToCalendarButton.tsx
 *
 * Dropdown button allowing users to export an opportunity to their calendar:
 * 1. Download .ics (Apple Calendar, Outlook, OS native)
 * 2. Add to Google Calendar (opens pre-filled template in new tab)
 * - Zero-emoji design with sleek SVGs
 */

import { useState, useRef, useEffect } from "react"
import type { OpportunityRow } from "@/lib/supabase/types"
import { generateSingleIcs, downloadIcsFile, getGoogleCalendarUrl } from "@/lib/calendar"
import { toast } from "@/components/Toast"

interface AddToCalendarButtonProps {
  opportunity: OpportunityRow
  variant?: "primary" | "secondary"
}

export default function AddToCalendarButton({
  opportunity,
  variant = "secondary",
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleDownloadIcs = () => {
    try {
      const appUrl = typeof window !== "undefined" ? window.location.origin : ""
      const ics = generateSingleIcs(opportunity, appUrl)
      const cleanName = opportunity.title.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)
      downloadIcsFile(`hackfeed_${cleanName}`, ics)
      toast.success("Calendar file (.ics) downloaded")
      setIsOpen(false)
    } catch {
      toast.error("Failed to generate calendar file.")
    }
  }

  const handleGoogleCalendar = () => {
    const appUrl = typeof window !== "undefined" ? window.location.origin : ""
    const gCalUrl = getGoogleCalendarUrl(opportunity, appUrl)
    window.open(gCalUrl, "_blank", "noopener,noreferrer")
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        id={`calendar-btn-${opportunity.id}`}
        className={`group flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold transition-all duration-200 active:scale-95 w-full ${
          variant === "primary"
            ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500"
            : "border border-white/10 bg-white/5 text-zinc-300 hover:border-violet-500/30 hover:bg-white/[0.08] hover:text-violet-300"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-violet-300">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Add to Calendar</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-white/10 bg-[#0d0d16] p-1.5 shadow-2xl backdrop-blur-xl focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:bg-violet-600/20 hover:text-violet-300"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 border border-white/10">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div>
              <p className="font-bold">Google Calendar</p>
              <p className="text-[10px] text-zinc-400 font-normal">Opens in new tab</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 transition hover:bg-violet-600/20 hover:text-violet-300 mt-0.5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 border border-white/10">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <div>
              <p className="font-bold">Download .ics file</p>
              <p className="text-[10px] text-zinc-400 font-normal">Apple, Outlook, Native</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
