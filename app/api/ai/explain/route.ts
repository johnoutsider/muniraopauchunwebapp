import { NextResponse } from 'next/server'
import { z } from 'zod'

import { analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { streamTutorReply } from '@/ai/services/tutor'
import { adminDb } from '@/lib/firebase/admin'
import { getUserDoc } from '@/features/shared/queries'
import { COL } from '@/config/constants'
import type { ItemDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const Schema = z.object({
  /** Dars blokidan kelgan tayyor savol */
  prompt: z.string().max(600).optional(),
  lessonId: z.string().max(60).optional(),
  context: z.string().max(300).optional(),
  mode: z.enum(['lesson_explain', 'item_explain']).optional(),
  /** Mashq runneridan kelgan kontekst */
  itemId: z.string().max(60).optional(),
  answer: z.array(z.string().max(400)).max(20).optional(),
  topic: z.string().max(120).optional(),
  skill: z.string().max(40).optional(),
  isCorrect: z.boolean().optional(),
})

/**
 * Qisqa, bir martalik AI tushuntirish (dars bloki yoki bajarilgan mashq uchun).
 * Chatdan farqi — sessiya ochilmaydi, javob to'liq matn sifatida qaytadi.
 * Nazorat guruhida `aiTutor` o'chirilgani uchun 403 keladi va UI statik
 * tushuntirishga qaytadi.
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiTutor' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx

  let question = body.prompt?.trim() ?? ''

  // Mashq konteksti: itemni o'qib, aniq savol tuzamiz
  if (!question && body.itemId) {
    const snap = await adminDb().collection(COL.items).doc(body.itemId).get()
    const item = snap.data() as ItemDoc | undefined
    if (!item) {
      return NextResponse.json({ error: 'Mashq topilmadi.' }, { status: 404 })
    }
    const learnerAnswer = (body.answer ?? []).join(', ') || '(javob berilmadi)'
    question = [
      `Exercise (${item.skill}, topic: ${item.topic}, ${item.cefr}):`,
      item.stem,
      `My answer: ${learnerAnswer}`,
      body.isCorrect
        ? 'My answer was accepted. Explain briefly why it works and one situation where the same rule applies.'
        : 'My answer was wrong. Explain in two or three short sentences why it is wrong, how to fix it, and where else this rule applies. Do not just say it is wrong.',
    ].join('\n')
  }

  if (!question) {
    return NextResponse.json({ error: 'Savol bo‘sh.' }, { status: 400 })
  }

  const userDoc = await getUserDoc(user.uid)

  const result = await streamTutorReply({
    user: analyticsUser(user),
    messages: [{ role: 'user', content: question }],
    signal: request.signal,
    context: {
      name: user.displayName,
      cefr: userDoc?.onboarding?.selfAssessedLevel,
      professionalTrack: userDoc?.onboarding?.professionalTrack,
      currentLesson: body.context,
      currentTopic: body.topic,
      explanationLanguage: user.locale === 'en' ? 'en' : 'uz',
      extra:
        'Answer in at most 120 words. This is a one-off explanation inside a lesson or exercise, not a conversation.',
    },
  })

  if (!result.ok) {
    const status = result.code === 'quota_exceeded' ? 429 : 503
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  try {
    const text = await result.data.text
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json({ error: 'AI javobini o‘qib bo‘lmadi.' }, { status: 502 })
  }
}
