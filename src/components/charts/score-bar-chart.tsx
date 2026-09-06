'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from './chart-card'

export interface ScoreBarDatum {
  name: string
  value: number
}

export interface ScoreBarChartProps {
  data: ScoreBarDatum[]
  maxValue?: number
  /** Gorizontal ustunlar (uzun nomlar uchun qulay) */
  horizontal?: boolean
  className?: string
}

/** Skill/bo‘lim ballari (Assessment natijalari, teacher analytics) */
export function ScoreBarChart({
  data,
  maxValue = 100,
  horizontal = false,
  className,
}: ScoreBarChartProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, left: horizontal ? 8 : -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={horizontal}
            horizontal={!horizontal}
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                domain={[0, maxValue]}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={96}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
          <Bar dataKey="value" name="Ball" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
