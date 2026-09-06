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
      title="Suhbatni ochib bo‘lmadi"
      message="Bu suhbat mavjud emas yoki sizda unga kirish huquqi yo‘q."
      retry={reset}
    />
  )
}
