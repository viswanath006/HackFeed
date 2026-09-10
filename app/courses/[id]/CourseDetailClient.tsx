"use client"

/**
 * app/courses/[id]/CourseDetailClient.tsx
 *
 * Client wrapper for the bookmark button on the course detail page.
 */

import CourseBookmarkButton from "@/components/CourseBookmarkButton"

interface CourseDetailClientProps {
  courseId: string
  userId: string | null
  initialBookmarked: boolean
}

export default function CourseDetailClient({
  courseId,
  userId,
  initialBookmarked,
}: CourseDetailClientProps) {
  return (
    <CourseBookmarkButton
      courseId={courseId}
      userId={userId}
      initialBookmarked={initialBookmarked}
      variant="full"
    />
  )
}
