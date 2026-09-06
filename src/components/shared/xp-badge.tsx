import * as React from 'react'
import { Zap } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { xpToLevel } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

export interface XpBadgeProps {
  xp: number
  /** Keyingi darajagacha progress chizig‘ini ko‘rsatish */
  showProgress?: boolean
  className?: string
}

/** Gamifikatsiya: daraja va XP (PLAN 8.12) */
export function XpBadge({ xp, showProgress = false, className }: XpBadgeProps) {
  const { level, next, progress } = xpToLevel(xp)

  return (
    <div className={cn('inline-flex min-w-0 flex-col gap-1', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-300">
        <Zap className="size-3 shrink-0 fill-current" aria-hidden="true" />
        <span className="tabular-nums">{level}-daraja</span>
        <span className="font-normal opacity-80">· {xp.toLocaleString('uz-UZ')} XP</span>
      </span>
      {showProgress ? (
        <div className="space-y-0.5">
          <Progress
            value={progress}
            className="h-1.5"
            indicatorClassName="bg-amber-500"
            aria-label="Keyingi darajagacha progress"
          />
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Keyingi daraja: {next.toLocaleString('uz-UZ')} XP
          </p>
        </div>
      ) : null}
    </div>
  )
}
