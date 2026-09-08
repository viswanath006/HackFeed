/**
 * components/DeadlineBadge.tsx
 *
 * Professional status and deadline countdown indicator.
 * Uses clean sans-serif typography, subtle semantic borders, and crisp dot indicators.
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export default function DeadlineBadge({
  deadline,
  variant = "badge",
}: DeadlineBadgeProps) {
  if (!deadline) return null

  const days = daysUntil(deadline)

  let label: string
  let badgeCls: string
  let dotCls: string
  let pulse = false

  if (days < 0) {
    label = "Closed"
    badgeCls = "bg-slate-800/80 text-slate-400 border border-slate-700/60"
    dotCls = "bg-slate-500"
  } else if (days <= 2) {
    label = days === 0 ? "Closes today" : `${days}d left`
    badgeCls = "bg-rose-500/10 text-rose-300 border border-rose-500/30"
    dotCls = "bg-rose-400"
    pulse = true
  } else if (days <= 6) {
    label = `${days}d left`
    badgeCls = "bg-amber-500/10 text-amber-300 border border-amber-500/25"
    dotCls = "bg-amber-400"
  } else {
    label = `Due ${formatDate(deadline)}`
    badgeCls = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    dotCls = "bg-emerald-400"
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${days < 0 ? "text-slate-500" : days <= 2 ? "text-rose-400" : days <= 6 ? "text-amber-400" : "text-emerald-400"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
        {label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight ${badgeCls}`}
    >
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        {pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dotCls} opacity-75`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotCls}`} />
      </span>
      <span>{label}</span>
    </span>
  )
}
