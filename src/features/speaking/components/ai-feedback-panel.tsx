'use client'

import * as React from 'react'
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'
import type { CefrLevel } from '@/config/constants'
import type { SpeakingAiFeedback } from '@/types'

import { postAi, type AiRequestError } from '@/features/ai-teacher/ai-request'

export interface AiFeedbackPanelProps {
  submissionId: string
  cefr: CefrLevel
  /** Firestore'da saqlangan feedback (bo'lsa, qaytadan so'ralmaydi). */
  initial?: SpeakingAiFeedback | null
  /** Sahifa ochilishi bilan avtomatik so'rash. */
  autoLoad?: boolean
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

/** Azure ballarini pedagogik tavsiyaga aylantirish (`POST /api/ai/speaking-feedback`). */
export function AiFeedbackPanel({
  submissionId,
  cefr,
  initial = null,
  autoLoad = true,
}: AiFeedbackPanelProps) {
  const [feedback, setFeedback] = React.useState<SpeakingAiFeedback | null>(initial)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<AiRequestError | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const load = React.useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 90_000)

    const result = await postAi<SpeakingAiFeedback>(
      '/api/ai/speaking-feedback',
      { submissionId, cefr },
      controller.signal
    )

    clearTimeout(timeout)
    abortRef.current = null
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setFeedback(result.data)
  }, [cefr, loading, submissionId])

  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const started = React.useRef(false)
  React.useEffect(() => {
    if (!autoLoad || feedback || started.current) return
    started.current = true
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, feedback])

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Talaffuz bo‘yicha pedagogik tahlil
        </CardTitle>
        <AiBadge label="AI tahlili" />
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && !feedback && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              AI ballarni tahlil qilmoqda — bu 10–20 soniya olishi mumkin.
            </p>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {error && !feedback && (
          <Alert variant={error.quotaExceeded ? 'default' : 'destructive'}>
            <AlertTitle>
              {error.quotaExceeded ? 'Kunlik AI limiti tugadi' : 'Tahlilni olib bo‘lmadi'}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error.message}</p>
              <p className="text-xs">
                Azure ballari yuqorida saqlanib qoldi — ular tahlilsiz ham to‘liq ishlaydi.
              </p>
              {!error.quotaExceeded && !error.flagDisabled && (
                <Button size="sm" variant="outline" onClick={() => void load()}>
                  Qaytadan urinish
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !feedback && !error && (
          <Button size="sm" onClick={() => void load()}>
            <Sparkles />
            AI tahlilini olish
          </Button>
        )}

        {feedback && (
          <div className="space-y-4 text-sm">
            <MarkdownText>{feedback.overallComment}</MarkdownText>

            <div className="grid gap-4 sm:grid-cols-2">
              <Section title="Kuchli tomonlar">
                <ul className="space-y-1">
                  {feedback.strengths.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              {feedback.issues.length > 0 && (
                <Section title="Ustida ishlash kerak">
                  <ul className="space-y-1">
                    {feedback.issues.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Section title="So‘z urg‘usi">
                <p className="text-muted-foreground">{feedback.wordStress}</p>
              </Section>
              <Section title="Gap urg‘usi">
                <p className="text-muted-foreground">{feedback.sentenceStress}</p>
              </Section>
              <Section title="Intonatsiya">
                <p className="text-muted-foreground">{feedback.intonation}</p>
              </Section>
              <Section title="Ravonlik">
                <p className="text-muted-foreground">{feedback.fluency}</p>
              </Section>
            </div>

            {feedback.problematicSounds.length > 0 && (
              <Section title="Muammoli tovushlar va mashqlar">
                <ul className="space-y-2">
                  {feedback.problematicSounds.map((sound, index) => (
                    <li key={index} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                          {sound.sound}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sound.words.join(', ')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs">{sound.tip}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Keyingi qadamlar">
              <ol className="list-decimal space-y-1 pl-5">
                {feedback.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </Section>

            <p className="text-[11px] text-muted-foreground">
              Bu tahlil AI tomonidan tayyorlangan. Yakuniy bahoni o‘qituvchingiz qo‘yadi.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
