import 'server-only'

/**
 * Corpus Verification (PLAN 8.16, 7.2).
 * n-gramm statistikasini chaqiruvchi (`corpusNgrams`) topadi — bu servis
 * faqat verdikt va metodik izoh yozadi: "make a profit" ✓ / "do a profit" ✗.
 */

import { MODEL_MAIN, mainModel } from '@/ai/client'
import { CORPUS_VERIFY_PROMPT, buildSystemPrompt } from '@/ai/prompts'
import { CorpusVerdictSchema, type CorpusVerdict } from '@/ai/schemas'
import { sanitizeUserInput } from '@/ai/guard'
import type { CefrLevel, Domain } from '@/config/constants'
import type { ActionResult, CorpusNgramDoc } from '@/types'

import { dataBlock, runObject, type BaseAiArgs } from './common'

export interface NgramStats {
  /** Izlangan ibora (lemmatized) */
  ngram?: string
  /** Korpusdagi uchrash soni */
  count: number
  /** Nechta hujjatda uchraydi */
  docFreq?: number
  /** Korpus hajmi (so'z) — chastotani nisbatlash uchun */
  corpusWords?: number
  /** Korpusdan olingan misol gaplar */
  examples?: Array<{ sentence: string; docId?: string }>
  /** Muqobil variantlar statistikasi: "make a profit" → 187 */
  alternatives?: Array<{ phrase: string; count: number }>
}

export interface VerifyCollocationArgs extends BaseAiArgs {
  phrase: string
  ngramStats: NgramStats
  domain?: Domain
  cefr?: CefrLevel
}

/** `CorpusNgramDoc` ni servis kutadigan ko'rinishga aylantiradi. */
export function ngramStatsFromDoc(
  doc: CorpusNgramDoc | null | undefined,
  extras: Partial<NgramStats> = {}
): NgramStats {
  return {
    ngram: doc?.ngram,
    count: doc?.count ?? 0,
    docFreq: doc?.docFreq ?? 0,
    examples: doc?.examples?.slice(0, 5),
    ...extras,
  }
}

export async function verifyCollocation(
  args: VerifyCollocationArgs
): Promise<ActionResult<CorpusVerdict>> {
  const phrase = sanitizeUserInput(args.phrase, 120)
    .replace(/[\n\r]+/g, ' ')
    .trim()
  if (!phrase) return { ok: false, error: 'Ibora kiritilmadi.', code: 'empty_input' }

  const stats: NgramStats = {
    ...args.ngramStats,
    examples: args.ngramStats.examples?.slice(0, 5).map((e) => ({
      sentence: String(e.sentence).slice(0, 300),
      docId: e.docId,
    })),
    alternatives: args.ngramStats.alternatives?.slice(0, 8),
  }

  const prompt = `${CORPUS_VERIFY_PROMPT}

--- REQUEST ---
Phrase to check: "${phrase}"
Professional domain: ${args.domain ?? 'economics (general)'}
Learner CEFR: ${args.cefr ?? 'B1 (assumed)'}

${dataBlock('CORPUS STATISTICS (from the platform mini-corpus)', stats)}

Judge "${phrase}" and explain the verdict to the learner.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'verifyCollocation', phrase, count: stats.count },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: CorpusVerdictSchema,
    system: buildSystemPrompt({
      cefr: args.cefr,
      professionalTrack: args.domain,
      extra:
        'You are the Corpus Verification assistant. Corpus counts are evidence, not proof; a small corpus can miss a genuine phrase.',
    }),
    prompt,
    temperature: 0.25,
    maxTokens: 1400,
    signal: args.signal,
  })
}
