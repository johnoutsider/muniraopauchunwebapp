'use client'

import * as React from 'react'
import { Loader2, Mic, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { levelBars } from '@/lib/speech/audio'

import { useRecorder } from '@/features/speaking/use-recorder'
import { postForm } from '../ai-request'

export interface VoiceInputProps {
  /** Transkript tayyor bo'lganda chaqiriladi (matn maydoniga qo'shiladi). */
  onTranscript: (text: string) => void
  disabled?: boolean
  maxDurationSec?: number
}

/**
 * Ovozli kiritish: yozish → WAV → `POST /api/speech/stt` → transkript.
 * Role-play'da talaba yozish o'rniga gapirishi mumkin (PLAN 8.6).
 */
export function VoiceInput({ onTranscript, disabled, maxDurationSec = 60 }: VoiceInputProps) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const recorder = useRecorder({ maxDurationSec })

  const transcribe = React.useCallback(
    async (wav: Blob) => {
      setBusy(true)
      setError(null)
      const form = new FormData()
      form.append('audio', wav, 'speech.wav')

      const result = await postForm<{ transcript?: string; status?: string }>(
        '/api/speech/stt',
        form
      )
      setBusy(false)

      if (!result.ok) {
        setError(result.error.message)
        return
      }
      const transcript = (result.data.transcript ?? '').trim()
      if (!transcript) {
        setError('Nutq aniqlanmadi. Mikrofonga yaqinroq va sekinroq gapiring.')
        return
      }
      onTranscript(transcript)
      recorder.reset()
    },
    [onTranscript, recorder]
  )

  async function handleClick() {
    setError(null)
    if (recorder.status === 'recording') {
      const recording = await recorder.stop()
      if (recording) await transcribe(recording.wav)
      return
    }
    await recorder.start()
  }

  if (!recorder.supported) return null

  const recording = recorder.status === 'recording'
  const bars = levelBars(recorder.level, 5)

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant={recording ? 'destructive' : 'outline'}
        size="icon"
        onClick={handleClick}
        disabled={disabled || busy}
        aria-label={recording ? 'Yozishni tugatish' : 'Ovoz bilan javob berish'}
        title={recording ? 'Yozishni tugatish' : 'Ovoz bilan javob berish'}
      >
        {busy ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}
      </Button>

      {recording && (
        <div className="flex items-end gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'w-0.5 rounded-full bg-destructive transition-all',
                index < bars ? 'h-2.5' : 'h-1 opacity-30'
              )}
            />
          ))}
        </div>
      )}

      {recording && (
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {Math.floor(recorder.elapsed)}s
        </span>
      )}

      {(error || recorder.error) && (
        <span className="max-w-[160px] text-[10px] leading-tight text-destructive">
          {error ?? recorder.error}
        </span>
      )}
    </div>
  )
}
