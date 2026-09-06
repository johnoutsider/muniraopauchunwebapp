import { NextResponse } from 'next/server'
import { z } from 'zod'

import { adminDb } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { COL } from '@/config/constants'

export const runtime = 'nodejs'

const Schema = z.object({ ids: z.array(z.string().max(60)).max(50).optional() })

/** Bildirishnomalarni o'qilgan deb belgilash. */
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Avtorizatsiya talab qilinadi.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const parsed = Schema.safeParse(body)
  const ids = parsed.success ? parsed.data.ids : undefined

  const db = adminDb()
  const col = db.collection(COL.notifications).doc(user.uid).collection('items')

  const snap = ids?.length
    ? await db.getAll(...ids.map((id) => col.doc(id)))
    : (await col.where('read', '==', false).limit(50).get()).docs

  const batch = db.batch()
  let count = 0
  for (const doc of snap) {
    if (!doc.exists) continue
    batch.set(doc.ref, { read: true }, { merge: true })
    count += 1
  }
  if (count) await batch.commit()

  return NextResponse.json({ ok: true, updated: count })
}
