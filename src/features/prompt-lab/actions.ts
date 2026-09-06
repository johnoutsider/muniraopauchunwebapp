'use server'

import { adminDb } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL, PROMPT_LEVELS, type PromptLevel } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult } from '@/types'

import { EMPTY_PROGRESS, type PromptLabProgress } from './types'

function isLevel(value: unknown): value is PromptLevel {
  return typeof value === 'string' && (PROMPT_LEVELS as readonly string[]).includes(value)
}

function levelIndex(level: PromptLevel): number {
  return PROMPT_LEVELS.indexOf(level)
}

async function readProgress(uid: string): Promise<PromptLabProgress> {
  const snap = await adminDb().collection(COL.users).doc(uid).get()
  const raw = (snap.data() as { promptLab?: Partial<PromptLabProgress> } | undefined)?.promptLab
  return {
    ...EMPTY_PROGRESS,
    ...(raw ?? {}),
    level: isLevel(raw?.level) ? raw.level : 'simple',
    completed: Array.isArray(raw?.completed) ? raw.completed : [],
    bestScores: raw?.bestScores ?? {},
    verified: Array.isArray(raw?.verified) ? raw.verified : [],
    simpleCorrect: typeof raw?.simpleCorrect === 'number' ? raw.simpleCorrect : 0,
    attempts: typeof raw?.attempts === 'number' ? raw.attempts : 0,
  }
}

/**
 * Mashq natijasini saqlaydi (PLAN 8.15): eng yaxshi ball, bajarilganlar ro'yxati
 * va AI tavsiya qilgan keyingi skafolding darajasi.
 * Daraja faqat OLDINGA suriladi — talaba past darajaga qaytarilmaydi.
 */
export async function recordPromptAttempt(input: {
  exerciseId: string
  level: PromptLevel
  totalScore: number
  nextLevel: PromptLevel
}): Promise<ActionResult<PromptLabProgress>> {
  const user = await requireStudent()

  if (!input.exerciseId || !isLevel(input.level) || !isLevel(input.nextLevel)) {
    return { ok: false, error: 'Ma’lumot noto‘g‘ri.', code: 'bad_input' }
  }

  const score = Math.max(0, Math.min(25, Math.round(input.totalScore)))

  try {
    const current = await readProgress(user.uid)

    const bestScores = { ...current.bestScores }
    bestScores[input.exerciseId] = Math.max(bestScores[input.exerciseId] ?? 0, score)

    const completed = current.completed.includes(input.exerciseId)
      ? current.completed
      : [...current.completed, input.exerciseId]

    // Yangi daraja: mavjud daraja va tavsiya etilganning kattarog'i
    const level =
      levelIndex(input.nextLevel) > levelIndex(current.level) ? input.nextLevel : current.level

    const next: PromptLabProgress = {
      ...current,
      level,
      completed: completed.slice(-200),
      bestScores,
      attempts: current.attempts + 1,
      updatedAt: Date.now(),
    }

    await adminDb().collection(COL.users).doc(user.uid).set({ promptLab: next }, { merge: true })

    return { ok: true, data: next }
  } catch (err) {
    console.error('[prompt-lab] recordPromptAttempt failed', err)
    return { ok: false, error: 'Natijani saqlab bo‘lmadi.', code: 'internal' }
  }
}

/** AI javobini tekshirish mashqining natijasi (AI literacy ko'rsatkichi). */
export async function recordVerification(input: {
  exerciseId: string
  correct: boolean
}): Promise<ActionResult<PromptLabProgress>> {
  const user = await requireStudent()
  if (!input.exerciseId) return { ok: false, error: 'Mashq aniqlanmadi.', code: 'bad_input' }

  try {
    const current = await readProgress(user.uid)
    const verified =
      input.correct && !current.verified.includes(input.exerciseId)
        ? [...current.verified, input.exerciseId]
        : current.verified

    const next: PromptLabProgress = {
      ...current,
      verified: verified.slice(-200),
      updatedAt: Date.now(),
    }
    await adminDb().collection(COL.users).doc(user.uid).set({ promptLab: next }, { merge: true })

    await logEvent(user, 'prompt_practice', {
      kind: 'ai_output_verification',
      exerciseId: input.exerciseId,
      correct: input.correct,
    })

    return { ok: true, data: next }
  } catch (err) {
    console.error('[prompt-lab] recordVerification failed', err)
    return { ok: false, error: 'Natijani saqlab bo‘lmadi.', code: 'internal' }
  }
}

/** «Simple» darajadagi tanlov mashqi (AI chaqiruvisiz — arzon va tez). */
export async function recordSimpleChoice(input: {
  exerciseId: string
  correct: boolean
}): Promise<ActionResult<PromptLabProgress>> {
  const user = await requireStudent()
  if (!input.exerciseId) return { ok: false, error: 'Mashq aniqlanmadi.', code: 'bad_input' }

  try {
    const current = await readProgress(user.uid)

    const isNew = input.correct && !current.completed.includes(input.exerciseId)
    const completed = isNew ? [...current.completed, input.exerciseId] : current.completed
    const simpleCorrect = current.simpleCorrect + (isNew ? 1 : 0)

    // Uchta «oddiy» mashq to'g'ri bajarilsa — «shablon bilan» darajasi ochiladi
    const level: PromptLevel =
      current.level === 'simple' && simpleCorrect >= 3 ? 'guided' : current.level

    const next: PromptLabProgress = {
      ...current,
      completed: completed.slice(-200),
      simpleCorrect,
      level,
      attempts: current.attempts + 1,
      updatedAt: Date.now(),
    }

    await adminDb().collection(COL.users).doc(user.uid).set({ promptLab: next }, { merge: true })

    await logEvent(user, 'prompt_practice', {
      kind: 'simple_choice',
      exerciseId: input.exerciseId,
      correct: input.correct,
      level: next.level,
      simpleCorrect: next.simpleCorrect,
    })

    return { ok: true, data: next }
  } catch (err) {
    console.error('[prompt-lab] recordSimpleChoice failed', err)
    return { ok: false, error: 'Natijani saqlab bo‘lmadi.', code: 'internal' }
  }
}
