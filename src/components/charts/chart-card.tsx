'use client'

import * as React from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

/** Grafik ranglari — CSS o‘zgaruvchilaridan (dark rejimga mos) */
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
] as const

export const AXIS_COLOR = 'var(--color-muted-foreground)'
export const GRID_COLOR = 'var(--color-border)'

/** Recharts tooltip uchun umumiy uslub */
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-popover)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    fontSize: '12px',
    color: 'var(--color-popover-foreground)',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  },
  labelStyle: { color: 'var(--color-foreground)', fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: 'var(--color-popover-foreground)' },
} as const

export const axisTick = { fill: AXIS_COLOR, fontSize: 11 } as const

export interface ChartCardProps {
  title: string
  description?: string
  actions?: React.ReactNode
  /** Grafik balandligi (px), standart 280 */
  height?: number
  className?: string
  children: React.ReactNode
}

export function ChartCard({
  title,
  description,
  actions,
  height = 280,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
