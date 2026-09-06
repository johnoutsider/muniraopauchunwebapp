'use server'

import { requireStudent } from '@/lib/firebase/session'
import type { ActionResult } from '@/types'

import { listTaskAttempts } from './queries'
import type { AttemptSummary } from './types'

/** Tanlangan topshiriq bo'yicha urinishlar tarixi (trend chizig'i uchun). */
export async function fetchTaskAttempts(
  taskId: string
): Promise<ActionResult<{ attempts: AttemptSummary[] }>> {
  const user = await requireStudent()
  if (!taskId) return { ok: false, error: 'Topshiriq aniqlanmadi.', code: 'bad_input' }

  try {
    const attempts = await listTaskAttempts(user.uid, taskId)
    return { ok: true, data: { attempts } }
  } catch (err) {
    console.error('[speaking] fetchTaskAttempts failed', err)
    return { ok: false, error: 'Urinishlar tarixini yuklab bo‘lmadi.', code: 'internal' }
  }
}
