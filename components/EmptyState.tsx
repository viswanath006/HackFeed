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
  title = "No opportunities found",
  description = "Try adjusting your filters or search query.",
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-content-center items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="opacity-50"
            aria-hidden="true"
          >
            <circle cx="22" cy="22" r="14" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M32 32L42 42" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M17 22h10M22 17v10" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-500 leading-relaxed">{description}</p>

      {onClear && (
        <button
          onClick={onClear}
          className="mt-6 rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-violet-500/40 hover:text-violet-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
