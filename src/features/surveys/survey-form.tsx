'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Cloud, CloudOff, Loader2, Send } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { cn } from '@/lib/utils/cn'
import type { SurveyDoc, SurveyQuestion } from '@/types'

import { saveSurveyDraftAction, submitSurveyAction } from './actions'
import { answeredCount, likertMax, scaleEnds } from './scoring'
import type { SurveyAnswers } from './types'

/**
 * So'rovnoma formasi (PLAN 9.1).
 *
 * Metodik tafsilotlar:
 *  • likert5/likert7 — raqamli radio shkala, ikkala uchida matnli yorliq;
 *  • teskari savollar (`reverse`) UI'da HECH QANDAY belgilanmaydi — aks holda
 *    talaba javobini "to'g'rilab" yuborardi va shkala buzilardi. Teskari
 *    hisob faqat serverda amalga oshiriladi;
 *  • javoblar qoralama sifatida avtosaqlanadi, topshirilgach qulflanadi.
 */

const AUTOSAVE_MS = 2000

export interface SurveyFormProps {
  surveyId: string
  survey: Pick<SurveyDoc, 'questions' | 'title' | 'titleUz' | 'description' | 'type'>
  initialAnswers: SurveyAnswers
  initialStatus: 'pending' | 'draft' | 'submitted'
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function SurveyForm({
  surveyId,
  survey,
  initialAnswers,
  initialStatus,
}: SurveyFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = React.useState<SurveyAnswers>(initialAnswers)
  const [status, setStatus] = React.useState(initialStatus)
  const [saveState, setSaveState] = React.useState<SaveState>('idle')
  const [submitting, setSubmitting] = React.useState(false)

  const answersRef = React.useRef(answers)
  answersRef.current = answers
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyRef = React.useRef(false)

  const submitted = status === 'submitted'
  const questions = survey.questions ?? []
  const done = answeredCount({ questions }, answers)
  const missing = questions.filter((question) => {
    const value = answers[question.id]
    if (value === undefined || value === null) return true
    return typeof value === 'string' ? value.trim().length === 0 : !Number.isFinite(value)
  })

  const flush = React.useCallback(async () => {
    if (!dirtyRef.current || submitted) return
    dirtyRef.current = false
    setSaveState('saving')
    try {
      const result = await saveSurveyDraftAction(surveyId, answersRef.current)
      setSaveState(result.ok ? 'saved' : 'error')
      if (!result.ok) dirtyRef.current = true
    } catch {
      dirtyRef.current = true
      setSaveState('error')
    }
  }, [surveyId, submitted])

  React.useEffect(() => {
    if (submitted) return
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [flush, submitted])

  function update(questionId: string, value: number | string) {
    if (submitted) return
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value }
      answersRef.current = next
      return next
    })
    dirtyRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_MS)
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const result = await submitSurveyAction(surveyId, answersRef.current)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      dirtyRef.current = false
      setStatus('submitted')
      toast.success('So‘rovnoma topshirildi. Rahmat!')
      router.refresh()
    } catch {
      toast.error('So‘rovnomani topshirib bo‘lmadi. Internet aloqasini tekshiring.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!questions.length) {
    return (
      <Alert variant="warning">
        <AlertTitle>So‘rovnomada savollar yo‘q</AlertTitle>
        <AlertDescription>
          Bu so‘rovnoma hali to‘ldirilmagan. Iltimos, keyinroq qayta urinib ko‘ring.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {submitted ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>So‘rovnoma topshirilgan</AlertTitle>
          <AlertDescription>
            Javoblaringiz saqlangan va o‘zgartirilmaydi. Ular ilmiy tahlilda faqat ishtirokchi
            kodi bilan ishlatiladi.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Javob berildi: <span className="font-medium text-foreground">{done}</span> /{' '}
                {questions.length}
              </p>
              <Progress value={(done / questions.length) * 100} />
            </div>
            <SaveIndicator state={saveState} onRetry={() => void flush()} />
          </CardContent>
        </Card>
      )}

      <ol className="space-y-3">
        {questions.map((question, index) => (
          <li key={question.id}>
            <QuestionCard
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={(value) => update(question.id, value)}
              disabled={submitted}
            />
          </li>
        ))}
      </ol>

      {!submitted ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {missing.length
              ? `${missing.length} ta savol javobsiz — topshirish uchun barchasiga javob bering.`
              : 'Barcha savollarga javob berildi.'}
          </p>
          <ConfirmDialog
            trigger={
              <Button type="button" disabled={missing.length > 0} loading={submitting}>
                <Send />
                Topshirish
              </Button>
            }
            title="So‘rovnomani topshirasizmi?"
            description="Topshirgandan keyin javoblarni o‘zgartirib bo‘lmaydi."
            confirmLabel="Ha, topshiraman"
            onConfirm={handleSubmit}
          />
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function QuestionCard({
  question,
  index,
  value,
  onChange,
  disabled,
}: {
  question: SurveyQuestion
  index: number
  value: number | string | undefined
  onChange: (value: number | string) => void
  disabled: boolean
}) {
  const max = likertMax(question.type)
  const text = question.textUz?.trim() || question.text

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium tabular-nums">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-relaxed">{text}</p>
            {question.textUz && question.textUz !== question.text ? (
              <p className="text-xs text-muted-foreground">{question.text}</p>
            ) : null}
          </div>
          {value !== undefined && value !== '' ? (
            <Badge variant="success" className="shrink-0 gap-1">
              <CheckCircle2 />
            </Badge>
          ) : null}
        </div>

        {max > 0 ? (
          <LikertScale
            name={question.id}
            max={max}
            ends={scaleEnds(question)}
            value={typeof value === 'number' ? value : Number(value) || 0}
            onChange={onChange}
            disabled={disabled}
          />
        ) : question.type === 'mcq' ? (
          <div className="space-y-2">
            {(question.options ?? []).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors',
                  value === option && 'border-primary bg-primary/5',
                  disabled && 'cursor-default opacity-90'
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  disabled={disabled}
                  onChange={() => onChange(option)}
                  className="mt-0.5 size-4 accent-[var(--color-primary)]"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <Textarea
            rows={4}
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            placeholder="Javobingizni yozing…"
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function LikertScale({
  name: _name,
  max,
  ends,
  value,
  onChange,
  disabled,
}: {
  name: string
  max: number
  ends: { low: string; high: string }
  value: number
  onChange: (value: number) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={`${ends.low} — ${ends.high}`}
        className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
      >
        {Array.from({ length: max }).map((_, index) => {
          const option = index + 1
          const active = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${option}`}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                'size-10 rounded-full border text-sm font-medium tabular-nums transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                disabled && 'cursor-default opacity-80'
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span className="max-w-40 text-left">{ends.low}</span>
        <span className="max-w-40 text-right">{ends.high}</span>
      </div>
    </div>
  )
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
      >
        <CloudOff className="size-3.5" />
        Saqlanmadi — qayta urinish
      </button>
    )
  }
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Saqlanmoqda…
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Cloud className="size-3.5" />
        Qoralama saqlandi
      </span>
    )
  }
  return null
}
