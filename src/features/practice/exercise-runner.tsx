'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Flame,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AiBadge } from '@/components/shared/ai-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { MarkdownText } from '@/components/shared/markdown-text'
import { ERROR_TAG_LABELS, ITEM_TYPE_LABELS, SKILL_LABELS, type ErrorTag } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

import { submitAnswerAction, finishPracticeSessionAction } from './actions'
import { ItemInput, PartMarks, hasAnswer } from './item-renderers'
import type { AnswerFeedback, RunnerItem, SessionSummary } from './types'

/**
 * Mashq yuritgichi (PLAN 5-bosqich, 6-bo'lim).
 *
 * Metodik talab: har javobdan keyin feedback UCH savolga javob beradi —
 * NIMA UCHUN xato → QANDAY tuzatish → YANA QAYERDA uchraydi.
 * Adaptiv o'tishlar ochiq ko'rsatiladi: 3 ta ketma-ket to'g'ri → «Daraja oshdi»,
 * 2 ta ketma-ket xato → qayta tushuntirish bloki.
 */

export interface ExerciseRunnerProps {
  items: RunnerItem[]
  context?: 'lesson' | 'practice' | 'test' | 'project'
  contextId?: string
  /** Ko'nikma nomi (yakuniy log uchun) */
  skill?: string
  topic?: string
  /** Boshlang'ich difficulty — sarlavhada ko'rsatiladi */
  difficulty?: number
  /** Eksperimental guruh: shaxsiylashtirilgan AI izohi tugmasi */
  aiExplain?: boolean
  /** Adaptiv o'tishlarni ko'rsatish (nazorat guruhida false) */
  adaptive?: boolean
  /** Yakunda «Davom etish» havolasi */
  continueHref?: string
  continueLabel?: string
  /** Yakunda refleksiya havolasi */
  reflectionHref?: string
  /** Dars ichida ishlatilganda ixcham ko'rinish */
  compact?: boolean
  title?: string
}

interface Answered {
  feedback: AnswerFeedback
  timeMs: number
  hintsUsed: number
}

export function ExerciseRunner({
  items,
  context = 'practice',
  contextId,
  skill,
  topic,
  difficulty,
  aiExplain = false,
  adaptive = true,
  continueHref = '/student/practice',
  continueLabel = 'Davom etish',
  reflectionHref = '/student/reflection',
  compact = false,
  title,
}: ExerciseRunnerProps) {
  const [index, setIndex] = React.useState(0)
  const [answer, setAnswer] = React.useState<string[]>([])
  const [hintsUsed, setHintsUsed] = React.useState(0)
  const [showHint, setShowHint] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [answered, setAnswered] = React.useState<Record<string, Answered>>({})
  const [finished, setFinished] = React.useState(false)
  const [toast, setToast] = React.useState<{ kind: 'up' | 'down' | 'mastered'; text: string } | null>(
    null
  )
  const [bonusXp, setBonusXp] = React.useState(0)
  const [aiText, setAiText] = React.useState<string | null>(null)
  const [aiPending, setAiPending] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)

  const startedAt = React.useRef<number>(Date.now())
  const item = items[index]
  const current = item ? answered[item.id] : undefined
  const feedback = current?.feedback ?? null

  React.useEffect(() => {
    startedAt.current = Date.now()
    setAnswer([])
    setHintsUsed(0)
    setShowHint(false)
    setError(null)
    setAiText(null)
    setAiError(null)
  }, [index])

  React.useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  const summary = React.useMemo<SessionSummary>(() => {
    const entries = Object.values(answered)
    const correct = entries.filter((entry) => entry.feedback.isCorrect).length
    const tagCounts = new Map<ErrorTag, number>()
    for (const entry of entries) {
      for (const tag of entry.feedback.errorTags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
      }
    }
    const topicMisses = new Map<string, number>()
    for (const runnerItem of items) {
      const entry = answered[runnerItem.id]
      if (entry && !entry.feedback.isCorrect) {
        topicMisses.set(runnerItem.topic, (topicMisses.get(runnerItem.topic) ?? 0) + 1)
      }
    }
    const weakest = [...topicMisses.entries()].sort((a, b) => b[1] - a[1])[0]

    let best = 0
    let run = 0
    for (const runnerItem of items) {
      const entry = answered[runnerItem.id]
      if (!entry) continue
      if (entry.feedback.isCorrect) {
        run += 1
        best = Math.max(best, run)
      } else {
        run = 0
      }
    }

    return {
      total: entries.length,
      correct,
      accuracy: entries.length ? Math.round((correct / entries.length) * 100) : 0,
      xp: entries.reduce((sum, entry) => sum + entry.feedback.xpAwarded, 0),
      totalTimeMs: entries.reduce((sum, entry) => sum + entry.timeMs, 0),
      hintsUsed: entries.reduce((sum, entry) => sum + entry.hintsUsed, 0),
      bestStreak: best,
      errorTags: [...tagCounts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      weakestTopic: weakest ? weakest[0] : null,
    }
  }, [answered, items])

  async function handleSubmit() {
    if (!item || pending || feedback) return
    setPending(true)
    setError(null)
    const timeMs = Date.now() - startedAt.current

    const result = await submitAnswerAction({
      itemId: item.id,
      answer,
      timeMs,
      hintsUsed,
      context,
      contextId,
    })

    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setAnswered((prev) => ({
      ...prev,
      [item.id]: { feedback: result.data, timeMs, hintsUsed },
    }))

    if (adaptive) {
      if (result.data.leveledUp) {
        setToast({ kind: 'up', text: `Daraja oshdi — endi ${result.data.difficulty}-daraja mashqlar` })
      } else if (result.data.leveledDown) {
        setToast({
          kind: 'down',
          text: `Daraja pasaytirildi — ${result.data.difficulty}-daraja, mustahkamlaymiz`,
        })
      } else if (result.data.mastered) {
        setToast({ kind: 'mastered', text: 'Bu mavzuni egalladingiz!' })
      }
    }
  }

  async function handleAiExplain() {
    if (!item || !feedback) return
    setAiPending(true)
    setAiError(null)
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          answer,
          topic: item.topic,
          skill: item.skill,
          isCorrect: feedback.isCorrect,
        }),
      })
      if (!response.ok) {
        setAiError('AI izohi hozir mavjud emas. Yuqoridagi tushuntirishdan foydalaning.')
        return
      }
      const payload: unknown = await response.json()
      const text = extractText(payload)
      if (!text) {
        setAiError('AI izohi bo‘sh qaytdi. Yuqoridagi tushuntirishdan foydalaning.')
        return
      }
      setAiText(text)
    } catch {
      setAiError('AI izohini olishda tarmoq xatosi.')
    } finally {
      setAiPending(false)
    }
  }

  async function handleNext() {
    if (index < items.length - 1) {
      setIndex(index + 1)
      return
    }
    setFinished(true)
    const result = await finishPracticeSessionAction({
      skill: skill ?? item?.skill ?? 'vocabulary',
      topic,
      context,
      contextId,
      total: summary.total,
      correct: summary.correct,
      totalTimeMs: summary.totalTimeMs,
      hintsUsed: summary.hintsUsed,
      errorTags: summary.errorTags.map((entry) => entry.tag),
    })
    if (result.ok) setBonusXp(result.data.bonusXp)
  }

  function restart() {
    setAnswered({})
    setIndex(0)
    setFinished(false)
    setBonusXp(0)
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Mashq topilmadi"
        description="Bu mavzu bo‘yicha tasdiqlangan mashqlar hali qo‘shilmagan. Boshqa ko‘nikmani tanlang."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/student/practice">Mashq maydoniga qaytish</Link>
          </Button>
        }
      />
    )
  }

  if (finished) {
    return (
      <SessionSummaryCard
        summary={summary}
        bonusXp={bonusXp}
        continueHref={continueHref}
        continueLabel={continueLabel}
        reflectionHref={reflectionHref}
        onRestart={restart}
      />
    )
  }

  if (!item) return null

  const answeredCount = Object.keys(answered).length
  const progress = Math.round((answeredCount / items.length) * 100)
  const typeLabel = ITEM_TYPE_LABELS[item.type]?.uz ?? item.type

  return (
    <div className="relative space-y-4">
      {toast ? <AdaptiveToast kind={toast.kind} text={toast.text} /> : null}

      {/* Sarlavha va jarayon */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline">{item.cefr}</Badge>
            <Badge variant="outline">Daraja {feedback?.difficulty ?? difficulty ?? item.difficulty}</Badge>
            {title ? <span className="text-sm text-muted-foreground">{title}</span> : null}
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {index + 1} / {items.length} · {summary.xp} XP
          </span>
        </div>
        <Progress value={progress} aria-label="Sessiya jarayoni" />
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">
            {item.instruction || 'Topshiriqni bajaring'}
          </CardTitle>
          {item.type !== 'gap_fill' &&
          item.type !== 'error_correction' &&
          item.type !== 'substitution' ? (
            <p className="text-base leading-relaxed">{item.stem}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <ItemInput
            key={item.id}
            item={item}
            disabled={Boolean(feedback) || pending}
            onChange={setAnswer}
            parts={feedback?.parts}
          />

          {showHint ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <p className="font-medium">Yordam</p>
              <p className="mt-1 text-muted-foreground">{buildHint(item)}</p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {!feedback ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={pending || !hasAnswer(item, answer)}
                loading={pending}
              >
                Tekshirish
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={showHint}
                onClick={() => {
                  setShowHint(true)
                  setHintsUsed((value) => value + 1)
                }}
              >
                <Lightbulb />
                Yordam
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {feedback ? (
        <FeedbackPanel
          feedback={feedback}
          item={item}
          aiExplain={aiExplain}
          aiText={aiText}
          aiPending={aiPending}
          aiError={aiError}
          onAiExplain={() => void handleAiExplain()}
          adaptive={adaptive}
          compact={compact}
          onNext={() => void handleNext()}
          isLast={index === items.length - 1}
        />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

interface FeedbackPanelProps {
  feedback: AnswerFeedback
  item: RunnerItem
  aiExplain: boolean
  aiText: string | null
  aiPending: boolean
  aiError: string | null
  onAiExplain: () => void
  adaptive: boolean
  compact: boolean
  onNext: () => void
  isLast: boolean
}

function FeedbackPanel({
  feedback,
  item,
  aiExplain,
  aiText,
  aiPending,
  aiError,
  onAiExplain,
  adaptive,
  compact,
  onNext,
  isLast,
}: FeedbackPanelProps) {
  return (
    <Card
      className={cn(
        'animate-slide-up border-l-4',
        feedback.isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {feedback.isCorrect ? (
            <>
              <span className="grid size-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="size-4" />
              </span>
              To‘g‘ri javob
            </>
          ) : (
            <>
              <span className="grid size-7 place-items-center rounded-full bg-rose-500/15 text-rose-600">
                <X className="size-4" />
              </span>
              Javob to‘liq to‘g‘ri emas
            </>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {feedback.aiGraded ? <AiBadge label="AI baholadi" /> : null}
          <Badge variant={feedback.isCorrect ? 'success' : 'outline'}>
            +{feedback.xpAwarded} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PartMarks parts={feedback.parts} />

        {!feedback.isCorrect ? (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              To‘g‘ri javob
            </p>
            <p className="mt-1 font-medium">{feedback.correctAnswer || '—'}</p>
            {feedback.modelAnswer ? (
              <p className="mt-1 text-muted-foreground">Namuna: {feedback.modelAnswer}</p>
            ) : null}
          </div>
        ) : null}

        {/* MAJBURIY UCHLIK: nima uchun → qanday → yana qayerda */}
        <ol className="space-y-3">
          <ExplanationRow
            step="1"
            label="Nima uchun shunday"
            text={feedback.explanation.why}
          />
          <ExplanationRow step="2" label="Qanday tuzatiladi" text={feedback.explanation.how} />
          <ExplanationRow
            step="3"
            label="Yana qayerda ishlatiladi"
            text={feedback.explanation.whereElse}
          />
        </ol>

        {feedback.errorTags.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Xato turi:</span>
            {feedback.errorTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {ERROR_TAG_LABELS[tag]?.uz ?? tag}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* 2 ta ketma-ket xato → qayta tushuntirish (PLAN 6.3) */}
        {adaptive && feedback.needsReteach ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <RotateCcw className="size-4 text-amber-600" />
              Qayta tushuntiramiz
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ketma-ket ikki marta xato bo‘ldi — «{item.topic}» mavzusiga qaytamiz va qiyinlik
              darajasi {feedback.difficulty} ga tushirildi. Quyidagi qadamlar bo‘yicha yana bir bor
              o‘qib chiqing.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{feedback.explanation.why}</li>
              <li>{feedback.explanation.how}</li>
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/student/learn?skill=${item.skill}`}>
                Mavzu darsini ochish
                <ChevronRight />
              </Link>
            </Button>
          </div>
        ) : null}

        {/* Eksperimental guruh: shaxsiylashtirilgan AI izohi */}
        {aiExplain ? (
          <div className="space-y-2">
            {aiText ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AiBadge label="Shaxsiy AI izohi" />
                </div>
                <MarkdownText>{aiText}</MarkdownText>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAiExplain}
                loading={aiPending}
                disabled={aiPending}
              >
                <Bot />
                Menga moslab tushuntir
              </Button>
            )}
            {aiError ? <p className="text-xs text-muted-foreground">{aiError}</p> : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-1">
          {adaptive ? (
            <span className="text-xs text-muted-foreground">
              Ketma-ket to‘g‘ri: {feedback.streakCorrect} · qiyinlik {feedback.difficulty}/5
            </span>
          ) : (
            <span />
          )}
          <Button type="button" onClick={onNext} size={compact ? 'sm' : 'default'}>
            {isLast ? 'Yakunlash' : 'Keyingi mashq'}
            <ArrowRight />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ExplanationRow({ step, label, text }: { step: string; label: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {step}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Adaptiv o'tish toasti                                               */
/* ------------------------------------------------------------------ */

function AdaptiveToast({ kind, text }: { kind: 'up' | 'down' | 'mastered'; text: string }) {
  const Icon = kind === 'up' ? TrendingUp : kind === 'down' ? TrendingDown : Sparkles
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'animate-slide-up fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-xl border p-3 shadow-lg sm:inset-x-auto sm:right-6',
        kind === 'down'
          ? 'border-amber-500/40 bg-card'
          : 'border-emerald-500/40 bg-card'
      )}
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full',
          kind === 'down' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
        )}
      >
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-medium">{kind === 'up' ? 'Daraja oshdi!' : text}</p>
      {kind === 'up' ? <span className="sr-only">{text}</span> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sessiya yakuni                                                      */
/* ------------------------------------------------------------------ */

function SessionSummaryCard({
  summary,
  bonusXp,
  continueHref,
  continueLabel,
  reflectionHref,
  onRestart,
}: {
  summary: SessionSummary
  bonusXp: number
  continueHref: string
  continueLabel: string
  reflectionHref: string
  onRestart: () => void
}) {
  const minutes = Math.max(1, Math.round(summary.totalTimeMs / 60000))
  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-5 text-primary" />
          Sessiya yakunlandi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <SummaryStat label="Aniqlik" value={`${summary.accuracy}%`} />
          <SummaryStat label="To‘g‘ri javob" value={`${summary.correct} / ${summary.total}`} />
          <SummaryStat label="XP" value={`+${summary.xp + bonusXp}`} />
          <SummaryStat label="Vaqt" value={`${minutes} daq`} />
        </div>

        {bonusXp > 0 ? (
          <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            Yuqori aniqlik uchun +{bonusXp} bonus XP!
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Xato turlari
            </p>
            {summary.errorTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu sessiyada qayd etilgan xato yo‘q — ajoyib!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {summary.errorTags.map((entry) => (
                  <li key={entry.tag} className="flex items-center justify-between text-sm">
                    <span>{ERROR_TAG_LABELS[entry.tag]?.uz ?? entry.tag}</span>
                    <Badge variant="outline">{entry.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Eng zaif mavzu
            </p>
            <p className="text-sm">
              {summary.weakestTopic ? (
                <span className="font-medium">{summary.weakestTopic}</span>
              ) : (
                <span className="text-muted-foreground">Aniqlanmadi — barcha javoblar to‘g‘ri</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Eng uzun to‘g‘ri javoblar seriyasi: {summary.bestStreak} · ishlatilgan yordam:{' '}
              {summary.hintsUsed}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={continueHref}>
              {continueLabel}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={reflectionHref}>Refleksiya yozish</Link>
          </Button>
          <Button type="button" variant="ghost" onClick={onRestart}>
            <RotateCcw />
            Qaytadan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

function buildHint(item: RunnerItem): string {
  const skillLabel = SKILL_LABELS[item.skill]?.uz ?? item.skill
  switch (item.type) {
    case 'mcq':
      return `${skillLabel} · «${item.topic}». Har variantni gapga qo‘yib o‘qing — grammatik va uslubiy jihatdan qaysi biri mos tushadi?`
    case 'gap_fill':
      return `«${item.topic}» mavzusi. Bo‘shliqdan oldingi va keyingi so‘zlarga qarang: ular kerakli shaklni belgilaydi.`
    case 'matching':
      return 'Avval siz aniq bilgan juftliklarni belgilang — qolganlari uchun tanlov toraydi.'
    case 'classification':
      return `Har bir so‘zni «${item.categories?.join('» yoki «') ?? 'kategoriya'}» ta’rifi bilan solishtiring.`
    case 'word_order':
      return 'Ingliz tilida odatiy tartib: ega → kesim → to‘ldiruvchi → hol. Avval egani toping.'
    case 'error_correction':
      return 'Zamon, artikl, predlog va son moslashuvini alohida tekshiring — xato ko‘pincha shulardan birida.'
    case 'transformation':
      return `«${item.topic}» strukturasini saqlang: ma’no o‘zgarmasligi kerak, faqat shakl o‘zgaradi.`
    case 'expansion':
      return 'Gapni sifat, hol yoki ergash gap bilan kengaytiring — kasbiy kontekstni qo‘shing.'
    case 'substitution':
      return 'Belgilangan qismni bir xil ma’noli, lekin kasbiy uslubga mos ibora bilan almashtiring.'
    case 'imitation':
      return 'Namunadagi tuzilishni saqlang, faqat mazmunni o‘z sohangizga moslang.'
    default:
      return `${skillLabel} · «${item.topic}» mavzusini eslang.`
  }
}

function extractText(payload: unknown): string | null {
  if (typeof payload === 'string') return payload.trim() || null
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (typeof record.text === 'string') return record.text.trim() || null
  if (typeof record.explanation === 'string') return record.explanation.trim() || null
  const data = record.data
  if (typeof data === 'string') return data.trim() || null
  if (data && typeof data === 'object') {
    const inner = data as Record<string, unknown>
    if (typeof inner.text === 'string') return inner.text.trim() || null
    if (typeof inner.explanation === 'string') return inner.explanation.trim() || null
  }
  return null
}
