'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from '@/components/charts/chart-card'

export interface PrePostDatum {
  name: string
  expPre: number
  expPreErr: number
  expPost: number
  expPostErr: number
  ctrlPre: number
  ctrlPreErr: number
  ctrlPost: number
  ctrlPostErr: number
}

export interface PrePostChartProps {
  data: PrePostDatum[]
  className?: string
}

/**
 * Pre/post ballar — eksperimental va nazorat guruhlari, xato chiziqlari bilan.
 * Xato chiziqlari — o'rtachaning standart xatosi (SE = SD/√n), ya'ni
 * o'rtachaning aniqligini ko'rsatadi (dispersiyani emas).
 */
export function PrePostChart({ data, className }: PrePostChartProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="name"
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: GRID_COLOR }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} width={44} />
          <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          <Bar dataKey="expPre" name="Eksperimental — pre" fill={CHART_COLORS[0]} fillOpacity={0.45} radius={[3, 3, 0, 0]}>
            <ErrorBar dataKey="expPreErr" width={4} strokeWidth={1.2} stroke={CHART_COLORS[0]} />
          </Bar>
          <Bar dataKey="expPost" name="Eksperimental — post" fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]}>
            <ErrorBar dataKey="expPostErr" width={4} strokeWidth={1.2} stroke={CHART_COLORS[0]} />
          </Bar>
          <Bar dataKey="ctrlPre" name="Nazorat — pre" fill={CHART_COLORS[3]} fillOpacity={0.45} radius={[3, 3, 0, 0]}>
            <ErrorBar dataKey="ctrlPreErr" width={4} strokeWidth={1.2} stroke={CHART_COLORS[3]} />
          </Bar>
          <Bar dataKey="ctrlPost" name="Nazorat — post" fill={CHART_COLORS[3]} radius={[3, 3, 0, 0]}>
            <ErrorBar dataKey="ctrlPostErr" width={4} strokeWidth={1.2} stroke={CHART_COLORS[3]} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
