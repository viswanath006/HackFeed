"use client"

import React, { useEffect, useRef, useState } from "react"

interface VideoScene {
  id: "typing" | "builder"
  label: string
  src: string
  poster: string
}

const SCENES: VideoScene[] = [
  {
    id: "typing",
    label: "Live Code",
    src: "/videos/hero-typing.mp4",
    poster: "/videos/hero-typing-poster.jpg",
  },
  {
    id: "builder",
    label: "Student Workshop",
    src: "/videos/hero-builder.mp4",
    poster: "/videos/hero-builder-poster.jpg",
  },
]

export default function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const activeScene = SCENES[activeSceneIndex]

  // Handle prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches && videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches && videoRef.current) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Auto-play when scene changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          // Browser prevented autoplay
          setIsPlaying(false)
        })
      }
    }
  }, [activeSceneIndex])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const cycleScene = () => {
    setActiveSceneIndex((prev) => (prev + 1) % SCENES.length)
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* 1. HTML5 Background Video Container */}
      <div className="absolute inset-0 opacity-25 dark:opacity-40 transition-opacity duration-1000">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={activeScene.poster}
          onLoadedData={() => setIsLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } saturate-[0.85] contrast-[1.05]`}
        >
          <source src={activeScene.src} type="video/mp4" />
        </video>
      </div>

      {/* 2. Editorial Grain & Technical Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 3px)`,
        }}
      />

      {/* 3. Horizontal Gradient Mask — protects left-aligned headline & text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5F0] via-[#F7F5F0]/90 sm:via-[#F7F5F0]/75 to-transparent dark:from-[#12110F] dark:via-[#12110F]/90 sm:dark:via-[#12110F]/75 dark:to-transparent" />

      {/* 4. Vertical Edge Gradients — seamless boundary with masthead and feed */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F5F0]/80 via-transparent to-[#F7F5F0] dark:from-[#12110F]/80 dark:via-transparent dark:to-[#12110F]" />

      {/* 5. Interactive Video Controls Pill (Bottom-Right, pointer-events-auto) */}
      <div className="absolute bottom-4 right-4 sm:right-8 z-20 pointer-events-auto flex items-center gap-2 rounded-full border border-hairline bg-paper/90 dark:bg-[#1A1815]/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-sans text-ink-muted shadow-sm transition hover:border-ink/40">
        {/* Recording status dot */}
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            isPlaying ? "bg-signal animate-pulse" : "bg-ink-muted/40"
          }`}
          title={isPlaying ? "Live video stream active" : "Video stream paused"}
        />

        {/* Scene switch trigger */}
        <button
          type="button"
          onClick={cycleScene}
          className="hover:text-ink transition flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider"
          title="Switch background video scene"
        >
          <span>{activeScene.label}</span>
          <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <path d="M2 4l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="text-hairline">|</span>

        {/* Pause / Play button */}
        <button
          type="button"
          onClick={togglePlay}
          className="hover:text-ink transition p-0.5 rounded"
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
          title={isPlaying ? "Pause background motion" : "Resume background motion"}
        >
          {isPlaying ? (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
