import 'server-only'

/**
 * Azure AI Speech — REST qatlami (PLAN.md 1.3, 8.3).
 *
 * METODIK MAQSAD:
 * Talaffuz — iqtisodiyot talabalari uchun eng zaif ko'nikmalardan biri, ammo
 * uni sub'ektiv baholash ilmiy jihatdan zaif. Azure Pronunciation Assessment
 * har so'z va FONEMA darajasida 0–100 ball beradi (accuracy, fluency,
 * completeness, prosody) — bu pre/post taqqoslash uchun obyektiv, takrorlanuvchan
 * o'lchov beradi (dissertatsiya uchun kritik).
 *
 * NIMA UCHUN REST, SDK EMAS:
 * `microsoft-cognitiveservices-speech-sdk` brauzerga mo'ljallangan (WebSocket,
 * mikrofon). Bizda audio allaqachon Storage'da WAV bo'lib yotadi va baholash
 * Vercel serverida bajariladi — shuning uchun oddiy `fetch` REST chaqiruvi
 * yengilroq, sovuq start tezroq va kalit hech qachon brauzerga chiqmaydi.
 *
 * AUDIO TALABI: 16 kHz, mono, 16-bit PCM WAV (`@/lib/speech/audio` shuni beradi).
 */

import { AUDIO } from '@/config/constants'
import type { AzureAssessment, PronunciationWordResult } from '@/types'

/* ------------------------------------------------------------------ */
/* Konfiguratsiya                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_LANGUAGE = 'en-GB'
const DEFAULT_VOICE = 'en-GB-SoniaNeural'
const DEFAULT_TTS_FORMAT = 'audio-16khz-32kbitrate-mono-mp3'
const REQUEST_TIMEOUT_MS = 30_000

interface SpeechConfig {
  key: string
  region: string
}

/** Kalitlar sozlanganmi (UI'da "Talaffuz baholash vaqtincha ishlamaydi" uchun). */
export function isSpeechConfigured(): boolean {
  return Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)
}

function requireConfig(): SpeechConfig {
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    throw new Error(
      'Azure Speech sozlanmagan: AZURE_SPEECH_KEY va AZURE_SPEECH_REGION muhit o‘zgaruvchilarini to‘ldiring (docs/SETUP.md).'
    )
  }
  return { key, region }
}

function sttEndpoint(region: string, language: string, detailed: boolean): string {
  const format = detailed ? 'detailed' : 'simple'
  return `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${encodeURIComponent(
    language
  )}&format=${format}`
}

function ttsEndpoint(region: string): string {
  return `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`
}

/** WAV (16 kHz mono PCM) uchun Content-Type. */
const WAV_CONTENT_TYPE = `audio/wav; codecs=audio/pcm; samplerate=${AUDIO.SAMPLE_RATE}`

function assertAudio(audio: Buffer): void {
  if (!audio?.length) {
    throw new Error('Audio bo‘sh — mikrofon yozuvi qayd etilmadi. Qaytadan urinib ko‘ring.')
  }
  if (audio.length > AUDIO.MAX_BYTES) {
    throw new Error(
      `Audio hajmi juda katta (${Math.round(audio.length / 1024 / 1024)} MB). Maksimal ${Math.round(
        AUDIO.MAX_BYTES / 1024 / 1024
      )} MB, ${AUDIO.MAX_DURATION_SEC} soniya.`
    )
  }
}

async function azureFetch(url: string, init: RequestInit, what: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'Azure Speech kaliti noto‘g‘ri yoki muddati tugagan. Administratorga murojaat qiling.'
        )
      }
      if (response.status === 429) {
        throw new Error(
          'Azure Speech so‘rovlar limiti tugadi. Bir necha daqiqadan so‘ng qayta urinib ko‘ring.'
        )
      }
      throw new Error(`Azure ${what} xatosi (${response.status}): ${body.slice(0, 300)}`)
    }
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        `Azure ${what} javob bermadi (${REQUEST_TIMEOUT_MS / 1000} s). Internetni tekshiring.`
      )
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ */
/* Azure javob sxemasi (detailed)                                      */
/* ------------------------------------------------------------------ */

interface AzurePhoneme {
  Phoneme?: string
  PronunciationAssessment?: { AccuracyScore?: number }
}

interface AzureSyllable {
  Syllable?: string
  PronunciationAssessment?: { AccuracyScore?: number }
}

interface AzureWord {
  Word?: string
  PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string }
  Phonemes?: AzurePhoneme[]
  Syllables?: AzureSyllable[]
}

interface AzureNBest {
  Display?: string
  Lexical?: string
  Confidence?: number
  PronunciationAssessment?: {
    AccuracyScore?: number
    FluencyScore?: number
    CompletenessScore?: number
    ProsodyScore?: number
    PronScore?: number
  }
  Words?: AzureWord[]
}

interface AzureRecognitionResponse {
  RecognitionStatus?: string
  DisplayText?: string
  NBest?: AzureNBest[]
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parseWords(words: AzureWord[] | undefined): PronunciationWordResult[] {
  if (!words?.length) return []
  return words.map((word) => ({
    word: word.Word ?? '',
    accuracyScore: num(word.PronunciationAssessment?.AccuracyScore),
    errorType: word.PronunciationAssessment?.ErrorType ?? 'None',
    phonemes: word.Phonemes?.map((phoneme) => ({
      phoneme: phoneme.Phoneme ?? '',
      accuracyScore: num(phoneme.PronunciationAssessment?.AccuracyScore),
    })),
    syllables: word.Syllables?.map((syllable) => ({
      syllable: syllable.Syllable ?? '',
      accuracyScore: num(syllable.PronunciationAssessment?.AccuracyScore),
    })),
  }))
}

/* ------------------------------------------------------------------ */
/* 1. Pronunciation Assessment                                         */
/* ------------------------------------------------------------------ */

export interface AssessPronunciationInput {
  /** 16 kHz mono 16-bit PCM WAV. */
  audio: Buffer
  /**
   * Berilsa — SCRIPTED rejim (so'z/gap o'qish, completeness va miscue hisoblanadi).
   * Berilmasa — UNSCRIPTED rejim (erkin nutq, prezentatsiya, role-play).
   */
  referenceText?: string
  language?: string
  /** Fonema alifbosi: IPA (talabaga ko'rsatish uchun) yoki SAPI. */
  phonemeAlphabet?: 'IPA' | 'SAPI'
}

/**
 * Talaffuzni baholash (PLAN 8.3).
 *
 * Baholash sarlavhasi (`Pronunciation-Assessment`) base64 JSON:
 *   GradingSystem: HundredMark   — 0–100 ball (talabaga tushunarli)
 *   Granularity:   Phoneme       — so'z + bo'g'in + fonema darajasi
 *   EnableMiscue:  true          — tushib qolgan/qo'shib yuborilgan so'zlar
 *   Dimension:     Comprehensive — accuracy + fluency + completeness + pron
 *   EnableProsodyAssessment: true — urg'u va intonatsiya (metodikaning muhim qismi)
 */
export async function assessPronunciation(
  input: AssessPronunciationInput
): Promise<AzureAssessment> {
  const { audio, referenceText, language = DEFAULT_LANGUAGE, phonemeAlphabet = 'IPA' } = input
  assertAudio(audio)
  const { key, region } = requireConfig()

  const params: Record<string, unknown> = {
    // Unscripted rejimda ReferenceText bo'sh string bo'lishi kerak
    ReferenceText: referenceText ?? '',
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    EnableMiscue: Boolean(referenceText),
    Dimension: 'Comprehensive',
    EnableProsodyAssessment: true,
    PhonemeAlphabet: phonemeAlphabet,
  }

  const header = Buffer.from(JSON.stringify(params), 'utf8').toString('base64')

  const response = await azureFetch(
    sttEndpoint(region, language, true),
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': WAV_CONTENT_TYPE,
        'Pronunciation-Assessment': header,
        Accept: 'application/json',
      },
      body: new Uint8Array(audio),
    },
    'Pronunciation Assessment'
  )

  const data = (await response.json()) as AzureRecognitionResponse

  if (data.RecognitionStatus && data.RecognitionStatus !== 'Success') {
    if (data.RecognitionStatus === 'NoMatch') {
      throw new Error(
        'Nutq aniqlanmadi. Mikrofonga yaqinroq va balandroq gapiring, atrofdagi shovqinni kamaytiring.'
      )
    }
    if (data.RecognitionStatus === 'InitialSilenceTimeout') {
      throw new Error('Yozuvda ovoz eshitilmadi. Mikrofon ruxsatini tekshirib, qaytadan yozing.')
    }
    throw new Error(`Azure nutqni tanimadi (${data.RecognitionStatus}).`)
  }

  const best = data.NBest?.[0]
  const assessment = best?.PronunciationAssessment

  if (!best || !assessment) {
    throw new Error('Azure baholash natijasini qaytarmadi. Yozuvni qaytadan yuboring.')
  }

  return {
    accuracyScore: num(assessment.AccuracyScore),
    fluencyScore: num(assessment.FluencyScore),
    completenessScore: num(assessment.CompletenessScore, referenceText ? 0 : 100),
    prosodyScore: typeof assessment.ProsodyScore === 'number' ? assessment.ProsodyScore : undefined,
    pronScore: num(assessment.PronScore),
    words: parseWords(best.Words),
    recognizedText: best.Display ?? data.DisplayText ?? best.Lexical ?? '',
  }
}

/* ------------------------------------------------------------------ */
/* 2. Speech-to-Text                                                   */
/* ------------------------------------------------------------------ */

export interface SpeechToTextInput {
  audio: Buffer
  language?: string
}

export interface SpeechToTextResult {
  transcript: string
  confidence: number
  status: string
}

/** Speaking topshiriqlari va ovozli role-play uchun transkript (PLAN 1.3). */
export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextResult> {
  const { audio, language = DEFAULT_LANGUAGE } = input
  assertAudio(audio)
  const { key, region } = requireConfig()

  const response = await azureFetch(
    sttEndpoint(region, language, true),
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': WAV_CONTENT_TYPE,
        Accept: 'application/json',
      },
      body: new Uint8Array(audio),
    },
    'Speech-to-Text'
  )

  const data = (await response.json()) as AzureRecognitionResponse
  const best = data.NBest?.[0]

  if (data.RecognitionStatus === 'NoMatch' || (!best && !data.DisplayText)) {
    return { transcript: '', confidence: 0, status: data.RecognitionStatus ?? 'NoMatch' }
  }

  return {
    transcript: best?.Display ?? data.DisplayText ?? '',
    confidence: num(best?.Confidence),
    status: data.RecognitionStatus ?? 'Success',
  }
}

/* ------------------------------------------------------------------ */
/* 3. Text-to-Speech                                                   */
/* ------------------------------------------------------------------ */

export interface TextToSpeechInput {
  text: string
  /** Neural ovoz nomi, masalan `en-GB-SoniaNeural` yoki `en-US-JennyNeural`. */
  voice?: string
  /** Ovoz uslubi (`newscast`, `cheerful`, `chat` …) — mavjud bo'lsa. */
  style?: string
  /** Sekinlashtirish: talaffuz namunasi uchun `-15%` foydali. */
  rate?: string
  language?: string
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** SSML qurish — uslub va tezlikni qo'llab-quvvatlaydi. */
export function buildSsml(input: TextToSpeechInput): string {
  const { text, voice = DEFAULT_VOICE, style, rate, language } = input
  const lang = language ?? voice.split('-').slice(0, 2).join('-')
  const escaped = escapeXml(text)
  const inner = rate ? `<prosody rate="${escapeXml(rate)}">${escaped}</prosody>` : escaped
  const styled = style
    ? `<mstts:express-as style="${escapeXml(style)}">${inner}</mstts:express-as>`
    : inner
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}">` +
    `<voice name="${escapeXml(voice)}">${styled}</voice></speak>`
  )
}

/**
 * Namunaviy talaffuz audiosi (PLAN 8.1, 8.3: "listen model / listen mine").
 * Natija `tts-cache.ts` orqali Storage'da keshlanadi — bir so'z bir marta.
 */
export async function textToSpeech(input: TextToSpeechInput): Promise<Buffer> {
  const text = input.text?.trim()
  if (!text) throw new Error('TTS uchun matn bo‘sh.')
  if (text.length > 3000) {
    throw new Error('TTS matni juda uzun (maksimal 3000 belgi).')
  }
  const { key, region } = requireConfig()

  const response = await azureFetch(
    ttsEndpoint(region),
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': DEFAULT_TTS_FORMAT,
        'User-Agent': 'LinguaEconAI',
      },
      body: buildSsml({ ...input, text }),
    },
    'Text-to-Speech'
  )

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/* ------------------------------------------------------------------ */
/* Yordamchi: natijani metodik talqin qilish                           */
/* ------------------------------------------------------------------ */

/** Muammoli tovushlar ro'yxati — minimal-pair mashqlarini tanlash uchun. */
export function problematicPhonemes(
  assessment: AzureAssessment,
  threshold = 60
): Array<{ phoneme: string; words: string[]; avgScore: number }> {
  const map = new Map<string, { total: number; count: number; words: Set<string> }>()
  for (const word of assessment.words) {
    for (const phoneme of word.phonemes ?? []) {
      if (!phoneme.phoneme) continue
      const entry = map.get(phoneme.phoneme) ?? { total: 0, count: 0, words: new Set<string>() }
      entry.total += phoneme.accuracyScore
      entry.count += 1
      if (phoneme.accuracyScore < threshold) entry.words.add(word.word)
      map.set(phoneme.phoneme, entry)
    }
  }
  return [...map.entries()]
    .map(([phoneme, entry]) => ({
      phoneme,
      words: [...entry.words],
      avgScore: entry.count ? Math.round(entry.total / entry.count) : 0,
    }))
    .filter((entry) => entry.avgScore < threshold && entry.words.length > 0)
    .sort((a, b) => a.avgScore - b.avgScore)
}

/** Ball → rang sinfi (so'z/fonema bo'yicha rangli ko'rsatish, PLAN 8.3). */
export function pronunciationBand(score: number): 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}
