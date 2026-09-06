import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { reviewWriting } from '@/ai/services/writing'
import { CEFR_LEVELS } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 120

const Schema = z.object({
  text: z.string().min(20).max(8000),
  genre: z.enum(['email', 'report', 'summary', 'memo', 'case_solution', 'essay']),
  cefr: z.enum(CEFR_LEVELS),
  taskPrompt: z.string().max(1000),
  knownWeaknesses: z.array(z.string().max(60)).max(10).optional(),
  draftNo: z.number().int().min(1).max(20).optional(),
})

/** Write → AI Feedback → Revise → Submit (PLAN 8.5). */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiFeedback' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const result = await reviewWriting({
    ...body,
    user: analyticsUser(user),
    signal: request.signal,
  })
  return aiResponse(result)
}
