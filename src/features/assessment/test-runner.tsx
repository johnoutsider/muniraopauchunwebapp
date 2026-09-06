'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  CloudOff,
  Loader2,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { SkillIcon } from '@/components/shared/skill-icon'
import { SKILL_LABELS } from '@/config/constants'
import { cn } from '@/lib/utils/cn'
import { wordCount } from '@/lib/utils/format'

import { AudioAnswer } from './audio-answer'
import { ListeningPlayer } from './listening-player'
import { QuestionRenderer } from './question-renderer'
import { SectionTimer } from './section-timer'
import { sectionStepCount } from './runner-content'
import {
  autosaveAttemptAction,
  discardAttemptAction,
  startAttemptAction,
  submitAttemptAction,
} from './actions'
import type {
  AnswerMap,
  AttemptProgress,
  OpenAnswerMap,
  RunnerSection,
  RunnerTest,
} from './types'

/**
 * Ko'p bo'limli test yurituvchisi (PLAN 8.11; metodikaning 2-bosqichi).
 *
 * IMKONIYATLAR:
 *  • bir vaqtda bitta savol + bo'lim progressi;
 *  • bo'lim taymeri (`TestSection.timeLimitMin`) — vaqt serverda saqlangan
 *    boshlanish momentidan hisoblanadi, sahifani yangilash yordam bermaydi;
 *  • bo'lim ichida savollar orasida erkin harakat;
 *  • AVTOSAQLASH — har o'zgarishdan 1.5 s keyin, bo'lim almashganda,
 *    sahifa yashirilganda va har 30 soniyada; internet uzilsa javob yo'qolmaydi;
 *  • listening — audio yoki TTS; reading — matn savollar ustida;
 *  • writing — so'z hisoblagich; speaking/pronunciation — ovoz yozish.
 *
 * Baholash bu komponentda UMUMAN yo'q: barcha ballar server action'da
 * `gradeItem` orqali hisoblanadi.
 */

const AUTOSAVE_DEBOUNCE_MS = 1500
const AUTOSAVE_INTERVAL_MS = 30000

export interface TestRunnerIntro {
  lead: string
  bullets: string[]
  estimatedMin: number
  /** «Bu test baholanmaydi» kabi tinchlantiruvchi izoh (diagnostika uchun) */
  note?: string
}

export interface TestRunnerProps {
  test: RunnerTest
  uid: string
  intro: TestRunnerIntro
  /** Tugallanmagan urinish mavjud bo'lsa — «davom ettirish» ekrani */
  existingAttemptId?: string | null
  /** Natijalar sahifasi manzili (attempt id qo'shiladi) */
  resultsBase?: string
}

type Phase = 'intro' | 'running' | 'submitting'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface RunnerState {
  attemptId: string
  answers: AnswerMap
  open: OpenAnswerMap
  progress: AttemptProgress
}

function sectionEndsAt(section: RunnerSection, startedAt: number | undefined): number | null {
  if (!section.timeLimitMin || !startedAt) return null
  return startedAt + section.timeLimitMin * 60000
}

/** Javob berilganmi — bo'sh satrlar va noto'g'ri tiplarga chidamli. */
function hasAnswer(value: string[] | undefined): boolean {
  return (
    Array.isArray(value) &&
    value.some((part) => typeof part === 'string' && part.trim().length > 0)
  )
}

function answeredCount(section: RunnerSection, answers: AnswerMap, open: OpenAnswerMap): number {
  let count = section.items.filter((item) => hasAnswer(answers[item.id])).length
  if (section.openTask) {
    const entry = open[section.id]
    if (entry?.text?.trim() || entry?.audioPath) count += 1
  }
  return count
}

export function TestRunner({
  test,
  uid,
  intro,
  existingAttemptId = null,
  resultsBase = '/student/assessment/results',
}: TestRunnerProps) {
  const router = useRouter()
  const [phase, setPhase] = React.useState<Phase>('intro')
  const [starting, setStarting] = React.useState(false)
  const [state, setState] = React.useState<RunnerState | null>(null)
  const [saveState, setSaveState] = React.useState<SaveState>('idle')

  const stateRef = React.useRef<RunnerState | null>(null)
  stateRef.current = state
  const dirtyRef = React.useRef(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = React.useRef(false)

  /* --------------------------------------------------------------- */
  /* Avtosaqlash                                                      */
  /* --------------------------------------------------------------- */

  const flush = React.useCallback(async () => {
    const current = stateRef.current
    if (!current || !dirtyRef.current || savingRef.current) return
    savingRef.current = true
    dirtyRef.current = false
    setSaveState('saving')
    try {
      const result = await autosaveAttemptAction(current.attemptId, {
        answers: current.answers,
        open: current.open,
        progress: current.progress,
      })
      setSaveState(result.ok ? 'saved' : 'error')
      if (!result.ok) dirtyRef.current = true
    } catch {
      dirtyRef.current = true
      setSaveState('error')
    } finally {
      savingRef.current = false
    }
  }, [])

  const scheduleSave = React.useCallback(() => {
    dirtyRef.current = true
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void flush(), AUTOSAVE_DEBOUNCE_MS)
  }, [flush])

  React.useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => void flush(), AUTOSAVE_INTERVAL_MS)

    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      void flush()
      event.preventDefault()
      event.returnValue = ''
    }

    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [phase, flush])

  /* --------------------------------------------------------------- */
  /* Boshlash / davom ettirish                                        */
  /* --------------------------------------------------------------- */

  async function handleStart() {
    setStarting(true)
    try {
      const result = await startAttemptAction(test.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const progress: AttemptProgress = {
        ...result.data.progress,
        sectionStartedAt: { ...result.data.progress.sectionStartedAt },
      }
      // Birinchi bo'lim uchun boshlanish vaqti belgilanmagan bo'lsa — hozir
      const first = test.sections[progress.sectionIndex] ?? test.sections[0]
      if (first && !progress.sectionStartedAt[first.id]) {
        progress.sectionStartedAt[first.id] = Date.now()
      }
      setState({
        attemptId: result.data.attemptId,
        answers: result.data.answers,
        open: result.data.open,
        progress,
      })
      setPhase('running')
    } catch {
      toast.error('Testni boshlab bo‘lmadi. Internet aloqasini tekshiring.')
    } finally {
      setStarting(false)
    }
  }

  async function handleDiscard() {
    if (!existingAttemptId) return
    const result = await discardAttemptAction(existingAttemptId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Oldingi urinish o‘chirildi.')
    router.refresh()
  }

  /* --------------------------------------------------------------- */
  /* Holatni yangilash                                                */
  /* --------------------------------------------------------------- */

  /**
   * Holatni `stateRef` asosida yangilaydi (React `setState` updater'i emas):
   * shu tufayli `goTo` dan keyin darhol chaqirilgan `flush()` ESKI emas,
   * AYNAN yangi holatni saqlaydi — bo'lim taymeri boshlangan vaqti yo'qolmaydi.
   */
  const update = React.useCallback(
    (updater: (prev: RunnerState) => RunnerState, save = true) => {
      const prev = stateRef.current
      if (!prev) return
      const next = updater(prev)
      stateRef.current = next
      setState(next)
      if (save) scheduleSave()
    },
    [scheduleSave]
  )

  function setAnswer(itemId: string, value: string[]) {
    update((prev) => ({ ...prev, answers: { ...prev.answers, [itemId]: value } }))
  }

  function setOpen(sectionId: string, value: OpenAnswerMap[string]) {
    update((prev) => ({ ...prev, open: { ...prev.open, [sectionId]: value } }))
  }

  function goTo(sectionIndex: number, itemIndex: number) {
    update((prev) => {
      const section = test.sections[sectionIndex]
      const startedAt = { ...prev.progress.sectionStartedAt }
      if (section && !startedAt[section.id]) startedAt[section.id] = Date.now()
      return {
        ...prev,
        progress: {
          ...prev.progress,
          sectionIndex,
          itemIndex,
          sectionStartedAt: startedAt,
        },
      }
    })
    void flush()
  }

  const lockSection = React.useCallback(
    (sectionId: string) => {
      update((prev) => {
        if (prev.progress.lockedSections.includes(sectionId)) return prev
        return {
          ...prev,
          progress: {
            ...prev.progress,
            lockedSections: [...prev.progress.lockedSections, sectionId],
          },
        }
      })
    },
    [update]
  )

  /* --------------------------------------------------------------- */
  /* Topshirish                                                       */
  /* --------------------------------------------------------------- */

  async function handleSubmit() {
    const current = stateRef.current
    if (!current) return
    setPhase('submitting')
    try {
      const result = await submitAttemptAction(current.attemptId, {
        answers: current.answers,
        open: current.open,
        progress: current.progress,
      })
      if (!result.ok) {
        toast.error(result.error)
        setPhase('running')
        return
      }
      dirtyRef.current = false
      toast.success('Test topshirildi. Natijalar tayyorlanmoqda…')
      router.push(`${resultsBase}/${result.data.attemptId}`)
    } catch {
      toast.error('Testni topshirib bo‘lmadi. Javoblaringiz saqlangan — qaytadan urinib ko‘ring.')
      setPhase('running')
    }
  }

  /* --------------------------------------------------------------- */
  /* Ekranlar                                                         */
  /* --------------------------------------------------------------- */

  if (phase === 'intro' || !state) {
    return (
      <IntroScreen
        test={test}
        intro={intro}
        resuming={Boolean(existingAttemptId)}
        starting={starting}
        onStart={() => void handleStart()}
        onDiscard={() => void handleDiscard()}
      />
    )
  }

  const sectionIndex = Math.min(state.progress.sectionIndex, test.sections.length - 1)
  const section = test.sections[sectionIndex]
  if (!section) {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>Test bo‘limlari topilmadi</AlertTitle>
        <AlertDescription>
          Bu testda hali savollar yo‘q. Iltimos, o‘qituvchingizga xabar bering.
        </AlertDescription>
      </Alert>
    )
  }

  const steps = sectionStepCount(section)
  const stepIndex = Math.min(state.progress.itemIndex, Math.max(0, steps - 1))
  const locked = state.progress.lockedSections.includes(section.id)
  const endsAt = sectionEndsAt(section, state.progress.sectionStartedAt[section.id])
  const isOpenStep = Boolean(section.openTask) && stepIndex === section.items.length
  const item = section.items[stepIndex]

  const isLastSection = sectionIndex === test.sections.length - 1
  const isLastStep = stepIndex >= steps - 1
  const answered = answeredCount(section, state.answers, state.open)
  const totalAnswered = test.sections.reduce(
    (sum, current) => sum + answeredCount(current, state.answers, state.open),
    0
  )
  const totalSteps = test.sections.reduce((sum, current) => sum + sectionStepCount(current), 0)

  return (
    <div className="space-y-4">
      {/* Bo'limlar qatori */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Umumiy: <span className="font-medium text-foreground">{totalAnswered}</span> /{' '}
              {totalSteps} javob berildi
            </p>
            <SaveIndicator state={saveState} onRetry={() => void flush()} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {test.sections.map((current, index) => {
              const visited = Boolean(state.progress.sectionStartedAt[current.id])
              const isLocked = state.progress.lockedSections.includes(current.id)
              const active = index === sectionIndex
              const done = answeredCount(current, state.answers, state.open)
              return (
                <button
                  key={current.id}
                  type="button"
                  disabled={isLocked || (!visited && index !== sectionIndex)}
                  onClick={() => goTo(index, 0)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/50',
                    (isLocked || (!visited && index !== sectionIndex)) &&
                      'cursor-not-allowed opacity-50'
                  )}
                >
                  <SkillIcon skill={current.skill} className="size-3.5" />
                  <span className="hidden sm:inline">{SKILL_LABELS[current.skill].uz}</span>
                  <span className="tabular-nums">
                    {done}/{sectionStepCount(current)}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Joriy bo'lim */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <SkillIcon skill={section.skill} className="size-4 text-primary" />
              {section.title}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {sectionIndex + 1}-bo‘lim / {test.sections.length} · {answered}/{steps} javob berildi
            </p>
          </div>
          {endsAt && !locked ? (
            <SectionTimer endsAt={endsAt} onExpire={() => lockSection(section.id)} />
          ) : null}
        </CardHeader>

        <CardContent className="space-y-5">
          <Progress value={steps ? (stepIndex / steps) * 100 : 0} />

          {locked ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle>Bo‘lim vaqti tugadi</AlertTitle>
              <AlertDescription>
                Bu bo‘limga qaytib kirib bo‘lmaydi. Berilgan javoblaringiz saqlandi — keyingi
                bo‘limga o‘ting.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {section.script ? (
                <ListeningPlayer
                  text={section.script}
                  label="Bo‘lim audiosi — diqqat bilan tinglang"
                />
              ) : null}

              {section.passage ? (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{section.passage}</p>
                </div>
              ) : null}

              {isOpenStep && section.openTask ? (
                <OpenTaskStep
                  section={section}
                  uid={uid}
                  attemptId={state.attemptId}
                  value={state.open[section.id] ?? {}}
                  onChange={(value) => setOpen(section.id, value)}
                />
              ) : item ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Savol {stepIndex + 1} / {section.items.length}
                  </p>
                  <QuestionRenderer
                    item={item}
                    value={state.answers[item.id] ?? []}
                    onChange={(value) => setAnswer(item.id, value)}
                    audio={{
                      uid,
                      storagePrefix: `speaking/${uid}/test/${state.attemptId}`,
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Bu bo‘limda savollar yo‘q.</p>
              )}

              {/* Savol raqamlari */}
              {section.items.length > 1 ? (
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
                  {section.items.map((current, index) => {
                    const filled = hasAnswer(state.answers[current.id])
                    return (
                      <button
                        key={current.id}
                        type="button"
                        onClick={() => goTo(sectionIndex, index)}
                        aria-current={index === stepIndex ? 'step' : undefined}
                        className={cn(
                          'size-8 rounded-md border text-xs font-medium tabular-nums transition-colors',
                          index === stepIndex
                            ? 'border-primary bg-primary text-primary-foreground'
                            : filled
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'border-border hover:bg-muted/50'
                        )}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                  {section.openTask ? (
                    <button
                      type="button"
                      onClick={() => goTo(sectionIndex, section.items.length)}
                      className={cn(
                        'h-8 rounded-md border px-2 text-xs font-medium transition-colors',
                        isOpenStep
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      Topshiriq
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigatsiya */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={sectionIndex === 0 && stepIndex === 0}
          onClick={() => {
            if (stepIndex > 0) goTo(sectionIndex, stepIndex - 1)
            else if (sectionIndex > 0) {
              const previous = test.sections[sectionIndex - 1]
              goTo(sectionIndex - 1, Math.max(0, sectionStepCount(previous) - 1))
            }
          }}
        >
          <ArrowLeft />
          Orqaga
        </Button>

        <div className="flex items-center gap-2">
          {!isLastSection || (!isLastStep && !locked) ? (
            <Button
              type="button"
              onClick={() => {
                if (!locked && !isLastStep) goTo(sectionIndex, stepIndex + 1)
                else goTo(Math.min(sectionIndex + 1, test.sections.length - 1), 0)
              }}
            >
              {locked || isLastStep ? 'Keyingi bo‘lim' : 'Keyingi'}
              <ArrowRight />
            </Button>
          ) : null}

          <ConfirmDialog
            trigger={
              <Button type="button" variant="success" loading={phase === 'submitting'}>
                <Send />
                Testni topshirish
              </Button>
            }
            title="Testni topshirasizmi?"
            description={`Javob berilgan: ${totalAnswered} / ${totalSteps}. Topshirgandan keyin javoblarni o‘zgartirib bo‘lmaydi va natijangiz hisoblanadi.`}
            confirmLabel="Ha, topshiraman"
            onConfirm={handleSubmit}
          />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ochiq topshiriq qadami                                              */
/* ------------------------------------------------------------------ */

function OpenTaskStep({
  section,
  uid,
  attemptId,
  value,
  onChange,
}: {
  section: RunnerSection
  uid: string
  attemptId: string
  value: OpenAnswerMap[string]
  onChange: (value: OpenAnswerMap[string]) => void
}) {
  const task = section.openTask
  if (!task) return null

  const words = wordCount(value.text ?? '')
  const enough = !task.minWords || words >= task.minWords

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Topshiriq</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{task.prompt}</p>
        {task.referenceText && task.kind === 'audio' ? (
          <p className="mt-3 rounded-md bg-background p-3 text-sm leading-relaxed">
            {task.referenceText}
          </p>
        ) : null}
      </div>

      {task.kind === 'audio' ? (
        <AudioAnswer
          uid={uid}
          storagePrefix={`speaking/${uid}/test/${attemptId}`}
          name={section.id}
          value={{ audioPath: value.audioPath, durationSec: value.durationSec }}
          onChange={(next) => onChange({ ...value, ...next })}
        />
      ) : (
        <div className="space-y-2">
          <textarea
            className="flex min-h-56 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            value={value.text ?? ''}
            placeholder="Javobingizni ingliz tilida yozing…"
            onChange={(event) => onChange({ ...value, text: event.target.value })}
          />
          <p
            className={cn(
              'text-xs',
              enough ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {words} ta so‘z
            {task.minWords ? ` · kamida ${task.minWords} ta so‘z talab qilinadi` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kirish / davom ettirish ekrani                                      */
/* ------------------------------------------------------------------ */

function IntroScreen({
  test,
  intro,
  resuming,
  starting,
  onStart,
  onDiscard,
}: {
  test: RunnerTest
  intro: TestRunnerIntro
  resuming: boolean
  starting: boolean
  onStart: () => void
  onDiscard: () => void
}) {
  const totalItems = test.sections.reduce((sum, section) => sum + sectionStepCount(section), 0)

  return (
    <div className="space-y-4">
      {resuming ? (
        <Alert variant="info">
          <RotateCcw />
          <AlertTitle>Tugallanmagan urinish topildi</AlertTitle>
          <AlertDescription>
            Oldingi javoblaringiz saqlangan. «Davom ettirish» tugmasi sizni to‘xtagan joyingizga
            qaytaradi. Boshidan boshlasangiz, oldingi javoblar o‘chib ketadi.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{test.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">{intro.lead}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Bo‘limlar</p>
              <p className="text-lg font-semibold">{test.sections.length} ta</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Topshiriqlar</p>
              <p className="text-lg font-semibold">{totalItems} ta</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Taxminiy vaqt</p>
              <p className="text-lg font-semibold">~{intro.estimatedMin} daqiqa</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Bo‘limlar tartibi</p>
            <ol className="grid gap-2 sm:grid-cols-2">
              {test.sections.map((section, index) => (
                <li
                  key={section.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium tabular-nums">
                    {index + 1}
                  </span>
                  <SkillIcon skill={section.skill} className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{section.title}</span>
                  {section.timeLimitMin ? (
                    <Badge variant="outline">{section.timeLimitMin} daq</Badge>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <ul className="space-y-1.5">
            {intro.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {bullet}
              </li>
            ))}
          </ul>

          {intro.note ? (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>{intro.note}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" loading={starting} onClick={onStart}>
              <Play />
              {resuming ? 'Davom ettirish' : 'Boshlash'}
            </Button>
            {resuming ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="outline" size="lg">
                    <RotateCcw />
                    Boshidan boshlash
                  </Button>
                }
                title="Boshidan boshlaysizmi?"
                description="Oldingi urinishdagi barcha javoblaringiz o‘chiriladi va uni tiklab bo‘lmaydi."
                confirmLabel="Ha, o‘chirilsin"
                destructive
                onConfirm={onDiscard}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Saqlash indikatori                                                  */
/* ------------------------------------------------------------------ */

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
        Saqlandi
      </span>
    )
  }
  return null
}
