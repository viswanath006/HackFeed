"use client"

/**
 * components/admin/OpportunityForm.tsx
 *
 * Shared create / edit form for opportunities.
 * Works in both "new" and "edit" mode via the `mode` prop.
 * All fields from the opportunities schema are included.
 * Validates client-side before submission and shows inline errors.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { OpportunityRow, OpportunityType, OpportunityMode } from "@/lib/supabase/types"

// ── Types ──────────────────────────────────────────────────────────────────

interface OpportunityFormProps {
  mode: "new" | "edit"
  /** Pre-populated when mode === "edit" */
  initial?: OpportunityRow
  /** Server action to call on submit */
  action: (formData: FormData) => Promise<{ error?: string }>
}

interface FieldErrors {
  title?: string
  source_url?: string
  type?: string
  banner_image_url?: string
  end_date?: string
  application_deadline?: string
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
        rows={3}
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

export default function OpportunityForm({ mode, initial, action }: OpportunityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Controlled fields that need cross-field validation
  const [startDate, setStartDate] = useState(initial?.start_date?.slice(0, 10) ?? "")
  const [endDate, setEndDate] = useState(initial?.end_date?.slice(0, 10) ?? "")

  function validate(data: FormData): FieldErrors {
    const errors: FieldErrors = {}
    const title = (data.get("title") as string)?.trim()
    const sourceUrl = (data.get("source_url") as string)?.trim()
    const type = data.get("type") as string
    const bannerUrl = (data.get("banner_image_url") as string)?.trim()
    const ed = data.get("end_date") as string
    const sd = data.get("start_date") as string
    const deadline = data.get("application_deadline") as string

    if (!title) errors.title = "Title is required."
    if (!sourceUrl) {
      errors.source_url = "Source URL is required."
    } else if (!isValidUrl(sourceUrl)) {
      errors.source_url = "Must be a valid URL (include https://)."
    }
    if (!type) errors.type = "Type is required."
    if (bannerUrl && !isValidUrl(bannerUrl)) {
      errors.banner_image_url = "Must be a valid URL."
    }
    if (sd && ed && new Date(ed) < new Date(sd)) {
      errors.end_date = "End date must be after start date."
    }
    if (deadline && sd && new Date(deadline) > new Date(sd)) {
      // Deadline before start is fine, but warn if after end
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
        router.push("/admin/opportunities")
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
          <Label htmlFor="of-title" required>Title</Label>
          <Input
            id="of-title"
            name="title"
            placeholder="e.g. Smart India Hackathon 2025"
            defaultValue={initial?.title}
            error={fieldErrors.title}
            required
          />
        </div>
        <Grid2>
          <div>
            <Label htmlFor="of-type" required>Type</Label>
            <Select id="of-type" name="type" defaultValue={initial?.type ?? ""} error={fieldErrors.type} required>
              <option value="" disabled>Select type…</option>
              <option value="hackathon">Hackathon</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="of-mode">Mode</Label>
            <Select id="of-mode" name="mode" defaultValue={initial?.mode ?? ""}>
              <option value="">Not specified</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </Select>
          </div>
        </Grid2>
        <div>
          <Label htmlFor="of-description">Description</Label>
          <Textarea id="of-description" name="description" placeholder="Brief description of the opportunity…" defaultValue={initial?.description ?? ""} />
        </div>
      </Section>

      {/* ── Source ── */}
      <Section title="Source">
        <Grid2>
          <div>
            <Label htmlFor="of-source-platform">Platform</Label>
            <Input id="of-source-platform" name="source_platform" placeholder="e.g. Unstop" defaultValue={initial?.source_platform ?? ""} />
          </div>
          <div>
            <Label htmlFor="of-organizer">Organizer</Label>
            <Input id="of-organizer" name="organizer" placeholder="e.g. AICTE" defaultValue={initial?.organizer ?? ""} />
          </div>
        </Grid2>
        <div>
          <Label htmlFor="of-source-url" required>Source URL</Label>
          <Input id="of-source-url" name="source_url" type="url" placeholder="https://…" defaultValue={initial?.source_url} error={fieldErrors.source_url} required />
        </div>
        <div>
          <Label htmlFor="of-banner-url">Banner Image URL</Label>
          <Input id="of-banner-url" name="banner_image_url" type="url" placeholder="https://…" defaultValue={initial?.banner_image_url ?? ""} error={fieldErrors.banner_image_url} />
        </div>
      </Section>

      {/* ── Dates ── */}
      <Section title="Dates">
        <Grid2>
          <div>
            <Label htmlFor="of-start-date">Start Date</Label>
            <Input
              id="of-start-date"
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="of-end-date">End Date</Label>
            <Input
              id="of-end-date"
              name="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={fieldErrors.end_date}
            />
          </div>
        </Grid2>
        <div>
          <Label htmlFor="of-deadline">Application Deadline</Label>
          <Input id="of-deadline" name="application_deadline" type="date" defaultValue={initial?.application_deadline?.slice(0, 10)} />
        </div>
      </Section>

      {/* ── Details ── */}
      <Section title="Details">
        <Grid2>
          <div>
            <Label htmlFor="of-location">Location</Label>
            <Input id="of-location" name="location" placeholder="Online / City" defaultValue={initial?.location ?? ""} />
          </div>
          <div>
            <Label htmlFor="of-team-size">Team Size</Label>
            <Input id="of-team-size" name="team_size" placeholder="e.g. 2–4 members" defaultValue={initial?.team_size ?? ""} />
          </div>
        </Grid2>
        <Grid2>
          <div>
            <Label htmlFor="of-prize-pool">Prize Pool</Label>
            <Input id="of-prize-pool" name="prize_pool" placeholder="e.g. ₹1,00,000" defaultValue={initial?.prize_pool ?? ""} />
          </div>
          <div>
            <Label htmlFor="of-stipend">Stipend</Label>
            <Input id="of-stipend" name="stipend" placeholder="e.g. ₹15,000/month" defaultValue={initial?.stipend ?? ""} />
          </div>
        </Grid2>
        <div>
          <Label htmlFor="of-eligibility">Eligibility</Label>
          <Textarea id="of-eligibility" name="eligibility" placeholder="e.g. Open to all college students" defaultValue={initial?.eligibility ?? ""} />
        </div>
        <div>
          <Label htmlFor="of-tags">Tags (comma-separated)</Label>
          <Input
            id="of-tags"
            name="tags"
            placeholder="AI/ML, Web Dev, Open to all"
            defaultValue={initial?.tags?.join(", ") ?? ""}
          />
          <p className="mt-1 text-[11px] text-zinc-500">Separate tags with commas.</p>
        </div>
      </Section>

      {/* ── Visibility ── */}
      <Section title="Visibility">
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              id="of-is-active"
              name="is_active"
              value="true"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-zinc-300">Active (visible in feed)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              id="of-is-featured"
              name="is_featured"
              value="true"
              defaultChecked={initial?.is_featured ?? false}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm text-zinc-300">Featured (pinned to top)</span>
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
          id="of-submit-btn"
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : mode === "new" ? "Create Opportunity" : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
