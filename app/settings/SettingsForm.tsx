"use client"

/**
 * app/settings/SettingsForm.tsx
 *
 * Client form for configuring user preferences:
 * - Preferred opportunity format (Hackathons, Internships, Both)
 * - Preferred tags
 * - Email Deadline Reminders toggle
 * - Weekly Newsletter Digest toggle
 * - Grounded in Paper & Ink design
 */

import { useState, useTransition } from "react"
import { updateUserPreferencesAction } from "@/app/actions/preferences"
import type { PreferenceOpportunityType, UserPreferencesRow } from "@/lib/supabase/types"
import { toast } from "@/components/Toast"

interface SettingsFormProps {
  initialPreferences: UserPreferencesRow | null
  availableTags: string[]
  userEmail: string
}

export default function SettingsForm({
  initialPreferences,
  availableTags,
  userEmail,
}: SettingsFormProps) {
  const [preferredTags, setPreferredTags] = useState<string[]>(
    initialPreferences?.preferred_tags ?? []
  )
  const [preferredType, setPreferredType] = useState<PreferenceOpportunityType>(
    initialPreferences?.preferred_type ?? "both"
  )
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    initialPreferences?.reminder_enabled ?? true
  )
  const [digestEnabled, setDigestEnabled] = useState<boolean>(
    initialPreferences?.digest_enabled ?? true
  )
  const [tagSearch, setTagSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const toggleTag = (tag: string) => {
    setPreferredTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filteredTags = availableTags.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const res = await updateUserPreferencesAction({
        preferred_tags: preferredTags,
        preferred_type: preferredType,
        reminder_enabled: reminderEnabled,
        digest_enabled: digestEnabled,
      })

      if (res.success) {
        toast.success("Preferences updated successfully")
      } else {
        toast.error(res.error || "Failed to save preferences.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Account Summary ── */}
      <div className="border border-hairline bg-paper p-6">
        <h2 className="font-serif text-sm font-normal text-ink mb-1">Account Profile</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{userEmail}</p>
            <p className="text-xs text-ink-muted">Student Developer Account</p>
          </div>
          <span className="border border-hairline px-2.5 py-0.5 text-xs font-medium text-forest">
            Active
          </span>
        </div>
      </div>

      {/* ── Preferred Opportunity Type ── */}
      <div className="border border-hairline bg-paper p-6 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-normal text-ink">Preferred Listings</h2>
          <p className="text-xs text-ink-muted mt-1">
            Choose what type of opportunities to prioritize in your personalized recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "both",
              label: "All Listings",
              desc: "Hackathons & internships",
            },
            {
              id: "hackathon",
              label: "Hackathons Only",
              desc: "Engineering challenges",
            },
            {
              id: "internship",
              label: "Internships Only",
              desc: "Industry tech roles",
            },
          ].map((item) => {
            const isSelected = preferredType === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreferredType(item.id as "both" | "hackathon" | "internship")}
                className={`flex flex-col items-start p-4 border text-left transition-all ${
                  isSelected
                    ? "border-ink bg-paper-muted text-ink"
                    : "border-hairline bg-paper text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                <span className="text-xs font-semibold text-ink">{item.label}</span>
                <span className="text-[11px] text-ink-muted mt-1">{item.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Preferred Tags & Tech Interests ── */}
      <div className="border border-hairline bg-paper p-6 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-normal text-ink">Interests &amp; Skills</h2>
          <p className="text-xs text-ink-muted mt-1">
            Select tags you are interested in. We will use these to curate recommendations and digests.
          </p>
        </div>

        {/* Search input */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags (AI, Web3, Python, Cloud)…"
            className="w-full max-w-sm border border-hairline bg-paper px-3.5 py-2 text-xs text-ink placeholder-ink-muted outline-none focus:border-ink"
          />
          <span className="text-xs text-ink-muted ml-4">
            {preferredTags.length} selected
          </span>
        </div>

        {/* Tags cloud */}
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 border border-hairline bg-paper-muted/30">
          {filteredTags.map((tag) => {
            const selected = preferredTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors ${
                  selected
                    ? "border-ink bg-ink text-paper"
                    : "border-hairline bg-paper text-ink hover:border-ink"
                }`}
              >
                <span>{selected ? "✓" : "+"}</span>
                <span>{tag}</span>
              </button>
            )
          })}
          {filteredTags.length === 0 && (
            <p className="text-xs text-ink-muted p-4 text-center w-full">No matching tags found.</p>
          )}
        </div>
      </div>

      {/* ── Notification Toggles ── */}
      <div className="border border-hairline bg-paper p-6 space-y-6">
        <h2 className="font-serif text-lg font-normal text-ink">Email Notifications</h2>

        {/* Reminder Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">
              Application Deadline Alerts
            </p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Receive email alerts 3 days and 1 day before the deadline of your bookmarked opportunities.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer border border-hairline transition-colors duration-200 focus:outline-none ${
              reminderEnabled ? "bg-ink" : "bg-paper-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform bg-paper transition duration-200 ${
                reminderEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-hairline" />

        {/* Digest Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">
              Weekly Bulletin Digest
            </p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Get a weekly Monday morning briefing of new opportunities tailored to your tech interests and skills.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={digestEnabled}
            onClick={() => setDigestEnabled(!digestEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer border border-hairline transition-colors duration-200 focus:outline-none ${
              digestEnabled ? "bg-ink" : "bg-paper-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform bg-paper transition duration-200 ${
                digestEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="border border-ink bg-ink hover:bg-ink/90 px-6 py-2.5 text-xs font-medium text-paper transition active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <span>Saving Preferences…</span>
          ) : (
            <span>Save Preferences</span>
          )}
        </button>
      </div>
    </form>
  )
}
