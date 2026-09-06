'use client'

import * as React from 'react'
import { CheckCircle2, Sparkles, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'
import { cn } from '@/lib/utils/cn'
import { ERROR_TAG_LABELS, RUBRIC_LABELS, WRITING_RUBRIC, type ErrorTag } from '@/config/constants'
import type { WritingAiFeedback } from '@/types'

import { AnnotatedText, ErrorCard } from './annotated-text'

export interface FeedbackPanelProps {
  text: string
  feedback: WritingAiFeedback
  draftNo: number
}

function RubricBars({ scores }: { scores: Partial<Record<string, number>> }) {
  return (
    <div className="space-y-2">
      {WRITING_RUBRIC.map((key) => {
        const value = scores[key]
        const score = typeof value === 'number' ? value : 0
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{RUBRIC_LABELS[key]?.uz ?? key}</span>
              <span className="tabular-nums text-muted-foreground">{score} / 5</span>
            </div>
            <Progress value={(score / 5) * 100} className="h-1.5" />
          </div>
        )
      })}
    </div>
  )
}

/** AI feedback paneli: inline xatolar + rubrika + kuchli/zaif tomonlar (PLAN 8.5). */
export function FeedbackPanel({ text, feedback, draftNo }: FeedbackPanelProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  const total = WRITING_RUBRIC.reduce((sum, key) => {
    const value = feedback.rubricScores[key]
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            AI feedback · {draftNo}-qoralama
          </CardTitle>
          <div className="flex items-center gap-2">
            <AiBadge label="AI feedback" />
            <Badge variant="secondary" className="tabular-nums">
              {total} / 25
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Bu izohni <span className="font-medium">sun’iy intellekt</span> tayyorladi va u yakuniy
            baho emas. AI matningizni qayta yozib bermaydi — u faqat xatolarni tushuntiradi. Yakuniy
            bahoni o‘qituvchingiz qo‘yadi.
          </p>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Matningiz — xatolar ustiga bosing
            </p>
            <div className="rounded-lg border border-border p-3">
              <AnnotatedText
                text={text}
                errors={feedback.errors}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rubrika bo‘yicha ballar (0–5)
              </p>
              <RubricBars scores={feedback.rubricScores} />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kuchli tomonlar
                </p>
                <ul className="space-y-1 text-sm">
                  {feedback.strengths.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Yaxshilash kerak
                </p>
                <ul className="space-y-1 text-sm">
                  {feedback.areasToImprove.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback.errors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Xatolar ro‘yxati ({feedback.errors.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedback.errors.map((error, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index === activeIndex ? null : index)}
                className={cn(
                  'block w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40',
                  activeIndex === index && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {ERROR_TAG_LABELS[error.type as ErrorTag]?.uz ?? error.type}
                  </Badge>
                  <span className="font-mono text-xs line-through">{error.span}</span>
                  <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    → {error.fix}
                  </span>
                </div>
                {activeIndex === index && (
                  <div className="mt-3 border-t border-border pt-3">
                    <ErrorCard error={error} />
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Qayta ishlash rejasi</CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownText>{feedback.summary}</MarkdownText>
        </CardContent>
      </Card>
    </div>
  )
}
