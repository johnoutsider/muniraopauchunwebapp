'use server'

import { revalidatePath } from 'next/cache'

import { requireStudent } from '@/lib/firebase/session'
import { regeneratePath, markStepDone } from '@/lib/adaptive'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult } from '@/types'

const REASONS = {
  manual: 'Talaba so‘rovi bo‘yicha qayta tuzildi',
  diagnostic: 'Yangi diagnostika natijasi asosida qayta tuzildi',
  goal_changed: 'Maqsad o‘zgargani uchun qayta tuzildi',
} as const

export type RegenerateReason = keyof typeof REASONS

/**
 * Individual o'quv yo'lini qayta generatsiya qilish (PLAN 6.7).
 * Diagnostika profili + onboarding maqsadi + tasdiqlangan kontent katalogi.
 */
export async function regeneratePathAction(
  reason: RegenerateReason = 'manual'
): Promise<ActionResult<{ steps: number; version: number; created: boolean }>> {
  const user = await requireStudent()

  const note = REASONS[reason] ?? REASONS.manual

  try {
    const result = await regeneratePath(user.uid, note)

    if (!result.path.steps.length) {
      return {
        ok: false,
        error:
          'Yo‘nalish tuzilmadi: hali tasdiqlangan dars yoki diagnostika natijasi yo‘q. Avval diagnostikadan o‘ting.',
        code: 'empty_path',
      }
    }

    await logEvent(user, 'path_generated', {
      reason,
      note,
      version: result.path.version,
      steps: result.path.steps.length,
      track: result.path.professionalTrack,
    })

    revalidatePath('/student/path')
    revalidatePath('/student/dashboard')

    return {
      ok: true,
      data: {
        steps: result.path.steps.length,
        version: result.path.version,
        created: result.created,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Yo‘nalishni yangilashda xatolik'
    return { ok: false, error: message }
  }
}

/** Qadamni bajarilgan deb belgilash (dars/mashq tugagach ham chaqiriladi). */
export async function completePathStepAction(stepId: string): Promise<ActionResult> {
  const user = await requireStudent()
  const id = typeof stepId === 'string' ? stepId.trim() : ''
  if (!id || id.length > 200) return { ok: false, error: 'Qadam identifikatori noto‘g‘ri.' }

  try {
    await markStepDone(user.uid, id)
    revalidatePath('/student/path')
    revalidatePath('/student/dashboard')
    return { ok: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Qadamni belgilashda xatolik'
    return { ok: false, error: message }
  }
}
