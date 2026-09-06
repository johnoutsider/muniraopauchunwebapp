import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { ngramStatsFromDoc, verifyCollocation } from '@/ai/services/corpus'
import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { CorpusNgramDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const Schema = z.object({
  phrase: z.string().min(2).max(120),
  alternative: z.string().max(120).optional(),
})

/** Corpus Verification Strategy: "make a profit" vs "do a profit" (PLAN 8.16). */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'corpusVerification' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const db = adminDb()

  const key = body.phrase.trim().toLowerCase().replace(/\s+/g, '_')
  const altKey = body.alternative?.trim().toLowerCase().replace(/\s+/g, '_')

  const [snap, altSnap] = await Promise.all([
    db.collection(COL.corpusNgrams).doc(key).get(),
    altKey ? db.collection(COL.corpusNgrams).doc(altKey).get() : Promise.resolve(null),
  ])

  const altDoc = altSnap ? ((altSnap.data() as CorpusNgramDoc | undefined) ?? null) : null
  const stats = ngramStatsFromDoc((snap.data() as CorpusNgramDoc | undefined) ?? null, {
    ngram: body.phrase,
    alternatives:
      altDoc && body.alternative
        ? [{ phrase: body.alternative, count: altDoc.count ?? 0 }]
        : undefined,
  })

  const result = await verifyCollocation({
    phrase: body.phrase,
    ngramStats: stats,
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (result.ok) {
    await logEvent(user, 'corpus_check', { phrase: body.phrase, verdict: result.data.verdict })
  }
  return aiResponse(result)
}
