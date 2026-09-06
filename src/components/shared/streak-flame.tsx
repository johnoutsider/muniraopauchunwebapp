import * as React from 'react'
import { Flame } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface StreakFlameProps {
  days: number
  className?: string
}

/** Kunlik streak (PLAN 8.12) */
export function StreakFlame({ days, className }: StreakFlameProps) {
  const active = days > 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        active
          ? 'bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-300'
          : 'bg-muted text-muted-foreground',
        className
      )}
      title={active ? `${days} kunlik ketma-ketlik` : 'Ketma-ketlik hali boshlanmagan'}
    >
      <Flame className={cn('size-3.5 shrink-0', active && 'fill-current')} aria-hidden="true" />
      <span className="tabular-nums">{days} kun</span>
    </span>
  )
}
