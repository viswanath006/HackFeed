/**
 * components/DeadlineBadge.tsx
 *
 * Editorial deadline indicator where urgency is expressed through typography itself:
 * prominent Fraunces serif numerals paired with clean label typography,
 * with urgent signal orange accent strictly for <= 2 days.
 */

interface DeadlineBadgeProps {
  deadline: string | null
  variant?: "prominent" | "compact" | "inline"
}

function daysUntil(iso: string): number {
  const now  = new Date()
  const then = new Date(iso)
  return Math.ceil((then.getTime() - now.getTime()) / 86_400_000)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function DeadlineBadge({
  deadline,
  variant = "prominent",
}: DeadlineBadgeProps) {
  if (!deadline) {
    return (
      <span className="text-xs text-ink-muted font-normal italic font-serif">
        Rolling deadline
      </span>
    )
  }

  const days = daysUntil(deadline)

  if (days < 0) {
    return (
      <span className="font-serif text-xs italic text-ink-faint">
        Closed
      </span>
    )
  }

  if (days === 0) {
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className="font-serif text-base sm:text-lg font-bold text-signal">Today</span>
        <span className="text-[11px] text-signal font-medium">closes tonight</span>
      </span>
    )
  }

  if (variant === "compact" || variant === "inline") {
    return (
      <span className="inline-flex items-baseline gap-1">
        <span className={`font-serif font-bold text-sm ${days <= 2 ? "text-signal" : "text-ink"}`}>
          {days}
        </span>
        <span className="text-[11px] text-ink-muted">
          {days === 1 ? "day left" : "days left"}
        </span>
      </span>
    )
  }

  // Default "prominent" bulletin row display:
  return (
    <div className="flex flex-col items-end text-right">
      <div className="inline-flex items-baseline gap-1">
        <span
          className={`font-serif text-xl sm:text-2xl font-bold leading-none ${
            days <= 2 ? "text-signal" : "text-ink"
          }`}
        >
          {days}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-ink-muted font-medium">
          {days === 1 ? "day left" : "days left"}
        </span>
      </div>
      <span className="mt-0.5 text-[10px] text-ink-faint font-sans">
        Due {formatDate(deadline)}
      </span>
    </div>
  )
}
