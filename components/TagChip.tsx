/**
 * components/TagChip.tsx
 *
 * Editorial tag chip with plain text styling, hairline border,
 * and clean active state for filter selections.
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
    : "px-2.5 py-0.5 text-xs"

  const stateClasses = active
    ? "bg-ink text-paper border-ink font-medium"
    : "bg-paper-muted text-ink-muted border-hairline hover:text-ink hover:border-ink"

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center border font-sans transition-colors duration-150 ${sizeClasses} ${stateClasses}`}
      >
        <span>{tag}</span>
      </button>
    )
  }

  return (
    <span
      className={`inline-flex items-center border font-sans ${sizeClasses} ${stateClasses}`}
    >
      <span>{tag}</span>
    </span>
  )
}
