'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AudioLines, CheckCircle2, MessageSquareText, Send } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/shared/ai-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/shared/score-badge'
import { RUBRIC_LABELS, SPEAKING_RUBRIC } from '@/config/constants'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format'
import type { SpeakingSubmissionDoc } from '@/types'

import { reviewSpeakingAction } from '../actions'
import { RubricScorer } from './rubric-scorer'

export interface SpeakingReviewPanelProps {
  submission: SpeakingSubmissionDoc & { id: string }
  studentName: string
  studentUid: string
  participantCode: string
  audioUrl: string | null
}

function wordClass(score: number, errorType?: string): string {
  if (errorType && errorType !== 'None') return 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  if (score >= 60) return 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
  if (score >= 40) return 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
}

export function SpeakingReviewPanel({
  submission,
  studentName,
  studentUid,
  participantCode,
  audioUrl,
}: SpeakingReviewPanelProps) {
  const router = useRouter()
  const [scores, setScores] = React.useState<Record<string, number>>(
    () => (submission.rubricScores as Record<string, number> | undefined) ?? {}
  )
  const [comment, setComment] = React.useState(submission.teacherFeedback?.text ?? '')
  const [pending, setPending] = React.useState(false)

  const azure = submission.azure
  const ai = submission.aiFeedback

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const missing = SPEAKING_RUBRIC.filter((key) => typeof scores[key] !== 'number')
    if (missing.length) {
      toast.error(`Baholanmagan mezon: ${missing.map((k) => RUBRIC_LABELS[k]?.uz ?? k).join(', ')}`)
      return
    }
    if (!comment.trim()) {
      toast.error('Talabaga izoh yozing.')
      return
    }

    setPending(true)
    try {
      const result = await reviewSpeakingAction({
        submissionId: submission.id,
        rubricScores: scores,
        comment,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(
        result.data.alreadyReviewed
          ? `Baho yangilandi: ${result.data.score}/100`
          : `Baholandi: ${result.data.score}/100 — talabaga xabar yuborildi`
      )
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{submission.taskTitle}</h2>
          <p className="text-sm text-muted-foreground">
            <Link href={`/teacher/students/${studentUid}`} className="hover:text-foreground">
              {studentName}
            </Link>{' '}
            · {participantCode} · {formatDateTime(submission.ts)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{submission.type}</Badge>
          <Badge variant="secondary">{submission.attemptNo ?? 1}-urinish</Badge>
          {submission.teacherFeedback ? (
            <Badge variant="success">
              <CheckCircle2 />
              Baholangan
            </Badge>
          ) : (
            <Badge variant="warning">Kutmoqda</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AudioLines className="size-4 text-muted-foreground" />
                Audio yozuv
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {audioUrl ? (
                <audio controls preload="none" src={audioUrl} className="w-full">
                  Brauzeringiz audio elementni qo‘llab-quvvatlamaydi.
                </audio>
              ) : (
                <EmptyState
                  title="Audio topilmadi"
                  description="Fayl o‘chirilgan yoki hali yuklanmagan."
                />
              )}

              {submission.referenceText ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Namuna matn
                  </p>
                  <p className="rounded-lg bg-muted/40 p-3 text-sm">{submission.referenceText}</p>
                </div>
              ) : null}

              {submission.transcript ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Transkript
                  </p>
                  <p className="rounded-lg bg-muted/40 p-3 text-sm">{submission.transcript}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Azure talaffuz baholari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!azure ? (
                <p className="text-sm text-muted-foreground">
                  Avtomatik talaffuz tahlili mavjud emas.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'Aniqlik', value: azure.accuracyScore },
                      { label: 'Ravonlik', value: azure.fluencyScore },
                      { label: 'To‘liqlik', value: azure.completenessScore },
                      { label: 'Prosodiya', value: azure.prosodyScore },
                    ].map((entry) => (
                      <div
                        key={entry.label}
                        className="rounded-lg border border-border p-2 text-center"
                      >
                        <p className="text-[11px] text-muted-foreground">{entry.label}</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {typeof entry.value === 'number' ? Math.round(entry.value) : '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {azure.words?.length ? (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        So‘z bo‘yicha ballar
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {azure.words.map((word, index) => (
                          <span
                            key={`${word.word}-${index}`}
                            title={`${Math.round(word.accuracyScore)} · ${word.errorType}${
                              word.phonemes?.length
                                ? ` · ${word.phonemes
                                    .map((p) => `${p.phoneme}:${Math.round(p.accuracyScore)}`)
                                    .join(' ')}`
                                : ''
                            }`}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-sm',
                              wordClass(word.accuracyScore, word.errorType)
                            )}
                          >
                            {word.word}
                            <span className="ml-1 text-[10px] opacity-70 tabular-nums">
                              {Math.round(word.accuracyScore)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                AI feedback
                <AiBadge label="AI yaratgan — yakuniy baho o‘qituvchida" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!ai ? (
                <p className="text-sm text-muted-foreground">
                  Bu topshiriq uchun AI tavsiyasi yo‘q (nazorat guruhi yoki AI o‘chirilgan).
                </p>
              ) : (
                <>
                  {ai.overallComment ? (
                    <Alert variant="info">
                      <AlertTitle>Umumiy izoh</AlertTitle>
                      <AlertDescription>{ai.overallComment}</AlertDescription>
                    </Alert>
                  ) : null}

                  <dl className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: 'So‘z urg‘usi', value: ai.wordStress },
                      { label: 'Gap urg‘usi', value: ai.sentenceStress },
                      { label: 'Intonatsiya', value: ai.intonation },
                      { label: 'Ravonlik', value: ai.fluency },
                    ]
                      .filter((entry) => Boolean(entry.value))
                      .map((entry) => (
                        <div key={entry.label} className="rounded-lg border border-border p-2">
                          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {entry.label}
                          </dt>
                          <dd className="text-sm">{entry.value}</dd>
                        </div>
                      ))}
                  </dl>

                  {ai.problematicSounds?.length ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Qiyin tovushlar
                      </p>
                      {ai.problematicSounds.map((sound, index) => (
                        <div key={index} className="rounded-lg border border-border p-2 text-sm">
                          <span className="font-mono font-semibold">{sound.sound}</span>{' '}
                          <span className="text-muted-foreground">({sound.words.join(', ')})</span>
                          <p className="text-muted-foreground">{sound.tip}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {ai.issues?.length ? (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm">
                      {ai.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareText className="size-4 text-muted-foreground" />
                O‘qituvchi bahosi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <RubricScorer
                  keys={SPEAKING_RUBRIC}
                  value={scores}
                  onChange={setScores}
                  disabled={pending}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="speaking-comment">Izoh (talabaga ko‘rinadi)</Label>
                  <Textarea
                    id="speaking-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Talaffuz, urg‘u, ravonlik bo‘yicha aniq tavsiyalar…"
                    rows={5}
                    maxLength={4000}
                    disabled={pending}
                  />
                </div>

                {submission.teacherFeedback ? (
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    Oldingi baho:
                    <ScoreBadge score={submission.teacherFeedback.score ?? 0} />
                    {formatDateTime(submission.teacherFeedback.at)}
                  </p>
                ) : null}

                <Button type="submit" loading={pending} className="w-full sm:w-auto">
                  <Send />
                  Bahoni saqlash va talabaga yuborish
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
