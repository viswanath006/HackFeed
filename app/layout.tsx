/**
 * app/layout.tsx — Root layout for HackFeed
 *
 * Ultra-sleek developer aesthetic with Plus Jakarta Sans & Inter,
 * high-contrast dark surfaces, and zero-emoji modern styling.
 */

import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import { ToastProvider } from "@/components/Toast"

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
})

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "HackFeed — The Developer Opportunity Aggregator",
    template: "%s | HackFeed",
  },
  description:
    "Aggregated real-time feed of hackathons, engineering challenges, and tech internships across Unstop, Devfolio, HackerEarth, and H2Skill.",
  keywords: ["hackathon", "internship", "developer", "engineering", "Unstop", "Devfolio", "HackerEarth"],
  openGraph: {
    siteName: "HackFeed",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} font-sans`}>
      <body className="min-h-screen bg-[#07070c] font-sans text-zinc-100 antialiased selection:bg-violet-500/30 selection:text-white">
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
