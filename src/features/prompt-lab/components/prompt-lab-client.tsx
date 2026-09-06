'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, GraduationCap, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils/cn'
import { PROMPT_LEVELS, type PromptLevel } from '@/config/constants'

import { CorpusWidget } from '@/features/corpus/components/corpus-widget'
import type { PromptExerciseItem } from '../content'
import type { PromptLabData, PromptLabProgress } from '../types'
import { LEVEL_LABELS } from './eval-result'
import { ExerciseRunner } from './exercise-runner'
import { BadVsGood, IntroModule } from './intro-module'
import { VerificationExercise } from './verification-exercise'

export interface PromptLabClientProps {
  data: PromptLabData
  /** `flags.corpusVerification` — nazorat guruhida vidjet ko'rsatilmaydi. */
  corpusEnabled: boolean
}

function levelIndex(level: PromptLevel): number {
  return PROMPT_LEVELS.indexOf(level)
}

export function PromptLabClient({ data, corpusEnabled }: PromptLabClientProps) {
  const [progress, setProgress] = React.useState<PromptLabProgress>(data.progress)
  const [level, setLevel] = React.useState<PromptLevel>(data.progress.level)
  const [indexByLevel, setIndexByLevel] = React.useState<Record<PromptLevel, number>>({
    simple: 0,
    guided: 0,
    independent: 0,
  })

  const byLevel = React.useMemo(() => {
    const map: Record<PromptLevel, PromptExerciseItem[]> = {
      simple: [],
      guided: [],
      independent: [],
    }
    for (const exercise of data.exercises) map[exercise.level]?.push(exercise)
    return map
  }, [data.exercises])

  const exercises = byLevel[level]
  const currentIndex = Math.min(indexByLevel[level], Math.max(0, exercises.length - 1))
  const exercise = exercises[currentIndex] ?? null

  const unlocked = levelIndex(progress.level)
  const totalCompleted = progress.completed.length
  const totalExercises = data.exercises.length
  const completionPercent = totalExercises ? Math.round((totalCompleted / totalExercises) * 100) : 0

  function move(delta: number) {
    setIndexByLevel((current) => ({
      ...current,
      [level]: Math.max(0, Math.min(exercises.length - 1, current[level] + delta)),
    }))
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" />
            Sizning darajangiz: {LEVEL_LABELS[progress.level].uz}
          </CardTitle>
          <Badge variant="secondary">
            {totalCompleted} / {totalExercises} mashq
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={completionPercent} />
          <div className="grid gap-2 sm:grid-cols-3">
            {PROMPT_LEVELS.map((item, index) => {
              const locked = index > unlocked
              return (
                <div
                  key={item}
                  className={cn(
                    'rounded-lg border border-border p-3',
                    progress.level === item && 'border-primary/50 bg-primary/5',
                    locked && 'opacity-60'
                  )}
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {locked && <Lock className="size-3" />}
                    {index + 1}. {LEVEL_LABELS[item].uz}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {LEVEL_LABELS[item].hint}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Daraja AI bahosiga qarab avtomatik ochiladi: yuqori ball — keyingi bosqich. Pastroq
            darajaga istalgan vaqtda qaytishingiz mumkin.
          </p>
        </CardContent>
      </Card>

      <IntroModule />
      <BadVsGood />

      {/* Mashqlar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prompt mashqlari</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={level} onValueChange={(value) => setLevel(value as PromptLevel)}>
            <TabsList className="grid w-full grid-cols-3">
              {PROMPT_LEVELS.map((item, index) => (
                <TabsTrigger key={item} value={item} disabled={index > unlocked}>
                  {index > unlocked && <Lock className="size-3" />}
                  {LEVEL_LABELS[item].uz}
                </TabsTrigger>
              ))}
            </TabsList>

            {PROMPT_LEVELS.map((item) => (
              <TabsContent key={item} value={item} className="space-y-3">
                {byLevel[item].length === 0 ? (
                  <EmptyState
                    title="Bu darajada mashq yo‘q"
                    description="O‘qituvchi mashqlar qo‘shgach, ular shu yerda paydo bo‘ladi."
                  />
                ) : level === item && exercise ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => move(-1)}
                        disabled={currentIndex === 0}
                      >
                        <ChevronLeft />
                        Oldingi
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {currentIndex + 1} / {exercises.length}
                        {progress.completed.includes(exercise.id) && ' · bajarilgan'}
                        {progress.bestScores[exercise.id] != null &&
                          ` · eng yaxshi ball ${progress.bestScores[exercise.id]}/25`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => move(1)}
                        disabled={currentIndex >= exercises.length - 1}
                      >
                        Keyingi
                        <ChevronRight />
                      </Button>
                    </div>

                    <ExerciseRunner
                      key={exercise.id}
                      exercise={exercise}
                      level={level}
                      cefr={data.cefr}
                      onProgress={setProgress}
                    />
                  </>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <VerificationExercise progress={progress} onProgress={setProgress} />

      {corpusEnabled ? (
        <CorpusWidget />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Iborani qanday tekshirish mumkin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sizning guruhingizda korpus vidjeti yoqilmagan. Ibora ingliz tilida ishlatiladimi yoki
            yo‘qmi — buni lug‘atdagi misollar, darslik va o‘qituvchingiz orqali tekshiring.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
