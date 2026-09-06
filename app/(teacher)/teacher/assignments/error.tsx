'use client'

import { TeacherRouteError } from '@/features/teacher/components/route-error'

export default function TeacherSegmentError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <TeacherRouteError {...props} />
}
