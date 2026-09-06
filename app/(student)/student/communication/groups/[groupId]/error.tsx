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
      title="Guruh kanalini ochib bo‘lmadi"
      message="Guruh topilmadi yoki siz bu guruhga biriktirilmagansiz."
      retry={reset}
    />
  )
}
