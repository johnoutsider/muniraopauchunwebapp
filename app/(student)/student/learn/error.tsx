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
    console.error('[learn]', error)
  }, [error])

  return (
    <ErrorState
      title="Darslarni yuklab bo‘lmadi"
      message={
        error.message ||
        'Darslar ro‘yxati yuklashda kutilmagan xatolik yuz berdi. Sahifani qayta yuklab ko‘ring yoki keyinroq urinib ko‘ring.'
      }
      retry={reset}
    />
  )
}
