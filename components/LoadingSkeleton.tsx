/**
 * components/LoadingSkeleton.tsx
 * Animated shimmer skeleton grid matching OpportunityCard layout.
 */

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#12141c]">
      {/* Banner / Header */}
      <div className="skeleton h-36 w-full border-b border-white/[0.06]" />
      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Badges row */}
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-md" />
          <div className="skeleton h-5 w-14 rounded-md" />
        </div>
        {/* Title */}
        <div className="space-y-2">
          <div className="skeleton h-4 w-full rounded-md" />
          <div className="skeleton h-4 w-3/4 rounded-md" />
        </div>
        {/* Organizer */}
        <div className="skeleton h-3.5 w-1/3 rounded-md" />
        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="skeleton h-5 w-20 rounded-md" />
          <div className="flex items-center gap-1.5">
            <div className="skeleton h-7 w-7 rounded-lg" />
            <div className="skeleton h-7 w-16 rounded-lg" />
          </div>
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
