/**
 * Deterministik baholash (grading) — AI'ga murojaat qilishdan OLDIN.
 * PLAN.md 6-bo'lim, 7.4 (xarajat nazorati), 8.2.
 *
 * PEDAGOGIK VA ILMIY MAQSAD:
 * 12 ta mashq turining 9 tasi (mcq, gap-fill, matching, classification,
 * transformation, error-correction, substitution, word-order, expansion)
 * ANIQ javob kalitiga ega — ularni model emas, qoida baholashi kerak:
 *   • natija 100% takrorlanuvchan (eksperiment uchun majburiy — bir xil javob
 *     har doim bir xil ball oladi, eksperimental va nazorat guruhida ham);
 *   • kechikish ~0 ms va AI xarajati yo'q;
 *   • nazorat guruhi (AI o'chirilgan) ham xuddi shu bahoni oladi.
 *
 * Faqat ochiq topshiriqlar (open_writing, speaking_prompt, imitation) va
 * qoida bo'yicha aniqlab bo'lmagan hollarda `needsAi: true` qaytariladi —
 * shundan keyingina Claude chaqiriladi.
 *
 * Modul TOZA (pure) — unit-test qilinadi.
 */

import type { ErrorTag } from '@/config/constants'
import type { ItemDoc } from '@/types'
import { normalizeAnswer } from '@/lib/utils/format'

/** Baholash natijasi. */
export interface GradeResult {
  /** To'liq to'g'ri bo'lsagina `true`. */
  isCorrect: boolean
  /** Qisman ball, 0..1 (matching/classification uchun muhim). */
  score: number
  /** Qoida bilan baholab bo'lmadi — Claude'ga yuborish kerak. */
  needsAi: boolean
  /** Xato bo'lsa — itemning taksonomiya teglari (`errorProfiles` uchun). */
  errorTags: ErrorTag[]
  /** UI uchun har bo'lak bo'yicha natija (inline belgilash). */
  parts?: boolean[]
  /** Nima uchun AI kerakligi (log/debug). */
  reason?: string
}

/** AI baholashini talab qiladigan (ochiq) mashq turlari. */
const AI_ITEM_TYPES = new Set<ItemDoc['type']>(['open_writing', 'speaking_prompt', 'imitation'])

/** Javob kalitidagi muqobil variantlar ajratgichi: `has risen|rose`. */
const ALT_SEPARATOR = '|'
/** Juftlik/kategoriya ajratgichi: `revenue::income statement`. */
const PAIR_SEPARATOR = '::'

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

function norm(value: unknown): string {
  return typeof value === 'string' ? normalizeAnswer(value) : ''
}

/** Bitta kalit bandidagi barcha qabul qilinadigan variantlar. */
function alternatives(key: string): string[] {
  return key
    .split(ALT_SEPARATOR)
    .map(norm)
    .filter((value) => value.length > 0)
}

function matchesAny(answer: string, keys: readonly string[]): boolean {
  const a = norm(answer)
  if (!a) return false
  return keys.some((key) => alternatives(key).includes(a))
}

function ratio(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 1000) / 1000
}

function pairKey(left: string, right: string): string {
  return `${norm(left)}${PAIR_SEPARATOR}${norm(right)}`
}

/** `a::b` ko'rinishidagi javobni ajratish; bo'lmasa `null`. */
function splitPair(value: string): [string, string] | null {
  const index = value.indexOf(PAIR_SEPARATOR)
  if (index < 0) return null
  return [value.slice(0, index), value.slice(index + PAIR_SEPARATOR.length)]
}

/* ------------------------------------------------------------------ */
/* Tur bo'yicha baholovchilar                                          */
/* ------------------------------------------------------------------ */

/** MCQ: variant `id` yoki (moslik topilmasa) variant matni bo'yicha. */
function gradeMcq(item: ItemDoc, answer: readonly string[]): GradeResult {
  const picked = answer.filter((value) => value.trim().length > 0)
  const keys = item.answerKey.map((key) => key.trim())

  if (!picked.length) {
    return { isCorrect: false, score: 0, needsAi: false, errorTags: item.errorTags }
  }

  const idMatch = (value: string): boolean => {
    if (keys.some((key) => key === value.trim())) return true
    // Variant matni yuborilgan bo'lsa — option id ga aylantirib ko'ramiz
    const option = item.options?.find(
      (opt) => norm(opt.text) === norm(value) || opt.id === value.trim()
    )
    if (!option) return false
    return keys.includes(option.id) || matchesAny(option.text, keys)
  }

  // Bir nechta to'g'ri variant bo'lishi mumkin (multi-select)
  const multi = keys.length > 1 && picked.length > 1
  if (multi) {
    const correctPicked = picked.filter(idMatch).length
    const score = ratio(correctPicked, Math.max(keys.length, picked.length))
    return {
      isCorrect: score === 1,
      score,
      needsAi: false,
      errorTags: score === 1 ? [] : item.errorTags,
      parts: picked.map(idMatch),
    }
  }

  const ok = idMatch(picked[0])
  return { isCorrect: ok, score: ok ? 1 : 0, needsAi: false, errorTags: ok ? [] : item.errorTags }
}

/**
 * Matnli javoblar: gap_fill, transformation, error_correction,
 * substitution, expansion.
 *
 * Ikki rejim:
 *   • bir nechta bo'shliq — pozitsion (answer[i] ↔ answerKey[i]);
 *   • bitta javob — kalitning ISTALGAN bandiga mos kelsa to'g'ri.
 */
function gradeText(item: ItemDoc, answer: readonly string[]): GradeResult {
  const keys = item.answerKey.filter((key) => key.trim().length > 0)
  if (!keys.length) {
    return {
      isCorrect: false,
      score: 0,
      needsAi: true,
      errorTags: [],
      reason: 'answerKey bo‘sh — AI baholaydi',
    }
  }

  const given = answer.map((value) => value ?? '')

  // Pozitsion rejim: bo'shliqlar soni kalit bandlari soniga teng
  if (keys.length > 1 && given.length === keys.length) {
    const parts = given.map((value, index) => alternatives(keys[index]).includes(norm(value)))
    const correct = parts.filter(Boolean).length
    const score = ratio(correct, keys.length)
    return {
      isCorrect: score === 1,
      score,
      needsAi: false,
      errorTags: score === 1 ? [] : item.errorTags,
      parts,
    }
  }

  const joined = given.length > 1 ? given.join(' ') : (given[0] ?? '')
  const ok = matchesAny(joined, keys)

  // Yaqin, lekin aynan emas: uzun erkin javoblarda AI'ga topshiramiz
  if (!ok && isLikelyOpen(joined, keys)) {
    return {
      isCorrect: false,
      score: 0,
      needsAi: true,
      errorTags: [],
      reason: 'javob erkin shaklda — semantik tekshiruv kerak',
    }
  }

  return { isCorrect: ok, score: ok ? 1 : 0, needsAi: false, errorTags: ok ? [] : item.errorTags }
}

/**
 * Javob kalitdan sezilarli uzun bo'lsa — talaba o'z gapini yozgan bo'lishi
 * mumkin (transformation/expansion). Bunday holda deterministik "xato"
 * adolatsiz bo'ladi, AI semantik tekshiradi.
 */
function isLikelyOpen(answer: string, keys: readonly string[]): boolean {
  const words = norm(answer).split(' ').filter(Boolean).length
  if (words < 4) return false
  const longest = Math.max(...keys.map((key) => norm(key).split(' ').filter(Boolean).length), 0)
  return words > longest + 2
}

/**
 * Matching: `pairs[]` bo'yicha.
 * Javob formati — `left::right` yoki `pairs` tartibidagi `right` qiymatlari.
 */
function gradeMatching(item: ItemDoc, answer: readonly string[]): GradeResult {
  const pairs = item.pairs ?? []
  if (!pairs.length) {
    return gradeText(item, answer)
  }

  const expected = new Set(pairs.map((pair) => pairKey(pair.left, pair.right)))
  const structured = answer.every((value) => splitPair(value) !== null) && answer.length > 0

  let parts: boolean[]
  if (structured) {
    parts = answer.map((value) => {
      const split = splitPair(value)
      return split ? expected.has(pairKey(split[0], split[1])) : false
    })
  } else {
    // Pozitsion: answer[i] — pairs[i].left uchun tanlangan `right`
    parts = pairs.map((pair, index) => norm(answer[index] ?? '') === norm(pair.right))
  }

  const correct = parts.filter(Boolean).length
  const score = ratio(correct, pairs.length)
  return {
    isCorrect: score === 1,
    score,
    needsAi: false,
    errorTags: score === 1 ? [] : item.errorTags,
    parts,
  }
}

/**
 * Classification: har element o'z kategoriyasiga (`categories[]`) joylanadi.
 * Kalit formati: `element::kategoriya`.
 */
function gradeClassification(item: ItemDoc, answer: readonly string[]): GradeResult {
  const keys = item.answerKey.filter((key) => key.includes(PAIR_SEPARATOR))
  if (!keys.length) return gradeText(item, answer)

  const expected = new Map<string, string>()
  for (const key of keys) {
    const split = splitPair(key)
    if (split) expected.set(norm(split[0]), norm(split[1]))
  }

  const parts = answer.map((value) => {
    const split = splitPair(value)
    if (!split) return false
    return expected.get(norm(split[0])) === norm(split[1])
  })

  const correct = parts.filter(Boolean).length
  const score = ratio(correct, expected.size)
  return {
    isCorrect: score === 1 && answer.length >= expected.size,
    score,
    needsAi: false,
    errorTags: score === 1 ? [] : item.errorTags,
    parts,
  }
}

/**
 * Word order: so'zlar ketma-ketligi.
 * Javob — so'zlar massivi yoki bitta gap; kalit — to'g'ri gap (yoki muqobillar).
 */
function gradeWordOrder(item: ItemDoc, answer: readonly string[]): GradeResult {
  const keys = item.answerKey.filter((key) => key.trim().length > 0)
  if (!keys.length) {
    return { isCorrect: false, score: 0, needsAi: true, errorTags: [], reason: 'answerKey bo‘sh' }
  }

  const sentence = norm(answer.join(' '))
  const ok = keys.some((key) => alternatives(key).includes(sentence))
  if (ok) return { isCorrect: true, score: 1, needsAi: false, errorTags: [] }

  // Qisman ball: to'g'ri pozitsiyadagi so'zlar ulushi (eng yaqin variant bo'yicha)
  const answerWords = sentence.split(' ').filter(Boolean)
  let best = 0
  let bestParts: boolean[] = answerWords.map(() => false)
  for (const key of keys) {
    for (const alt of alternatives(key)) {
      const keyWords = alt.split(' ').filter(Boolean)
      const parts = answerWords.map((word, index) => word === keyWords[index])
      const score = ratio(
        parts.filter(Boolean).length,
        Math.max(keyWords.length, answerWords.length)
      )
      if (score > best) {
        best = score
        bestParts = parts
      }
    }
  }

  return {
    isCorrect: false,
    score: best,
    needsAi: false,
    errorTags: item.errorTags,
    parts: bestParts,
  }
}

/* ------------------------------------------------------------------ */
/* Asosiy kirish nuqtasi                                               */
/* ------------------------------------------------------------------ */

/**
 * Itemni javob bilan solishtirish.
 *
 * @param item   mashq banki hujjati
 * @param answer talaba javobi (`AttemptDoc.answer` — har doim `string[]`)
 */
export function gradeItem(item: ItemDoc, answer: readonly string[] | string): GradeResult {
  const values = Array.isArray(answer) ? answer : [answer]
  const filled = values.some((value) => typeof value === 'string' && value.trim().length > 0)

  // Ochiq topshiriqlar — har doim AI/o'qituvchi baholaydi
  if (AI_ITEM_TYPES.has(item.type)) {
    return {
      isCorrect: false,
      score: 0,
      needsAi: true,
      errorTags: [],
      reason: `"${item.type}" turi ochiq topshiriq — AI/o‘qituvchi baholaydi`,
    }
  }

  if (!filled) {
    return {
      isCorrect: false,
      score: 0,
      needsAi: false,
      errorTags: item.errorTags,
      reason: 'javob bo‘sh',
    }
  }

  switch (item.type) {
    case 'mcq':
      return gradeMcq(item, values)
    case 'matching':
      return gradeMatching(item, values)
    case 'classification':
      return gradeClassification(item, values)
    case 'word_order':
      return gradeWordOrder(item, values)
    case 'gap_fill':
    case 'transformation':
    case 'error_correction':
    case 'substitution':
    case 'expansion':
      return gradeText(item, values)
    default:
      return gradeText(item, values)
  }
}

/** Bir necha itemni birdan baholash (test bo'limi, mashq sessiyasi). */
export function gradeAll(entries: ReadonlyArray<{ item: ItemDoc; answer: readonly string[] }>): {
  results: GradeResult[]
  total: number
  max: number
  percent: number
  needsAi: number
} {
  const results = entries.map((entry) => gradeItem(entry.item, entry.answer))
  const auto = results.filter((result) => !result.needsAi)
  const total = auto.reduce((sum, result) => sum + result.score, 0)
  const max = auto.length
  return {
    results,
    total: Math.round(total * 1000) / 1000,
    max,
    percent: max ? Math.round((total / max) * 100) : 0,
    needsAi: results.filter((result) => result.needsAi).length,
  }
}
