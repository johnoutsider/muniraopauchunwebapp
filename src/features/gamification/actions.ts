'use server'

import { revalidatePath } from 'next/cache'

import { adminDb } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import type { ActionResult } from '@/types'

/**
 * Guruh reytingida ishtirok — IXTIYORIY (PLAN 8.12, 9.4).
 * O'chirilganda talabaning bali boshqalarga umuman ko'rsatilmaydi.
 */
export async function setLeaderboardOptInAction(
  optIn: boolean
): Promise<ActionResult<{ optIn: boolean }>> {
  const user = await requireStudent()
  if (typeof optIn !== 'boolean') return { ok: false, error: 'Qiymat noto‘g‘ri.' }

  await adminDb()
    .collection(COL.users)
    .doc(user.uid)
    .set({ leaderboardOptIn: optIn }, { merge: true })

  revalidatePath('/student/achievements')
  revalidatePath('/student/settings')
  return { ok: true, data: { optIn } }
}
