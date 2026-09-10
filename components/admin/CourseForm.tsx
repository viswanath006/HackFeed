"use client"

/**
 * components/admin/CourseForm.tsx
 *
 * Shared create / edit form for courses.
 * Works in both "new" and "edit" mode via the `mode` prop.
 * All fields from the courses schema are included.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CourseRow, CoursePriceType } from "@/lib/supabase/types"
import { COURSE_DOMAINS } from "@/lib/supabase/types"

// ── Types ──────────────────────────────────────────────────────────────────

interface CourseFormProps {
  mode: "new" | "edit"
  initial?: CourseRow
  action: (formData: FormData) => Promise<{ error?: string }>
}

interface FieldErrors {
  title?: string
  provider?: string
  domain?: string
  course_url?: string
  rating?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Label({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-zinc-300">
      {children}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  )
}

function Input({ id, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string }) {
  return (
    <>
      <input
        id={id}
        {...props}
        className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:ring-1 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
            : "border-white/10 focus:border-violet-500/60 focus:ring-violet-500/30"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </>
  )
}

function Textarea({ id, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; error?: string }) {
  return (
    <>
      <textarea
        id={id}
        {...props}
        rows={4}
        className={`w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:ring-1 resize-none ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
            : "border-white/10 focus:border-violet-500/60 focus:ring-violet-500/30"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </>
  )
}

function Select({ id, children, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string; error?: string; children: React.ReactNode }) {
  return (
    <>
      <select
        id={id}
        {...props}
        className={`w-full rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:ring-1 ${
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
            : "border-white/10 focus:border-violet-500/60 focus:ring-violet-500/30"
        }`}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CourseForm({ mode, initial, action }: CourseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [priceType, setPriceType] = useState<CoursePriceType>(initial?.price_type ?? "free")

  function validate(data: FormData): FieldErrors {
    const errors: FieldErrors = {}
    const title = (data.get("title") as string)?.trim()
    const provider = (data.get("provider") as string)?.trim()
    const domain = data.get("domain") as string
    const courseUrl = (data.get("course_url") as string)?.trim()
    const rating = (data.get("rating") as string)?.trim()

    if (!title) errors.title = "Title is required."
    if (!provider) errors.provider = "Provider is required."
    if (!domain) errors.domain = "Domain is required."
    if (!courseUrl) {
      errors.course_url = "Course URL is required."
    } else if (!isValidUrl(courseUrl)) {
      errors.course_url = "Must be a valid URL (include https://)."
    }
    if (rating) {
      const n = parseFloat(rating)
      if (isNaN(n) || n < 0 || n > 5) {
        errors.rating = "Rating must be a number between 0 and 5."
      }
    }
    return errors
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errors = validate(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setServerError(null)

    startTransition(async () => {
      const result = await action(formData)
      if (result?.error) {
        setServerError(result.error)
      } else {
        router.push("/admin/courses")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {serverError}
        </div>
      )}

      {/* ── Core Info ── */}
      <Section title="Core Info">
        <div>
          <Label htmlFor="cf-title" required>Title</Label>
          <Input
            id="cf-title"
            name="title"
            placeholder="e.g. Machine Learning Specialization"
            defaultValue={initial?.title}
            error={fieldErrors.title}
            required
          />
        </div>
        <Grid2>
          <div>
            <Label htmlFor="cf-provider" required>Provider</Label>
            <Input
              id="cf-provider"
              name="provider"
              placeholder="e.g. Coursera, Udemy, freeCodeCamp"
              defaultValue={initial?.provider}
              error={fieldErrors.provider}
              required
            />
          </div>
          <div>
            <Label htmlFor="cf-domain" required>Domain</Label>
            <Select id="cf-domain" name="domain" defaultValue={initial?.domain ?? ""} error={fieldErrors.domain} required>
              <option value="" disabled>Select domain…</option>
              {COURSE_DOMAINS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </Grid2>
        <Grid2>
          <div>
            <Label htmlFor="cf-level">Level</Label>
            <Select id="cf-level" name="level" defaultValue={initial?.level ?? ""}>
              <option value="">Not specified</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="cf-price-type" required>Price Type</Label>
            <Select
              id="cf-price-type"
              name="price_type"
              defaultValue={initial?.price_type ?? "free"}
              onChange={(e) => setPriceType(e.target.value as CoursePriceType)}
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="free_with_paid_certificate">Free (Paid Certificate)</option>
            </Select>
          </div>
        </Grid2>
        <div>
          <Label htmlFor="cf-description">Description</Label>
          <Textarea
            id="cf-description"
            name="description"
            placeholder="Brief description of what students will learn…"
            defaultValue={initial?.description ?? ""}
          />
        </div>
      </Section>

      {/* ── Details ── */}
      <Section title="Details">
        <Grid2>
          <div>
            <Label htmlFor="cf-duration">Duration</Label>
            <Input
              id="cf-duration"
              name="duration"
              placeholder="e.g. 6 weeks, 20 hours"
              defaultValue={initial?.duration ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="cf-rating">Rating (0–5)</Label>
            <Input
              id="cf-rating"
              name="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="e.g. 4.7"
              defaultValue={initial?.rating?.toString() ?? ""}
              error={fieldErrors.rating}
            />
          </div>
        </Grid2>

        {/* Price — only shown for paid / free_with_paid_certificate */}
        {priceType !== "free" && (
          <div>
            <Label htmlFor="cf-price">Price</Label>
            <Input
              id="cf-price"
              name="price"
              placeholder="e.g. $49, ₹2,999"
              defaultValue={initial?.price ?? ""}
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              {priceType === "free_with_paid_certificate"
                ? "Price of the certificate only (course audit is free)."
                : "Full course price."}
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="cf-tags">Tags (comma-separated)</Label>
          <Input
            id="cf-tags"
            name="tags"
            placeholder="Python, Beginner Friendly, Hands-on Projects"
            defaultValue={initial?.tags?.join(", ") ?? ""}
          />
          <p className="mt-1 text-[11px] text-zinc-500">Separate tags with commas.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="cf-certificate"
            name="certificate_provided"
            value="true"
            defaultChecked={initial?.certificate_provided ?? false}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
          />
          <label htmlFor="cf-certificate" className="text-sm text-zinc-300 cursor-pointer">
            Certificate provided upon completion
          </label>
        </div>
      </Section>

      {/* ── Link ── */}
      <Section title="Course Link">
        <div>
          <Label htmlFor="cf-course-url" required>Course URL</Label>
          <Input
            id="cf-course-url"
            name="course_url"
            type="url"
            placeholder="https://…"
            defaultValue={initial?.course_url}
            error={fieldErrors.course_url}
            required
          />
          <p className="mt-1 text-[11px] text-zinc-500">
            Direct link to the course page. HackFeed will link students here.
          </p>
        </div>
      </Section>

      {/* ── Visibility ── */}
      <Section title="Visibility">
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              id="cf-is-active"
              name="is_active"
              value="true"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-zinc-300">Active (visible in courses feed)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              id="cf-is-featured"
              name="is_featured"
              value="true"
              defaultChecked={initial?.is_featured ?? false}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-zinc-300">Featured (shown on home page)</span>
          </label>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="cf-submit-btn"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : mode === "new" ? "Add Course" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
