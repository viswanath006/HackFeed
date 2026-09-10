/**
 * app/admin/(dashboard)/courses/new/page.tsx
 *
 * "New Course" admin page.
 */

import type { Metadata } from "next"
import Link from "next/link"
import CourseForm from "@/components/admin/CourseForm"
import { createCourse } from "@/app/admin/actions"

export const metadata: Metadata = { title: "Add Course — Admin" }

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
        >
          ← Back to Courses
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">Add Course</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manually curate a new course or certification for the HackFeed directory.
        </p>
      </div>

      <CourseForm mode="new" action={createCourse} />
    </div>
  )
}
