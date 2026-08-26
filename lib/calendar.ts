/**
 * lib/calendar.ts
 *
 * Calendar export utilities:
 * 1. RFC 5545 standard-compliant `.ics` generation (single & multi-event)
 * 2. Google Calendar quick-add URL constructor
 */

import type { OpportunityRow } from "./supabase/types"

/**
 * Format a Date or ISO string into an iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
export function formatIcsDate(dateInput: string | Date | null | undefined): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  if (isNaN(d.getTime())) {
    const fallback = new Date()
    return fallback.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

/**
 * Escape text for iCalendar format
 */
function escapeIcsText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

/**
 * Generate an RFC 5545 .ics string for a single opportunity
 */
export function generateSingleIcs(opportunity: OpportunityRow, appUrl: string = ""): string {
  return generateMultiIcs([opportunity], appUrl)
}

/**
 * Generate an RFC 5545 .ics string for multiple opportunities (e.g. all bookmarked)
 */
export function generateMultiIcs(opportunities: OpportunityRow[], appUrl: string = ""): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HackFeed//Hackathons and Internships Aggregator//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:HackFeed Saved Opportunities",
  ]

  const nowStamp = formatIcsDate(new Date())

  for (const op of opportunities) {
    // Start date defaults to application_deadline or start_date
    const startDateRaw = op.start_date || op.application_deadline || new Date().toISOString()
    const endDateRaw = op.end_date || op.application_deadline || startDateRaw

    const dtStart = formatIcsDate(startDateRaw)
    // Add 1 hour if start and end are identical
    let dtEnd = formatIcsDate(endDateRaw)
    if (dtStart === dtEnd) {
      const d = new Date(startDateRaw)
      d.setHours(d.getHours() + 2)
      dtEnd = formatIcsDate(d)
    }

    const detailUrl = appUrl ? `${appUrl}/opportunities/${op.id}` : op.source_url
    const description = [
      `Opportunity: ${op.title}`,
      `Type: ${op.type}`,
      `Platform: ${op.source_platform || "HackFeed"}`,
      op.prize_pool ? `Prize: ${op.prize_pool}` : null,
      op.stipend ? `Stipend: ${op.stipend}` : null,
      op.application_deadline ? `Deadline: ${new Date(op.application_deadline).toLocaleString()}` : null,
      `\nView on HackFeed: ${detailUrl}`,
      `Apply directly: ${op.source_url}`,
    ]
      .filter(Boolean)
      .join("\n")

    lines.push("BEGIN:VEVENT")
    lines.push(`UID:hackfeed-${op.id}@hackfeed.dev`)
    lines.push(`DTSTAMP:${nowStamp}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(`SUMMARY:${escapeIcsText(`[HackFeed] ${op.title}`)}`)
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`)
    if (op.location) {
      lines.push(`LOCATION:${escapeIcsText(op.location)}`)
    }
    lines.push(`URL:${detailUrl}`)
    lines.push("STATUS:CONFIRMED")
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

/**
 * Triggers a client-side download of a .ics file
 */
export function downloadIcsFile(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const link = document.createElement("a")
  link.href = window.URL.createObjectURL(blob)
  link.setAttribute("download", filename.endsWith(".ics") ? filename : `${filename}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Construct Google Calendar "Quick Add" URL
 */
export function getGoogleCalendarUrl(opportunity: OpportunityRow, appUrl: string = ""): string {
  const startDateRaw = opportunity.start_date || opportunity.application_deadline || new Date().toISOString()
  const endDateRaw = opportunity.end_date || opportunity.application_deadline || startDateRaw

  const dtStart = formatIcsDate(startDateRaw)
  let dtEnd = formatIcsDate(endDateRaw)
  if (dtStart === dtEnd) {
    const d = new Date(startDateRaw)
    d.setHours(d.getHours() + 2)
    dtEnd = formatIcsDate(d)
  }

  const detailUrl = appUrl ? `${appUrl}/opportunities/${opportunity.id}` : opportunity.source_url
  const details = [
    `Opportunity: ${opportunity.title}`,
    `Type: ${opportunity.type}`,
    `Platform: ${opportunity.source_platform || "HackFeed"}`,
    opportunity.prize_pool ? `Prize: ${opportunity.prize_pool}` : null,
    opportunity.stipend ? `Stipend: ${opportunity.stipend}` : null,
    `\nView on HackFeed: ${detailUrl}`,
    `Apply directly: ${opportunity.source_url}`,
  ]
    .filter(Boolean)
    .join("\n")

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[HackFeed] ${opportunity.title}`,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: opportunity.location || (opportunity.mode === "online" ? "Online" : "See Details"),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
