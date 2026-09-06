'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[reflection]', error)
  }, [error])

  return (
    <div className="space-y-4">
      <ErrorState
        title="Refleksiya kundaligini ochib bo‘lmadi"
        message="Ma’lumotlarni yuklashda xatolik yuz berdi. Javoblaringiz saqlangan bo‘lsa, ular yo‘qolmaydi — sahifani qayta yuklab ko‘ring."
        retry={reset}
      />
      <div className="flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/student/dashboard">Bosh sahifaga qaytish</Link>
        </Button>
      </div>
    </div>
  )
}
