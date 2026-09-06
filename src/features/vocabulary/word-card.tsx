'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Network } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DOMAIN_LABELS, type Domain } from '@/config/constants'
import { cn } from '@/lib/utils/cn'
import { TtsButton } from '@/features/learn/tts-button'
import type { LexiconDoc } from '@/types'

/**
 * 6 bosqichli so'z kartasi (PLAN 8.1):
 *   1) so'z (IPA + audio) → 2) ma'no → 3) kollokatsiyalar →
 *   4) kontekst gap → 5) kasbiy vaziyat → 6) kommunikativ topshiriq
 */

export const WORD_STEPS = [
  { key: 'word', uz: 'So‘z' },
  { key: 'meaning', uz: 'Ma’no' },
  { key: 'collocations', uz: 'Kollokatsiyalar' },
  { key: 'context', uz: 'Kontekst' },
  { key: 'professional', uz: 'Kasbiy vaziyat' },
  { key: 'communicative', uz: 'Kommunikativ qo‘llash' },
] as const

export type WordStepKey = (typeof WORD_STEPS)[number]['key']

export interface WordCardProps {
  word: LexiconDoc & { id: string }
  /** Bosqichma-bosqich ochish (SRS takrorlash) yoki hammasini ko'rsatish (dars) */
  revealMode?: boolean
  /** `semanticNetwork` flagi yoqilgan bo'lsa — grafga havola */
  semanticNetwork?: boolean
  className?: string
  /** Bosqich o'zgarganda (takrorlash oqimi uchun) */
  onStepChange?: (step: number) => void
}

export function WordCard({
  word,
  revealMode = false,
  semanticNetwork = false,
  className,
  onStepChange,
}: WordCardProps) {
  const [step, setStep] = React.useState(revealMode ? 0 : WORD_STEPS.length - 1)

  React.useEffect(() => {
    setStep(revealMode ? 0 : WORD_STEPS.length - 1)
  }, [word.id, revealMode])

  function next() {
    const value = Math.min(WORD_STEPS.length - 1, step + 1)
    setStep(value)
    onStepChange?.(value)
  }

  const visible = (index: number) => index <= step

  const definition = word.definitions?.[0]
  const example = word.examples?.[0]

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl">{word.word}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {word.ipa ? <span className="font-mono">/{word.ipa}/</span> : null}
              {word.pos ? <span>{word.pos}</span> : null}
              <Badge variant="outline">{word.cefr}</Badge>
              {(word.domains ?? []).slice(0, 2).map((domain) => (
                <Badge key={domain} variant="secondary">
                  {DOMAIN_LABELS[domain as Domain]?.uz ?? domain}
                </Badge>
              ))}
            </div>
          </div>
          <TtsButton text={word.word} audioUrl={word.audioUrl} />
        </div>
        {revealMode ? (
          <div className="space-y-1">
            <Progress value={((step + 1) / WORD_STEPS.length) * 100} />
            <p className="text-xs text-muted-foreground">
              {step + 1} / {WORD_STEPS.length} — {WORD_STEPS[step].uz}
            </p>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 2. Ma'no */}
        {visible(1) ? (
          <StepBlock index={2} label="Ma’no">
            {definition ? (
              <>
                <p className="text-sm">{definition.text}</p>
                {definition.textUz ? (
                  <p className="text-sm text-muted-foreground">{definition.textUz}</p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ta’rif kiritilmagan.</p>
            )}
          </StepBlock>
        ) : null}

        {/* 3. Kollokatsiyalar */}
        {visible(2) ? (
          <StepBlock index={3} label="Kollokatsiyalar">
            {word.collocations?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {word.collocations.slice(0, 8).map((collocation) => (
                  <Badge
                    key={collocation.text}
                    variant={collocation.verified ? 'success' : 'outline'}
                    title={
                      collocation.corpusCount
                        ? `Korpusda ${collocation.corpusCount} marta uchraydi`
                        : undefined
                    }
                  >
                    {collocation.text}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kollokatsiya kiritilmagan.</p>
            )}
          </StepBlock>
        ) : null}

        {/* 4. Kontekst gap */}
        {visible(3) ? (
          <StepBlock index={4} label="Kontekst gap">
            {example ? (
              <blockquote className="border-l-2 border-border pl-3 text-sm italic">
                {example.sentence}
                {example.translationUz ? (
                  <span className="mt-1 block not-italic text-muted-foreground">
                    {example.translationUz}
                  </span>
                ) : null}
                {example.source ? (
                  <span className="mt-1 block text-xs not-italic text-muted-foreground">
                    Manba: {example.source}
                  </span>
                ) : null}
              </blockquote>
            ) : (
              <p className="text-sm text-muted-foreground">Misol gap kiritilmagan.</p>
            )}
          </StepBlock>
        ) : null}

        {/* 5. Kasbiy vaziyat */}
        {visible(4) ? (
          <StepBlock index={5} label="Kasbiy vaziyat">
            <p className="text-sm">
              {word.professionalContext || 'Kasbiy kontekst kiritilmagan.'}
            </p>
          </StepBlock>
        ) : null}

        {/* 6. Kommunikativ topshiriq */}
        {visible(5) ? (
          <StepBlock index={6} label="Kommunikativ topshiriq">
            <p className="text-sm">
              {word.communicativeTask ||
                `«${word.word}» so‘zi bilan o‘z sohangizga oid bitta gap yozing yoki ayting.`}
            </p>
          </StepBlock>
        ) : null}

        {(word.synonyms?.length || word.wordFamily?.length) && visible(2) ? (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {word.synonyms?.length ? <span>Sinonim: {word.synonyms.join(', ')}</span> : null}
            {word.wordFamily?.length ? <span>So‘z oilasi: {word.wordFamily.join(', ')}</span> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {revealMode && step < WORD_STEPS.length - 1 ? (
            <Button type="button" size="sm" onClick={next}>
              {WORD_STEPS[step + 1].uz}
              <ArrowRight />
            </Button>
          ) : null}
          {semanticNetwork ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/student/practice/vocabulary/network?word=${encodeURIComponent(word.word)}`}>
                <Network />
                Semantik tarmoq
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function StepBlock({
  index,
  label,
  children,
}: {
  index: number
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-[10px] text-primary">
          {index}
        </span>
        {label}
      </p>
      <div className="space-y-1 pl-7">{children}</div>
    </div>
  )
}
