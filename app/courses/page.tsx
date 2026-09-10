/**
 * app/courses/page.tsx — HackFeed Courses & Certifications
 *
 * Public listing page for curated courses.
 * Domain is the PRIMARY filter (prominent pill tabs).
 * Secondary: price_type, level, provider, full-text search.
 */

import type { Metadata } from "next"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import CoursesFeedClient from "./CoursesFeedClient"
import type { CourseRow } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Courses & Certifications — HackFeed",
  description:
    "Browse free and paid courses by domain — Web Development, AI/ML, Cloud Computing, DSA, Cybersecurity, Data Science. Curated from Coursera, Udemy, freeCodeCamp, NPTEL, Google, and AWS.",
}

interface SearchParams {
  domain?: string
  price_type?: string
  level?: string
  provider?: string
  q?: string
  page?: string
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const domain = sp.domain?.trim() ?? ""
  const priceType = sp.price_type?.trim() ?? ""
  const level = sp.level?.trim() ?? ""
  const provider = sp.provider?.trim() ?? ""
  const q = sp.q?.trim() ?? ""
  const page = Math.max(1, parseInt(sp.page ?? "1", 10))
  const pageSize = 24
  const offset = (page - 1) * pageSize

  const { user } = await getUser()
  const userId = user?.id ?? null

  let courses: CourseRow[] = []
  let totalCount = 0
  let bookmarkedCourseIds = new Set<string>()

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      let query = supabase
        .from("courses")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (domain) query = query.eq("domain", domain)
      if (priceType) query = query.eq("price_type", priceType)
      if (level) query = query.eq("level", level)
      if (provider) query = (query as any).ilike("provider", `%${provider}%`)
      if (q) {
        query = (query as any).or(
          `title.ilike.%${q}%,provider.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`
        )
      }

      const { data, count } = await query
      if (data) courses = data as CourseRow[]
      if (count !== null) totalCount = count

      // Fetch bookmarked course IDs for authenticated user
      if (userId) {
        const { data: bmData } = await (supabase as any)
          .from("bookmarks")
          .select("course_id")
          .eq("user_id", userId)
          .not("course_id", "is", null)

        if (bmData) {
          bookmarkedCourseIds = new Set(
            (bmData as { course_id: string }[]).map((b) => b.course_id)
          )
        }
      }
    } catch (err) {
      console.warn("CoursesPage Supabase query notice:", err)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-24">
      {/* ── Page Header ── */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="text-xs font-serif italic text-ink-muted">Skill building</p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
                Courses &amp; Certifications
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-ink-muted max-w-xl leading-relaxed">
                Curated free and paid courses from Coursera, Udemy, freeCodeCamp, NPTEL, Google, and AWS. Start with a domain — your next skill is one click away.
              </p>
            </div>
            <div className="border border-hairline bg-paper px-4 py-2.5 text-right">
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">Total Courses</p>
              <p className="font-serif text-2xl font-normal text-ink mt-0.5">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Courses Feed ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="py-12 text-center text-ink-muted text-xs">Loading courses…</div>}>
          <CoursesFeedClient
            initialCourses={courses}
            userId={userId}
            bookmarkedCourseIds={bookmarkedCourseIds}
            currentDomain={domain}
            currentPriceType={priceType}
            currentLevel={level}
            currentProvider={provider}
            currentQ={q}
            totalCount={totalCount}
          />
        </Suspense>

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-4 text-xs">
            {page > 1 && (
              <a
                href={`/courses?${new URLSearchParams({ ...(domain && { domain }), ...(priceType && { price_type: priceType }), ...(level && { level }), ...(provider && { provider }), ...(q && { q }), page: String(page - 1) }).toString()}`}
                className="border border-hairline bg-paper px-4 py-2 text-ink transition hover:border-ink hover:bg-paper-muted"
              >
                ← Previous
              </a>
            )}
            <span className="text-ink-muted">
              Page {page} of {Math.ceil(totalCount / pageSize)}
            </span>
            {page < Math.ceil(totalCount / pageSize) && (
              <a
                href={`/courses?${new URLSearchParams({ ...(domain && { domain }), ...(priceType && { price_type: priceType }), ...(level && { level }), ...(provider && { provider }), ...(q && { q }), page: String(page + 1) }).toString()}`}
                className="border border-hairline bg-paper px-4 py-2 text-ink transition hover:border-ink hover:bg-paper-muted"
              >
                Next →
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
