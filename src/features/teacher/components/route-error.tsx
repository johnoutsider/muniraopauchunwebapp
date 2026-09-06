'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/shared/error-state'

export interface TeacherRouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Barcha `/teacher/**` segmentlari uchun umumiy xato ekrani.
 * Avtorizatsiya xatosi (`assertTeachesGroup`) alohida ko‘rsatiladi.
 */
export function TeacherRouteError({ error, reset }: TeacherRouteErrorProps) {
  React.useEffect(() => {
    console.error('[teacher] route error', error)
  }, [error])

  const forbidden =
    error.name === 'TeacherAccessError' ||
    /biriktirilmagan|topilmadi|ko‘rsatilmagan|talaba emas/i.test(error.message)

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-amber-400/40 bg-amber-50 px-4 py-10 text-center dark:bg-amber-500/10">
        <span className="flex size-11 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
          <ShieldAlert className="size-5" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">Ruxsat yo‘q</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {error.message ||
              'Siz faqat o‘zingizga biriktirilgan guruhlar va ulardagi talabalarni ko‘ra olasiz.'}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/teacher/dashboard">Bosh sahifaga qaytish</Link>
        </Button>
      </div>
    )
  }

  return (
    <ErrorState
      message={error.message || 'Ma’lumotlarni yuklab bo‘lmadi. Qaytadan urinib ko‘ring.'}
      retry={reset}
    />
  )
}

export default TeacherRouteError
