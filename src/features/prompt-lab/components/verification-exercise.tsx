'use client'

import * as React from 'react'
import { CircleCheck, CircleX, Eye, ScanSearch } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AiBadge } from '@/components/shared/ai-badge'
import { cn } from '@/lib/utils/cn'

import { recordVerification } from '../actions'
import { VERIFICATION_EXERCISES } from '../content'
import type { PromptLabProgress } from '../types'

export interface VerificationExerciseProps {
  progress: PromptLabProgress
  onProgress: (progress: PromptLabProgress) => void
}

/**
 * «AI javobini tekshirish» mashqi (PLAN 8.15).
 * Talaba ataylab kiritilgan faktik yoki lingvistik xatoni topadi —
 * bu «check this» odatini shakllantiradi (AI literacy).
 */
export function VerificationExercise({ progress, onProgress }: VerificationExerciseProps) {
  const [index, setIndex] = React.useState(0)
  const [picked, setPicked] = React.useState<number | null>(null)
  const [revealed, setRevealed] = React.useState(false)

  const exercise = VERIFICATION_EXERCISES[index]
  const solved = progress.verified.includes(exercise.id)

  function reset(nextIndex: number) {
    setIndex(nextIndex)
    setPicked(null)
    setRevealed(false)
  }

  async function handlePick(sentenceIndex: number) {
    if (picked !== null) return
    setPicked(sentenceIndex)
    const correct = sentenceIndex === exercise.errorIndex
    const result = await recordVerification({ exerciseId: exercise.id, correct })
    if (result.ok) onProgress(result.data)
  }

  const isCorrect = picked === exercise.errorIndex

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanSearch className="size-4 text-primary" />
            AI javobini tekshirish
          </CardTitle>
          <CardDescription>
            Quyidagi javobda ataylab bitta xato bor. Uni toping — AI javobini tekshirish odati
            shunday shakllanadi.
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {solved && (
            <Badge variant="success" className="text-[10px]">
              bajarilgan
            </Badge>
          )}
          <Badge variant="outline">
            {index + 1} / {VERIFICATION_EXERCISES.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Talabaning savoli
          </p>
          <p className="rounded-lg bg-muted/40 p-3 font-mono text-sm">{exercise.question}</p>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI javobi
            <AiBadge label="tekshirilmagan AI javobi" />
          </p>
          <ul className="space-y-1.5">
            {exercise.sentences.map((sentence, sentenceIndex) => {
              const isError = sentenceIndex === exercise.errorIndex
              const show = picked !== null || revealed
              return (
                <li key={sentenceIndex}>
                  <button
                    type="button"
                    disabled={picked !== null || revealed}
                    onClick={() => void handlePick(sentenceIndex)}
                    className={cn(
                      'w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:cursor-default',
                      show && isError && 'border-destructive/60 bg-destructive/5',
                      picked === sentenceIndex && !isError && 'border-amber-500/60 bg-amber-500/10'
                    )}
                  >
                    <span className="flex items-start gap-2">
                      {show &&
                        (isError ? (
                          <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
                        ) : (
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        ))}
                      <span>{sentence}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {picked === null && !revealed && (
          <Button variant="ghost" size="sm" onClick={() => setRevealed(true)}>
            <Eye />
            Javobni ko‘rsatish
          </Button>
        )}

        {(picked !== null || revealed) && (
          <Alert variant={picked !== null && isCorrect ? 'default' : 'destructive'}>
            <AlertTitle>
              {picked === null
                ? 'Xato qayerda edi'
                : isCorrect
                  ? 'To‘g‘ri topdingiz!'
                  : 'Xato boshqa joyda edi'}
            </AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              <p>
                <Badge variant="outline" className="mr-2 text-[10px]">
                  {exercise.errorKind === 'factual' ? 'faktik xato' : 'lingvistik xato'}
                </Badge>
                {exercise.explanation}
              </p>
              <p className="text-xs">
                To‘g‘ri variant: <span className="font-mono">{exercise.correction}</span>
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset((index + 1) % VERIFICATION_EXERCISES.length)}
          >
            Keyingi mashq
          </Button>
          {(picked !== null || revealed) && (
            <Button variant="ghost" size="sm" onClick={() => reset(index)}>
              Qaytadan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
