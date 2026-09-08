"use client"

/**
 * components/OpportunityCover.tsx
 *
 * Robust, aspect-ratio preserved cover image container for HackFeed.
 * - Handles hotlinked external images with loading="lazy" and decoding="async"
 * - Displays a warm skeleton/shimmer placeholder while image loads
 * - Prevents Cumulative Layout Shift (CLS) with fixed aspect ratios
 * - Gracefully falls back to deterministic CoverFallback on empty src or load error
 * - Implements descriptive alt text for accessibility
 */

import React, { useState } from "react"
import CoverFallback from "./CoverFallback"

interface OpportunityCoverProps {
  src?: string | null
  alt: string
  title: string
  type?: string | null
  platform?: string | null
  aspectRatio?: "4/3" | "16/7" | "21/9" | "square" | "auto"
  variant?: "thumbnail" | "hero"
  priority?: boolean
  className?: string
}

export default function OpportunityCover({
  src,
  alt,
  title,
  type = "hackathon",
  platform,
  aspectRatio = "4/3",
  variant = "thumbnail",
  priority = false,
  className = "",
}: OpportunityCoverProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Map aspect ratio string to Tailwind classes
  const aspectClass =
    aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : aspectRatio === "16/7"
      ? "aspect-[16/7]"
      : aspectRatio === "21/9"
      ? "aspect-[21/9]"
      : aspectRatio === "square"
      ? "aspect-square"
      : "aspect-[4/3]"

  // If no image is provided or if the hotlinked image fails to load, render programmatic fallback
  if (!src || hasError) {
    return (
      <div className={`relative overflow-hidden ${aspectClass} ${className}`}>
        <CoverFallback
          title={title}
          type={type}
          platform={platform}
          variant={variant}
          className="w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden bg-paper-muted border border-hairline ${aspectClass} ${className}`}
    >
      {/* Skeleton Shimmer / Blur placeholder while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-paper-muted via-[#ECE8E0] to-paper-muted animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Actual Image with lazy loading and error handler */}
      <img
        src={src}
        alt={alt || title || "Opportunity cover"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
