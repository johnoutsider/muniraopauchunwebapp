import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { generateVocabCard } from '@/ai/services/vocabulary'
import { getUserDoc } from '@/features/shared/queries'
import { CEFR_LEVELS, DOMAINS } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'

export const runtime = 'nodejs'
export const maxDuration = 60

const Schema = z.object({
  word: z.string().min(1).max(80),
  domain: z.enum(DOMAINS).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
})

/** 6 bosqichli so'z kartasi (PLAN 8.1): so'z → ma'no → kollokatsiya → kontekst → kasbiy vaziyat → topshiriq. */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiTutor' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const userDoc = await getUserDoc(user.uid)

  const result = await generateVocabCard({
    word: body.word,
    domain: body.domain ?? userDoc?.onboarding?.professionalTrack ?? 'economics',
    cefr: body.cefr ?? userDoc?.onboarding?.selfAssessedLevel ?? 'B1',
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (result.ok) {
    await logEvent(user, 'vocab_review', { word: body.word, source: 'ai_card' })
  }
  return aiResponse(result)
}
