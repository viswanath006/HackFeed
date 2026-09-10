/**
 * app/courses/[id]/page.tsx — Course Detail Page
 *
 * Full editorial detail for a single curated course.
 * "View Course" outbound link mirrors "Apply Now" on opportunity detail.
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/getUser"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import TagChip from "@/components/TagChip"
import CourseDetailClient from "./CourseDetailClient"
import type { CourseRow } from "@/lib/supabase/types"
import { sanitizeExternalUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"

// ── SEO Metadata ───────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  let data: Partial<CourseRow> | null = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: record } = await supabase
        .from("courses")
        .select("title, description, provider, domain")
        .eq("id", id)
        .single()
      data = record as Partial<CourseRow> | null
    } catch { /* fallback */ }
  }

  if (!data || !data.title) return { title: "Course not found — HackFeed" }

  return {
    title: `${data.title} — HackFeed Courses`,
    description:
      data.description?.slice(0, 155) ??
      `${data.domain} course from ${data.provider}, curated by HackFeed.`,
    openGraph: {
      title: data.title,
      description: data.description?.slice(0, 155) ?? "",
      type: "article",
    },
  }
}

// ── Price type display ─────────────────────────────────────────────────────

function PriceTypeDisplay({ priceType, price }: { priceType: string; price?: string | null }) {
  if (priceType === "free") {
    return <span className="text-forest font-semibold">Free</span>
  }
  if (priceType === "free_with_paid_certificate") {
    return (
      <span>
        <span className="text-forest font-semibold">Free to audit</span>
        {price && <span className="text-ink-muted"> · Certificate: <span className="font-medium text-ink">{price}</span></span>}
      </span>
    )
  }
  return <span className="font-semibold text-ink">{price ?? "Paid"}</span>
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user } = await getUser()
  const userId = user?.id ?? null

  let course: CourseRow | null = null
  let isBookmarked = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single()

      if (data) course = data as CourseRow

      if (userId && course) {
        const { data: bm } = await (supabase as any)
          .from("bookmarks")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", course.id)
          .maybeSingle()
        if (bm) isBookmarked = true
      }
    } catch (err) {
      console.warn("CourseDetailPage Supabase query notice:", err)
    }
  }

  if (!course) notFound()

  const externalUrl = sanitizeExternalUrl(course.course_url)

  return (
    <div className="min-h-screen bg-paper text-ink pb-24">
      {/* ── Back nav ── */}
      <div className="border-b border-hairline bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink transition"
          >
            <span>← Back to Courses</span>
          </Link>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">

          {/* Left Column: Title, Metadata, Body (8 cols) */}
          <article className="lg:col-span-8">
            {/* Classification tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="border-l-2 border-ink pl-2 font-medium uppercase tracking-wider text-ink">
                {course.provider}
              </span>
              <span className="text-ink-muted">{course.domain}</span>
              {course.level && (
                <span className="text-ink-muted capitalize">{course.level}</span>
              )}
              {course.is_featured && (
                <span className="font-serif italic text-ink">Featured</span>
              )}
            </div>

            {/* Course Title */}
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.15] tracking-tight text-ink">
              {course.title}
            </h1>

            {/* Rating */}
            {course.rating && (
              <p className="mt-3 text-sm text-ink-muted">
                <span className="text-amber-500 text-base">★</span>{" "}
                <span className="font-semibold text-ink">{course.rating.toFixed(1)}</span>
                <span className="text-ink-muted/60"> / 5.0 rating</span>
              </p>
            )}

            <div className="my-8 border-b border-hairline" />

            {/* Description */}
            {course.description && (
              <div className="space-y-4">
                <h2 className="font-serif text-lg font-normal text-ink">About this course</h2>
                <div className="max-w-prose text-sm sm:text-base text-ink/90 leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </div>
              </div>
            )}

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="mt-8 border-t border-hairline pt-6">
                <h2 className="font-serif text-xs uppercase tracking-widest text-ink-muted mb-3">
                  Topics Covered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} size="sm" />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Right Column: Action sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Primary CTA */}
            <div className="border border-hairline bg-paper p-6 space-y-4">
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="view-course-btn"
                className="flex w-full items-center justify-center border border-signal bg-signal px-5 py-3.5 text-xs font-medium text-white transition hover:bg-signal/90 active:scale-95 text-center"
              >
                View Course on {course.provider}
              </a>

              <CourseDetailClient
                courseId={course.id}
                userId={userId}
                initialBookmarked={isBookmarked}
              />

              <p className="text-[11px] text-ink-muted text-center pt-2 border-t border-hairline">
                HackFeed curates this course. You will be taken to {course.provider}'s website.
              </p>
            </div>

            {/* Course details */}
            <div className="border border-hairline bg-paper p-6 space-y-3">
              <h3 className="font-serif text-xs uppercase tracking-widest text-ink-muted pb-2 border-b border-hairline">
                Course Details
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Domain</dt>
                  <dd className="font-medium text-ink text-right">{course.domain}</dd>
                </div>
                {course.level && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Level</dt>
                    <dd className="font-medium text-ink text-right capitalize">{course.level}</dd>
                  </div>
                )}
                {course.duration && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Duration</dt>
                    <dd className="font-medium text-ink text-right">{course.duration}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Price</dt>
                  <dd className="font-medium text-right">
                    <PriceTypeDisplay priceType={course.price_type} price={course.price} />
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Certificate</dt>
                  <dd className={`font-medium text-right ${course.certificate_provided ? "text-forest" : "text-ink-muted"}`}>
                    {course.certificate_provided ? "Provided" : "Not included"}
                  </dd>
                </div>
                {course.provider && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-muted">Platform</dt>
                    <dd className="font-medium text-ink text-right">{course.provider}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Back to courses */}
            <Link
              href="/courses"
              className="block text-center text-xs text-ink-muted hover:text-ink transition underline decoration-ink-muted/40 underline-offset-4"
            >
              Browse all courses
            </Link>
          </aside>
        </div>
      </main>
    </div>
  )
}
