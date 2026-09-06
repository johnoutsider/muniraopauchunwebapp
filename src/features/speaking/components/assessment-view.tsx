'use client'

import * as React from 'react'
import { AudioLines, Ear, Mic2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { AzureAssessment } from '@/types'

import { BAND_TEXT, clock, pronunciationBand } from '../scoring'
import type { ProblematicSound } from '../types'
import { ModelAudio } from './model-audio'
import { ScoreGauge } from './score-gauge'
import { ScoredText } from './scored-text'

export interface AssessmentViewProps {
  assessment: AzureAssessment
  referenceText: string
  problematicSounds: ProblematicSound[]
  durationSec: number
  attemptNo: number
  /** Talabaning o'z yozuvi (blob URL yoki Storage URL) */
  ownAudioUrl?: string
}

/** Azure natijasining to'liq ko'rinishi (PLAN 8.3). */
export function AssessmentView({
  assessment,
  referenceText,
  problematicSounds,
  durationSec,
  attemptNo,
  ownAudioUrl,
}: AssessmentViewProps) {
  const pron = Math.round(assessment.pronScore)
  const band = pronunciationBand(pron)

  return (
    <div className="space-y-4">
      {/* Ballar */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <AudioLines className="size-4 text-primary" />
            Azure talaffuz baholash
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{attemptNo}-urinish</Badge>
            <Badge variant="secondary">{clock(durationSec)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-center gap-4 sm:justify-between">
            <ScoreGauge
              label="Umumiy talaffuz"
              value={assessment.pronScore}
              hint={BAND_TEXT[band]}
              size={110}
            />
            <ScoreGauge
              label="Aniqlik"
              value={assessment.accuracyScore}
              hint="Tovushlar to‘g‘riligi"
            />
            <ScoreGauge
              label="Ravonlik"
              value={assessment.fluencyScore}
              hint="Sur’at va pauzalar"
            />
            <ScoreGauge
              label="To‘liqlik"
              value={assessment.completenessScore}
              hint="Matnning qancha qismi aytildi"
            />
            <ScoreGauge
              label="Prosodika"
              value={assessment.prosodyScore ?? null}
              hint="Urg‘u va ohang"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Ballar Azure Pronunciation Assessment tomonidan hisoblanadi (0–100). Bu obyektiv o‘lchov
            — pedagogik izoh alohida beriladi.
          </p>
        </CardContent>
      </Card>

      {/* Matn */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic2 className="size-4 text-primary" />
            So‘zlar bo‘yicha natija
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoredText words={assessment.words ?? []} />

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-emerald-200 dark:bg-emerald-500/40" /> 80–100 —
              yaxshi
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-amber-200 dark:bg-amber-500/40" /> 60–79 — o‘rtacha
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-rose-200 dark:bg-rose-500/40" /> 0–59 — ustida
              ishlash kerak
            </span>
            <span>So‘zni bosing — fonema ballari IPA bilan ochiladi.</span>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Namuna talaffuz</p>
              {referenceText ? (
                <ModelAudio text={referenceText} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Erkin nutq topshirig‘ida namuna matn bo‘lmaydi.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium">Sizning yozuvingiz</p>
              {ownAudioUrl ? (
                <audio src={ownAudioUrl} controls className="h-8 w-full max-w-xs" />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Yozuv saqlangan — o‘qituvchingiz uni ko‘rib chiqadi.
                </p>
              )}
            </div>
          </div>

          {assessment.recognizedText && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium text-muted-foreground">
                Tizim eshitgan matn (transkript)
              </p>
              <p className="mt-1 text-sm">{assessment.recognizedText}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Muammoli tovushlar */}
      {problematicSounds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ear className="size-4 text-primary" />
              Muammoli tovushlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {problematicSounds.slice(0, 6).map((sound) => (
              <div
                key={sound.phoneme}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
              >
                <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-sm text-rose-900 dark:bg-rose-500/20 dark:text-rose-200">
                  /{sound.phoneme}/
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  o‘rtacha {sound.avgScore}
                </span>
                <span className="text-xs text-muted-foreground">
                  Muammo bo‘lgan so‘zlar: {sound.words.join(', ')}
                </span>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Bu tovushlarni minimal juftliklar bilan mashq qiling — quyidagi AI tavsiyalarida aniq
              mashqlar berilgan.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
