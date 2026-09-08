/**
 * app/layout.tsx — Root layout for HackFeed
 *
 * Ultra-sleek developer aesthetic with Plus Jakarta Sans & Inter,
 * high-contrast dark surfaces, and zero-emoji modern styling.
 */

import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import { ToastProvider } from "@/components/Toast"

const serifFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "HackFeed — The Student Builder Opportunity Bulletin",
    template: "%s | HackFeed",
  },
  description:
    "Live bulletin board aggregating hackathons, engineering challenges, and tech internships across Unstop, Devfolio, HackerEarth, and H2Skill.",
  keywords: ["hackathon", "internship", "developer", "student builder", "Unstop", "Devfolio", "HackerEarth"],
  openGraph: {
    siteName: "HackFeed",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable} font-sans`}>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-signal/20 selection:text-ink">
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
