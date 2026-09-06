'use client'

import * as React from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { CHART_COLORS, tooltipStyle } from './chart-card'

export interface DonutDatum {
  name: string
  value: number
}

export interface DonutChartProps {
  data: DonutDatum[]
  /** Markazdagi izoh (masalan «Jami») */
  centerLabel?: string
  showLegend?: boolean
  className?: string
}

/** Ulushlar diagrammasi (vaqt taqsimoti, mashq turlari, tugallanish) */
export function DonutChart({ data, centerLabel, showLegend = true, className }: DonutChartProps) {
  const total = React.useMemo(() => data.reduce((sum, d) => sum + (d.value || 0), 0), [data])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="var(--color-card)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          {showLegend ? (
            <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 12 }} />
          ) : null}
        </PieChart>
      </ResponsiveContainer>

      <div
        className="pointer-events-none absolute inset-x-0 top-[38%] flex -translate-y-1/2 flex-col items-center"
        aria-hidden="true"
      >
        <span className="text-xl font-semibold tabular-nums">{total.toLocaleString('uz-UZ')}</span>
        {centerLabel ? (
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        ) : null}
      </div>
    </div>
  )
}
