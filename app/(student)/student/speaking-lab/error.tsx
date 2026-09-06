'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function SpeakingLabError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[speaking-lab] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="Speaking Lab ochilmadi"
      message="Topshiriqlar yoki yozuvlar ro‘yxatini yuklashda xatolik yuz berdi. Qaytadan urinib ko‘ring — yozuvlaringiz saqlanib qolgan."
      retry={reset}
    />
  )
}
