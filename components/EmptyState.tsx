/**
 * components/EmptyState.tsx
 * Shown when no opportunities match the current filters.
 */

interface EmptyStateProps {
  title?: string
  description?: string
  onClear?: () => void
}

export default function EmptyState({
  title = "No listings found",
  description = "Try adjusting your filters or search keywords.",
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-t border-b border-hairline my-6">
      <h3 className="font-serif text-2xl font-normal text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted leading-relaxed">{description}</p>

      {onClear && (
        <button
          onClick={onClear}
          className="mt-6 border border-hairline bg-paper px-4 py-2 text-xs font-medium text-ink transition hover:border-ink hover:bg-paper-muted"
        >
          Reset All Filters
        </button>
      )}
    </div>
  )
}
