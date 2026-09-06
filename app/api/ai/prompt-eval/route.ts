import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { evaluatePrompt } from '@/ai/services/prompt-lab'
import { CEFR_LEVELS, PROMPT_LEVELS } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'

export const runtime = 'nodejs'
export const maxDuration = 60

const Schema = z.object({
  prompt: z.string().min(3).max(2000),
  level: z.enum(PROMPT_LEVELS),
  cefr: z.enum(CEFR_LEVELS).optional(),
  exercise: z.object({
    id: z.string().optional(),
    task: z.string().max(1000),
    badPromptExample: z.string().max(500).optional(),
    goodPromptExample: z.string().max(500).optional(),
    rubric: z.array(z.string().max(200)).max(10).optional(),
  }),
})

/** Prompt Practice Lab: Simple → Guided → Independent (PLAN 8.15). */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'promptLab' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const result = await evaluatePrompt({
    prompt: body.prompt,
    level: body.level,
    cefr: body.cefr,
    exercise: { ...body.exercise, level: body.level },
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (result.ok) {
    await logEvent(user, 'prompt_practice', {
      level: body.level,
      exerciseId: body.exercise.id ?? null,
      totalScore: result.data.totalScore,
      nextLevel: result.data.nextLevel,
    })
  }
  return aiResponse(result)
}
