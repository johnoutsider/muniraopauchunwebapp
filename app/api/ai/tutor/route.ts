import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/firebase/session'
import { checkFlag } from '@/lib/flags'
import { createTutorSession, streamTutorReply } from '@/ai/services/tutor'
import { getUserDoc } from '@/features/shared/queries'
import { getLearningPath } from '@/features/shared/queries'
import { SKILL_LABELS, scoreToLabel, type Skill } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 120

const BodySchema = z.object({
  sessionId: z.string().optional(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .min(1)
    .max(60),
  lessonContext: z.string().max(500).optional(),
  topic: z.string().max(120).optional(),
})

/**
 * AI o'qituvchi (24/7) — oqimli javob.
 * Nazorat guruhida `aiTutor` flagi o'chirilgan, shuning uchun 403 qaytadi.
 */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi.' }, { status: 401 })

  if (!(await checkFlag(user, 'aiTutor'))) {
    return NextResponse.json(
      { error: 'AI o‘qituvchi sizning guruhingiz uchun yoqilmagan.' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri.' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Xabar formati noto‘g‘ri.' }, { status: 400 })
  }

  // Talaba konteksti: daraja, kasbiy yo'nalish, kuchli/zaif tomonlar
  const [userDoc, path] = await Promise.all([getUserDoc(user.uid), getLearningPath(user.uid)])

  const profile = path?.linguisticProfile ?? {}
  const strengths: string[] = []
  const weaknesses: string[] = []
  for (const [skill, entry] of Object.entries(profile) as Array<[Skill, { score: number }]>) {
    const label = scoreToLabel(entry.score)
    if (label === 'strong') strengths.push(SKILL_LABELS[skill].en)
    if (label === 'weak' || label === 'needs_improvement') weaknesses.push(SKILL_LABELS[skill].en)
  }

  let sessionId = parsed.data.sessionId
  if (!sessionId) {
    const created = await createTutorSession(
      { uid: user.uid, participantCode: user.participantCode, expGroup: user.expGroup },
      parsed.data.topic ?? 'AI Teacher'
    )
    if (created.ok) sessionId = created.data.sessionId
  }

  const result = await streamTutorReply({
    user: {
      uid: user.uid,
      participantCode: user.participantCode,
      expGroup: user.expGroup,
      groupId: user.groupId,
    },
    sessionId,
    messages: parsed.data.messages,
    signal: request.signal,
    context: {
      name: user.displayName,
      cefr: userDoc?.onboarding?.selfAssessedLevel,
      professionalTrack: userDoc?.onboarding?.professionalTrack,
      targetSkills: userDoc?.onboarding?.targetSkills,
      strengths,
      weaknesses,
      currentLesson: parsed.data.lessonContext,
      currentTopic: parsed.data.topic,
      explanationLanguage: user.locale === 'en' ? 'en' : 'uz',
    },
  })

  if (!result.ok) {
    const status = result.code === 'quota_exceeded' ? 429 : 503
    return NextResponse.json({ error: result.error, code: result.code }, { status })
  }

  const response = result.data.toTextStreamResponse()
  if (sessionId) response.headers.set('X-Session-Id', sessionId)
  return response
}
