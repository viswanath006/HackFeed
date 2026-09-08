/**
 * components/LoadingSkeleton.tsx
 * Shimmer skeleton rows matching the editorial bulletin listing layout.
 */

function SkeletonRow() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 py-5 px-3 border-b border-hairline bg-paper">
      <div className="space-y-2.5 flex-1">
        <div className="flex items-center gap-3">
          <div className="skeleton h-3.5 w-16" />
          <div className="skeleton h-3 w-12" />
        </div>
        <div className="skeleton h-6 w-3/4 max-w-md" />
        <div className="skeleton h-3.5 w-1/3" />
      </div>
      <div className="flex items-center gap-6 sm:self-center">
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-8 w-24" />
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  count?: number
}

export default function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <div className="border-t border-hairline divide-y divide-hairline">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
