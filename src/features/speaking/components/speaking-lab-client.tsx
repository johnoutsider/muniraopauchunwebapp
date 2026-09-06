'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ListChecks, Mic, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils/cn'
import type { CefrLevel } from '@/config/constants'

import { fetchTaskAttempts } from '../actions'
import { TASK_TYPE_LABELS } from '../tasks'
import type { AssessResponse, AttemptSummary, SpeakingTask, SpeakingTaskType } from '../types'
import { AiFeedbackPanel } from './ai-feedback-panel'
import { AssessmentView } from './assessment-view'
import { AttemptTrend } from './attempt-trend'
import { ModelAudio } from './model-audio'
import { RecorderPanel } from './recorder-panel'

export interface SpeakingLabClientProps {
  tasks: SpeakingTask[]
  initialTaskId?: string
  initialAttempts: AttemptSummary[]
  cefr: CefrLevel
  /** `flags.pronunciationAI` — nazorat guruhida AI tahlili bo'lmaydi. */
  aiEnabled: boolean
}

const TYPE_ORDER: SpeakingTaskType[] = ['word', 'sentence', 'dialogue', 'presentation']

export function SpeakingLabClient({
  tasks,
  initialTaskId,
  initialAttempts,
  cefr,
  aiEnabled,
}: SpeakingLabClientProps) {
  const router = useRouter()

  const initialTask =
    tasks.find((task) => task.id === initialTaskId) ??
    tasks.find((task) => task.type === 'sentence') ??
    tasks[0] ??
    null

  const [task, setTask] = React.useState<SpeakingTask | null>(initialTask)
  const [tab, setTab] = React.useState<SpeakingTaskType>(initialTask?.type ?? 'sentence')
  const [result, setResult] = React.useState<AssessResponse | null>(null)
  const [ownAudioUrl, setOwnAudioUrl] = React.useState<string>('')
  const [duration, setDuration] = React.useState(0)
  const [attempts, setAttempts] = React.useState<AttemptSummary[]>(
    initialTaskId ? initialAttempts : []
  )

  const loadAttempts = React.useCallback(async (taskId: string) => {
    const response = await fetchTaskAttempts(taskId)
    if (response.ok) setAttempts(response.data.attempts)
  }, [])

  React.useEffect(() => {
    if (task) void loadAttempts(task.id)
  }, [task, loadAttempts])

  function handleSelect(next: SpeakingTask) {
    setTask(next)
    setResult(null)
    setOwnAudioUrl('')
  }

  function handleAssessed(assessed: AssessResponse, audioUrl: string, durationSec: number) {
    setResult(assessed)
    setOwnAudioUrl(audioUrl)
    setDuration(durationSec)
    if (task) void loadAttempts(task.id)
    router.refresh()
  }

  const grouped = React.useMemo(() => {
    const map: Record<SpeakingTaskType, SpeakingTask[]> = {
      word: [],
      sentence: [],
      dialogue: [],
      presentation: [],
    }
    for (const item of tasks) map[item.type].push(item)
    return map
  }, [tasks])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Topshiriq tanlash */}
      <aside className="space-y-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-primary" />
              Topshiriqni tanlang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(value) => setTab(value as SpeakingTaskType)}>
              <TabsList className="grid w-full grid-cols-4">
                {TYPE_ORDER.map((type) => (
                  <TabsTrigger key={type} value={type} className="px-1 text-[11px]">
                    {TASK_TYPE_LABELS[type].uz}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TYPE_ORDER.map((type) => (
                <TabsContent key={type} value={type} className="mt-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground">{TASK_TYPE_LABELS[type].hint}</p>
                  {grouped[type].length === 0 ? (
                    <EmptyState
                      title="Topshiriq yo‘q"
                      description="Bu turdagi topshiriqlar hali qo‘shilmagan."
                    />
                  ) : (
                    <ScrollArea className="-mr-2 h-[min(46vh,380px)] pr-2">
                      <ul className="space-y-1.5">
                        {grouped[type].map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(item)}
                              aria-pressed={task?.id === item.id}
                              className={cn(
                                'w-full rounded-lg border border-border p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40',
                                task?.id === item.id &&
                                  'border-primary bg-primary/5 ring-1 ring-primary/30'
                              )}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="min-w-0 truncate text-sm font-medium">
                                  {item.title}
                                </span>
                                {item.cefr && (
                                  <Badge variant="outline" className="shrink-0 text-[10px]">
                                    {item.cefr}
                                  </Badge>
                                )}
                              </span>
                              {item.ipa && (
                                <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                                  {item.ipa}
                                </span>
                              )}
                              {item.source === 'path' && (
                                <span className="mt-0.5 block text-[10px] text-primary">
                                  O‘quv yo‘nalishingizdan
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {attempts.length > 0 && task && <AttemptTrend attempts={attempts} taskTitle={task.title} />}
      </aside>

      {/* Yozish va natija */}
      <section className="space-y-4">
        {!task ? (
          <EmptyState
            title="Topshiriq tanlanmagan"
            description="Chap tomondagi ro‘yxatdan bitta topshiriqni tanlang."
          />
        ) : (
          <>
            <Card>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mic className="size-4 text-primary" />
                    {task.title}
                  </CardTitle>
                  {task.ipa && (
                    <p className="font-mono text-sm text-muted-foreground">{task.ipa}</p>
                  )}
                </div>
                <Badge variant="secondary">{TASK_TYPE_LABELS[task.type].uz}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{task.instruction}</p>

                {task.referenceText ? (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      O‘qiladigan matn
                    </p>
                    <p className="text-base leading-relaxed">{task.referenceText}</p>
                    <ModelAudio text={task.referenceText} />
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Erkin nutq topshirig‘i: matn yo‘q, {task.minSeconds ?? 60}–120 soniya davomida
                    o‘z fikringizni ayting. Baholash aniqlik va ravonlik bo‘yicha o‘tkaziladi.
                  </p>
                )}

                {!result && <RecorderPanel task={task} onAssessed={handleAssessed} />}

                {result && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResult(null)
                        setOwnAudioUrl('')
                      }}
                    >
                      <RotateCcw />
                      Yana bir marta urinish
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href={`/student/speaking-lab/${result.id}`}>
                        To‘liq natija sahifasi
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {result && (
              <>
                <AssessmentView
                  assessment={result.assessment}
                  referenceText={task.referenceText}
                  problematicSounds={result.problematicSounds}
                  durationSec={duration}
                  attemptNo={result.attemptNo}
                  ownAudioUrl={ownAudioUrl || undefined}
                />

                {aiEnabled ? (
                  <AiFeedbackPanel submissionId={result.id} cefr={cefr} />
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Keyingi qadam</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Yozuvingiz va ballaringiz saqlandi. Batafsil talaffuz tahlilini o‘qituvchingiz
                      beradi — natijalar uning panelida ko‘rinadi. Ballarga qarab qaysi so‘zlar
                      qizil rangda ekanini ko‘ring va o‘sha so‘zlarni namuna audio bilan taqqoslab
                      qayta yozing.
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
