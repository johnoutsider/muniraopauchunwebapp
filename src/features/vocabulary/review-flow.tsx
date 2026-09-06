'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Eye, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { SRS_QUALITY_LABELS } from '@/lib/adaptive/srs'

import { finishReviewSessionAction, reviewWordAction } from './actions'
import { WordCard } from './word-card'
import type { ReviewCard } from './queries'

/** Talaba o'zini baholaydigan 4 tugma (SM-2 sifat shkalasi). */
const QUALITY_BUTTONS: Array<{
  quality: number
  variant: 'destructive' | 'outline' | 'secondary' | 'success'
}> = [
  { quality: 1, variant: 'destructive' },
  { quality: 3, variant: 'outline' },
  { quality: 4, variant: 'secondary' },
  { quality: 5, variant: 'success' },
]

export interface ReviewFlowProps {
  cards: ReviewCard[]
  /** `flags.semanticNetwork` — nazorat guruhida yashiriladi */
  semanticNetwork?: boolean
}

/**
 * SRS takrorlash oqimi (PLAN 6.6, 8.1):
 * 6 bosqichli so'z kartasi ochiladi → talaba o'zini baholaydi →
 * `reviewWord` keyingi muddatni hisoblaydi.
 */
export function ReviewFlow({ cards, semanticNetwork = false }: ReviewFlowProps) {
  const router = useRouter()
  const [index, setIndex] = React.useState(0)
  const [revealed, setRevealed] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<
    Array<{ word: string; quality: number; intervalDays: number }>
  >([])
  const [finished, setFinished] = React.useState(false)

  const card = cards[index]

  React.useEffect(() => {
    setRevealed(false)
    setError(null)
  }, [index])

  async function grade(quality: number) {
    if (!card || pending) return
    setPending(true)
    setError(null)

    const result = await reviewWordAction({ wordId: card.wordId, quality })
    setPending(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    const next = [
      ...results,
      { word: card.word, quality, intervalDays: result.data.intervalDays },
    ]
    setResults(next)

    if (index < cards.length - 1) {
      setIndex(index + 1)
      return
    }

    setFinished(true)
    await finishReviewSessionAction({
      reviewed: next.length,
      remembered: next.filter((entry) => entry.quality >= 3).length,
    })
    router.refresh()
  }

  if (!cards.length) {
    return (
      <EmptyState
        icon={<CheckCircle2 />}
        title="Bugun takrorlash uchun so‘z yo‘q"
        description="Barcha so‘zlar takrorlangan. Yangi so‘zlarni darslardan yoki lug‘atdan qo‘shishingiz mumkin."
        action={
          <Button asChild size="sm">
            <Link href="/student/learn?skill=vocabulary">Lug‘at darslariga o‘tish</Link>
          </Button>
        }
      />
    )
  }

  if (finished) {
    const remembered = results.filter((entry) => entry.quality >= 3).length
    return (
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Takrorlash yakunlandi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {results.length} ta so‘z takrorlandi, {remembered} tasini esladingiz (
            {Math.round((remembered / results.length) * 100)}%).
          </p>
          <ul className="space-y-1.5">
            {results.map((entry) => (
              <li
                key={entry.word}
                className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
              >
                <span>{entry.word}</span>
                <Badge variant={entry.quality >= 3 ? 'success' : 'danger'}>
                  {entry.intervalDays} kundan keyin
                </Badge>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/student/practice">
                Mashqni davom ettirish
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/reflection">Refleksiya yozish</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!card) return null

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {index + 1} / {cards.length} so‘z
          </span>
          <span>
            Takrorlash: {card.reps} marta · kechikish: {Math.abs(Math.min(0, card.dueInDays))} kun
          </span>
        </div>
        <Progress value={((index + 1) / cards.length) * 100} aria-label="Takrorlash jarayoni" />
      </div>

      {card.lexicon ? (
        <WordCard
          key={card.wordId}
          word={card.lexicon}
          revealMode={!revealed}
          semanticNetwork={semanticNetwork}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{card.word}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bu so‘z uchun to‘liq lug‘at kartasi topilmadi — faqat takrorlash mumkin.
            </p>
          </CardContent>
        </Card>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!revealed ? (
        <Button type="button" variant="outline" onClick={() => setRevealed(true)}>
          <Eye />
          Hammasini ko‘rsatish va o‘zimni baholash
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bu so‘zni qanchalik esladingiz?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {QUALITY_BUTTONS.map((button) => (
              <Button
                key={button.quality}
                type="button"
                variant={button.variant === 'success' ? 'success' : button.variant}
                size="sm"
                disabled={pending}
                onClick={() => void grade(button.quality)}
              >
                {SRS_QUALITY_LABELS[button.quality]?.uz ?? String(button.quality)}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setRevealed(false)}
            >
              <RotateCcw />
              Yana ko‘rish
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
