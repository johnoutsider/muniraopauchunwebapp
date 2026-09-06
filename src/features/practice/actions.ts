'use server'

import { adminDb } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { COL, XP, type ErrorTag } from '@/config/constants'
import { logEvent, awardXp, touchStreak } from '@/lib/analytics/events'
import { gradeItem, recordAttempt } from '@/lib/adaptive'
import { normalizeAnswer } from '@/lib/utils/format'
import type { ActionResult, ItemDoc, ItemExplanation } from '@/types'

import type { AnswerFeedback } from './types'

/* ------------------------------------------------------------------ */
/* Validatsiya                                                         */
/* ------------------------------------------------------------------ */

const MAX_ANSWER_PARTS = 40
const MAX_ANSWER_CHARS = 600

function cleanAnswer(answer: unknown): string[] | null {
  if (!Array.isArray(answer)) return null
  if (answer.length > MAX_ANSWER_PARTS) return null
  const out: string[] = []
  for (const value of answer) {
    if (typeof value !== 'string') return null
    out.push(value.slice(0, MAX_ANSWER_CHARS))
  }
  return out
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/* ------------------------------------------------------------------ */
/* Zaxira baholash — AI mavjud bo'lmaganda (nazorat guruhi)            */
/* ------------------------------------------------------------------ */

function tokens(text: string): string[] {
  return normalizeAnswer(text).split(' ').filter(Boolean)
}

/**
 * Ochiq javob uchun deterministik zaxira: kalit so'zlarning qamrovi.
 * Nazorat guruhida AI chaqirilmaydi, lekin talaba javobsiz qolmasligi kerak.
 */
function looseGrade(item: ItemDoc, answer: string): { isCorrect: boolean; score: number } {
  const given = new Set(tokens(answer))
  if (!given.size) return { isCorrect: false, score: 0 }

  let best = 0
  for (const key of item.answerKey ?? []) {
    for (const alt of key.split('|')) {
      const words = tokens(alt)
      if (!words.length) continue
      const hit = words.filter((word) => given.has(word)).length
      best = Math.max(best, hit / words.length)
    }
  }
  const score = Math.round(best * 100) / 100
  return { isCorrect: score >= 0.8, score }
}

function readableAnswer(item: ItemDoc): string {
  if (item.type === 'mcq') {
    const texts = (item.answerKey ?? [])
      .map((key) => item.options?.find((option) => option.id === key)?.text ?? key)
      .filter(Boolean)
    return texts.join(', ')
  }
  if (item.type === 'matching') {
    return (item.pairs ?? []).map((pair) => `${pair.left} → ${pair.right}`).join('; ')
  }
  if (item.type === 'classification') {
    return (item.answerKey ?? []).map((key) => key.replace('::', ' → ')).join('; ')
  }
  return (item.answerKey ?? []).map((key) => key.split('|')[0]).join(' / ')
}

const FALLBACK_EXPLANATION: ItemExplanation = {
  why: 'Javob kutilgan strukturaga to‘liq mos kelmadi.',
  how: 'To‘g‘ri javobni diqqat bilan o‘qing va farqni belgilab qo‘ying.',
  whereElse: 'Xuddi shu qoida iqtisodiy hisobot va taqdimotlarda ham qo‘llanadi.',
}

function safeExplanation(item: ItemDoc): ItemExplanation {
  const source = item.explanation
  return {
    why: source?.why?.trim() || FALLBACK_EXPLANATION.why,
    how: source?.how?.trim() || FALLBACK_EXPLANATION.how,
    whereElse: source?.whereElse?.trim() || FALLBACK_EXPLANATION.whereElse,
  }
}

/* ------------------------------------------------------------------ */
/* Javobni topshirish                                                  */
/* ------------------------------------------------------------------ */

export interface SubmitAnswerInput {
  itemId: string
  answer: string[]
  timeMs: number
  hintsUsed?: number
  context?: 'lesson' | 'practice' | 'test' | 'project'
  contextId?: string
}

export async function submitAnswerAction(
  input: SubmitAnswerInput
): Promise<ActionResult<AnswerFeedback>> {
  const user = await requireStudent()

  const itemId = typeof input?.itemId === 'string' ? input.itemId.trim() : ''
  if (!itemId || itemId.length > 128) return { ok: false, error: 'Mashq identifikatori noto‘g‘ri.' }

  const answer = cleanAnswer(input?.answer)
  if (!answer) return { ok: false, error: 'Javob formati noto‘g‘ri.' }

  const timeMs = clampNumber(input?.timeMs, 0, 3_600_000, 0)
  const hintsUsed = clampNumber(input?.hintsUsed, 0, 10, 0)
  const context = input?.context ?? 'practice'
  const contextId =
    typeof input?.contextId === 'string' ? input.contextId.slice(0, 128) : undefined

  const snap = await adminDb().collection(COL.items).doc(itemId).get()
  if (!snap.exists) return { ok: false, error: 'Mashq topilmadi.' }
  const item = { id: snap.id, ...(snap.data() as ItemDoc) }
  if (item.status !== 'approved') {
    return { ok: false, error: 'Bu mashq hali tasdiqlanmagan.' }
  }

  const flags = await resolveFlags(user)

  // 1) Deterministik baholash — har doim birinchi (PLAN 6, 7.4)
  const graded = gradeItem(item, answer)

  let isCorrect = graded.isCorrect
  let score = graded.score
  let errorTags: ErrorTag[] = graded.errorTags
  let aiGraded = false
  let explanation = safeExplanation(item)
  let modelAnswer: string | undefined

  // 2) Faqat ochiq javoblar uchun AI zaxirasi
  if (graded.needsAi) {
    const text = answer.join(' ').trim()
    if (flags.aiFeedback) {
      try {
        const { gradeOpenAnswer } = await import('@/ai/services/grading')
        const result = await gradeOpenAnswer({
          user: {
            uid: user.uid,
            participantCode: user.participantCode,
            expGroup: user.expGroup,
            groupId: user.groupId,
          },
          item,
          answer: text,
        })
        if (result.ok) {
          isCorrect = result.data.isCorrect
          score = result.data.score
          errorTags = result.data.errorTags as ErrorTag[]
          aiGraded = true
          modelAnswer = result.data.modelAnswer
          explanation = {
            why: result.data.why || explanation.why,
            how: result.data.how || explanation.how,
            whereElse: result.data.whereElse || explanation.whereElse,
          }
        } else {
          const loose = looseGrade(item, text)
          isCorrect = loose.isCorrect
          score = loose.score
          errorTags = loose.isCorrect ? [] : item.errorTags
        }
      } catch {
        const loose = looseGrade(item, text)
        isCorrect = loose.isCorrect
        score = loose.score
        errorTags = loose.isCorrect ? [] : item.errorTags
      }
    } else {
      const loose = looseGrade(item, text)
      isCorrect = loose.isCorrect
      score = loose.score
      errorTags = loose.isCorrect ? [] : item.errorTags
    }
  }

  // 3) Adaptiv dvigatelga yozish (attempt + mastery + errorProfile + XP + event)
  const result = await recordAttempt(user, {
    item,
    answer,
    isCorrect,
    score,
    timeMs,
    hintsUsed,
    context,
    contextId,
    errorTags,
    adaptive: flags.adaptive,
  })

  return {
    ok: true,
    data: {
      itemId: item.id,
      isCorrect,
      score,
      parts: graded.parts,
      explanation,
      correctAnswer: readableAnswer(item),
      errorTags,
      xpAwarded: result.xpAwarded,
      leveledUp: result.leveledUp,
      leveledDown: result.leveledDown,
      needsReteach: result.needsReteach,
      mastered: result.mastered,
      difficulty: result.mastery.currentDifficulty,
      streakCorrect: result.mastery.streakCorrect,
      streakWrong: result.mastery.streakWrong,
      aiGraded,
      modelAnswer,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Sessiya yakuni                                                      */
/* ------------------------------------------------------------------ */

export interface FinishSessionInput {
  skill: string
  topic?: string
  context?: 'lesson' | 'practice' | 'test' | 'project'
  contextId?: string
  total: number
  correct: number
  totalTimeMs: number
  hintsUsed: number
  errorTags: string[]
}

export async function finishPracticeSessionAction(
  input: FinishSessionInput
): Promise<ActionResult<{ bonusXp: number; streak: number }>> {
  const user = await requireStudent()

  const total = clampNumber(input?.total, 0, 200, 0)
  const correct = clampNumber(input?.correct, 0, total, 0)
  if (!total) return { ok: false, error: 'Sessiyada bajarilgan mashq yo‘q.' }

  const totalTimeMs = clampNumber(input?.totalTimeMs, 0, 6 * 3_600_000, 0)
  const hintsUsed = clampNumber(input?.hintsUsed, 0, 500, 0)
  const accuracy = Math.round((correct / total) * 100)

  // To'liq sessiyani yakunlagani uchun kichik bonus (PLAN 8.12)
  const bonusXp = total >= 5 && accuracy >= 80 ? XP.ITEM_CORRECT * 2 : 0

  // Diqqat: `timeOnTaskMin` har urinishda `recordAttempt` ichida oshiriladi —
  // shuning uchun bu yerda qayta qo'shilmaydi (ikki marta sanalmasligi uchun).
  const [streak] = await Promise.all([
    touchStreak(user.uid),
    logEvent(user, 'practice_session', {
      skill: String(input?.skill ?? '').slice(0, 40),
      topic: input?.topic ? String(input.topic).slice(0, 60) : null,
      context: input?.context ?? 'practice',
      contextId: input?.contextId ?? null,
      total,
      correct,
      accuracy,
      totalTimeMs,
      hintsUsed,
      errorTags: (input?.errorTags ?? []).slice(0, 10),
    }),
  ])

  if (bonusXp) await awardXp(user, bonusXp, 'practice_session_bonus')

  return { ok: true, data: { bonusXp, streak: streak.current } }
}
