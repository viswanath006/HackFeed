/**
 * components/TagChip.tsx
 * Reusable tag pill with deterministic color from the tag string.
 */

interface TagChipProps {
  tag: string
  onClick?: () => void
  active?: boolean
  size?: "sm" | "xs"
}

/** Deterministic hue 0-359 from a string */
function tagHue(tag: string): number {
  let h = 0
  for (let i = 0; i < tag.length; i++) {
    h = (tag.charCodeAt(i) + ((h << 5) - h)) >>> 0
  }
  return h % 360
}

export default function TagChip({ tag, onClick, active, size = "sm" }: TagChipProps) {
  const hue = tagHue(tag)
  const style = {
    backgroundColor: `hsla(${hue}, 70%, 60%, ${active ? 0.25 : 0.12})`,
    color:           `hsl(${hue}, 80%, 75%)`,
    borderColor:     `hsla(${hue}, 70%, 60%, ${active ? 0.5 : 0.2})`,
  }
  const base = size === "xs"
    ? "px-2 py-0.5 text-[10px]"
    : "px-2.5 py-1 text-xs"

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`${base} inline-flex items-center rounded-full border font-medium transition-all hover:opacity-90 active:scale-95`}
    >
      {tag}
    </button>
  ) : (
    <span
      style={style}
      className={`${base} inline-flex items-center rounded-full border font-medium`}
    >
      {tag}
    </span>
  )
}
