"use client"

/**
 * components/AddToCalendarButton.tsx
 *
 * Dropdown button allowing users to export an opportunity to their calendar:
 * 1. Download .ics (Apple Calendar, Outlook, OS native)
 * 2. Add to Google Calendar (opens pre-filled template in new tab)
 * - Grounded in Paper & Ink editorial aesthetic
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
        className={`group flex items-center justify-center gap-2 border px-4 py-2.5 text-xs font-medium transition-all w-full ${
          variant === "primary"
            ? "border-ink bg-ink text-paper hover:bg-ink/90"
            : "border-hairline bg-paper text-ink hover:border-ink hover:bg-paper-muted"
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted">
          <rect x="3" y="4" width="18" height="18" rx="0" ry="0" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>Add to Calendar</span>
        <svg
          className={`h-3 w-3 text-ink-muted transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
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
        <div className="absolute right-0 z-50 mt-1 w-56 border border-hairline bg-paper p-1 shadow-lg backdrop-blur-md focus:outline-none">
          <button
            type="button"
            onClick={handleGoogleCalendar}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-ink transition hover:bg-paper-muted"
          >
            <span className="flex h-6 w-6 items-center justify-center border border-hairline bg-paper-muted text-ink-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-ink">Google Calendar</p>
              <p className="text-[10px] text-ink-muted">Opens template in new tab</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-ink transition hover:bg-paper-muted border-t border-hairline"
          >
            <span className="flex h-6 w-6 items-center justify-center border border-hairline bg-paper-muted text-ink-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="0" ry="0" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-ink">Apple / Outlook (.ics)</p>
              <p className="text-[10px] text-ink-muted">Downloads standard file</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
