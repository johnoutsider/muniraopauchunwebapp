'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FilePenLine,
  GraduationCap,
  Loader2,
  Save,
  Send,
  Sparkles,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { wordCount } from '@/lib/utils/format'
import type { CefrLevel } from '@/config/constants'
import type { WritingAiFeedback } from '@/types'

import { postAi, type AiRequestError } from '@/features/ai-teacher/ai-request'
import { saveAiFeedback, saveDraft, startNewDraft, submitToTeacher } from '../actions'
import { GENRE_LABELS, type WritingTask } from '../genres'
import type { DraftSummary, SubmissionDetail } from '../types'
import { DraftHistory } from './draft-history'
import { FeedbackPanel } from './feedback-panel'

export interface WritingWorkspaceProps {
  task: WritingTask
  submission: SubmissionDetail | null
  cefr: CefrLevel
  knownWeaknesses: string[]
  /** `flags.aiFeedback` — nazorat guruhida AI paneli o'rniga izoh ko'rsatiladi. */
  aiEnabled: boolean
  /** Ish yuborilgan bo'lsa muharrir faqat o'qish uchun ochiladi. */
  readOnly?: boolean
}

const AUTOSAVE_MS = 2500

export function WritingWorkspace({
  task,
  submission,
  cefr,
  knownWeaknesses,
  aiEnabled,
  readOnly = false,
}: WritingWorkspaceProps) {
  const router = useRouter()

  const [submissionId, setSubmissionId] = React.useState<string | null>(submission?.id ?? null)
  const [text, setText] = React.useState(submission?.currentText ?? '')
  const [drafts, setDrafts] = React.useState<DraftSummary[]>(submission?.drafts ?? [])
  const [status, setStatus] = React.useState(submission?.status ?? 'draft')

  const [saving, setSaving] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<number | null>(null)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const [feedback, setFeedback] = React.useState<WritingAiFeedback | null>(
    submission?.currentFeedback ?? null
  )
  const [feedbackText, setFeedbackText] = React.useState(submission?.currentText ?? '')
  const [feedbackLoading, setFeedbackLoading] = React.useState(false)
  const [feedbackError, setFeedbackError] = React.useState<AiRequestError | null>(null)

  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [busyDraft, setBusyDraft] = React.useState(false)

  const lastSavedText = React.useRef(submission?.currentText ?? '')
  const abortRef = React.useRef<AbortController | null>(null)

  const words = wordCount(text)
  const genre = GENRE_LABELS[task.genre]
  const draftNo = Math.max(1, drafts.length)
  const locked = readOnly || status !== 'draft'
  const progress = Math.min(100, (words / task.minWords) * 100)

  /* ---------------- Avtomatik saqlash ---------------- */

  const persist = React.useCallback(
    async (value: string) => {
      if (locked) return
      setSaving(true)
      setSaveError(null)

      const result = await saveDraft({
        submissionId: submissionId ?? undefined,
        taskId: task.id,
        taskTitle: task.title,
        genre: task.genre,
        text: value,
      })

      setSaving(false)
      if (!result.ok) {
        setSaveError(result.error)
        return
      }

      lastSavedText.current = value
      setSavedAt(result.data.savedAt)

      if (!submissionId) {
        setSubmissionId(result.data.submissionId)
        router.refresh()
      }

      setDrafts((current) => {
        const next = [...current]
        const entry: DraftSummary = {
          index: result.data.draftNo - 1,
          text: value,
          wordCount: result.data.wordCount,
          hasFeedback: next[result.data.draftNo - 1]?.hasFeedback ?? false,
          ts: result.data.savedAt,
        }
        next[result.data.draftNo - 1] = entry
        return next
      })
    },
    [locked, router, submissionId, task.genre, task.id, task.title]
  )

  React.useEffect(() => {
    if (locked) return
    if (text === lastSavedText.current) return
    if (!text.trim()) return

    const timer = setTimeout(() => {
      void persist(text)
    }, AUTOSAVE_MS)
    return () => clearTimeout(timer)
  }, [text, locked, persist])

  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  /* ---------------- AI feedback ---------------- */

  async function handleFeedback() {
    if (feedbackLoading) return
    if (words < 20) {
      setFeedbackError({
        message: 'Feedback olish uchun kamida 20 ta so‘z yozing.',
        status: 400,
        quotaExceeded: false,
        flagDisabled: false,
        unauthenticated: false,
        aborted: false,
      })
      return
    }

    setFeedbackLoading(true)
    setFeedbackError(null)

    // Avval joriy matnni saqlaymiz — feedback aynan shu qoralamaga biriktiriladi
    await persist(text)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 120_000)

    const result = await postAi<WritingAiFeedback>(
      '/api/ai/writing-feedback',
      {
        text,
        genre: task.genre,
        cefr,
        taskPrompt: task.prompt,
        knownWeaknesses: knownWeaknesses.slice(0, 8),
        draftNo,
      },
      controller.signal
    )

    clearTimeout(timeout)
    abortRef.current = null
    setFeedbackLoading(false)

    if (!result.ok) {
      setFeedbackError(result.error)
      return
    }

    setFeedback(result.data)
    setFeedbackText(text)

    const currentId = submissionId
    if (currentId) {
      const saved = await saveAiFeedback({ submissionId: currentId, feedback: result.data })
      if (saved.ok) {
        setDrafts((current) =>
          current.map((draft, index) =>
            index === saved.data.draftNo - 1 ? { ...draft, hasFeedback: true } : draft
          )
        )
      }
    }
  }

  /* ---------------- Qayta ishlash / yuborish ---------------- */

  async function handleNewDraft() {
    if (!submissionId) return
    setBusyDraft(true)
    await persist(text)
    const result = await startNewDraft(submissionId)
    setBusyDraft(false)

    if (!result.ok) {
      setSaveError(result.error)
      return
    }

    setDrafts((current) => [
      ...current,
      { index: current.length, text, wordCount: words, hasFeedback: false, ts: Date.now() },
    ])
    setFeedback(null)
    setFeedbackError(null)
    router.refresh()
  }

  async function handleSubmit() {
    if (!submissionId) {
      await persist(text)
    }
    const id = submissionId
    if (!id) {
      setSubmitError(
        'Ishni avval saqlash kerak — bir necha soniyadan so‘ng qaytadan urinib ko‘ring.'
      )
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    const result = await submitToTeacher({ submissionId: id, text })
    setSubmitting(false)

    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    setStatus('submitted')
    router.refresh()
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        {/* Topshiriq */}
        <Card>
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <FilePenLine className="size-4 text-primary" />
                {task.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{genre.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">{genre.uz}</Badge>
              <Badge variant="outline">{draftNo}-qoralama</Badge>
              {status !== 'draft' && (
                <Badge variant="success">
                  {status === 'submitted' ? 'Yuborilgan' : 'Baholangan'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">{task.prompt}</p>
            <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {task.checklist.map((item, index) => (
                <li key={index} className="flex gap-1.5">
                  <CheckCircle2 className="mt-0.5 size-3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Muharrir */}
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-base">Matningiz</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Saqlanmoqda…
                </span>
              ) : savedAt ? (
                <span className="flex items-center gap-1">
                  <Save className="size-3" />
                  Saqlandi
                </span>
              ) : null}
              <span
                className={cn(
                  'tabular-nums',
                  words < task.minWords
                    ? 'text-muted-foreground'
                    : words > task.maxWords
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                )}
              >
                {words} so‘z ({task.minWords}–{task.maxWords})
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress} className="h-1.5" />
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={locked}
              rows={16}
              placeholder="Ingliz tilida yozing…"
              className="min-h-[320px] resize-y font-[inherit] text-sm leading-7"
              aria-label="Yozma ish matni"
            />

            {saveError && <p className="text-xs text-destructive">{saveError}</p>}

            <div className="flex flex-wrap items-center gap-2">
              {!locked && aiEnabled && (
                <Button onClick={() => void handleFeedback()} loading={feedbackLoading}>
                  <Sparkles />
                  AI feedbackini olish
                </Button>
              )}

              {!locked && (
                <Button
                  variant="outline"
                  onClick={() => void persist(text)}
                  disabled={saving || text === lastSavedText.current}
                >
                  <CloudUpload />
                  Hozir saqlash
                </Button>
              )}

              {!locked && feedback && (
                <Button variant="outline" onClick={() => void handleNewDraft()} loading={busyDraft}>
                  <FilePenLine />
                  Qayta ishlash (yangi qoralama)
                </Button>
              )}

              {!locked && (
                <Button
                  variant="success"
                  onClick={() => void handleSubmit()}
                  loading={submitting}
                  disabled={words < 20}
                >
                  <Send />
                  O‘qituvchiga yuborish
                </Button>
              )}

              {submissionId && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/student/writing-lab/${submissionId}`}>
                    Ish sahifasi
                    <ExternalLink />
                  </Link>
                </Button>
              )}
            </div>

            {submitError && <p className="text-xs text-destructive">{submitError}</p>}

            {status === 'submitted' && (
              <Alert>
                <AlertTitle>Ish o‘qituvchiga yuborildi</AlertTitle>
                <AlertDescription>
                  Matn qulflandi. O‘qituvchingiz izoh va baho qo‘yganidan so‘ng natija shu sahifada
                  ko‘rinadi.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* AI feedback yoki nazorat guruhi izohi */}
        {aiEnabled ? (
          <>
            {feedbackError && (
              <Alert variant={feedbackError.quotaExceeded ? 'default' : 'destructive'}>
                <AlertTitle>
                  {feedbackError.quotaExceeded
                    ? 'Kunlik AI limiti tugadi'
                    : feedbackError.unauthenticated
                      ? 'Sessiya tugagan'
                      : 'Feedbackni olib bo‘lmadi'}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{feedbackError.message}</p>
                  <p className="text-xs">
                    Matningiz saqlanib qoldi — uni istalgan vaqtda o‘qituvchiga yuborishingiz
                    mumkin.
                  </p>
                  {!feedbackError.quotaExceeded && !feedbackError.flagDisabled && (
                    <Button size="sm" variant="outline" onClick={() => void handleFeedback()}>
                      Qaytadan urinish
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {feedbackLoading && !feedback && (
              <Card>
                <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  AI matningizni tahlil qilmoqda — bu 15–30 soniya olishi mumkin.
                </CardContent>
              </Card>
            )}

            {feedback && (
              <FeedbackPanel text={feedbackText} feedback={feedback} draftNo={draftNo} />
            )}
          </>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-muted-foreground" />
                Ishingizni o‘qituvchi ko‘rib chiqadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Sizning guruhingizda yozma ishlarga izohni o‘qituvchi beradi. Yuqoridagi talablar
                ro‘yxatidan foydalanib matningizni o‘zingiz tekshiring, so‘ng «O‘qituvchiga
                yuborish» tugmasini bosing.
              </p>
              <p className="text-xs">
                Qoralamalaringiz saqlanadi — yuborishdan oldin matnni istagancha qayta ishlashingiz
                mumkin.
              </p>
            </CardContent>
          </Card>
        )}

        {/* O'qituvchi izohi */}
        {submission?.teacherFeedback && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4 text-primary" />
                O‘qituvchi izohi
                {typeof submission.teacherFeedback.score === 'number' && (
                  <span className="text-sm font-normal text-muted-foreground">
                    · {submission.teacherFeedback.score} ball
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{submission.teacherFeedback.text}</CardContent>
          </Card>
        )}
      </div>

      <aside className="space-y-4">
        <DraftHistory drafts={drafts} currentText={text} />
      </aside>
    </div>
  )
}
