import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { getUserDoc } from '@/features/shared/queries'
import { COL, PROMPT_LEVELS, type CefrLevel, type PromptLevel } from '@/config/constants'
import type { PromptExerciseDoc, SessionUser } from '@/types'

import { BUILTIN_EXERCISES, type PromptExerciseItem } from './content'
import { EMPTY_PROGRESS, type PromptLabData, type PromptLabProgress } from './types'

function isLevel(value: unknown): value is PromptLevel {
  return typeof value === 'string' && (PROMPT_LEVELS as readonly string[]).includes(value)
}

/** `promptExercises` kolleksiyasi + platforma zaxira mashqlari. */
export const listPromptExercises = cache(async (): Promise<PromptExerciseItem[]> => {
  let fromDb: PromptExerciseItem[] = []
  try {
    const snap = await adminDb().collection(COL.promptExercises).orderBy('order', 'asc').get()
    fromDb = snap.docs
      .map((doc) => {
        const data = doc.data() as PromptExerciseDoc
        return {
          id: doc.id,
          level: data.level,
          task: data.task,
          badPromptExample: data.badPromptExample,
          goodPromptExample: data.goodPromptExample,
          rubric: data.rubric ?? [],
          hints: data.hints ?? [],
          order: data.order ?? 0,
        } satisfies PromptExerciseItem
      })
      .filter((item) => isLevel(item.level) && Boolean(item.task))
  } catch (err) {
    console.error('[prompt-lab] listPromptExercises failed', err)
  }

  const merged = [...fromDb, ...BUILTIN_EXERCISES]
  return merged.sort((a, b) => a.order - b.order)
})

/** Talabaning darajalar bo'yicha holati (`users/{uid}.promptLab`). */
export const getPromptProgress = cache(async (uid: string): Promise<PromptLabProgress> => {
  try {
    const snap = await adminDb().collection(COL.users).doc(uid).get()
    const raw = (snap.data() as { promptLab?: Partial<PromptLabProgress> } | undefined)?.promptLab
    if (!raw) return { ...EMPTY_PROGRESS }
    return {
      level: isLevel(raw.level) ? raw.level : 'simple',
      completed: Array.isArray(raw.completed) ? raw.completed.slice(0, 200) : [],
      bestScores: raw.bestScores ?? {},
      verified: Array.isArray(raw.verified) ? raw.verified.slice(0, 200) : [],
      simpleCorrect: typeof raw.simpleCorrect === 'number' ? raw.simpleCorrect : 0,
      attempts: typeof raw.attempts === 'number' ? raw.attempts : 0,
      updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    }
  } catch (err) {
    console.error('[prompt-lab] getPromptProgress failed', err)
    return { ...EMPTY_PROGRESS }
  }
})

export const getPromptLabData = cache(async (user: SessionUser): Promise<PromptLabData> => {
  const [exercises, progress, userDoc] = await Promise.all([
    listPromptExercises(),
    getPromptProgress(user.uid),
    getUserDoc(user.uid),
  ])

  const cefr: CefrLevel = userDoc?.onboarding?.selfAssessedLevel ?? 'B1'
  return { exercises, progress, cefr }
})
