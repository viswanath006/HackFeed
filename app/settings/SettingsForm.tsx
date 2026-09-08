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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Account Summary ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141c] p-5 sm:p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Account Profile</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">{userEmail}</p>
            <p className="text-xs text-slate-400">Student Developer Account</p>
          </div>
          <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
            Active
          </span>
        </div>
      </div>

      {/* ── Preferred Opportunity Type ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141c] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Opportunities</h2>
          <p className="text-xs text-slate-400 mt-1">
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
              desc: "Engineering challenges",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
            },
            {
              id: "internship",
              label: "Internships Only",
              desc: "Tech job roles",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              ),
            },
          ].map((item) => {
            const isSelected = preferredType === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreferredType(item.id as "both" | "hackathon" | "internship")}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-150 ${
                  isSelected
                    ? "border-indigo-500/50 bg-indigo-500/10 text-white shadow-sm"
                    : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
              >
                <span className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 border border-white/10"}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-bold text-slate-100">{item.label}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{item.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Preferred Tags & Tech Interests ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141c] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interests &amp; Skills</h2>
          <p className="text-xs text-slate-400 mt-1">
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
            className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:bg-[#161824]"
          />
          <span className="text-xs text-slate-400 font-medium ml-4">
            {preferredTags.length} selected
          </span>
        </div>

        {/* Tags cloud */}
        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-2 border border-white/[0.06] rounded-lg bg-black/20">
          {filteredTags.map((tag) => {
            const selected = preferredTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                  selected
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                <span>{selected ? "✓" : "+"}</span>
                <span>{tag}</span>
              </button>
            )
          })}
          {filteredTags.length === 0 && (
            <p className="text-xs text-slate-500 p-4 text-center w-full">No matching tags found.</p>
          )}
        </div>
      </div>

      {/* ── Notification Toggles ── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#12141c] p-5 sm:p-6 space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Notifications</h2>

        {/* Reminder Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Application Deadline Reminders
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Automatically receive email alerts 3 days and 1 day before the deadline of your bookmarked opportunities.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              reminderEnabled ? "bg-indigo-600" : "bg-slate-700"
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
            <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Weekly Newsletter Digest
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Get a weekly Monday morning briefing of new opportunities tailored to your tech interests and skills.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={digestEnabled}
            onClick={() => setDigestEnabled(!digestEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              digestEnabled ? "bg-indigo-600" : "bg-slate-700"
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
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition active:scale-95 disabled:opacity-50"
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
