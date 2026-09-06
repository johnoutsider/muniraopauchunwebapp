'use client'

import * as React from 'react'
import { CircleHelp, Loader2, Mic, RotateCcw, Send, Square } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { AUDIO } from '@/config/constants'
import { levelBars } from '@/lib/speech/audio'

import { postForm, type AiRequestError } from '@/features/ai-teacher/ai-request'
import { useRecorder } from '../use-recorder'
import { clock } from '../scoring'
import type { AssessResponse, SpeakingTask } from '../types'

export interface RecorderPanelProps {
  task: SpeakingTask
  onAssessed: (result: AssessResponse, audioUrl: string, durationSec: number) => void
}

const BARS = 24

/** Record → (playback / re-record) → Submit (PLAN 8.3). */
export function RecorderPanel({ task, onAssessed }: RecorderPanelProps) {
  const [playbackUrl, setPlaybackUrl] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<AiRequestError | string | null>(null)
  const [showHelp, setShowHelp] = React.useState(false)

  const recorder = useRecorder({
    maxDurationSec: AUDIO.MAX_DURATION_SEC,
    onComplete: (recording) => {
      setPlaybackUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return URL.createObjectURL(recording.blob)
      })
    },
  })

  // Topshiriq almashsa — yozuvni tozalaymiz
  React.useEffect(() => {
    setError(null)
    setPlaybackUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    recorder.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  React.useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl)
    }
  }, [playbackUrl])

  const recording = recorder.status === 'recording'
  const ready = recorder.status === 'ready' && recorder.result !== null
  const bars = levelBars(recorder.level, BARS)
  const timePercent = Math.min(100, (recorder.elapsed / AUDIO.MAX_DURATION_SEC) * 100)

  async function handleSubmit() {
    if (!recorder.result) return
    setSubmitting(true)
    setError(null)

    const form = new FormData()
    form.append('audio', recorder.result.wav, 'recording.wav')
    if (task.referenceText) form.append('referenceText', task.referenceText)
    form.append('taskId', task.id)
    form.append('taskTitle', task.title)
    form.append('type', task.type)
    form.append('durationSec', String(Math.round(recorder.result.durationSec * 10) / 10))

    const result = await postForm<AssessResponse>('/api/speech/assess', form)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    onAssessed(result.data, playbackUrl ?? '', recorder.result.durationSec)
  }

  if (!recorder.supported) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Ovoz yozish qo‘llab-quvvatlanmaydi</AlertTitle>
        <AlertDescription>
          Brauzeringiz mikrofondan yozishni qo‘llab-quvvatlamaydi. Chrome, Edge yoki Safari’ning
          so‘nggi versiyasidan foydalaning va sahifa <code>https://</code> orqali ochilganiga
          ishonch hosil qiling.
        </AlertDescription>
      </Alert>
    )
  }

  const errorText = typeof error === 'string' ? error : error?.message

  return (
    <div className="space-y-4">
      {/* Daraja o'lchagich va vaqt */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{recording ? 'Yozilmoqda…' : ready ? 'Yozuv tayyor' : 'Yozishga tayyor'}</span>
          <span className="tabular-nums">
            {clock(recorder.elapsed)} / {clock(AUDIO.MAX_DURATION_SEC)}
          </span>
        </div>

        <div className="mt-3 flex h-12 items-end justify-center gap-1" aria-hidden="true">
          {Array.from({ length: BARS }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'w-1.5 rounded-full transition-all duration-75',
                index < bars && recording ? 'bg-primary' : 'bg-muted'
              )}
              style={{
                height:
                  index < bars && recording
                    ? `${20 + Math.min(80, (bars - index) * 6 + recorder.level * 40)}%`
                    : '12%',
              }}
            />
          ))}
        </div>

        <Progress value={timePercent} className="mt-3 h-1.5" />
        {recording && recorder.elapsed > AUDIO.MAX_DURATION_SEC - 15 && (
          <p className="mt-2 text-center text-xs text-amber-600">
            Vaqt tugayapti — {Math.max(0, Math.ceil(AUDIO.MAX_DURATION_SEC - recorder.elapsed))}{' '}
            soniya qoldi.
          </p>
        )}
      </div>

      {/* Boshqaruv */}
      <div className="flex flex-wrap items-center gap-2">
        {!recording && !ready && (
          <Button onClick={() => void recorder.start()} disabled={recorder.status === 'requesting'}>
            {recorder.status === 'requesting' ? <Loader2 className="animate-spin" /> : <Mic />}
            Yozishni boshlash
          </Button>
        )}

        {recording && (
          <Button variant="destructive" onClick={() => void recorder.stop()}>
            <Square />
            To‘xtatish
          </Button>
        )}

        {ready && (
          <>
            <Button onClick={() => void handleSubmit()} disabled={submitting} loading={submitting}>
              <Send />
              Baholashga yuborish
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setError(null)
                recorder.reset()
                setPlaybackUrl((current) => {
                  if (current) URL.revokeObjectURL(current)
                  return null
                })
              }}
              disabled={submitting}
            >
              <RotateCcw />
              Qayta yozish
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp((value) => !value)}
          aria-expanded={showHelp}
        >
          <CircleHelp />
          Mikrofon ishlamayaptimi?
        </Button>
      </div>

      {/* Tinglab ko'rish */}
      {ready && playbackUrl && (
        <div className="space-y-1.5 rounded-lg border border-border p-3">
          <p className="text-xs font-medium">Yozuvingizni tinglang</p>
          <audio src={playbackUrl} controls className="w-full" />
          <p className="text-[11px] text-muted-foreground">
            Davomiyligi: {clock(recorder.result?.durationSec ?? 0)}. Agar ovoz sekin yoki shovqinli
            bo‘lsa, «Qayta yozish» tugmasini bosing — baholash aniqroq bo‘ladi.
          </p>
        </div>
      )}

      {/* Xatolar */}
      {(errorText || recorder.error) && (
        <Alert variant="destructive">
          <AlertTitle>
            {typeof error !== 'string' && error?.quotaExceeded
              ? 'Limit tugadi'
              : 'Yozuvni yuborib bo‘lmadi'}
          </AlertTitle>
          <AlertDescription>{errorText ?? recorder.error}</AlertDescription>
        </Alert>
      )}

      {/* Mikrofon yo'riqnomasi */}
      {(showHelp || recorder.permissionDenied) && (
        <Alert>
          <AlertTitle>Mikrofonga ruxsat berish</AlertTitle>
          <AlertDescription>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs">
              <li>
                Brauzer manzil qatorining chap tomonidagi qulf yoki mikrofon belgisini bosing.
              </li>
              <li>«Mikrofon» bandini «Ruxsat berish» (Allow) holatiga o‘tkazing.</li>
              <li>Sahifani yangilang va yozishni qaytadan boshlang.</li>
              <li>
                Agar mikrofon boshqa dastur tomonidan band bo‘lsa (Zoom, Telegram), o‘sha dasturni
                yoping.
              </li>
              <li>Noutbukda tashqi mikrofon ulangan bo‘lsa, tizim sozlamalarida uni tanlang.</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
