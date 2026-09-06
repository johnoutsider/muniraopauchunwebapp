/**
 * Test urinishini DETERMINISTIK baholash (PLAN 8.11, 6-bo'lim).
 *
 * ILMIY TALAB: bir xil javoblar to'plami HAR DOIM bir xil ball olishi kerak —
 * eksperimental va nazorat guruhida bir xil, qayta hisoblanganda ham bir xil.
 * Shuning uchun bu modul:
 *   • faqat `gradeItem` (qoida asosidagi baholovchi) natijasiga tayanadi;
 *   • AI'ga umuman murojaat qilmaydi;
 *   • TOZA (pure) — Firestore'ga ham, `Date.now()`ga ham tegmaydi.
 *
 * Ochiq topshiriqlar (`needsAi`) baldan CHIQARIB TASHLANADI: ular
 * o'qituvchi/AI navbatiga yuboriladi va bahosi keyin qo'shiladi. Aks holda
 * talaba javob yozgan bo'lsa ham 0 ball olib qolardi.
 */

import { gradeItem, type GradeResult } from '@/lib/adaptive/grade'
import type { ErrorTag, Skill } from '@/config/constants'
import type { ItemDoc, TestAttemptDoc, TestSection, WithId } from '@/types'

import type { AnswerMap } from './types'

export interface GradedItem {
  itemId: string
  sectionId: string
  skill: Skill
  topic: string
  difficulty: number
  answer: string[]
  result: GradeResult
}

export interface GradedSection {
  sectionId: string
  skill: Skill
  /** Qoida bilan baholangan itemlar soni */
  closedCount: number
  /** 0..1 — to'g'ri javoblar ulushi */
  ratio: number
  /** Bo'lim vazniga keltirilgan ball */
  score: number
  max: number
  percent: number
  /** Ochiq topshiriq/itemlar bor va hali baholanmagan */
  pending: boolean
}

export interface GradedAttempt {
  items: GradedItem[]
  sections: GradedSection[]
  sectionScores: TestAttemptDoc['sectionScores']
  rawAnswers: TestAttemptDoc['rawAnswers']
  errorTagCounts: Partial<Record<ErrorTag, number>>
  pendingSections: string[]
  totalScore: number
  totalMax: number
  percent: number
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Bo'lim vazni: `TestSection.maxScore` (tadqiqotchi belgilaydi).
 * Belgilanmagan bo'lsa — baholangan itemlar soni (1 item = 1 ball).
 */
function sectionWeight(section: TestSection, closedCount: number): number {
  const declared = Number(section.maxScore)
  if (Number.isFinite(declared) && declared > 0) return declared
  return closedCount
}

/**
 * Barcha bo'limlarni baholash.
 *
 * @param sections  test bo'limlari (tartibi saqlanadi)
 * @param itemsById baholash uchun TO'LIQ `ItemDoc` (answerKey bilan) — faqat server
 * @param answers   itemId → talaba javobi
 */
export function gradeAttempt(
  sections: readonly TestSection[],
  itemsById: ReadonlyMap<string, ItemDoc & WithId>,
  answers: AnswerMap
): GradedAttempt {
  const items: GradedItem[] = []
  const sectionResults: GradedSection[] = []
  const sectionScores: TestAttemptDoc['sectionScores'] = {}
  const rawAnswers: TestAttemptDoc['rawAnswers'] = []
  const errorTagCounts: Partial<Record<ErrorTag, number>> = {}
  const pendingSections: string[] = []

  let totalScore = 0
  let totalMax = 0

  for (const section of sections) {
    let closedCount = 0
    let rawScore = 0

    for (const itemId of section.itemIds) {
      const item = itemsById.get(itemId)
      if (!item) continue

      const answer = answers[itemId] ?? []
      const result = gradeItem(item, answer)
      items.push({
        itemId,
        sectionId: section.id,
        skill: item.skill,
        topic: item.topic,
        difficulty: item.difficulty,
        answer,
        result,
      })

      rawAnswers.push({
        itemId,
        answer,
        isCorrect: result.needsAi ? undefined : result.isCorrect,
        score: result.needsAi ? undefined : result.score,
      })

      if (result.needsAi) continue

      closedCount += 1
      rawScore += result.score

      for (const tag of result.errorTags) {
        errorTagCounts[tag] = (errorTagCounts[tag] ?? 0) + 1
      }
    }

    if (closedCount === 0) {
      // Bo'lim faqat ochiq topshiriqdan iborat — bahosi keyin qo'shiladi
      sectionResults.push({
        sectionId: section.id,
        skill: section.skill,
        closedCount: 0,
        ratio: 0,
        score: 0,
        max: sectionWeight(section, 0),
        percent: 0,
        pending: true,
      })
      pendingSections.push(section.id)
      continue
    }

    const ratio = rawScore / closedCount
    const max = sectionWeight(section, closedCount)
    const score = round(ratio * max)
    const percent = Math.round(ratio * 100)

    sectionResults.push({
      sectionId: section.id,
      skill: section.skill,
      closedCount,
      ratio: round(ratio, 4),
      score,
      max,
      percent,
      pending: false,
    })

    // Bir skill bir necha bo'limda uchrasa — ballar qo'shiladi
    const existing = sectionScores[section.skill]
    if (existing) {
      const mergedScore = round(existing.score + score)
      const mergedMax = existing.max + max
      sectionScores[section.skill] = {
        score: mergedScore,
        max: mergedMax,
        percent: mergedMax > 0 ? Math.round((mergedScore / mergedMax) * 100) : 0,
      }
    } else {
      sectionScores[section.skill] = { score, max, percent }
    }

    totalScore += score
    totalMax += max
  }

  return {
    items,
    sections: sectionResults,
    sectionScores,
    rawAnswers,
    errorTagCounts,
    pendingSections,
    totalScore: round(totalScore),
    totalMax: round(totalMax),
    percent: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
  }
}

/** Xato teglarini kamayish tartibida (natijalar sahifasidagi "asosiy xatolar"). */
export function topErrorTags(
  counts: Partial<Record<ErrorTag, number>> | undefined,
  limit = 6
): Array<{ tag: ErrorTag; count: number }> {
  if (!counts) return []
  return (Object.entries(counts) as Array<[ErrorTag, number]>)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}
