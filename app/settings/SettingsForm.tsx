"use client"

/**
 * app/settings/SettingsForm.tsx
 *
 * Client form for configuring user preferences:
 * - Preferred tags (multi-select pill chips)
 * - Preferred opportunity format (Hackathons, Internships, Both)
 * - Email Deadline Reminders toggle
 * - Weekly Newsletter Digest toggle
 * - Zero-emoji design
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Account Summary ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Account Profile</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{userEmail}</p>
            <p className="text-xs text-zinc-500">Student Account</p>
          </div>
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            Active
          </span>
        </div>
      </div>

      {/* ── Preferred Opportunity Type ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Preferred Opportunities</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Choose what type of listings you would like HackFeed to prioritize in your recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "both",
              label: "Both Mixed",
              desc: "Hackathons & internships",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
              ),
            },
            {
              id: "hackathon",
              label: "Hackathons Only",
              desc: "Prize sprints & builds",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
            },
            {
              id: "internship",
              label: "Internships Only",
              desc: "Roles & hiring programs",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              ),
            },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPreferredType(opt.id as PreferenceOpportunityType)}
              className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 ${
                preferredType === opt.id
                  ? "border-violet-500/60 bg-violet-500/15 ring-1 ring-violet-500/30 text-violet-300"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-zinc-400"
              }`}
            >
              <div className="mb-2 text-zinc-300">{opt.icon}</div>
              <span className="text-sm font-bold text-zinc-100">{opt.label}</span>
              <span className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Preferred Tags & Tech Interests ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Interests &amp; Skills</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Select tags you are interested in. We will use these to curate recommendations and weekly digests.
          </p>
        </div>

        {/* Search input */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags (AI, Web3, Python, Cloud)…"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-violet-500/60"
          />
          <span className="text-xs text-zinc-400 font-medium ml-4">
            {preferredTags.length} selected
          </span>
        </div>

        {/* Tags cloud */}
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1 border border-white/[0.06] rounded-xl bg-black/20">
          {filteredTags.map((tag) => {
            const selected = preferredTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  selected
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 scale-105"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white"
                }`}
              >
                <span>{selected ? "✓" : "+"}</span>
                <span>{tag}</span>
              </button>
            )
          })}
          {filteredTags.length === 0 && (
            <p className="text-xs text-zinc-500 p-4 text-center w-full">No matching tags found.</p>
          )}
        </div>
      </div>

      {/* ── Notification Toggles ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email Notifications</h2>

        {/* Reminder Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Application Deadline Reminders
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Automatically receive email alerts 3 days and 1 day before the deadline of your bookmarked opportunities.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              reminderEnabled ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                reminderEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-white/[0.06]" />

        {/* Digest Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Weekly Newsletter Digest
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Get a weekly Monday morning briefing of new opportunities tailored to your tech interests and skills.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={digestEnabled}
            onClick={() => setDigestEnabled(!digestEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              digestEnabled ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
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
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-95 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Saving Preferences…</span>
            </>
          ) : (
            <span>Save Preferences</span>
          )}
        </button>
      </div>
    </form>
  )
}
