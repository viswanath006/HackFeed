/**
 * app/admin/(dashboard)/courses/[id]/edit/page.tsx
 *
 * Edit Course admin page — fetches the course, pre-fills CourseForm.
 */

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import CourseForm from "@/components/admin/CourseForm"
import { updateCourse, softDeleteCourse, hardDeleteCourse } from "@/app/admin/actions"
import { getUser } from "@/lib/supabase/getUser"
import type { CourseRow } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Edit Course — Admin" }

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { isSuperAdmin } = await getUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) notFound()

  const course = data as CourseRow

  const updateAction = updateCourse.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/courses"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
          >
            ← Back to Courses
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">Edit Course</h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-xl truncate">{course.title}</p>
        </div>

        {/* Danger zone actions */}
        <div className="flex items-center gap-2">
          <form action={softDeleteCourse.bind(null, id)}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
            >
              {course.is_active ? "Deactivate" : "Already Inactive"}
            </button>
          </form>
          {isSuperAdmin && (
            <form action={hardDeleteCourse.bind(null, id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10"
                onClick={(e) => {
                  if (!confirm("Permanently delete this course? This cannot be undone.")) {
                    e.preventDefault()
                  }
                }}
              >
                Delete Permanently
              </button>
            </form>
          )}
        </div>
      </div>

      <CourseForm mode="edit" initial={course} action={updateAction} />
    </div>
  )
}
