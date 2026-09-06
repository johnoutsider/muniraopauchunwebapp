'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { CheckCircle2, History, MessageSquareText, Send, User } from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/shared/ai-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/shared/score-badge'
import { ERROR_TAG_LABELS, RUBRIC_LABELS, WRITING_RUBRIC } from '@/config/constants'
import { formatDateTime, relativeTime } from '@/lib/utils/format'
import type { WritingSubmissionDoc } from '@/types'

import { reviewWritingAction } from '../actions'
import { RubricScorer } from './rubric-scorer'

export interface WritingReviewPanelProps {
  submission: WritingSubmissionDoc & { id: string }
  studentName: string
  studentUid: string
  participantCode: string
}

export function WritingReviewPanel({
  submission,
  studentName,
  studentUid,
  participantCode,
}: WritingReviewPanelProps) {
  const router = useRouter()
  const [scores, setScores] = React.useState<Record<string, number>>(
    () => (submission.rubricScores as Record<string, number> | undefined) ?? {}
  )
  const [comment, setComment] = React.useState(submission.teacherFeedback?.text ?? '')
  const [pending, setPending] = React.useState(false)

  const drafts = submission.drafts ?? []
  const lastAi = [...drafts].reverse().find((d) => d.aiFeedback)?.aiFeedback
  const finalText = submission.finalText ?? drafts.at(-1)?.text ?? ''

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const missing = WRITING_RUBRIC.filter((key) => typeof scores[key] !== 'number')
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
      const result = await reviewWritingAction({
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
            · {participantCode} · {formatDateTime(submission.submittedAt ?? submission.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{submission.genre}</Badge>
          <Badge variant="secondary">{submission.wordCount ?? 0} so‘z</Badge>
          {submission.status === 'reviewed' ? (
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
        {/* Talaba matni + qoralamalar tarixi */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-muted-foreground" />
                Talabaning yakuniy matni
              </CardTitle>
            </CardHeader>
            <CardContent>
              {finalText ? (
                <article className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                  {finalText}
                </article>
              ) : (
                <EmptyState title="Matn yo‘q" description="Talaba hali matn yubormagan." />
              )}
            </CardContent>
          </Card>

          {drafts.length > 1 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="size-4 text-muted-foreground" />
                  Qoralamalar tarixi ({drafts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {drafts.map((draft, index) => (
                    <AccordionItem key={index} value={`draft-${index}`}>
                      <AccordionTrigger>
                        <span className="flex flex-wrap items-center gap-2 text-sm">
                          {index + 1}-qoralama
                          <span className="text-xs font-normal text-muted-foreground">
                            {relativeTime(draft.ts)} · {draft.wordCount ?? 0} so‘z
                          </span>
                          {draft.aiFeedback ? <AiBadge label="AI feedback olgan" /> : null}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
                          {draft.text}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* AI feedback + o'qituvchi bahosi */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                AI feedback
                <AiBadge label="AI yaratgan — yakuniy baho o‘qituvchida" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!lastAi ? (
                <p className="text-sm text-muted-foreground">
                  Bu ish uchun AI feedback yo‘q (nazorat guruhi yoki AI o‘chirilgan).
                </p>
              ) : (
                <>
                  {lastAi.summary ? (
                    <Alert variant="info">
                      <AlertTitle>Umumiy xulosa</AlertTitle>
                      <AlertDescription>{lastAi.summary}</AlertDescription>
                    </Alert>
                  ) : null}

                  {lastAi.strengths?.length ? (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Kuchli tomonlar
                      </p>
                      <ul className="list-disc space-y-0.5 pl-5 text-sm">
                        {lastAi.strengths.map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {lastAi.areasToImprove?.length ? (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Yaxshilash kerak
                      </p>
                      <ul className="list-disc space-y-0.5 pl-5 text-sm">
                        {lastAi.areasToImprove.map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {lastAi.errors?.length ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Topilgan xatolar ({lastAi.errors.length})
                      </p>
                      {lastAi.errors.slice(0, 8).map((error, index) => (
                        <div key={index} className="rounded-lg border border-border p-2.5 text-sm">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <code className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-700 dark:text-rose-300">
                              {error.span}
                            </code>
                            <Badge variant="outline">
                              {ERROR_TAG_LABELS[error.type]?.uz ?? error.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Nima uchun: </span>
                            {error.why}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Tuzatish: </span>
                            {error.fix}
                          </p>
                          {error.whereElse ? (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">Yana qayerda: </span>
                              {error.whereElse}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {lastAi.rubricScores && Object.keys(lastAi.rubricScores).length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(lastAi.rubricScores).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {RUBRIC_LABELS[key]?.uz ?? key}: {value}
                        </Badge>
                      ))}
                    </div>
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
                  keys={WRITING_RUBRIC}
                  value={scores}
                  onChange={setScores}
                  aiScores={lastAi?.rubricScores as Record<string, number> | undefined}
                  disabled={pending}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="teacher-comment">Izoh (talabaga ko‘rinadi)</Label>
                  <Textarea
                    id="teacher-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Nima yaxshi chiqdi, nimani va qanday yaxshilash kerak…"
                    rows={5}
                    maxLength={4000}
                    disabled={pending}
                  />
                  <p className="text-xs text-muted-foreground">{comment.length} / 4000</p>
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
