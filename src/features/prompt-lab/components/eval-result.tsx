'use client'

import * as React from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AiBadge } from '@/components/shared/ai-badge'
import { CopyButton } from '@/components/shared/copy-button'
import { MarkdownText } from '@/components/shared/markdown-text'
import { PROMPT_LEVELS, type PromptLevel } from '@/config/constants'

import { CRITERION_LABELS, type PromptEvalResult } from '../types'

export const LEVEL_LABELS: Record<PromptLevel, { uz: string; hint: string }> = {
  simple: { uz: 'Oddiy', hint: 'Tayyor promptlardan yaxshirog‘ini tanlaysiz.' },
  guided: { uz: 'Shablon bilan', hint: 'Shablonni to‘ldirib prompt tuzasiz.' },
  independent: { uz: 'Mustaqil', hint: 'Promptni to‘liq o‘zingiz yozasiz.' },
}

export function EvalResult({
  result,
  currentLevel,
  onUseImproved,
}: {
  result: PromptEvalResult
  currentLevel: PromptLevel
  onUseImproved?: (prompt: string) => void
}) {
  const criteria = Object.keys(result.scores) as Array<keyof PromptEvalResult['scores']>
  const levelUp = PROMPT_LEVELS.indexOf(result.nextLevel) > PROMPT_LEVELS.indexOf(currentLevel)

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Prompt bahosi
        </CardTitle>
        <div className="flex items-center gap-2">
          <AiBadge label="AI bahosi" />
          <Badge variant="secondary" className="tabular-nums">
            {result.totalScore} / 25
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {criteria.map((key) => {
            const score = result.scores[key]
            const label = CRITERION_LABELS[key]
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{label.uz}</span>
                  <span className="tabular-nums text-muted-foreground">{score} / 5</span>
                </div>
                <Progress value={(score / 5) * 100} className="h-1.5" />
                <p className="text-[11px] leading-tight text-muted-foreground">{label.hint}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Izoh
          </p>
          <MarkdownText>{result.feedback}</MarkdownText>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Yaxshilangan variant
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="font-mono text-sm leading-relaxed">{result.improvedPrompt}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CopyButton text={result.improvedPrompt} withLabel size="sm" />
              {onUseImproved && (
                <button
                  type="button"
                  onClick={() => onUseImproved(result.improvedPrompt)}
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Muharrirga qo‘yish va taqqoslash
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Bu variantni ko‘chirib olmang — o‘z promptingiz bilan solishtiring va nima
            yetishmaganini aniqlang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
          <ArrowUpRight className="size-4 text-primary" />
          <span className="text-sm">
            Tavsiya etilgan keyingi daraja:{' '}
            <span className="font-medium">{LEVEL_LABELS[result.nextLevel].uz}</span>
          </span>
          {levelUp && (
            <Badge variant="success" className="text-[10px]">
              Daraja oshdi
            </Badge>
          )}
          <span className="w-full text-[11px] text-muted-foreground">
            {LEVEL_LABELS[result.nextLevel].hint}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
