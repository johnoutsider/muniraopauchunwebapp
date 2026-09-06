import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = 'Yuklanmoqda…' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <Loader2 className={cn('size-4 animate-spin text-muted-foreground', className)} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export interface LoadingStateProps {
  /** Nechta skelet qatori chizilsin */
  rows?: number
  /** Sarlavha skeletini ko‘rsatish */
  withHeader?: boolean
  className?: string
}

export function LoadingState({ rows = 4, withHeader = true, className }: LoadingStateProps) {
  return (
    <div
      className={cn('w-full space-y-3', className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {withHeader ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      ) : null}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
      <span className="sr-only">Yuklanmoqda…</span>
    </div>
  )
}
