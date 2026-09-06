'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function WritingLabError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[writing-lab] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="Writing Lab ochilmadi"
      message="Topshiriqlar yoki ishlaringiz ro‘yxatini yuklashda xatolik yuz berdi. Qoralamalaringiz saqlanib qolgan — qaytadan urinib ko‘ring."
      retry={reset}
    />
  )
}
