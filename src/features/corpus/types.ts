/** Corpus Verification (PLAN 8.16) uchun klient tiplari. */

export type CorpusVerdictValue = 'attested' | 'rare' | 'not_attested'

export interface CorpusAlternative {
  phrase: string
  note: string
}

/** `POST /api/ai/corpus-verify` javobi (`CorpusVerdictSchema`). */
export interface CorpusVerdictResult {
  verdict: CorpusVerdictValue
  explanation: string
  betterAlternatives: CorpusAlternative[]
  exampleSentences: string[]
}

/** `corpusNgrams` hujjatidan olingan xom statistika (server action orqali). */
export interface CorpusStats {
  phrase: string
  found: boolean
  count: number
  docFreq: number
  examples: Array<{ sentence: string; docId?: string }>
}

export const VERDICT_META: Record<
  CorpusVerdictValue,
  { uz: string; sign: string; tone: 'success' | 'warning' | 'danger'; hint: string }
> = {
  attested: {
    uz: 'Tasdiqlandi',
    sign: '✓',
    tone: 'success',
    hint: 'Bu ibora korpusda uchraydi va professional matnlarda ishlatiladi.',
  },
  rare: {
    uz: 'Kam uchraydi',
    sign: '~',
    tone: 'warning',
    hint: 'Ibora grammatik jihatdan mumkin, lekin kam ishlatiladi — muqobilini ko‘rib chiqing.',
  },
  not_attested: {
    uz: 'Uchramaydi',
    sign: '✗',
    tone: 'danger',
    hint: 'Bu birikma ingliz tilida ishlatilmaydi. Quyidagi muqobillardan foydalaning.',
  },
}
