/**
 * So'rovnoma shkalasi va ball hisobi (PLAN 9.1, 9.2 — `survey_items` dataseti).
 *
 * TESKARI SAVOLLAR (`reverse: true`): motivatsiya va AI-literacy shkalalarida
 * ba'zi bandlar ataylab teskari yozilgan ("Men ingliz tilidan qo'rqaman").
 * Umumiy ballda ular AKS ETTIRIB qo'shiladi: `max + 1 − javob`. Aks holda
 * shkalaning ichki izchilligi (Cronbach α) buziladi va tahlil noto'g'ri
 * chiqadi. Modul TOZA — unit-test qilinadi.
 */

import type { SurveyDoc, SurveyQuestion } from '@/types'

export const DEFAULT_SCALE_LOW = 'Umuman qo‘shilmayman'
export const DEFAULT_SCALE_HIGH = 'To‘liq qo‘shilaman'

const SCALE_SEPARATORS = ['|', '→', '—', '–', '...', '…']

/** likert5 → 5, likert7 → 7, boshqalar → 0 (ballga kirmaydi). */
export function likertMax(type: SurveyQuestion['type']): number {
  if (type === 'likert5') return 5
  if (type === 'likert7') return 7
  return 0
}

export function isLikert(type: SurveyQuestion['type']): boolean {
  return likertMax(type) > 0
}

/**
 * Shkalaning ikki uchi. `question.scale` da ajratgich bo'lsa
 * ("Umuman qo'shilmayman|To'liq qo'shilaman") — ikki uch ham undan olinadi.
 */
export function scaleEnds(question: SurveyQuestion): { low: string; high: string } {
  const raw = question.scale?.trim()
  if (!raw) return { low: DEFAULT_SCALE_LOW, high: DEFAULT_SCALE_HIGH }

  for (const separator of SCALE_SEPARATORS) {
    const index = raw.indexOf(separator)
    if (index > 0) {
      const low = raw.slice(0, index).trim()
      const high = raw.slice(index + separator.length).trim()
      if (low && high) return { low, high }
    }
  }
  return { low: DEFAULT_SCALE_LOW, high: raw }
}

/** Bitta javobning umumiy ballga qo'shadigan hissasi (teskari savol hisobga olinadi). */
export function scoreOf(question: SurveyQuestion, answer: number | string | undefined): number {
  const max = likertMax(question.type)
  if (!max) return 0
  const value = typeof answer === 'number' ? answer : Number(answer)
  if (!Number.isFinite(value) || value < 1 || value > max) return 0
  return question.reverse ? max + 1 - value : value
}

/** Barcha likert bandlari bo'yicha umumiy ball. */
export function computeScoreTotal(
  survey: Pick<SurveyDoc, 'questions'>,
  answers: Record<string, number | string>
): number {
  return survey.questions.reduce(
    (sum, question) => sum + scoreOf(question, answers[question.id]),
    0
  )
}

/** Nazariy maksimal ball — natijani foizda ko'rsatish uchun. */
export function maxScoreTotal(survey: Pick<SurveyDoc, 'questions'>): number {
  return survey.questions.reduce((sum, question) => sum + likertMax(question.type), 0)
}

/** Javob berilgan majburiy savollar soni (open savollar ham hisobga olinadi). */
export function answeredCount(
  survey: Pick<SurveyDoc, 'questions'>,
  answers: Record<string, number | string>
): number {
  return survey.questions.filter((question) => {
    const value = answers[question.id]
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim().length > 0
    return Number.isFinite(value)
  }).length
}

/** Javob berilmagan savollar (topshirishdan oldin ogohlantirish uchun). */
export function missingQuestions(
  survey: Pick<SurveyDoc, 'questions'>,
  answers: Record<string, number | string>
): SurveyQuestion[] {
  return survey.questions.filter((question) => {
    const value = answers[question.id]
    if (value === undefined || value === null) return true
    if (typeof value === 'string') return value.trim().length === 0
    return !Number.isFinite(value)
  })
}
