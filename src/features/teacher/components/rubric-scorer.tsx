'use client'

import * as React from 'react'

import { RUBRIC_LABELS } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

export interface RubricScorerProps {
  /** Rubrika mezonlari (WRITING_RUBRIC / SPEAKING_RUBRIC / PROJECT_RUBRIC) */
  keys: readonly string[]
  value: Record<string, number>
  onChange: (next: Record<string, number>) => void
  /** AI taklif qilgan ballar — taqqoslash uchun ko‘rsatiladi */
  aiScores?: Record<string, number>
  disabled?: boolean
  className?: string
}

const SCALE = [0, 1, 2, 3, 4, 5] as const

/** 0–5 rubrika baholagichi (PLAN 8.5, 8.6, 8.10). */
export function RubricScorer({
  keys,
  value,
  onChange,
  aiScores,
  disabled,
  className,
}: RubricScorerProps) {
  const filled = keys.filter((key) => typeof value[key] === 'number').length
  const total = keys.reduce((sum, key) => sum + (value[key] ?? 0), 0)
  const percent = keys.length ? Math.round((total / (keys.length * 5)) * 100) : 0

  return (
    <div className={cn('space-y-3', className)}>
      {keys.map((key) => {
        const label = RUBRIC_LABELS[key]?.uz ?? key
        const current = value[key]
        const ai = aiScores?.[key]

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              {typeof ai === 'number' ? (
                <span className="text-[11px] text-muted-foreground">AI taklifi: {ai}</span>
              ) : null}
            </div>
            <div
              role="radiogroup"
              aria-label={label}
              className="flex flex-wrap items-center gap-1.5"
            >
              {SCALE.map((score) => {
                const active = current === score
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={disabled}
                    onClick={() => onChange({ ...value, [key]: score })}
                    className={cn(
                      'size-8 rounded-md border text-sm font-medium tabular-nums transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-muted'
                    )}
                  >
                    {score}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {filled} / {keys.length} mezon baholandi
        </span>
        <span className="font-semibold tabular-nums">
          {total} / {keys.length * 5} · {percent}%
        </span>
      </div>
    </div>
  )
}
