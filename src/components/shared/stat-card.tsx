import * as React from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

export type StatTone = 'default' | 'success' | 'warning' | 'danger'

const TONE_ICON: Record<StatTone, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

const TONE_VALUE: Record<StatTone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-rose-600 dark:text-rose-400',
}

export interface StatCardProps {
  label: string
  value: React.ReactNode
  sublabel?: string
  icon?: React.ReactNode
  /** Foizdagi o‘zgarish; musbat — o‘sish, manfiy — pasayish */
  trend?: number
  tone?: StatTone
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  tone = 'default',
  className,
}: StatCardProps) {
  const hasTrend = typeof trend === 'number' && Number.isFinite(trend)
  const up = hasTrend && trend >= 0

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn('text-2xl font-semibold leading-tight', TONE_VALUE[tone])}>{value}</p>
          {sublabel ? <p className="text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              TONE_ICON[tone]
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {hasTrend ? (
        <p
          className={cn(
            'mt-2 flex items-center gap-1 text-xs font-medium',
            up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {up ? (
            <TrendingUp className="size-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="size-3.5" aria-hidden="true" />
          )}
          {up ? '+' : ''}
          {Math.round(trend * 10) / 10}%
        </p>
      ) : null}
    </Card>
  )
}
