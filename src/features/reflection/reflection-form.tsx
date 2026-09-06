'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { NotebookPen, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/shared/ai-badge'
import { MarkdownText } from '@/components/shared/markdown-text'
import { Spinner } from '@/components/shared/loading-state'
import { cn } from '@/lib/utils/cn'
import { XP } from '@/config/constants'

import { createReflectionAction, saveReflectionCommentAction } from './actions'
import { MOOD_OPTIONS, REFLECTION_QUESTIONS, extractAiComment } from './constants'

/**
 * Refleksiya kundaligi formasi (PLAN 8.14).
 *
 * AI izohi FAQAT `aiFeedback` bayrog'i yoqilgan guruhda so'raladi
 * (`canUseAi` propi serverda `resolveFlags` orqali hisoblanadi). Nazorat
 * guruhida hech qanday AI so'rovi yuborilmaydi. So'rov muvaffaqiyatsiz
 * bo'lsa — jimgina o'tkazib yuboriladi, yozuv baribir saqlangan bo'ladi.
 */

export interface ReflectionFormProps {
  /** `flags.aiFeedback` — nazorat guruhida `false` */
  canUseAi: boolean
  /** Metodika bosqichi (1 — maqsad qo'yish, 8 — yakuniy refleksiya) */
  stage?: number
  contextId?: string
}

type Answers = { didWell: string; repeatedMistakes: string; improveNext: string }

const EMPTY: Answers = { didWell: '', repeatedMistakes: '', improveNext: '' }

export function ReflectionForm({ canUseAi, stage = 8, contextId }: ReflectionFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = React.useState<Answers>(EMPTY)
  const [mood, setMood] = React.useState<number>(3)
  const [saving, setSaving] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiComment, setAiComment] = React.useState<string | null>(null)

  const filled = Object.values(answers).some((value) => value.trim().length > 0)

  async function requestAiComment(reflectionId: string, payload: Answers, moodValue: number) {
    if (!canUseAi) return
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/feedback-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'reflection',
          reflectionId,
          answers: payload,
          mood: moodValue,
        }),
      })
      if (!response.ok) return
      const comment = extractAiComment(await response.json())
      if (!comment) return
      setAiComment(comment)
      await saveReflectionCommentAction(reflectionId, comment).catch(() => undefined)
    } catch {
      // AI izohi ixtiyoriy — xatolik jimgina o'tkazib yuboriladi
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setAiComment(null)
    try {
      const result = await createReflectionAction({ ...answers, mood, stage, contextId })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(`Refleksiya saqlandi. +${XP.REFLECTION} XP`)
      const saved = { ...answers }
      const savedMood = mood
      setAnswers(EMPTY)
      setMood(3)
      router.refresh()
      void requestAiComment(result.data.id, saved, savedMood)
    } catch {
      toast.error('Yozuvni saqlab bo‘lmadi. Internet aloqasini tekshiring.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookPen className="size-4 text-primary" />
            Bugungi refleksiya
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Uch savolga qisqacha javob bering. Bu — metodikaning majburiy qismi: o‘z ishingizni
            baholash xatolarni takrorlamaslikka yordam beradi.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {REFLECTION_QUESTIONS.map((question) => (
              <div key={question.key} className="space-y-1.5">
                <Label htmlFor={question.key}>{question.uz}</Label>
                <p className="text-xs text-muted-foreground">{question.en}</p>
                <Textarea
                  id={question.key}
                  rows={3}
                  value={answers[question.key]}
                  placeholder={question.placeholder}
                  onChange={(event) =>
                    setAnswers((prev) => ({ ...prev, [question.key]: event.target.value }))
                  }
                />
              </div>
            ))}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Bugungi kayfiyatingiz</legend>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={mood === option.value}
                    onClick={() => setMood(option.value)}
                    className={cn(
                      'flex min-w-24 flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors',
                      mood === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <span aria-hidden="true" className="text-xl">
                      {option.emoji}
                    </span>
                    {option.uz}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving} disabled={!filled}>
                Saqlash (+{XP.REFLECTION} XP)
              </Button>
              {!filled ? (
                <p className="text-xs text-muted-foreground">
                  Kamida bitta savolga javob yozing.
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {canUseAi && (aiLoading || aiComment) ? (
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Yozuvingizga qisqa izoh
            </CardTitle>
            <AiBadge label="AI izohi" />
          </CardHeader>
          <CardContent>
            {aiLoading && !aiComment ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Izoh tayyorlanmoqda…
              </div>
            ) : aiComment ? (
              <MarkdownText>{aiComment}</MarkdownText>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
