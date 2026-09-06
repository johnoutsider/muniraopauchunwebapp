'use client'

import * as React from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[researcher/dashboard]', error)
  }, [error])

  return (
    <ErrorState
      title="Sahifani yuklab bo‘lmadi"
      message={error.message || 'Kutilmagan xatolik yuz berdi. Qaytadan urinib ko‘ring.'}
      retry={reset}
    />
  )
}
