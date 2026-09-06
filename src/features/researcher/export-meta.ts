/**
 * Eksport datasetlari haqidagi klient-xavfsiz metama'lumot.
 *
 * Kalitlar `@/lib/export` dagi `DatasetName` bilan AYNAN bir xil — shu tufayli
 * klient formasidagi tanlov to'g'ridan to'g'ri `buildDatasets()` ga uzatiladi
 * (`datasets.ts` server moduli bo'lgani uchun bu yerda import qilinmaydi).
 */

export type DatasetKey =
  | 'participants'
  | 'attempts_long'
  | 'speaking_long'
  | 'writing_long'
  | 'ai_interactions'
  | 'survey_items'
  | 'events_long'

export const DATASET_ORDER: DatasetKey[] = [
  'participants',
  'attempts_long',
  'speaking_long',
  'writing_long',
  'ai_interactions',
  'survey_items',
  'events_long',
]

export const DATASET_LABELS: Record<DatasetKey, { label: string; description: string }> = {
  participants: {
    label: 'Ishtirokchilar (wide)',
    description:
      'Har ishtirokchi — bitta qator. Pre/post ballar, gain, so‘rovnoma ballari va faollik ko‘rsatkichlari. SPSS’da asosiy tahlil shu fayldan boshlanadi.',
  },
  attempts_long: {
    label: 'Mashq urinishlari (long)',
    description:
      'Har mashq urinishi — bitta qator. Ko‘nikma, mavzu, qiyinlik, to‘g‘ri/noto‘g‘ri, sarflangan vaqt, xato teglari.',
  },
  speaking_long: {
    label: 'Speaking topshiriqlari (long)',
    description:
      'Har audio topshiriq — bitta qator. Azure talaffuz ballari (accuracy, fluency, completeness, pron) va rubrika ballari.',
  },
  writing_long: {
    label: 'Writing topshiriqlari (long)',
    description:
      'Har yozma ish — bitta qator. Qoralamalar soni, so‘zlar soni, rubrika ballari, xatolar soni.',
  },
  ai_interactions: {
    label: 'AI bilan muloqot',
    description:
      'Har AI sessiyasi — bitta qator. Rejim, model, xabarlar soni, tokenlar. Nazorat guruhida bo‘sh bo‘lishi kutiladi.',
  },
  survey_items: {
    label: 'So‘rovnoma javoblari (item darajasi)',
    description:
      'Har savol — bitta qator. Likert javoblari raqamli. Ishonchlilik (Cronbach alpha) tahlili uchun.',
  },
  events_long: {
    label: 'Hodisalar jurnali (long)',
    description:
      'To‘liq faoliyat logi. Katta fayl — faqat kerak bo‘lganda tanlang (o‘quv analitikasi, vaqt seriyalari).',
  },
}

/** SPSS o'lchov darajasi (klient tomonda ko'rsatish uchun). */
export type Measure = 'nominal' | 'ordinal' | 'scale'

export const MEASURE_UZ: Record<Measure, string> = {
  nominal: 'nominal (nomlovchi)',
  ordinal: 'ordinal (tartib)',
  scale: 'scale (miqdoriy)',
}

/** Eksport sxemasi — `previewExportSchemaAction` qaytaradigan shakl. */
export interface DatasetSchemaPreview {
  name: string
  label: string
  description: string
  rows: number
  columns: Array<{
    name: string
    label: string
    type: 'string' | 'number' | 'date'
    measure: Measure
    values: string | null
  }>
}
