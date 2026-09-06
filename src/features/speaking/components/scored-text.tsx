'use client'

import * as React from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import type { PronunciationWordResult } from '@/types'

import { BAND_WORD_CLASS, errorTypeText, pronunciationBand } from '../scoring'

export interface ScoredTextProps {
  words: PronunciationWordResult[]
  className?: string
}

/**
 * Azure baholagan matn: har bir so'z bali bo'yicha rangda, bosilganda
 * fonema ballari IPA bilan ochiladi (PLAN 8.3).
 */
export function ScoredText({ words, className }: ScoredTextProps) {
  if (words.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Azure so‘z darajasidagi ballarni qaytarmadi (erkin nutq rejimida bu normal holat).
      </p>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-x-1.5 gap-y-2 text-base leading-relaxed', className)}>
      {words.map((word, index) => {
        const score = Math.round(word.accuracyScore)
        const band = pronunciationBand(score)
        const phonemes = word.phonemes ?? []
        const syllables = word.syllables ?? []

        return (
          <Popover key={`${word.word}-${index}`}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'rounded px-1.5 py-0.5 transition-shadow hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  BAND_WORD_CLASS[band],
                  word.errorType === 'Omission' && 'line-through opacity-70'
                )}
                aria-label={`${word.word}: ${score} ball — batafsil`}
              >
                {word.word}
                <span className="ml-1 align-super text-[9px] tabular-nums opacity-70">{score}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{word.word}</p>
                <div className="flex items-center gap-2">
                  <Progress value={score} className="h-1.5 flex-1" />
                  <span className="text-xs tabular-nums text-muted-foreground">{score}/100</span>
                </div>
                {word.errorType && word.errorType !== 'None' && (
                  <p className="text-xs text-destructive">{errorTypeText(word.errorType)}</p>
                )}
              </div>

              {syllables.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">Bo‘g‘inlar</p>
                  <div className="flex flex-wrap gap-1">
                    {syllables.map((syllable, syllableIndex) => (
                      <span
                        key={`${syllable.syllable}-${syllableIndex}`}
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs',
                          BAND_WORD_CLASS[pronunciationBand(syllable.accuracyScore)]
                        )}
                      >
                        {syllable.syllable} {Math.round(syllable.accuracyScore)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {phonemes.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Tovushlar (IPA) bo‘yicha ball
                  </p>
                  <ul className="space-y-1">
                    {phonemes.map((phoneme, phonemeIndex) => {
                      const phonemeScore = Math.round(phoneme.accuracyScore)
                      return (
                        <li
                          key={`${phoneme.phoneme}-${phonemeIndex}`}
                          className="flex items-center gap-2"
                        >
                          <span className="w-12 shrink-0 font-mono text-xs">
                            /{phoneme.phoneme}/
                          </span>
                          <Progress value={phonemeScore} className="h-1.5 flex-1" />
                          <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                            {phonemeScore}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Bu so‘z uchun fonema ballari mavjud emas.
                </p>
              )}
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
}
