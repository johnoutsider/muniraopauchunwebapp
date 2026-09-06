'use client'

import * as React from 'react'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { AlertTriangle, CheckCircle2, Mic, RotateCcw, Square, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getFirebaseAuth, getFirebaseStorage } from '@/lib/firebase/client'
import {
  createRecorder,
  isRecordingSupported,
  levelBars,
  type Recorder,
} from '@/lib/speech/audio'
import { AUDIO } from '@/config/constants'
import { formatDuration } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/**
 * Speaking / Pronunciation bo'limlari uchun ovozli javob (PLAN 8.3, 8.11).
 *
 * OQIM: Record → 16 kHz mono WAV (brauzerda) → Firebase Storage
 * `speaking/{uid}/…` → urinish hujjatida FAQAT yo'l (path) saqlanadi.
 * Fayl klient SDK bilan yuklanadi (storage.rules: `isOwner(uid)`), server
 * action esa yo'lni tekshirib qabul qiladi — audio hech qachon server action
 * orqali o'tmaydi (Vercel payload limiti va tezlik uchun).
 */

export interface AudioAnswerValue {
  audioPath?: string
  durationSec?: number
}

export interface AudioAnswerProps {
  uid: string
  /** Storage papkasi, masalan `speaking/{uid}/test/{attemptId}` */
  storagePrefix: string
  /** Fayl nomining o'zagi (bo'lim id) */
  name: string
  value: AudioAnswerValue
  onChange: (value: AudioAnswerValue) => void
  readOnly?: boolean
  className?: string
}

type Phase = 'idle' | 'recording' | 'processing' | 'uploading' | 'done' | 'error'

export function AudioAnswer({
  uid: _uid,
  storagePrefix,
  name,
  value,
  onChange,
  readOnly = false,
  className,
}: AudioAnswerProps) {
  const [phase, setPhase] = React.useState<Phase>(value.audioPath ? 'done' : 'idle')
  const [error, setError] = React.useState<string | null>(null)
  const [level, setLevel] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [supported, setSupported] = React.useState(true)

  const recorderRef = React.useRef<Recorder | null>(null)
  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const objectUrlRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    setSupported(isRecordingSupported())
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      recorderRef.current?.cancel()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // Saqlangan yozuvni tinglash uchun havola (qayta yuklangandan keyin)
  React.useEffect(() => {
    let cancelled = false
    if (!value.audioPath || objectUrlRef.current) return
    getDownloadURL(storageRef(getFirebaseStorage(), value.audioPath))
      .then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [value.audioPath])

  function stopTicker() {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
  }

  async function handleStart() {
    setError(null)
    const recorder = createRecorder({
      onLevel: setLevel,
      onMaxDuration: () => {
        void handleStop()
      },
    })
    recorderRef.current = recorder
    try {
      await recorder.start()
      setPhase('recording')
      setElapsed(0)
      tickRef.current = setInterval(() => setElapsed(recorder.elapsedSec()), 250)
    } catch (err) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Mikrofonni ishga tushirib bo‘lmadi.')
    }
  }

  async function handleStop() {
    const recorder = recorderRef.current
    if (!recorder) return
    stopTicker()
    setPhase('processing')
    try {
      const result = await recorder.stop()
      recorderRef.current = null

      // Tinglash uchun mahalliy havola
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      const url = URL.createObjectURL(result.wav)
      objectUrlRef.current = url
      setPreviewUrl(url)

      await upload(result.wav, result.durationSec)
    } catch (err) {
      recorderRef.current = null
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Yozuvni saqlab bo‘lmadi.')
    }
  }

  async function upload(wav: Blob, durationSec: number) {
    setPhase('uploading')
    try {
      // Firebase Auth holati tiklanmagan bo'lsa Storage qoidasi rad etadi
      const auth = getFirebaseAuth()
      await auth.authStateReady?.()
      if (!auth.currentUser) {
        throw new Error(
          'Sessiya muddati tugagan. Yozuvni saqlash uchun tizimga qaytadan kiring.'
        )
      }

      const path = `${storagePrefix}/${name}-${Date.now()}.wav`
      await uploadBytes(storageRef(getFirebaseStorage(), path), wav, {
        contentType: 'audio/wav',
      })
      onChange({ audioPath: path, durationSec: Math.round(durationSec) })
      setPhase('done')
    } catch (err) {
      setPhase('error')
      setError(
        err instanceof Error
          ? err.message
          : 'Yozuvni yuklab bo‘lmadi. Internet aloqasini tekshirib, qaytadan urinib ko‘ring.'
      )
    }
  }

  function handleReset() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setPreviewUrl(null)
    setError(null)
    setElapsed(0)
    setPhase('idle')
    onChange({})
  }

  if (readOnly) {
    return (
      <div className={cn('space-y-2', className)}>
        {previewUrl ? (
          <audio controls src={previewUrl} className="w-full">
            <track kind="captions" />
          </audio>
        ) : (
          <p className="text-sm text-muted-foreground">
            {value.audioPath ? 'Yozuv yuklanmoqda…' : 'Ovozli javob yozilmagan.'}
          </p>
        )}
      </div>
    )
  }

  if (!supported) {
    return (
      <Alert variant="warning" className={className}>
        <AlertTriangle />
        <AlertDescription>
          Brauzeringiz ovoz yozishni qo‘llab-quvvatlamaydi. Chrome yoki Safari’ning so‘nggi
          versiyasidan foydalaning yoki telefoningizdan kiring.
        </AlertDescription>
      </Alert>
    )
  }

  const bars = levelBars(level, 16)
  const busy = phase === 'processing' || phase === 'uploading'

  return (
    <div className={cn('space-y-3 rounded-lg border border-border p-4', className)}>
      <div className="flex flex-wrap items-center gap-3">
        {phase === 'recording' ? (
          <Button type="button" variant="destructive" onClick={() => void handleStop()}>
            <Square />
            Yozishni to‘xtatish
          </Button>
        ) : (
          <Button
            type="button"
            variant={value.audioPath ? 'outline' : 'default'}
            onClick={() => void handleStart()}
            loading={busy}
            disabled={busy}
          >
            {value.audioPath ? <RotateCcw /> : <Mic />}
            {value.audioPath ? 'Qayta yozish' : 'Yozishni boshlash'}
          </Button>
        )}

        {phase === 'recording' && (
          <span className="flex items-center gap-2 text-sm tabular-nums text-muted-foreground">
            <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'w-1 rounded-sm transition-all',
                    index < bars ? 'bg-primary' : 'bg-muted'
                  )}
                  style={{ height: `${4 + (index % 4) * 3}px` }}
                />
              ))}
            </span>
            {formatDuration(elapsed)} / {formatDuration(AUDIO.MAX_DURATION_SEC)}
          </span>
        )}

        {phase === 'uploading' && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Upload className="size-4" aria-hidden="true" />
            Yuklanmoqda…
          </span>
        )}

        {phase === 'done' && value.audioPath && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Saqlandi
            {value.durationSec ? ` · ${formatDuration(value.durationSec)}` : ''}
          </span>
        )}

        {value.audioPath && phase !== 'recording' && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            O‘chirish
          </Button>
        )}
      </div>

      {previewUrl && phase !== 'recording' ? (
        <audio controls src={previewUrl} className="w-full">
          <track kind="captions" />
        </audio>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tinch joyda, mikrofonga 10–15 sm masofadan gapiring. Maksimal davomiylik{' '}
          {AUDIO.MAX_DURATION_SEC} soniya.
        </p>
      )}
    </div>
  )
}
