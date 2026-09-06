/**
 * Brauzerda audio yozish va WAV kodlash (PLAN.md 8.3, 1.1).
 *
 * NIMA UCHUN WAV VA AYNAN 16 kHz MONO:
 * Azure Pronunciation Assessment REST endpointi 16 kHz, mono, 16-bit PCM WAV
 * kutadi. `MediaRecorder` esa brauzerga qarab WebM/Opus yoki MP4/AAC beradi.
 * Shuning uchun yozuvni serverga yuborishdan OLDIN brauzerning o'zida
 * dekodlab, mono'ga tushirib, 16 kHz ga qayta diskretlab, WAV sifatida
 * qayta kodlaymiz. Bu server tomonda ffmpeg'ga bo'lgan ehtiyojni yo'q qiladi
 * (Vercel'da og'ir) va trafikni ham kamaytiradi.
 *
 * BU FAYL KLIENT UCHUN — `server-only` importi YO'Q.
 */

import { AUDIO } from '@/config/constants'

/* ------------------------------------------------------------------ */
/* Mikrofon cheklovlari                                                */
/* ------------------------------------------------------------------ */

/** Azure talab qiladigan sifat: mono, 16 kHz, shovqin va aks-sado bostirilgan. */
export const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    channelCount: 1,
    sampleRate: AUDIO.SAMPLE_RATE,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

/** Brauzer qo'llab-quvvatlaydigan birinchi audio konteynerni tanlash. */
function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

/** Mikrofon umuman mavjudmi (UI'da yo'riqnoma ekranini ko'rsatish uchun). */
export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

/** getUserMedia xatolarini o'zbekcha, foydalanuvchiga tushunarli matnga aylantirish. */
export function micErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Mikrofonga ruxsat berilmadi. Brauzer manzil qatoridagi qulf belgisini bosib, mikrofonni yoqing.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Mikrofon topilmadi. Qurilmangizga mikrofon ulanganini tekshiring.'
    case 'NotReadableError':
      return 'Mikrofon band (boshqa dastur ishlatmoqda). Qolgan dasturlarni yopib, qayta urinib ko‘ring.'
    default:
      return 'Mikrofonni ishga tushirib bo‘lmadi. Sahifani yangilab, qaytadan urinib ko‘ring.'
  }
}

/* ------------------------------------------------------------------ */
/* Recorder                                                            */
/* ------------------------------------------------------------------ */

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped' | 'error'

export interface RecordingResult {
  /** Xom yozuv (WebM/MP4) — Storage'ga zaxira sifatida yuklash mumkin. */
  blob: Blob
  /** Azure uchun tayyor 16 kHz mono WAV. */
  wav: Blob
  durationSec: number
  mimeType: string
}

export interface RecorderOptions {
  /** Maksimal davomiylik (standart `AUDIO.MAX_DURATION_SEC` = 120 s). */
  maxDurationSec?: number
  /** Limit tugaganda avtomatik to'xtatilganda chaqiriladi. */
  onMaxDuration?: () => void
  /** Daraja o'lchagich (0..1) uchun, ~20 Hz chaqiriladi. */
  onLevel?: (level: number) => void
}

export interface Recorder {
  readonly state: RecorderState
  /** Mikrofonni so'raydi va yozishni boshlaydi. */
  start(): Promise<void>
  /** Yozishni tugatadi va WAV bilan birga natijani qaytaradi. */
  stop(): Promise<RecordingResult>
  /** Yozuvni bekor qilib, mikrofonni bo'shatadi. */
  cancel(): void
  /** Yozilgan vaqt (soniya). */
  elapsedSec(): number
  /** Oxirgi o'lchangan daraja 0..1 (level meter uchun). */
  level(): number
  readonly stream: MediaStream | null
}

/**
 * `MediaRecorder` ustidagi yupqa qobiq: ruxsat so'rash, davomiylik limiti,
 * daraja o'lchagich va yozuvni avtomatik WAV'ga aylantirish.
 */
export function createRecorder(options: RecorderOptions = {}): Recorder {
  const maxDurationSec = options.maxDurationSec ?? AUDIO.MAX_DURATION_SEC

  let state: RecorderState = 'idle'
  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []
  let startedAt = 0
  let stoppedAt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let rafId: number | null = null
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let lastLevel = 0

  function cleanup() {
    if (timer) clearTimeout(timer)
    timer = null
    if (rafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId)
    rafId = null
    analyser = null
    void audioCtx?.close().catch(() => undefined)
    audioCtx = null
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
  }

  function startMeter() {
    if (!stream || !options.onLevel) return
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    audioCtx = new Ctx()
    const source = audioCtx.createMediaStreamSource(stream)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.fftSize)
    const tick = () => {
      if (!analyser) return
      analyser.getByteTimeDomainData(data)
      lastLevel = formatLevel(data)
      options.onLevel?.(lastLevel)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  return {
    get state() {
      return state
    },
    get stream() {
      return stream
    },
    elapsedSec() {
      if (!startedAt) return 0
      const end = stoppedAt || Date.now()
      return (end - startedAt) / 1000
    },
    level() {
      return lastLevel
    },
    async start() {
      if (state === 'recording') return
      if (!isRecordingSupported()) {
        state = 'error'
        throw new Error(
          'Brauzeringiz ovoz yozishni qo‘llab-quvvatlamaydi. Chrome yoki Safari’dan foydalaning.'
        )
      }
      state = 'requesting'
      try {
        stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
      } catch (error) {
        state = 'error'
        throw new Error(micErrorMessage(error))
      }

      chunks = []
      stoppedAt = 0
      const mimeType = pickMimeType()
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.start(250)
      startedAt = Date.now()
      state = 'recording'
      startMeter()

      timer = setTimeout(() => {
        if (state === 'recording') {
          options.onMaxDuration?.()
          recorder?.stop()
        }
      }, maxDurationSec * 1000)
    },
    stop() {
      return new Promise<RecordingResult>((resolve, reject) => {
        if (!recorder || state !== 'recording') {
          reject(new Error('Yozuv boshlanmagan.'))
          return
        }
        const mimeType = recorder.mimeType || 'audio/webm'
        recorder.onstop = () => {
          stoppedAt = Date.now()
          state = 'stopped'
          const durationSec = (stoppedAt - startedAt) / 1000
          const blob = new Blob(chunks, { type: mimeType })
          cleanup()
          blobToWav(blob)
            .then((wav) => {
              const guard = checkAudioLimits(wav, durationSec)
              if (!guard.ok) {
                reject(new Error(guard.error))
                return
              }
              resolve({ blob, wav, durationSec, mimeType })
            })
            .catch(reject)
        }
        if (recorder.state !== 'inactive') recorder.stop()
      })
    },
    cancel() {
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }
      recorder = null
      chunks = []
      state = 'idle'
      cleanup()
    },
  }
}

/* ------------------------------------------------------------------ */
/* Cheklovlar                                                          */
/* ------------------------------------------------------------------ */

export interface AudioGuardResult {
  ok: boolean
  error?: string
}

/**
 * Davomiylik va hajm cheklovlari (`AUDIO` konstantalari, PLAN 8.3, 17-bo'lim:
 * "audio ≤ 2 daqiqa" — talabalarning interneti zaif).
 */
export function checkAudioLimits(blob: Blob, durationSec: number): AudioGuardResult {
  if (durationSec < 0.5) {
    return { ok: false, error: 'Yozuv juda qisqa (kamida 1 soniya gapiring).' }
  }
  if (durationSec > AUDIO.MAX_DURATION_SEC + 1) {
    return {
      ok: false,
      error: `Yozuv juda uzun: ${Math.round(durationSec)} s. Maksimal ${AUDIO.MAX_DURATION_SEC} soniya.`,
    }
  }
  if (blob.size > AUDIO.MAX_BYTES) {
    return {
      ok: false,
      error: `Fayl juda katta (${(blob.size / 1024 / 1024).toFixed(1)} MB). Maksimal ${Math.round(
        AUDIO.MAX_BYTES / 1024 / 1024
      )} MB.`,
    }
  }
  if (blob.size < 1024) {
    return { ok: false, error: 'Yozuvda ovoz aniqlanmadi. Mikrofonni tekshirib, qaytadan yozing.' }
  }
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* WAV kodlash                                                         */
/* ------------------------------------------------------------------ */

/** Ko'p kanalni monoga qo'shish (o'rtacha). */
function toMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels
  if (channels === 1) return buffer.getChannelData(0).slice()
  const out = new Float32Array(buffer.length)
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) out[i] += data[i] / channels
  }
  return out
}

/** Chiziqli interpolyatsiya bilan qayta diskretlash (OfflineAudioContext zaxirasi). */
function resampleLinear(input: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return input
  const ratio = from / to
  const length = Math.round(input.length / ratio)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const position = i * ratio
    const index = Math.floor(position)
    const frac = position - index
    const a = input[index] ?? 0
    const b = input[index + 1] ?? a
    out[i] = a + (b - a) * frac
  }
  return out
}

/**
 * `AudioBuffer` → 16 kHz mono 16-bit PCM WAV `Blob`.
 * WAV sarlavhasi (44 bayt) qo'lda quriladi — hech qanday kutubxona kerak emas.
 */
export function encodeWav(audioBuffer: AudioBuffer, targetRate: number = AUDIO.SAMPLE_RATE): Blob {
  const mono = toMono(audioBuffer)
  const samples = resampleLinear(mono, audioBuffer.sampleRate, targetRate)

  const bytesPerSample = 2
  const blockAlign = AUDIO.CHANNELS * bytesPerSample
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk hajmi
  view.setUint16(20, 1, true) // format = PCM
  view.setUint16(22, AUDIO.CHANNELS, true)
  view.setUint32(24, targetRate, true)
  view.setUint32(28, targetRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 8 * bytesPerSample, true) // bit depth
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
    offset += bytesPerSample
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * Ixtiyoriy audio `Blob` (WebM/Opus, MP4/AAC …) → Azure uchun WAV.
 * `AudioContext.decodeAudioData` bilan dekodlanadi, so'ng `encodeWav`.
 */
export async function blobToWav(blob: Blob, targetRate: number = AUDIO.SAMPLE_RATE): Promise<Blob> {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) throw new Error('Brauzer audio qayta ishlashni qo‘llab-quvvatlamaydi.')

  const arrayBuffer = await blob.arrayBuffer()
  const context = new Ctx()
  try {
    const decoded = await context.decodeAudioData(arrayBuffer.slice(0))
    return encodeWav(decoded, targetRate)
  } catch {
    throw new Error('Yozuvni o‘qib bo‘lmadi. Qaytadan yozib ko‘ring.')
  } finally {
    void context.close().catch(() => undefined)
  }
}

/** Audio `Blob` davomiyligini (soniya) aniqlash. */
export async function blobDuration(blob: Blob): Promise<number> {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return 0
  const context = new Ctx()
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer())
    return decoded.duration
  } catch {
    return 0
  } finally {
    void context.close().catch(() => undefined)
  }
}

/* ------------------------------------------------------------------ */
/* Daraja o'lchagich                                                   */
/* ------------------------------------------------------------------ */

/**
 * `AnalyserNode.getByteTimeDomainData` ma'lumotidan 0..1 daraja (RMS).
 * Talaba "ovozim yetarlimi?" degan savolga yozishdan oldin javob oladi.
 */
export function formatLevel(analyserData: Uint8Array): number {
  if (!analyserData.length) return 0
  let sum = 0
  for (let i = 0; i < analyserData.length; i += 1) {
    const value = (analyserData[i] - 128) / 128
    sum += value * value
  }
  const rms = Math.sqrt(sum / analyserData.length)
  // Kuchaytirish: oddiy gapirishda ~0.05–0.2 RMS bo'ladi
  return Math.min(1, Math.round(rms * 3 * 100) / 100)
}

/** Darajani ustunlar soniga aylantirish (oddiy level meter UI). */
export function levelBars(level: number, bars = 12): number {
  return Math.max(0, Math.min(bars, Math.round(level * bars)))
}
