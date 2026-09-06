import 'server-only'

/**
 * TTS keshi — Firebase Storage'da (PLAN.md 1.3: "Natija Storage'da keshlanadi,
 * bir so'z — bir marta"; 16-bo'lim: Azure xarajatini nazorat qilish).
 *
 * NIMA UCHUN KERAK:
 * Lug'at kartasi (8.1) va talaffuz namunasi (8.3) har ochilganda bir xil
 * matnni qayta sintez qilish — bu 200 talaba × 500 so'z = yuz minglab
 * ortiqcha chaqiruv degani. Matn + ovoz kombinatsiyasidan SHA-256 hash olinadi
 * va fayl `tts/{hash}.mp3` sifatida bir marta saqlanadi; keyingi barcha
 * chaqiruvlar tayyor URL qaytaradi (Azure'ga so'rov yo'q).
 */

import { createHash } from 'node:crypto'

import { adminBucket } from '@/lib/firebase/admin'

import { isSpeechConfigured, textToSpeech, type TextToSpeechInput } from './azure'

const DEFAULT_VOICE = 'en-GB-SoniaNeural'
const CACHE_PREFIX = 'tts'
/** Signed URL uchun uzoq muddat (v2 imzolash cheklovsiz muddatga ruxsat beradi). */
const SIGNED_URL_EXPIRES = '2100-01-01'

export interface TtsCacheResult {
  url: string
  path: string
  hash: string
  /** `true` — fayl allaqachon keshda bor edi (Azure chaqirilmadi). */
  cached: boolean
}

/**
 * Kesh kaliti: matn + ovoz + uslub + tezlik.
 * Matn normallashtiriladi (ortiqcha bo'shliq, registr) — "Revenue" va
 * "revenue " bir xil faylni ishlatadi.
 */
export function ttsHash(text: string, voice: string, style?: string, rate?: string): string {
  const normalised = text.replace(/\s+/g, ' ').trim().toLowerCase()
  return createHash('sha256')
    .update(`${voice}|${style ?? ''}|${rate ?? ''}|${normalised}`)
    .digest('hex')
    .slice(0, 40)
}

/** Kesh fayli yo'li. */
export function ttsPath(hash: string): string {
  return `${CACHE_PREFIX}/${hash}.mp3`
}

async function publicOrSignedUrl(path: string): Promise<string> {
  const file = adminBucket().file(path)
  try {
    // Ochiq URL — CDN keshlanadi, eng arzon variant
    await file.makePublic()
    return `https://storage.googleapis.com/${adminBucket().name}/${encodeURI(path)}`
  } catch {
    // Uniform bucket-level access yoqilgan bo'lsa ACL ishlamaydi → signed URL
    const [url] = await file.getSignedUrl({
      version: 'v2',
      action: 'read',
      expires: SIGNED_URL_EXPIRES,
    })
    return url
  }
}

/**
 * Keshdan olish yoki sintez qilib keshga yozish.
 *
 * @param text  aytiladigan matn (so'z, kollokatsiya yoki gap)
 * @param voice Azure Neural ovoz nomi
 */
export async function getOrCreateTts(
  text: string,
  voice: string = DEFAULT_VOICE,
  options: Pick<TextToSpeechInput, 'style' | 'rate' | 'language'> = {}
): Promise<TtsCacheResult> {
  const clean = text?.trim()
  if (!clean) throw new Error('TTS uchun matn bo‘sh.')

  const hash = ttsHash(clean, voice, options.style, options.rate)
  const path = ttsPath(hash)
  const file = adminBucket().file(path)

  const [exists] = await file.exists()
  if (exists) {
    return { url: await publicOrSignedUrl(path), path, hash, cached: true }
  }

  if (!isSpeechConfigured()) {
    throw new Error(
      'Talaffuz namunasi hozircha mavjud emas: Azure Speech sozlanmagan. Administratorga murojaat qiling.'
    )
  }

  const audio = await textToSpeech({ text: clean, voice, ...options })
  await file.save(audio, {
    contentType: 'audio/mpeg',
    resumable: false,
    metadata: {
      // Bir yil brauzer keshi — fayl mazmuni hash bilan bog'langan, o'zgarmaydi
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { voice, style: options.style ?? '', text: clean.slice(0, 200) },
    },
  })

  return { url: await publicOrSignedUrl(path), path, hash, cached: false }
}

/**
 * Bir nechta matnni ketma-ket keshlash (seed skript: 500 lug'at so'zi).
 * Azure'ni bo'g'ib qo'ymaslik uchun ketma-ket, xatolar yig'iladi.
 */
export async function warmTtsCache(
  texts: readonly string[],
  voice: string = DEFAULT_VOICE
): Promise<{ ok: TtsCacheResult[]; failed: Array<{ text: string; error: string }> }> {
  const ok: TtsCacheResult[] = []
  const failed: Array<{ text: string; error: string }> = []
  for (const text of texts) {
    try {
      ok.push(await getOrCreateTts(text, voice))
    } catch (error) {
      failed.push({ text, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return { ok, failed }
}

/** Keshdagi faylni o'chirish (admin: ovoz almashtirilganda). */
export async function invalidateTts(text: string, voice: string = DEFAULT_VOICE): Promise<boolean> {
  const path = ttsPath(ttsHash(text, voice))
  try {
    await adminBucket().file(path).delete()
    return true
  } catch {
    return false
  }
}
