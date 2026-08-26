"use client"

/**
 * components/Toast.tsx
 *
 * Lightweight, accessible toast notification system for HackFeed.
 * Provides a hook & global `toast` trigger for success, error, and info toasts.
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from "react"

export type ToastType = "success" | "error" | "info"

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Custom event name for triggering toasts from non-React / outside-context scopes
const TOAST_EVENT = "hackfeed:toast"

export const toast = {
  success: (message: string, duration = 3500) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, { detail: { message, type: "success", duration } })
      )
    }
  },
  error: (message: string, duration = 4500) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, { detail: { message, type: "error", duration } })
      )
    }
  },
  info: (message: string, duration = 3500) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(TOAST_EVENT, { detail: { message, type: "info", duration } })
      )
    }
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newToast: ToastItem = { id, type, message, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType; duration?: number }>
      if (customEvent.detail) {
        showToast(customEvent.detail.message, customEvent.detail.type, customEvent.detail.duration)
      }
    }

    window.addEventListener(TOAST_EVENT, handleCustomToast)
    return () => window.removeEventListener(TOAST_EVENT, handleCustomToast)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              t.type === "success"
                ? "border-emerald-500/30 bg-[#0c1815]/90 text-emerald-200 shadow-emerald-950/40"
                : t.type === "error"
                ? "border-rose-500/30 bg-[#1e0e13]/90 text-rose-200 shadow-rose-950/40"
                : "border-violet-500/30 bg-[#120f24]/90 text-violet-200 shadow-violet-950/40"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-xs">
                {t.type === "success" && "✓"}
                {t.type === "error" && "!"}
                {t.type === "info" && "ℹ"}
              </span>
              <p className="text-sm font-medium leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return {
      toast,
      showToast: toast.info,
      removeToast: () => {},
    }
  }
  return context
}
