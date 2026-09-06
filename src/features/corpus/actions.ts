'use server'

import { adminDb } from '@/lib/firebase/admin'
import { requireUser } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import type { ActionResult, CorpusNgramDoc } from '@/types'

import { cleanPhrase, ngramKey } from './keys'
import type { CorpusStats } from './types'

/**
 * Korpus chastotasini o'qiydi (PLAN 8.16).
 * AI verdikti `/api/ai/corpus-verify` orqali keladi; xom raqamlar esa
 * to'g'ridan-to'g'ri Firestore'dan — talaba dalilni o'z ko'zi bilan ko'rishi kerak.
 */
export async function lookupCorpusStats(
  phrase: string,
  alternative?: string
): Promise<ActionResult<{ main: CorpusStats; alternative: CorpusStats | null }>> {
  await requireUser()

  const cleaned = cleanPhrase(phrase)

  if (cleaned.length < 2) {
    return { ok: false, error: 'Iborani kiriting (kamida 2 belgi).', code: 'bad_input' }
  }

  const altCleaned = alternative ? cleanPhrase(alternative) : ''

  try {
    const db = adminDb()
    const [snap, altSnap] = await Promise.all([
      db.collection(COL.corpusNgrams).doc(ngramKey(cleaned)).get(),
      altCleaned
        ? db.collection(COL.corpusNgrams).doc(ngramKey(altCleaned)).get()
        : Promise.resolve(null),
    ])

    const toStats = (
      phraseText: string,
      data: CorpusNgramDoc | undefined,
      exists: boolean
    ): CorpusStats => ({
      phrase: phraseText,
      found: exists && Boolean(data),
      count: data?.count ?? 0,
      docFreq: data?.docFreq ?? 0,
      examples: (data?.examples ?? []).slice(0, 5).map((example) => ({
        sentence: String(example.sentence).slice(0, 300),
        docId: example.docId,
      })),
    })

    return {
      ok: true,
      data: {
        main: toStats(cleaned, snap.data() as CorpusNgramDoc | undefined, snap.exists),
        alternative: altSnap
          ? toStats(altCleaned, altSnap.data() as CorpusNgramDoc | undefined, altSnap.exists)
          : null,
      },
    }
  } catch (err) {
    console.error('[corpus] lookupCorpusStats failed', err)
    return { ok: false, error: 'Korpus statistikasini o‘qib bo‘lmadi.', code: 'internal' }
  }
}
