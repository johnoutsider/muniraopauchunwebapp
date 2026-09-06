import * as React from 'react'

import { cn } from '@/lib/utils/cn'
import { scoreColor } from '@/lib/utils/format'

export interface ScoreBadgeProps {
  score: number
  /** Maksimal ball (standart 100) */
  max?: number
  /** «ball» so‘zini ko‘rsatish */
  showLabel?: boolean
  className?: string
}

export function ScoreBadge({ score, max = 100, showLabel = false, className }: ScoreBadgeProps) {
  const percent = max > 0 ? (score / max) * 100 : 0
  const rounded = Math.round(score * 10) / 10

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums',
        scoreColor(percent),
        className
      )}
      title={`${rounded} / ${max}`}
    >
      {rounded}
      <span className="text-xs font-normal text-muted-foreground">
        / {max}
        {showLabel ? ' ball' : ''}
      </span>
    </span>
  )
}
