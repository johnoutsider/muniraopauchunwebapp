/**
 * Learning Path qadamlariga o'zbekcha izoh (PLAN 6.7).
 * Qadamlarni qoidalar dvigateli tanlaydi — AI faqat `reason` matnini yozadi.
 */

import { z } from 'zod'

import { Text } from './common'

export const PathReasonSchema = z.object({
  stepId: Text(80),
  reason: Text(300).describe('One Uzbek sentence, max 18 words, tied to the learner profile'),
})
export type PathReason = z.infer<typeof PathReasonSchema>

export const PathReasonsSchema = z.object({
  reasons: z.array(PathReasonSchema).min(1).max(30),
  note: Text(400).optional().describe('One optional Uzbek sentence about the path as a whole'),
})
export type PathReasons = z.infer<typeof PathReasonsSchema>
