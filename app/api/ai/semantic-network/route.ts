import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, analyticsUser, guardRoute } from '@/features/shared/api-helpers'
import { generateSemanticNetwork } from '@/ai/services/vocabulary'
import { getUserDoc } from '@/features/shared/queries'
import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { CEFR_LEVELS, COL, DOMAINS } from '@/config/constants'
import type { SemanticNetworkDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 90

const Schema = z.object({
  seedWord: z.string().min(1).max(80),
  domain: z.enum(DOMAINS).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
  size: z.number().int().min(4).max(20).optional(),
})

/**
 * Semantik tarmoq (PLAN 8.1): inflation → prices → purchasing power …
 * Natija `semanticNetworks` ga `approved: false` bilan yoziladi —
 * o'qituvchi tasdiqlagunicha kontent bankiga tushmaydi (human-in-the-loop, PLAN 1.5).
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'semanticNetwork' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const userDoc = await getUserDoc(user.uid)
  const domain = body.domain ?? userDoc?.onboarding?.professionalTrack ?? 'economics'

  const result = await generateSemanticNetwork({
    seedWord: body.seedWord,
    domain,
    size: body.size,
    cefr: body.cefr ?? userDoc?.onboarding?.selfAssessedLevel ?? 'B1',
    user: analyticsUser(user),
    signal: request.signal,
  })

  if (!result.ok) return aiResponse(result)

  const doc: Omit<SemanticNetworkDoc, 'createdAt'> & { createdAt: FirebaseFirestore.FieldValue } = {
    seedWord: body.seedWord.trim(),
    domain,
    nodes: result.data.nodes,
    edges: result.data.edges,
    generatedBy: 'ai',
    approved: false,
    createdAt: FieldValue.serverTimestamp(),
  }

  let networkId: string | null = null
  try {
    const ref = await adminDb().collection(COL.semanticNetworks).add(doc)
    networkId = ref.id
  } catch (err) {
    // Saqlash muvaffaqiyatsiz bo'lsa ham talaba tarmoqni ko'rishi kerak
    console.error('[api/semantic-network] persist failed', err)
  }

  return NextResponse.json({ ...result.data, id: networkId, approved: false })
}
