/**
 * components/LoadingSkeleton.tsx
 * Animated shimmer skeleton grid matching OpportunityCard layout.
 */

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0f0f1a]">
      {/* Banner */}
      <div className="skeleton h-40 w-full" />
      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Badges row */}
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-full" />
          <div className="skeleton h-5 w-14 rounded-full" />
        </div>
        {/* Title */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-3/4 rounded-lg" />
        </div>
        {/* Organizer */}
        <div className="skeleton h-3.5 w-1/2 rounded-lg" />
        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-7 w-7 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  count?: number
}

export default function LoadingSkeleton({ count = 9 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
