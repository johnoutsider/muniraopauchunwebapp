import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { gradeOpenAnswer, type GradableItem } from '@/ai/services/grading'
import { adminDb } from '@/lib/firebase/admin'
import { CEFR_LEVELS, COL, DOMAINS, ITEM_TYPES, SKILLS } from '@/config/constants'
import type { ItemDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const InlineItemSchema = z.object({
  type: z.enum(ITEM_TYPES),
  skill: z.enum(SKILLS),
  topic: z.string().max(120),
  domain: z.enum(DOMAINS),
  cefr: z.enum(CEFR_LEVELS),
  difficulty: z.number().int().min(1).max(5),
  stem: z.string().max(1200),
  instruction: z.string().max(300).optional(),
  answerKey: z.array(z.string().max(400)).max(20),
})

const Schema = z
  .object({
    itemId: z.string().max(60).optional(),
    item: InlineItemSchema.optional(),
    answer: z.string().min(1).max(1000),
    cefr: z.enum(CEFR_LEVELS).optional(),
  })
  .refine((value) => Boolean(value.itemId || value.item), {
    message: 'itemId yoki item kerak',
  })

/**
 * Ochiq javoblarni AI bilan baholash (PLAN 6, 8.2) — mashq runneri chaqiradi.
 * Nazorat guruhida `aiFeedback` o'chirilgan: runner deterministik zaxira
 * baholashga tushadi (`features/practice/actions.ts`).
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiFeedback' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx

  let item: GradableItem | null = body.item ?? null

  if (!item && body.itemId) {
    const snap = await adminDb().collection(COL.items).doc(body.itemId).get()
    const doc = snap.data() as ItemDoc | undefined
    if (!snap.exists || !doc) {
      return NextResponse.json({ error: 'Mashq topilmadi.' }, { status: 404 })
    }
    item = {
      type: doc.type,
      skill: doc.skill,
      topic: doc.topic,
      domain: doc.domain,
      cefr: doc.cefr,
      difficulty: doc.difficulty,
      stem: doc.stem,
      instruction: doc.instruction,
      answerKey: doc.answerKey ?? [],
      explanation: doc.explanation,
    }
  }

  if (!item) {
    return NextResponse.json({ error: 'Mashq ma’lumoti yetarli emas.' }, { status: 400 })
  }

  const result = await gradeOpenAnswer({
    item,
    answer: body.answer,
    cefr: body.cefr,
    user: analyticsUser(user),
    signal: request.signal,
  })

  return aiResponse(result)
}
