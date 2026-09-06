'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL, XP } from '@/config/constants'
import { awardXp, bumpDailyStats, logEvent, touchStreak } from '@/lib/analytics/events'
import { getLearningPath, markStepDone } from '@/lib/adaptive'
import type { ActionResult, LessonDoc } from '@/types'

import { LESSON_PROGRESS } from './queries'

function cleanId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 128) return null
  return trimmed
}

/** Dars ochilganini qayd etish (PLAN 4.4 — `lesson_view`). */
export async function logLessonViewAction(lessonId: string): Promise<ActionResult> {
  const user = await requireStudent()
  const id = cleanId(lessonId)
  if (!id) return { ok: false, error: 'Dars identifikatori noto‘g‘ri.' }

  const snap = await adminDb().collection(COL.lessons).doc(id).get()
  if (!snap.exists) return { ok: false, error: 'Dars topilmadi.' }
  const lesson = snap.data() as LessonDoc

  await Promise.all([
    logEvent(user, 'lesson_view', { lessonId: id, moduleId: lesson.moduleId }),
    adminDb()
      .collection(COL.users)
      .doc(user.uid)
      .collection(LESSON_PROGRESS)
      .doc(id)
      .set(
        {
          lessonId: id,
          moduleId: lesson.moduleId,
          courseId: lesson.courseId,
          status: 'in_progress',
          startedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
  ])

  return { ok: true, data: undefined }
}

export interface CompleteLessonInput {
  lessonId: string
  /** Darsda o'tkazilgan vaqt (ms) — kunlik statistikaga qo'shiladi. */
  timeMs?: number
}

/**
 * «Darsni yakunlash»: progress yoziladi, XP beriladi, event loglanadi va
 * mos o'quv yo'li qadami bajarilgan deb belgilanadi (PLAN 5, 4-bosqich).
 */
export async function completeLessonAction(
  input: CompleteLessonInput
): Promise<ActionResult<{ xp: number; streak: number; stepDone: boolean }>> {
  const user = await requireStudent()
  const id = cleanId(input?.lessonId)
  if (!id) return { ok: false, error: 'Dars identifikatori noto‘g‘ri.' }

  const timeMs =
    typeof input?.timeMs === 'number' && Number.isFinite(input.timeMs)
      ? Math.min(4 * 3_600_000, Math.max(0, Math.round(input.timeMs)))
      : 0

  const db = adminDb()
  const lessonSnap = await db.collection(COL.lessons).doc(id).get()
  if (!lessonSnap.exists) return { ok: false, error: 'Dars topilmadi.' }
  const lesson = lessonSnap.data() as LessonDoc
  if (!lesson.published) return { ok: false, error: 'Bu dars hali nashr qilinmagan.' }

  const progressRef = db.collection(COL.users).doc(user.uid).collection(LESSON_PROGRESS).doc(id)
  const existing = await progressRef.get()
  const alreadyDone = (existing.data() as { status?: string } | undefined)?.status === 'done'

  await progressRef.set(
    {
      lessonId: id,
      moduleId: lesson.moduleId,
      courseId: lesson.courseId,
      status: 'done',
      timeMs,
      completedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  // Yo'nalishdagi mos qadam
  let stepDone = false
  try {
    const path = await getLearningPath(user.uid)
    const step = path?.steps?.find((entry) => entry.kind === 'lesson' && entry.refId === id)
    if (step && step.status !== 'done') {
      await markStepDone(user.uid, step.id)
      stepDone = true
    }
  } catch {
    // Yo'nalish yo'q bo'lsa — dars baribir yakunlangan hisoblanadi
  }

  const xp = alreadyDone ? 0 : XP.LESSON_COMPLETE

  const [streak] = await Promise.all([
    touchStreak(user.uid),
    logEvent(user, 'lesson_complete', {
      lessonId: id,
      moduleId: lesson.moduleId,
      courseId: lesson.courseId,
      timeMs,
      repeat: alreadyDone,
      stepDone,
    }),
    alreadyDone
      ? Promise.resolve()
      : bumpDailyStats(user, {
          lessonsDone: 1,
          timeOnTaskMin: Math.min(180, timeMs / 60000),
        }),
  ])

  if (xp) await awardXp(user, xp, 'lesson_complete', id)

  revalidatePath('/student/learn')
  revalidatePath(`/student/learn/${id}`)
  revalidatePath('/student/path')
  revalidatePath('/student/dashboard')

  return { ok: true, data: { xp, streak: streak.current, stepDone } }
}
