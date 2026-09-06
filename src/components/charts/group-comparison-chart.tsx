'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from './chart-card'

export interface GroupComparisonDatum {
  name: string
  experimental: number
  control: number
}

export interface GroupComparisonChartProps {
  data: GroupComparisonDatum[]
  experimentalLabel?: string
  controlLabel?: string
  maxValue?: number
  className?: string
}

/** Eksperimental va nazorat guruhlarini taqqoslash (PLAN 8.18) */
export function GroupComparisonChart({
  data,
  experimentalLabel = 'Eksperimental guruh',
  controlLabel = 'Nazorat guruhi',
  maxValue = 100,
  className,
}: GroupComparisonChartProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="name"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <YAxis
            domain={[0, maxValue]}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="experimental"
            name={experimentalLabel}
            fill={CHART_COLORS[0]}
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="control" name={controlLabel} fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
