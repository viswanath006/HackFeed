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
import { ThemeProvider } from "@/components/ThemeProvider"

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

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('hackfeed-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serifFont.variable} ${sansFont.variable} font-sans`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-signal/20 selection:text-ink transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
