/**
 * components/DeadlineBadge.tsx
 *
 * Countdown badge with urgency color coding.
 *  < 0 days → "Closed"        (zinc)
 *  0–2 days → "X days left"   (red, pulsing)
 *  3–6 days → "X days left"   (amber)
 *  7–13 days→ "X days left"   (yellow)
 * 14+ days  → formatted date  (emerald)
 * null      → nothing
 */

interface DeadlineBadgeProps {
  deadline: string | null
  showLabel?: boolean
  /** "badge" = pill, "inline" = plain text */
  variant?: "badge" | "inline"
}

function daysUntil(iso: string): number {
  const now  = new Date()
  const then = new Date(iso)
  return Math.ceil((then.getTime() - now.getTime()) / 86_400_000)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export default function DeadlineBadge({
  deadline,
  variant = "badge",
}: DeadlineBadgeProps) {
  if (!deadline) return null

  const days = daysUntil(deadline)

  let label: string
  let cls: string
  let pulse = false

  if (days < 0) {
    label = "Closed"
    cls   = "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"
  } else if (days <= 2) {
    label = days === 0 ? "Closes today!" : `${days}d left`
    cls   = "bg-red-500/20 text-red-300 ring-red-500/30"
    pulse = true
  } else if (days <= 6) {
    label = `${days}d left`
    cls   = "bg-amber-500/20 text-amber-300 ring-amber-500/30"
  } else if (days <= 13) {
    label = `${days}d left`
    cls   = "bg-yellow-500/15 text-yellow-300 ring-yellow-500/25"
  } else {
    label = formatDate(deadline)
    cls   = "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
  }

  if (variant === "inline") {
    return (
      <span className={`font-mono text-[11px] font-semibold ${days < 0 ? "text-zinc-500" : days <= 2 ? "text-red-400" : days <= 6 ? "text-amber-400" : "text-emerald-400"}`}>
        {label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
        </span>
      )}
      {label}
    </span>
  )
}
