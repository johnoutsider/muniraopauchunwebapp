'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function SpeakingSubmissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[speaking-lab/submission] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="Natijani ochib bo‘lmadi"
      message="Bu yozuv natijasini yuklashda xatolik yuz berdi. Speaking Lab sahifasiga qaytib, urinishni qaytadan oching."
      retry={reset}
    />
  )
}
