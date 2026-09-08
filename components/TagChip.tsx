/**
 * components/TagChip.tsx
 *
 * Professional tag chip with consistent neutral slate styling,
 * subtle borders, and an active state for filter selections.
 */

interface TagChipProps {
  tag: string
  onClick?: () => void
  active?: boolean
  size?: "sm" | "xs"
}

export default function TagChip({ tag, onClick, active = false, size = "sm" }: TagChipProps) {
  const sizeClasses = size === "xs"
    ? "px-2 py-0.5 text-[11px]"
    : "px-2.5 py-1 text-xs"

  const stateClasses = active
    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm"
    : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-slate-100 hover:border-slate-600"

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center rounded-md border font-medium transition-colors duration-150 active:scale-95 ${sizeClasses} ${stateClasses}`}
      >
        <span>{tag}</span>
      </button>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses} ${stateClasses}`}
    >
      <span>{tag}</span>
    </span>
  )
}
