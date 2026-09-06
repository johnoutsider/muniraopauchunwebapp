'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <ErrorState
      title="Mavzuni ochib bo‘lmadi"
      message="Mavzu o‘chirilgan bo‘lishi yoki sizning guruhingizga ochiq bo‘lmasligi mumkin."
      retry={reset}
    />
  )
}
