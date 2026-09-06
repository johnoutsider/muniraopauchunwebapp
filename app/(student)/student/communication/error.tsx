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
      title="Muloqot markazi ochilmadi"
      message="Sahifani yangilab ko‘ring. Muammo takrorlansa, o‘qituvchingizga xabar bering."
      retry={reset}
    />
  )
}
