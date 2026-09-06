'use client'

import * as React from 'react'
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { AXIS_COLOR, CHART_COLORS, GRID_COLOR, axisTick, tooltipStyle } from './chart-card'

export interface SkillRadarDatum {
  skill: string
  score: number
  compare?: number
}

export interface SkillRadarChartProps {
  data: SkillRadarDatum[]
  /** Taqqoslash chizig‘i nomi (masalan «Pre-test» yoki «Guruh o‘rtachasi») */
  compareLabel?: string
  scoreLabel?: string
  max?: number
  className?: string
}

/** Individual Linguistic Profile radar grafigi (PLAN 5, 2-bosqich) */
export function SkillRadarChart({
  data,
  compareLabel = 'Taqqoslash',
  scoreLabel = 'Joriy natija',
  max = 100,
  className,
}: SkillRadarChartProps) {
  const hasCompare = data.some((d) => typeof d.compare === 'number')

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={GRID_COLOR} />
          <PolarAngleAxis dataKey="skill" tick={axisTick} />
          <PolarRadiusAxis
            domain={[0, max]}
            tick={{ fill: AXIS_COLOR, fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip {...tooltipStyle} />
          {hasCompare ? (
            <Radar
              name={compareLabel}
              dataKey="compare"
              stroke={CHART_COLORS[3]}
              fill={CHART_COLORS[3]}
              fillOpacity={0.15}
            />
          ) : null}
          <Radar
            name={scoreLabel}
            dataKey="score"
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
            fillOpacity={0.3}
          />
          {hasCompare ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
