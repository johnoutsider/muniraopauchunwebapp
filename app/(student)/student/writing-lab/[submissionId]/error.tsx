'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function WritingSubmissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[writing-lab/submission] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="Ishni ochib bo‘lmadi"
      message="Bu yozma ishni yuklashda xatolik yuz berdi. Writing Lab sahifasiga qaytib, ishni qaytadan oching."
      retry={reset}
    />
  )
}
