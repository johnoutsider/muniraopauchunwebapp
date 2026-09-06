'use server'

import { revalidatePath } from 'next/cache'

import { adminDb } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import type { ActionResult } from '@/types'

import { DEFAULT_PREFERENCES, GOAL_LIMITS, type StudentPreferences } from './preferences'

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Kunlik maqsad va bildirishnoma sozlamalarini saqlash. */
export async function updatePreferencesAction(
  input: Partial<StudentPreferences>
): Promise<ActionResult<StudentPreferences>> {
  const user = await requireStudent()

  const rawGoal = Number(input?.dailyGoalXp)
  if (
    input?.dailyGoalXp !== undefined &&
    (!Number.isFinite(rawGoal) || rawGoal < GOAL_LIMITS.min || rawGoal > GOAL_LIMITS.max)
  ) {
    return {
      ok: false,
      error: `Kunlik maqsad ${GOAL_LIMITS.min} dan ${GOAL_LIMITS.max} XP gacha bo‘lishi kerak.`,
    }
  }

  const preferences: StudentPreferences = {
    dailyGoalXp:
      input?.dailyGoalXp !== undefined
        ? Math.round(rawGoal / 10) * 10
        : DEFAULT_PREFERENCES.dailyGoalXp,
    notifications: {
      reminders: bool(input?.notifications?.reminders, DEFAULT_PREFERENCES.notifications.reminders),
      feedback: bool(input?.notifications?.feedback, DEFAULT_PREFERENCES.notifications.feedback),
      assignments: bool(
        input?.notifications?.assignments,
        DEFAULT_PREFERENCES.notifications.assignments
      ),
      leaderboard: bool(
        input?.notifications?.leaderboard,
        DEFAULT_PREFERENCES.notifications.leaderboard
      ),
    },
  }

  await adminDb().collection(COL.users).doc(user.uid).set({ preferences }, { merge: true })

  revalidatePath('/student/settings')
  revalidatePath('/student/dashboard')
  return { ok: true, data: preferences }
}
