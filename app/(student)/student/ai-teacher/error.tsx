'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function AiTeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ai-teacher] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="AI o‘qituvchini ochib bo‘lmadi"
      message="Suhbat tarixini yuklashda xatolik yuz berdi. Qaytadan urinib ko‘ring — muammo takrorlansa, o‘qituvchingizga xabar bering."
      retry={reset}
    />
  )
}
