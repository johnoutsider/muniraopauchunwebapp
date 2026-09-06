'use client'

import * as React from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[achievements]', error)
  }, [error])

  return (
    <ErrorState
      title="Yutuqlarni yuklab bo‘lmadi"
      message={
        error.message ||
        'Yutuqlar yuklashda kutilmagan xatolik yuz berdi. Sahifani qayta yuklab ko‘ring yoki keyinroq urinib ko‘ring.'
      }
      retry={reset}
    />
  )
}
