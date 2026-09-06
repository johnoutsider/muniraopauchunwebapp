'use client'

import { useEffect } from 'react'

import { ErrorState } from '@/components/shared/error-state'

export default function PromptLabError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[prompt-lab] segment error', error)
  }, [error])

  return (
    <ErrorState
      title="Prompt Lab ochilmadi"
      message="Mashqlar ro‘yxatini yuklashda xatolik yuz berdi. Qaytadan urinib ko‘ring — natijalaringiz saqlanib qolgan."
      retry={reset}
    />
  )
}
