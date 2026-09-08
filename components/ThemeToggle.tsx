"use client"

/**
 * components/ThemeToggle.tsx
 *
 * Tactile editorial switch button for toggling between Light and Dark mode.
 * Styled with hairline borders and smooth icon transitions.
 */

import React, { useEffect, useState } from "react"
import { useTheme } from "./ThemeProvider"

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render placeholder with identical dimensions to prevent layout shift
    return (
      <div
        className={`h-8 w-8 border border-hairline bg-paper-muted ${className}`}
        aria-hidden="true"
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      className={`relative inline-flex h-8 items-center justify-center border border-hairline bg-paper px-2 text-ink transition-colors hover:border-ink hover:bg-paper-muted focus-visible:outline-none ${
        showLabel ? "gap-2 px-3 text-xs font-medium" : "w-8"
      } ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        // Sun Icon for switching to light mode
        <svg
          className="h-4 w-4 text-ink transition-transform duration-200 hover:rotate-45"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ) : (
        // Moon Icon for switching to dark mode
        <svg
          className="h-4 w-4 text-ink transition-transform duration-200 hover:-rotate-12"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      )}

      {showLabel && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  )
}
