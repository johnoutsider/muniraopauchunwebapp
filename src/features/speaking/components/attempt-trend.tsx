'use client'

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ChartCard } from '@/components/charts/chart-card'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDateTime } from '@/lib/utils/format'

import type { AttemptSummary } from '../types'

export interface AttemptTrendProps {
  attempts: AttemptSummary[]
  taskTitle: string
}

/** Bir topshiriq bo'yicha urinishlar dinamikasi: Record → … → Retry (PLAN 8.3). */
export function AttemptTrend({ attempts, taskTitle }: AttemptTrendProps) {
  const data = attempts.map((attempt) => ({
    name: `${attempt.attemptNo}-urinish`,
    pron: attempt.pronScore,
    accuracy: attempt.accuracyScore,
    fluency: attempt.fluencyScore,
  }))

  const first = attempts[0]
  const last = attempts[attempts.length - 1]
  const delta = first && last ? last.pronScore - first.pronScore : 0

  return (
    <ChartCard
      title="Urinishlar dinamikasi"
      description={taskTitle}
      height={240}
      actions={
        attempts.length > 1 ? (
          <Badge variant={delta >= 0 ? 'success' : 'danger'} className="gap-1">
            <TrendingUp className="size-3" />
            {delta >= 0 ? '+' : ''}
            {delta} ball
          </Badge>
        ) : null
      }
    >
      {attempts.length < 2 ? (
        <EmptyState
          title="Taqqoslash uchun kamida ikkita urinish kerak"
          description="Shu topshiriqni qaytadan yozib yuboring — o‘sish grafigi shu yerda paydo bo‘ladi."
        />
      ) : (
        <div className="space-y-3">
          <div style={{ height: 200 }}>
            <ProgressLineChart
              data={data}
              xKey="name"
              series={[
                { key: 'pron', label: 'Umumiy' },
                { key: 'accuracy', label: 'Aniqlik' },
                { key: 'fluency', label: 'Ravonlik' },
              ]}
            />
          </div>
          <ul className="space-y-1 text-xs">
            {[...attempts].reverse().map((attempt) => (
              <li key={attempt.id}>
                <Link
                  href={`/student/speaking-lab/${attempt.id}`}
                  className="flex items-center justify-between rounded border border-transparent px-2 py-1 hover:border-border hover:bg-muted/40"
                >
                  <span>
                    {attempt.attemptNo}-urinish · {formatDateTime(attempt.ts)}
                  </span>
                  <span className="tabular-nums font-medium">{attempt.pronScore}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  )
}
