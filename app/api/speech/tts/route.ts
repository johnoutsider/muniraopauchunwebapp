import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getSessionUser } from '@/lib/firebase/session'
import { getOrCreateTts } from '@/lib/speech/tts-cache'

export const runtime = 'nodejs'
export const maxDuration = 30

const BodySchema = z.object({
  text: z.string().min(1).max(600),
  voice: z.string().max(60).optional(),
  style: z.string().max(40).optional(),
  rate: z.string().max(20).optional(),
})

/**
 * Talaffuz namunasi (TTS). Natija Storage'da keshlanadi —
 * bir so'z butun platforma uchun bir marta sintez qilinadi (PLAN 8.3, 16).
 */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri.' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Matn noto‘g‘ri yoki juda uzun.' }, { status: 400 })
  }

  try {
    const result = await getOrCreateTts(parsed.data.text, parsed.data.voice, {
      style: parsed.data.style,
      rate: parsed.data.rate,
    })
    return NextResponse.json({ url: result.url, cached: result.cached })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audio yaratib bo‘lmadi.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
