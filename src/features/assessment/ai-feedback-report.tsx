'use client'

import * as React from 'react'
import { AlertTriangle, ArrowRight, Lightbulb, ThumbsUp } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AiBadge } from '@/components/shared/ai-badge'
import { Spinner } from '@/components/shared/loading-state'
import { MarkdownText } from '@/components/shared/markdown-text'
import { SKILL_LABELS, type Skill } from '@/config/constants'

import { saveFeedbackReportAction } from './actions'
import type { FeedbackReportView } from './types'

/**
 * AI Feedback Report (PLAN 5 — 8-bosqich, 7.2).
 *
 * MUHIM (eksperiment yaxlitligi, PLAN 1.5): bu komponent FAQAT
 * `flags.aiFeedback === true` bo'lganda render qilinadi. Nazorat guruhida
 * sahifa uni umuman chaqirmaydi — server komponent boshqa blok ko'rsatadi.
 *
 * Hisobot bir marta generatsiya qilinadi va urinish hujjatida keshlanadi
 * (`saveFeedbackReportAction`) — har ochilganda AI qayta chaqirilmaydi.
 */

export interface AiFeedbackReportProps {
  attemptId: string
  /** Avval keshlangan hisobot (server komponentdan) */
  initialReport?: FeedbackReportView | null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

/** API javobining shakli oldindan qat'iy emas — himoyalangan normalizatsiya. */
export function normalizeReport(payload: unknown): FeedbackReportView | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  const source = (
    root.data && typeof root.data === 'object' ? root.data : root
  ) as Record<string, unknown>

  const strengths = asStringArray(source.strengths)
  const areasToImprove = asStringArray(source.areasToImprove ?? source.areas_to_improve)
  const nextSteps = asStringArray(source.nextSteps ?? source.next_steps)

  if (!strengths.length && !areasToImprove.length && !nextSteps.length) return null

  const skillNotes = Array.isArray(source.skillNotes)
    ? (source.skillNotes as unknown[])
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null
          const note = entry as Record<string, unknown>
          if (typeof note.skill !== 'string' || typeof note.note !== 'string') return null
          return { skill: note.skill, note: note.note }
        })
        .filter((entry): entry is { skill: string; note: string } => entry !== null)
    : []

  return {
    strengths,
    areasToImprove,
    nextSteps,
    skillNotes,
    encouragement:
      typeof source.encouragement === 'string' ? source.encouragement : undefined,
  }
}

export function AiFeedbackReport({ attemptId, initialReport = null }: AiFeedbackReportProps) {
  const [report, setReport] = React.useState<FeedbackReportView | null>(initialReport)
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const requested = React.useRef(Boolean(initialReport))

  const load = React.useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const response = await fetch('/api/ai/feedback-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'test_attempt', attemptId }),
      })
      if (!response.ok) throw new Error('request_failed')
      const parsed = normalizeReport(await response.json())
      if (!parsed) throw new Error('empty')
      setReport(parsed)
      // Keshlash — xato bo'lsa ham hisobot ko'rsatilaveradi
      void saveFeedbackReportAction(attemptId, parsed).catch(() => undefined)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [attemptId])

  React.useEffect(() => {
    if (requested.current) return
    requested.current = true
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>AI Feedback Report</CardTitle>
        <AiBadge label="AI tahlili" />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !report ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner />
            Natijalaringiz tahlil qilinmoqda…
          </div>
        ) : null}

        {failed && !report ? (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>
                AI tahlilini hozir olib bo‘lmadi. Quyidagi ball taqsimoti va o‘quv yo‘nalishingiz
                baribir tayyor.
              </span>
              <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                Qayta urinish
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {report ? (
          <div className="space-y-5">
            <ReportList
              title="Kuchli tomonlaringiz"
              icon={<ThumbsUp className="size-4 text-emerald-500" />}
              items={report.strengths}
            />
            <ReportList
              title="Yaxshilash kerak bo‘lgan jihatlar"
              icon={<Lightbulb className="size-4 text-amber-500" />}
              items={report.areasToImprove}
            />
            <ReportList
              title="Keyingi qadamlar"
              icon={<ArrowRight className="size-4 text-primary" />}
              items={report.nextSteps}
            />

            {report.skillNotes.length ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ko‘nikmalar bo‘yicha izoh</p>
                <ul className="space-y-2">
                  {report.skillNotes.map((note) => (
                    <li key={note.skill} className="rounded-lg border border-border p-3 text-sm">
                      <span className="font-medium">
                        {SKILL_LABELS[note.skill as Skill]?.uz ?? note.skill}:{' '}
                      </span>
                      {note.note}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {report.encouragement ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <MarkdownText>{report.encouragement}</MarkdownText>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ReportList({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
}) {
  if (!items.length) return null
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
