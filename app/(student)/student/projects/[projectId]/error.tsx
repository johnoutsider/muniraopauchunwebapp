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
      title="Loyiha ish zonasini ochib bo‘lmadi"
      message="Loyiha topilmadi yoki siz uning a’zosi emassiz."
      retry={reset}
    />
  )
}
