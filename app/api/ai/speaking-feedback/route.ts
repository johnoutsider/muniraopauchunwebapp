import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { analyseSpeaking } from '@/ai/services/speaking'
import { adminDb } from '@/lib/firebase/admin'
import { COL, CEFR_LEVELS } from '@/config/constants'
import type { SpeakingSubmissionDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

const Schema = z.object({
  submissionId: z.string().min(1).max(60),
  cefr: z.enum(CEFR_LEVELS).default('B1'),
})

/** Azure ballarini pedagogik tavsiyaga aylantirish (PLAN 8.3, 7.2). */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'pronunciationAI' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const db = adminDb()
  const ref = db.collection(COL.speakingSubmissions).doc(body.submissionId)
  const snap = await ref.get()
  const submission = snap.data() as SpeakingSubmissionDoc | undefined

  if (!snap.exists || !submission) {
    return NextResponse.json({ error: 'Topshiriq topilmadi.' }, { status: 404 })
  }
  if (submission.uid !== user.uid && user.role === 'student') {
    return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 403 })
  }
  if (submission.aiFeedback) {
    return NextResponse.json(submission.aiFeedback)
  }

  // Oldingi urinish bali — taraqqiyotni taqqoslash uchun
  const previous = await db
    .collection(COL.speakingSubmissions)
    .where('uid', '==', submission.uid)
    .where('taskId', '==', submission.taskId)
    .orderBy('ts', 'desc')
    .limit(2)
    .get()
  const previousPronScore = previous.docs
    .map((d) => (d.data() as SpeakingSubmissionDoc).azure?.pronScore)
    .find((score, index) => index > 0 && typeof score === 'number')

  const result = await analyseSpeaking({
    referenceText: submission.referenceText,
    transcript: submission.transcript,
    azure: submission.azure,
    cefr: body.cefr,
    taskType: submission.type,
    attemptNo: submission.attemptNo,
    previousPronScore,
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (result.ok) {
    await ref.set({ aiFeedback: result.data }, { merge: true })
  }
  return aiResponse(result)
}
