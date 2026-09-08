"use client"

/**
 * components/CoverFallback.tsx
 *
 * Deterministic, programmatic editorial cover generator for listings without an image.
 * Uses platform brand accents from the Paper & Ink design system,
 * subtle hairline grid lines, and large Fraunces serif typography.
 */

import React from "react"

interface CoverFallbackProps {
  title: string
  type?: string | null
  platform?: string | null
  aspectRatio?: "4/3" | "16/7" | "21/9" | "square" | "auto"
  variant?: "thumbnail" | "hero"
  className?: string
}

interface PlatformTheme {
  name: string
  bg: string
  text: string
  border: string
  accent: string
  watermarkColor: string
  patternStroke: string
}

const PLATFORM_THEMES: Record<string, PlatformTheme> = {
  unstop: {
    name: "Unstop",
    bg: "bg-[#FDF6ED]",
    text: "text-[#8C4A14]",
    border: "border-[#EADBCA]",
    accent: "text-amber-700",
    watermarkColor: "rgba(140, 74, 20, 0.08)",
    patternStroke: "rgba(140, 74, 20, 0.07)",
  },
  devfolio: {
    name: "Devfolio",
    bg: "bg-[#F0F4F9]",
    text: "text-[#1E3A8A]",
    border: "border-[#D1DFEC]",
    accent: "text-blue-700",
    watermarkColor: "rgba(30, 58, 138, 0.08)",
    patternStroke: "rgba(30, 58, 138, 0.07)",
  },
  hackerearth: {
    name: "HackerEarth",
    bg: "bg-[#EFF6F2]",
    text: "text-[#1B4332]",
    border: "border-[#CDE2D6]",
    accent: "text-forest",
    watermarkColor: "rgba(27, 67, 50, 0.08)",
    patternStroke: "rgba(27, 67, 50, 0.07)",
  },
  h2skill: {
    name: "H2Skill",
    bg: "bg-[#F3F1EE]",
    text: "text-[#282522]",
    border: "border-[#DAD5CC]",
    accent: "text-ink",
    watermarkColor: "rgba(40, 37, 34, 0.08)",
    patternStroke: "rgba(40, 37, 34, 0.07)",
  },
  hack2skill: {
    name: "Hack2Skill",
    bg: "bg-[#F3F1EE]",
    text: "text-[#282522]",
    border: "border-[#DAD5CC]",
    accent: "text-ink",
    watermarkColor: "rgba(40, 37, 34, 0.08)",
    patternStroke: "rgba(40, 37, 34, 0.07)",
  },
}

const DEFAULT_THEME: PlatformTheme = {
  name: "Bulletin",
  bg: "bg-paper-muted",
  text: "text-ink-muted",
  border: "border-hairline",
  accent: "text-ink",
  watermarkColor: "rgba(22, 21, 18, 0.06)",
  patternStroke: "rgba(22, 21, 18, 0.05)",
}

function getPlatformTheme(platform?: string | null): PlatformTheme {
  if (!platform) return DEFAULT_THEME
  const key = platform.toLowerCase().replace(/\s+/g, "")
  return PLATFORM_THEMES[key] ?? {
    ...DEFAULT_THEME,
    name: platform,
  }
}

/** Deterministic hash for subtle pattern variation */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export default function CoverFallback({
  title,
  type = "hackathon",
  platform,
  variant = "thumbnail",
  className = "",
}: CoverFallbackProps) {
  const theme = getPlatformTheme(platform)
  const isHero = variant === "hero"
  const isHackathon = (type || "").toLowerCase().includes("hack")
  const typeLabel = isHackathon ? "HACKATHON" : "INTERNSHIP"
  const shortTypeLabel = isHackathon ? "HACK" : "INTERN"
  
  // Deterministic seed from title
  const seed = hashString(title || "hackfeed")
  const patternIndex = seed % 3

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none ${theme.bg} ${theme.border} ${className}`}
      aria-hidden="true"
    >
      {/* Background SVG Grid / Ruled Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid-${seed}`}
            width={isHero ? "32" : "16"}
            height={isHero ? "32" : "16"}
            patternUnits="userSpaceOnUse"
          >
            {patternIndex === 0 && (
              // Fine crosshatch
              <path
                d={`M ${isHero ? "32" : "16"} 0 L 0 ${isHero ? "32" : "16"}`}
                fill="none"
                stroke={theme.patternStroke}
                strokeWidth="1"
              />
            )}
            {patternIndex === 1 && (
              // Fine grid
              <path
                d={`M ${isHero ? "32" : "16"} 0 L 0 0 0 ${isHero ? "32" : "16"}`}
                fill="none"
                stroke={theme.patternStroke}
                strokeWidth="0.75"
              />
            )}
            {patternIndex === 2 && (
              // Horizontal ruled lines
              <path
                d={`M 0 ${isHero ? "16" : "8"} L ${isHero ? "32" : "16"} ${isHero ? "16" : "8"}`}
                fill="none"
                stroke={theme.patternStroke}
                strokeWidth="0.75"
              />
            )}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${seed})`} />
      </svg>

      {/* Large Watermark Typography in Fraunces Serif */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <span
          className="font-serif font-bold uppercase tracking-widest whitespace-nowrap select-none"
          style={{
            fontSize: isHero ? "clamp(3rem, 12vw, 9rem)" : "clamp(1.4rem, 4vw, 2.2rem)",
            color: theme.watermarkColor,
            letterSpacing: isHero ? "0.18em" : "0.08em",
            transform: isHero ? "rotate(-3deg)" : "rotate(-5deg)",
          }}
        >
          {isHero ? typeLabel : shortTypeLabel}
        </span>
      </div>

      {/* Top Header Row (Platform + Monogram) */}
      <div className="relative z-10 flex items-center justify-between p-2 sm:p-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-white/70 backdrop-blur-xs border border-current/10 ${theme.text}`}
          >
            {theme.name}
          </span>
        </div>
        <span
          className={`font-serif text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${theme.text} opacity-60`}
        >
          {isHackathon ? "Contest" : "Hiring"}
        </span>
      </div>

      {/* Center/Bottom Content */}
      <div className="relative z-10 p-2 sm:p-3 pt-0">
        {isHero ? (
          <div className="max-w-xl">
            <p className={`font-serif text-2xl sm:text-4xl font-normal leading-tight tracking-tight ${theme.text}`}>
              {typeLabel}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-ink-muted opacity-80">
              Official Bulletin Listing
            </p>
          </div>
        ) : (
          <div>
            <span
              className={`block font-serif text-xs sm:text-sm font-semibold tracking-tight leading-none ${theme.text}`}
            >
              {typeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Hairline Rule */}
      <div className="relative z-10 h-[2px] w-full bg-current opacity-15" />
    </div>
  )
}
