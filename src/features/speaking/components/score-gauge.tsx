'use client'

import * as React from 'react'

import { cn } from '@/lib/utils/cn'

import { BAND_STROKE, pronunciationBand } from '../scoring'

export interface ScoreGaugeProps {
  label: string
  /** 0..100; `null` — Azure bu o'lchovni qaytarmadi */
  value: number | null
  hint?: string
  size?: number
  className?: string
}

/**
 * Bitta Azure o'lchovi uchun doiraviy indikator (accuracy, fluency,
 * completeness, prosody, umumiy ball) — PLAN 8.3.
 */
export function ScoreGauge({ label, value, hint, size = 92, className }: ScoreGaugeProps) {
  const available = typeof value === 'number' && Number.isFinite(value)
  const score = available ? Math.max(0, Math.min(100, Math.round(value))) : 0
  const band = pronunciationBand(score)

  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)

  return (
    <div className={cn('flex flex-col items-center gap-1.5 text-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label}: ${available ? `${score} ball` : 'mavjud emas'}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-muted"
          />
          {available && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className={cn('transition-[stroke-dashoffset] duration-700', BAND_STROKE[band])}
              stroke="currentColor"
            />
          )}
        </svg>
        <span className="absolute inset-0 grid place-items-center">
          <span
            className={cn(
              'text-lg font-semibold tabular-nums',
              available ? BAND_STROKE[band] : 'text-muted-foreground'
            )}
          >
            {available ? score : '—'}
          </span>
        </span>
      </div>
      <span className="text-xs font-medium">{label}</span>
      {hint && (
        <span className="max-w-[140px] text-[10px] leading-tight text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  )
}
