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
      title="Suhbatlar ro‘yxatini yuklab bo‘lmadi"
      message="Internet aloqasini tekshiring va qayta urinib ko‘ring."
      retry={reset}
    />
  )
}
