'use client'

import * as React from 'react'

import {
  createRecorder,
  isRecordingSupported,
  type Recorder,
  type RecordingResult,
} from '@/lib/speech/audio'
import { AUDIO } from '@/config/constants'

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'ready' | 'error'

export interface UseRecorderOptions {
  maxDurationSec?: number
  /** Yozuv tugagach (limit yoki qo'lda) chaqiriladi. */
  onComplete?: (result: RecordingResult) => void
}

export interface UseRecorderApi {
  status: RecorderStatus
  /** 0..1 mikrofon darajasi (level meter) */
  level: number
  /** Yozilgan soniyalar */
  elapsed: number
  error: string | null
  /** Ruxsat berilmadi — yo'riqnoma panelini ko'rsatish uchun */
  permissionDenied: boolean
  result: RecordingResult | null
  /** Brauzer ovoz yozishni umuman qo'llab-quvvatlaydimi */
  supported: boolean
  maxDurationSec: number
  start: () => Promise<void>
  stop: () => Promise<RecordingResult | null>
  cancel: () => void
  reset: () => void
}

const LEVEL_INTERVAL_MS = 90

/**
 * `createRecorder` ustidagi React qobig'i (PLAN 8.3).
 * Speaking Lab va AI role-play ovozli kiritishi shu hookdan foydalanadi.
 */
export function useRecorder(options: UseRecorderOptions = {}): UseRecorderApi {
  const maxDurationSec = options.maxDurationSec ?? AUDIO.MAX_DURATION_SEC

  const recorderRef = React.useRef<Recorder | null>(null)
  const levelAtRef = React.useRef(0)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  /** `finish()` faqat bir marta chaqirilishi uchun qulf. */
  const finishingRef = React.useRef(false)
  const onCompleteRef = React.useRef(options.onComplete)
  onCompleteRef.current = options.onComplete

  const [status, setStatus] = React.useState<RecorderStatus>('idle')
  const [level, setLevel] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = React.useState(false)
  const [result, setResult] = React.useState<RecordingResult | null>(null)
  const [supported, setSupported] = React.useState(true)

  React.useEffect(() => {
    setSupported(isRecordingSupported())
  }, [])

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  React.useEffect(() => {
    return () => {
      clearTimer()
      recorderRef.current?.cancel()
      recorderRef.current = null
    }
  }, [clearTimer])

  const finish = React.useCallback(async (): Promise<RecordingResult | null> => {
    const recorder = recorderRef.current
    if (!recorder) return null
    clearTimer()
    try {
      const recording = await recorder.stop()
      recorderRef.current = null
      setResult(recording)
      setElapsed(recording.durationSec)
      setLevel(0)
      setStatus('ready')
      onCompleteRef.current?.(recording)
      return recording
    } catch (err) {
      recorderRef.current = null
      setStatus('error')
      setLevel(0)
      setError(err instanceof Error ? err.message : 'Yozuvni yakunlab bo‘lmadi.')
      return null
    }
  }, [clearTimer])

  const start = React.useCallback(async () => {
    if (status === 'recording' || status === 'requesting') return
    setError(null)
    setPermissionDenied(false)
    setResult(null)
    setElapsed(0)
    finishingRef.current = false
    setStatus('requesting')

    /*
     * Limitni O'ZIMIZ ushlaymiz. `createRecorder` ichidagi taymer chegarada
     * `MediaRecorder.stop()` ni to'g'ridan-to'g'ri chaqiradi — o'shanda
     * `recorder.stop()` promise'i hech qachon hal bo'lmaydi. Shuning uchun
     * kutubxona taymeriga zaxira sifatida kattaroq qiymat beriladi va yozuv
     * quyidagi intervalda, aniq chegarada yakunlanadi.
     */
    const recorder = createRecorder({
      maxDurationSec: maxDurationSec + 5,
      onLevel: (value) => {
        levelAtRef.current = value
      },
    })

    recorderRef.current = recorder

    try {
      await recorder.start()
    } catch (err) {
      recorderRef.current = null
      const message = err instanceof Error ? err.message : 'Mikrofonni ishga tushirib bo‘lmadi.'
      setStatus('error')
      setError(message)
      setPermissionDenied(message.toLowerCase().includes('ruxsat'))
      return
    }

    setStatus('recording')
    timerRef.current = setInterval(() => {
      const current = recorderRef.current
      if (!current) return
      setLevel(levelAtRef.current)
      const seconds = current.elapsedSec()
      setElapsed(seconds)
      if (seconds >= maxDurationSec && !finishingRef.current) {
        finishingRef.current = true
        void finish()
      }
    }, LEVEL_INTERVAL_MS)
  }, [finish, maxDurationSec, status])

  const stop = React.useCallback(async () => {
    if (status !== 'recording' || finishingRef.current) return null
    finishingRef.current = true
    return finish()
  }, [finish, status])

  const cancel = React.useCallback(() => {
    clearTimer()
    finishingRef.current = false
    recorderRef.current?.cancel()
    recorderRef.current = null
    setStatus('idle')
    setLevel(0)
    setElapsed(0)
    setResult(null)
  }, [clearTimer])

  const reset = React.useCallback(() => {
    clearTimer()
    finishingRef.current = false
    recorderRef.current?.cancel()
    recorderRef.current = null
    setStatus('idle')
    setLevel(0)
    setElapsed(0)
    setError(null)
    setResult(null)
  }, [clearTimer])

  return {
    status,
    level,
    elapsed,
    error,
    permissionDenied,
    result,
    supported,
    maxDurationSec,
    start,
    stop,
    cancel,
    reset,
  }
}
