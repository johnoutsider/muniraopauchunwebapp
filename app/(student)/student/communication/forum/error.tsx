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
      title="Forumni yuklab bo‘lmadi"
      message="Mavzular ro‘yxatini olishda xatolik yuz berdi."
      retry={reset}
    />
  )
}
