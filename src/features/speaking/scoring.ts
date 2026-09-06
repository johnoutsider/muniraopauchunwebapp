/**
 * `@/lib/speech/azure` dagi `pronunciationBand` mantig'ining klient-xavfsiz nusxasi.
 * `azure.ts` `server-only` bo'lgani uchun brauzer komponentiga import qilinmaydi;
 * chegaralar (80 / 60) AYNAN o'sha faylniki bilan bir xil bo'lishi shart (PLAN 8.3).
 */

export type PronunciationBand = 'good' | 'fair' | 'poor'

export function pronunciationBand(score: number): PronunciationBand {
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

export const BAND_TEXT: Record<PronunciationBand, string> = {
  good: 'Yaxshi',
  fair: 'O‘rtacha',
  poor: 'Zaif',
}

/** So'z/fonema rangi — matn ustida ko'rsatish uchun. */
export const BAND_WORD_CLASS: Record<PronunciationBand, string> = {
  good: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  fair: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  poor: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200',
}

/** Gauge / progress rangi. */
export const BAND_STROKE: Record<PronunciationBand, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  fair: 'text-amber-500 dark:text-amber-400',
  poor: 'text-rose-600 dark:text-rose-400',
}

export const ERROR_TYPE_TEXT: Record<string, string> = {
  None: 'To‘g‘ri talaffuz qilindi',
  Mispronunciation: 'Noto‘g‘ri talaffuz',
  Omission: 'Tushib qoldi (aytilmadi)',
  Insertion: 'Ortiqcha qo‘shildi',
  UnexpectedBreak: 'Kutilmagan pauza',
  MissingBreak: 'Pauza yetishmadi',
  Monoton: 'Monoton ohang',
}

export function errorTypeText(errorType: string | undefined): string {
  if (!errorType) return ''
  return ERROR_TYPE_TEXT[errorType] ?? errorType
}

/** Sekundni `1:05` ko'rinishida. */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}
