"use client"

/**
 * components/ThemeProvider.tsx
 *
 * Zero-dependency theme provider supporting "light" and "dark" modes.
 * Persists preference in localStorage and synchronizes with system preferences.
 * Toggles the `.dark` class and `data-theme` attribute on document.documentElement.
 */

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = "hackfeed-theme"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read persisted theme from localStorage or system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === "dark" || stored === "light") {
      setThemeState(stored)
      applyTheme(stored)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const initialTheme = prefersDark ? "dark" : "light"
      setThemeState(initialTheme)
      applyTheme(initialTheme)
    }
    setMounted(true)

    // Listen for system theme changes if no explicit user override
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = (e: MediaQueryListEvent) => {
      const userOverride = localStorage.getItem(THEME_STORAGE_KEY)
      if (!userOverride) {
        const nextTheme = e.matches ? "dark" : "light"
        setThemeState(nextTheme)
        applyTheme(nextTheme)
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    if (t === "dark") {
      root.classList.add("dark")
      root.setAttribute("data-theme", "dark")
      root.style.colorScheme = "dark"
    } else {
      root.classList.remove("dark")
      root.setAttribute("data-theme", "light")
      root.style.colorScheme = "light"
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

const defaultThemeContext: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
}

export function useTheme() {
  const context = useContext(ThemeContext)
  return context ?? defaultThemeContext
}
