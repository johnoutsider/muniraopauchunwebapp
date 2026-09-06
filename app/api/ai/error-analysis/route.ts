import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { analyseErrors } from '@/ai/services/analysis'
import { getUserDoc } from '@/features/shared/queries'
import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { CEFR_LEVELS, COL, type ErrorTag } from '@/config/constants'
import type { ErrorProfileDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 90

const Schema = z.object({
  /** O'qituvchi/tadqiqotchi boshqa talabaning profilini so'rashi mumkin. */
  uid: z.string().max(60).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
  /** Keshlangan tahlil bo'lsa ham qaytadan hisoblash. */
  refresh: z.boolean().optional(),
})

/**
 * AI Error Analysis (PLAN 5 — 8-bosqich, 6.5).
 * `errorProfiles/{uid}` dan xatolar statistikasini o'qiydi, tahlilni
 * o'sha hujjatning `aiAnalysis` maydoniga qaytarib yozadi.
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiFeedback' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx

  const targetUid = body.uid ?? user.uid
  if (targetUid !== user.uid && user.role === 'student') {
    return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 403 })
  }

  const db = adminDb()
  const ref = db.collection(COL.errorProfiles).doc(targetUid)
  const snap = await ref.get()
  const profile = snap.data() as ErrorProfileDoc | undefined

  if (!profile || !profile.counts || Object.keys(profile.counts).length === 0) {
    return NextResponse.json(
      {
        error:
          'Tahlil uchun yetarli ma’lumot yo‘q. Avval bir nechta mashq bajaring — xatolaringiz to‘planganda tahlil tayyor bo‘ladi.',
        code: 'no_data',
      },
      { status: 409 }
    )
  }

  if (profile.aiAnalysis && !body.refresh) {
    return NextResponse.json({ ...profile.aiAnalysis, cached: true })
  }

  const userDoc = await getUserDoc(targetUid)

  const result = await analyseErrors({
    uid: targetUid,
    counts: profile.counts,
    recentExamples: (profile.recent ?? [])
      .slice(-20)
      .map((entry) => ({ tag: entry.tag as ErrorTag, example: entry.example })),
    cefr: body.cefr ?? userDoc?.onboarding?.selfAssessedLevel,
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (!result.ok) return aiResponse(result)

  try {
    await ref.set(
      {
        aiAnalysis: { ...result.data, generatedAt: FieldValue.serverTimestamp() },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    console.error('[api/error-analysis] persist failed', err)
  }

  return NextResponse.json({ ...result.data, cached: false })
}
