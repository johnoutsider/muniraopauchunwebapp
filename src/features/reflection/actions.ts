'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { COL, STAGES, XP, type Stage } from '@/config/constants'
import { awardXp, logEvent } from '@/lib/analytics/events'
import type { ActionResult, ReflectionDoc } from '@/types'

/**
 * Refleksiya kundaligi (PLAN 5 — 1 va 8-bosqichlar, 8.14).
 *
 * Metodikaning uchta savoli o'zgarmaydi:
 *   1) Nimani yaxshi bajardim?
 *   2) Qaysi xatolarni takrorladim?
 *   3) Keyingi safar nimani yaxshilayman?
 * Ular + 1–5 kayfiyat `reflections` kolleksiyasiga yoziladi va ilmiy
 * tahlilda o'z-o'zini baholash (self-assessment) manbai bo'lib xizmat qiladi.
 */

const MAX_ANSWER_LENGTH = 2000
const MAX_COMMENT_LENGTH = 2000

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_ANSWER_LENGTH) : ''
}

interface ReflectionInput {
  didWell: string
  repeatedMistakes: string
  improveNext: string
  mood: number
  stage?: number
  contextId?: string
}

export async function createReflectionAction(
  input: ReflectionInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireStudent()

  const answers = {
    didWell: clean(input.didWell),
    repeatedMistakes: clean(input.repeatedMistakes),
    improveNext: clean(input.improveNext),
  }

  if (!answers.didWell && !answers.repeatedMistakes && !answers.improveNext) {
    return fail('Kamida bitta savolga javob yozing.', 'empty')
  }

  const moodValue = Math.round(Number(input.mood))
  if (!Number.isFinite(moodValue) || moodValue < 1 || moodValue > 5) {
    return fail('Kayfiyatni 1 dan 5 gacha tanlang.', 'mood')
  }

  const stageValue = Number(input.stage)
  const stage: Stage = (STAGES as readonly number[]).includes(stageValue)
    ? (stageValue as Stage)
    : 8

  const doc: ReflectionDoc = {
    uid: user.uid,
    stage,
    contextId: input.contextId ? String(input.contextId).slice(0, 200) : undefined,
    answers,
    mood: moodValue as ReflectionDoc['mood'],
    ts: FieldValue.serverTimestamp() as unknown as ReflectionDoc['ts'],
  }

  const ref = await adminDb().collection(COL.reflections).add(doc)

  await Promise.all([
    logEvent(user, 'reflection', {
      reflectionId: ref.id,
      stage,
      mood: moodValue,
      wordCounts: {
        didWell: answers.didWell.split(/\s+/).filter(Boolean).length,
        repeatedMistakes: answers.repeatedMistakes.split(/\s+/).filter(Boolean).length,
        improveNext: answers.improveNext.split(/\s+/).filter(Boolean).length,
      },
    }),
    awardXp(user, XP.REFLECTION, 'reflection', ref.id),
  ])

  revalidatePath('/student/reflection')
  revalidatePath('/student/dashboard')

  return { ok: true, data: { id: ref.id } }
}

/**
 * AI qisqa izohini yozuvga qo'shish.
 * Nazorat guruhida `aiFeedback` o'chirilgani uchun bu action hech qachon
 * muvaffaqiyatli tugamaydi — AI matni ularning hujjatlariga tushmaydi (PLAN 1.5).
 */
export async function saveReflectionCommentAction(
  reflectionId: string,
  comment: string
): Promise<ActionResult<null>> {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  if (!flags.aiFeedback) return fail('Bu imkoniyat guruhingiz uchun yoqilmagan.', 'flag_off')

  const text = typeof comment === 'string' ? comment.trim().slice(0, MAX_COMMENT_LENGTH) : ''
  if (!text) return fail('Izoh bo‘sh.', 'empty')

  const ref = adminDb().collection(COL.reflections).doc(reflectionId)
  const snap = await ref.get()
  const data = snap.data() as ReflectionDoc | undefined
  if (!data) return fail('Yozuv topilmadi.', 'not_found')
  if (data.uid !== user.uid) return fail('Ruxsat yo‘q.', 'forbidden')

  await ref.update({ aiComment: text })
  revalidatePath('/student/reflection')
  return { ok: true, data: null }
}
