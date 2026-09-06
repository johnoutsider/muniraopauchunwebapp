import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { generateExercises } from '@/ai/services/exercises'
import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { AI_LIMITS, CEFR_LEVELS, COL, DOMAINS, ITEM_TYPES, SKILLS } from '@/config/constants'

export const runtime = 'nodejs'
export const maxDuration = 180

const Schema = z.object({
  skill: z.enum(SKILLS),
  topic: z.string().min(1).max(120),
  domain: z.enum(DOMAINS),
  cefr: z.enum(CEFR_LEVELS),
  difficulty: z.number().int().min(1).max(5),
  count: z.number().int().min(1).max(AI_LIMITS.GENERATION_MAX_ITEMS),
  types: z.array(z.enum(ITEM_TYPES)).max(6).optional(),
  extraInstruction: z.string().max(500).optional(),
  /** `false` bo'lsa itemlar saqlanmaydi (oldindan ko'rish). */
  persist: z.boolean().optional(),
})

/**
 * AI mashq generatsiyasi (PLAN 8.2, 14).
 * Faqat o'qituvchi va admin uchun. Natija DOIM `status: 'draft'` sifatida
 * `items` ga yoziladi — o'qituvchi tasdiqlagandan keyingina item bankka tushadi.
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, roles: ['teacher', 'admin'] })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx

  const result = await generateExercises({
    skill: body.skill,
    topic: body.topic,
    domain: body.domain,
    cefr: body.cefr,
    difficulty: body.difficulty,
    count: body.count,
    types: body.types,
    extraInstruction: body.extraInstruction,
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (!result.ok) return aiResponse(result)

  if (body.persist === false) {
    return NextResponse.json({ items: result.data.map((item) => ({ ...item, id: null })) })
  }

  const db = adminDb()
  const batch = db.batch()
  const ids: string[] = []

  for (const item of result.data) {
    const ref = db.collection(COL.items).doc()
    ids.push(ref.id)
    batch.set(ref, {
      ...item,
      createdBy: user.uid,
      stats: { attempts: 0, correct: 0 },
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  try {
    await batch.commit()
  } catch (err) {
    console.error('[api/generate-items] persist failed', err)
    return NextResponse.json(
      { error: 'Mashqlar yaratildi, lekin saqlab bo‘lmadi. Qaytadan urinib ko‘ring.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    items: result.data.map((item, index) => ({ ...item, id: ids[index] })),
    saved: ids.length,
    status: 'draft',
  })
}
