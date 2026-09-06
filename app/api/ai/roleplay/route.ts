import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { createRolePlaySession, finishRolePlay, streamRolePlay } from '@/ai/services/roleplay'
import { getScenario, getUserDoc } from '@/features/shared/queries'
import { AI_PERSONAS, CEFR_LEVELS } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 120

const Schema = z.object({
  sessionId: z.string().max(60).optional(),
  persona: z.enum(AI_PERSONAS),
  scenarioId: z.string().max(60).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(6000) }))
    .max(60)
    .default([]),
  /** `true` bo'lsa — sessiya ochiladi va personaning ochilish gapi qaytariladi. */
  start: z.boolean().optional(),
  /** `true` bo'lsa — rol o'yini tugadi, yakuniy feedback qaytariladi. */
  finish: z.boolean().optional(),
})

/**
 * AI Speaking Partner — role-play (PLAN 8.6, 5-bo'lim 6-bosqich).
 * Oddiy holatda javob oqim (text stream) sifatida qaytadi;
 * `finish: true` da esa oqimsiz yakuniy feedback (JSON) qaytadi.
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiRolePlay' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx

  const [userDoc, scenarioDoc] = await Promise.all([
    getUserDoc(user.uid),
    body.scenarioId ? getScenario(body.scenarioId) : Promise.resolve(null),
  ])

  const cefr = body.cefr ?? userDoc?.onboarding?.selfAssessedLevel ?? 'B1'
  const scenario = scenarioDoc
    ? {
        title: scenarioDoc.title,
        context: scenarioDoc.context,
        goals: scenarioDoc.goals,
        successCriteria: scenarioDoc.successCriteria,
        openingLine: scenarioDoc.openingLine,
        domain: scenarioDoc.domain,
      }
    : undefined

  const analytics = analyticsUser(user)

  /* --- Sessiyani ochish -------------------------------------------- */
  if (body.start) {
    const created = await createRolePlaySession(analytics, {
      persona: body.persona,
      scenario,
      scenarioId: body.scenarioId,
      cefr,
    })
    if (!created.ok) return aiResponse(created)
    return NextResponse.json({
      sessionId: created.data.sessionId,
      opening: created.data.opening,
      cefr,
    })
  }

  /* --- Yakuniy feedback ------------------------------------------- */
  if (body.finish) {
    const result = await finishRolePlay({
      user: analytics,
      sessionId: body.sessionId,
      persona: body.persona,
      scenario,
      messages: body.messages,
      cefr,
      signal: request.signal,
    })
    if (!result.ok) return aiResponse(result)
    return NextResponse.json({ feedback: result.data, sessionId: body.sessionId ?? null })
  }

  if (body.messages.length === 0) {
    return NextResponse.json({ error: 'Xabar bo‘sh.' }, { status: 400 })
  }

  /* --- Sessiya ----------------------------------------------------- */
  let sessionId = body.sessionId
  if (!sessionId) {
    const created = await createRolePlaySession(analytics, {
      persona: body.persona,
      scenario,
      scenarioId: body.scenarioId,
      cefr,
    })
    if (created.ok) sessionId = created.data.sessionId
  }

  /* --- Oqim -------------------------------------------------------- */
  const result = await streamRolePlay({
    user: analytics,
    sessionId,
    persona: body.persona,
    scenario,
    scenarioId: body.scenarioId,
    messages: body.messages,
    cefr,
    signal: request.signal,
  })

  if (!result.ok) return aiResponse(result)

  const response = result.data.toTextStreamResponse()
  if (sessionId) response.headers.set('X-Session-Id', sessionId)
  return response
}
