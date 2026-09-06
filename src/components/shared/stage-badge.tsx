import * as React from 'react'

import { STAGE_META, type Stage } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

const PHASE_CLASS: Record<'organizational' | 'practical' | 'reflective', string> = {
  organizational: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  practical: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  reflective: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
}

export interface StageBadgeProps {
  stage: Stage
  /** Bosqich nomini ham chiqarish */
  showTitle?: boolean
  className?: string
}

/** 8 bosqichli mualliflik metodikasi belgisi (PLAN 5-bo‘lim) */
export function StageBadge({ stage, showTitle = false, className }: StageBadgeProps) {
  const meta = STAGE_META[stage]

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        PHASE_CLASS[meta.phase],
        className
      )}
      title={meta.uz}
    >
      <span className="font-semibold tabular-nums">{stage}-bosqich</span>
      {showTitle ? <span className="truncate font-normal opacity-90">{meta.uz}</span> : null}
    </span>
  )
}
