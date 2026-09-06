'use client'

import * as React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils/cn'

import { CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from './chart-card'

export interface EconChartProps {
  chartType: 'line' | 'bar' | 'pie'
  /** Dars/case study blokidan keladigan ma’lumot (LessonBlock kind: 'chart') */
  data: Record<string, unknown>[]
  caption?: string
  height?: number
  className?: string
}

/** Ma’lumot kalitlarini aniqlaydi: birinchi matnli kalit — o‘q, qolgan sonli kalitlar — qatorlar */
function inferKeys(data: Record<string, unknown>[]): { xKey: string; valueKeys: string[] } {
  const sample = data[0] ?? {}
  const keys = Object.keys(sample)
  const xKey = keys.find((key) => typeof sample[key] === 'string') ?? keys[0] ?? 'name'
  const valueKeys = keys.filter((key) => key !== xKey && typeof sample[key] === 'number')
  return { xKey, valueKeys: valueKeys.length ? valueKeys : keys.filter((k) => k !== xKey) }
}

/**
 * Darslar va case study ichidagi iqtisodiy grafiklar (PLAN 8.4, 8.10 — «explain the chart»).
 */
export function EconChart({ chartType, data, caption, height = 260, className }: EconChartProps) {
  const { xKey, valueKeys } = React.useMemo(() => inferKeys(data), [data])

  if (!data.length || !valueKeys.length) {
    return (
      <figure className={cn('w-full', className)}>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Grafik uchun ma’lumot yo‘q
        </div>
        {caption ? (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }

  return (
    <figure className={cn('w-full', className)}>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKeys[0]}
                nameKey={xKey}
                outerRadius="78%"
                stroke="var(--color-card)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={String(entry[xKey] ?? index)}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          ) : chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
              />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }} />
              {valueKeys.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
              {valueKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: GRID_COLOR }}
              />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} />
              <Tooltip {...tooltipStyle} />
              {valueKeys.length > 1 ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
              {valueKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
