'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] unhandled error', error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h1 className="text-2xl font-semibold">Xatolik yuz berdi</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Kutilmagan xatolik. Sahifani qayta yuklab ko&lsquo;ring. Muammo takrorlansa, administratorga
        xabar bering.
      </p>
      {error.digest && (
        <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {error.digest}
        </code>
      )}
      <Button onClick={reset}>
        <RotateCcw />
        Qayta urinish
      </Button>
    </div>
  )
}
