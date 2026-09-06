'use client'

import * as React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from './chart-card'

export interface ProgressSeries {
  key: string
  label: string
  color?: string
}

export interface ProgressLineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: ProgressSeries[]
  /** Y o‘qi chegarasi (standart 0..100) */
  domain?: [number, number]
  className?: string
}

/** Skill ballari dinamikasi (Progress Dashboard, PLAN 8.11 / 8.18) */
export function ProgressLineChart({
  data,
  xKey,
  series,
  domain = [0, 100],
  className,
}: ProgressLineChartProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
          />
          <YAxis domain={domain} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip {...tooltipStyle} />
          {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
          {series.map((s, index) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
