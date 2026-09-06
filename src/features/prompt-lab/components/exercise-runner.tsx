'use client'

import * as React from 'react'
import { CircleCheck, CircleX, Lightbulb, Send, Sparkles } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import type { CefrLevel, PromptLevel } from '@/config/constants'

import { postAi, type AiRequestError } from '@/features/ai-teacher/ai-request'
import { recordPromptAttempt, recordSimpleChoice } from '../actions'
import { TEMPLATE_FIELDS, buildTemplatePrompt, type PromptExerciseItem } from '../content'
import type { PromptEvalResult, PromptLabProgress } from '../types'
import { EvalResult } from './eval-result'

export interface ExerciseRunnerProps {
  exercise: PromptExerciseItem
  level: PromptLevel
  cefr: CefrLevel
  onProgress: (progress: PromptLabProgress) => void
}

/* ------------------------------------------------------------------ */
/* 1. Simple — ikkitadan yaxshirog'ini tanlash                          */
/* ------------------------------------------------------------------ */

function SimpleExercise({ exercise, onProgress }: Omit<ExerciseRunnerProps, 'level' | 'cefr'>) {
  const [choice, setChoice] = React.useState<'bad' | 'good' | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Variantlar tartibi mashq id siga bog'liq — har safar bir xil, lekin har mashqda har xil
  const goodFirst = React.useMemo(
    () => exercise.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2 === 0,
    [exercise.id]
  )

  const options = goodFirst
    ? [
        { key: 'good' as const, text: exercise.goodPromptExample },
        { key: 'bad' as const, text: exercise.badPromptExample },
      ]
    : [
        { key: 'bad' as const, text: exercise.badPromptExample },
        { key: 'good' as const, text: exercise.goodPromptExample },
      ]

  React.useEffect(() => {
    setChoice(null)
  }, [exercise.id])

  async function handleChoose(key: 'bad' | 'good') {
    if (choice) return
    setChoice(key)
    setSaving(true)
    const result = await recordSimpleChoice({ exerciseId: exercise.id, correct: key === 'good' })
    setSaving(false)
    if (result.ok) onProgress(result.data)
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const revealed = choice !== null
          const isGood = option.key === 'good'
          return (
            <button
              key={option.key}
              type="button"
              disabled={revealed || saving}
              onClick={() => void handleChoose(option.key)}
              className={cn(
                'rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:cursor-default',
                revealed && isGood && 'border-emerald-500/60 bg-emerald-500/5',
                revealed && !isGood && 'border-destructive/50 bg-destructive/5',
                choice === option.key && 'ring-2 ring-primary/40'
              )}
            >
              <span className="flex items-start gap-2">
                {revealed &&
                  (isGood ? (
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
                  ))}
                <span className="font-mono text-sm leading-relaxed">«{option.text}»</span>
              </span>
            </button>
          )
        })}
      </div>

      {choice && (
        <Alert variant={choice === 'good' ? 'default' : 'destructive'}>
          <AlertTitle>{choice === 'good' ? 'To‘g‘ri!' : 'Bu prompt zaifroq'}</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>
              Yaxshi prompt: «{exercise.goodPromptExample}» — unda vazifa, daraja, mavzu va format
              aniq ko‘rsatilgan.
            </p>
            <p className="text-xs">
              Zaif variantda («{exercise.badPromptExample}») bu qismlarning ko‘pi yo‘q, shuning
              uchun AI umumiy va foydasiz javob beradi.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2 & 3. Guided va Independent — AI baholaydi                          */
/* ------------------------------------------------------------------ */

function WritingExercise({ exercise, level, cefr, onProgress }: ExerciseRunnerProps) {
  const isGuided = level === 'guided'

  const [values, setValues] = React.useState<Record<string, string>>({
    task: '',
    level: '',
    topic: '',
    format: '',
  })
  const [freeText, setFreeText] = React.useState('')
  const [showHints, setShowHints] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<AiRequestError | null>(null)
  const [result, setResult] = React.useState<PromptEvalResult | null>(null)

  const abortRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abortRef.current?.abort(), [])

  React.useEffect(() => {
    setResult(null)
    setError(null)
    setFreeText('')
    setValues({ task: '', level: '', topic: '', format: '' })
  }, [exercise.id, level])

  const composed = isGuided
    ? buildTemplatePrompt({
        task: values.task,
        level: values.level,
        topic: values.topic,
        format: values.format,
      })
    : freeText

  async function handleSubmit() {
    const prompt = composed.trim()
    if (prompt.length < 10) {
      setError({
        message: 'Prompt juda qisqa — kamida bir to‘liq jumla yozing.',
        status: 400,
        quotaExceeded: false,
        flagDisabled: false,
        unauthenticated: false,
        aborted: false,
      })
      return
    }

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    abortRef.current = controller
    const timeout = setTimeout(() => controller.abort(), 90_000)

    const response = await postAi<PromptEvalResult>(
      '/api/ai/prompt-eval',
      {
        prompt,
        level,
        cefr,
        exercise: {
          id: exercise.id,
          task: exercise.task,
          badPromptExample: exercise.badPromptExample,
          goodPromptExample: exercise.goodPromptExample,
          rubric: exercise.rubric,
        },
      },
      controller.signal
    )

    clearTimeout(timeout)
    abortRef.current = null
    setLoading(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    setResult(response.data)
    const saved = await recordPromptAttempt({
      exerciseId: exercise.id,
      level,
      totalScore: response.data.totalScore,
      nextLevel: response.data.nextLevel,
    })
    if (saved.ok) onProgress(saved.data)
  }

  return (
    <div className="space-y-4">
      {isGuided ? (
        <div className="space-y-3">
          {TEMPLATE_FIELDS.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`tpl-${field.id}`}>{field.label}</Label>
              <Textarea
                id={`tpl-${field.id}`}
                value={values[field.id]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [field.id]: event.target.value }))
                }
                placeholder={field.placeholder}
                rows={2}
                className="min-h-[52px] resize-y text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {field.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValues((current) => ({ ...current, [field.id]: option }))}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{field.hint}</p>
            </div>
          ))}

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Yig‘ilgan prompt
            </p>
            <p className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
              {composed || '—'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="free-prompt">Promptingizni yozing (ingliz tilida)</Label>
          <Textarea
            id="free-prompt"
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            rows={6}
            placeholder="I am a B2 economics student. …"
            className="min-h-[140px] resize-y text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Eslatma: vazifa + daraja + mavzu + format. Halollik uchun «Do not write it for me» kabi
            chegara qo‘ying.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void handleSubmit()} loading={loading} disabled={loading}>
          <Send />
          Baholashga yuborish
        </Button>
        {exercise.hints.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setShowHints((value) => !value)}>
            <Lightbulb />
            {showHints ? 'Maslahatlarni yashirish' : 'Maslahat'}
          </Button>
        )}
      </div>

      {showHints && exercise.hints.length > 0 && (
        <ul className="list-disc space-y-1 rounded-lg border border-dashed border-border p-3 pl-7 text-xs text-muted-foreground">
          {exercise.hints.map((hint, index) => (
            <li key={index}>{hint}</li>
          ))}
        </ul>
      )}

      {error && (
        <Alert variant={error.quotaExceeded ? 'default' : 'destructive'}>
          <AlertTitle>
            {error.quotaExceeded
              ? 'Kunlik AI limiti tugadi'
              : error.unauthenticated
                ? 'Sessiya tugagan'
                : 'Baholab bo‘lmadi'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error.message}</p>
            {error.quotaExceeded && (
              <p className="text-xs">
                Ertaga limit yangilanadi. Shu vaqtgacha «Yomon ↔ yaxshi prompt» namunasi va AI
                javobini tekshirish mashqlari ochiq — ular AI chaqiruvisiz ishlaydi.
              </p>
            )}
            {!error.quotaExceeded && !error.flagDisabled && (
              <Button size="sm" variant="outline" onClick={() => void handleSubmit()}>
                Qaytadan urinish
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <EvalResult
          result={result}
          currentLevel={level}
          onUseImproved={isGuided ? undefined : (prompt) => setFreeText(prompt)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Umumiy qobiq                                                         */
/* ------------------------------------------------------------------ */

export function ExerciseRunner({ exercise, level, cefr, onProgress }: ExerciseRunnerProps) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Mashq
        </CardTitle>
        <Badge variant="outline">
          {level === 'simple' ? 'Oddiy' : level === 'guided' ? 'Shablon bilan' : 'Mustaqil'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-lg bg-muted/40 p-3 text-sm">{exercise.task}</p>
        {level === 'simple' ? (
          <SimpleExercise exercise={exercise} onProgress={onProgress} />
        ) : (
          <WritingExercise exercise={exercise} level={level} cefr={cefr} onProgress={onProgress} />
        )}
      </CardContent>
    </Card>
  )
}
