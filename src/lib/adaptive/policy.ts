/**
 * Adaptiv qiyinlik siyosati (difficulty policy) — PLAN.md 6-bo'lim, 1–3 qoidalar.
 *
 * PEDAGOGIK MAQSAD:
 * Talaba "proksimal rivojlanish zonasi" da qolishi kerak — juda oson mashq
 * zeriktiradi, juda qiyin mashq qo'rqitadi. Shuning uchun qoidalar ATAYLAB
 * sodda va tushuntirib beriladigan qilib olingan (dissertatsiyada
 * asoslanadigan, "qora quti" bo'lmagan model):
 *
 *   1. Boshlang'ich difficulty diagnostika natijasidan olinadi.
 *   2. 3 ta ketma-ket TO'G'RI  → difficulty +1 (maksimum 5) + "Level up".
 *   3. 2 ta ketma-ket XATO     → difficulty −1 (minimum 1) + mikro-tushuntirish
 *      (nazorat guruhida statik `explanation`, eksperimental guruhda AI matn).
 *
 * Nazorat guruhida 2–3 qoidalar o'chiriladi (`adaptive` feature flag), ya'ni
 * hamma bir xil ketma-ketlikni oladi — bu eksperimentning mustaqil o'zgaruvchisi.
 *
 * Modul TOZA (pure) — Firestore yo'q, unit-test qilinadi.
 */

import { ADAPTIVE, DIFFICULTY_CEFR, type CefrLevel, type Skill } from '@/config/constants'
import type { ItemDoc, MasteryDoc, WithId } from '@/types'

import {
  DEFAULT_BKT_PARAMS,
  initialMastery,
  isMastered,
  updateMastery,
  type BktParams,
} from './bkt'

/* ------------------------------------------------------------------ */
/* Tiplar                                                              */
/* ------------------------------------------------------------------ */

/** Qiyinlikni hisoblash uchun zarur minimal holat. */
export interface DifficultyState {
  currentDifficulty: number
  streakCorrect: number
  streakWrong: number
}

/** Bitta urinish natijasi (grading'dan keyin). */
export interface AttemptSignal {
  isCorrect: boolean
  /** Yordam ishlatilgan bo'lsa, seriya "toza" hisoblanmaydi. */
  hintsUsed?: number
  timeMs?: number
}

/** `mastery/{uid}/skills/{skillId}` hujjatining o'zgaradigan maydonlari. */
export type MasteryState = Pick<
  MasteryDoc,
  'pMastery' | 'currentDifficulty' | 'streakCorrect' | 'streakWrong' | 'attempts' | 'correct'
>

/** `applyAttempt` natijasi: yangi holat + UI uchun signal bayroqlari. */
export interface AttemptOutcome extends MasteryState {
  /** Difficulty oshdi — "Level up" animatsiyasi ko'rsatiladi. */
  leveledUp: boolean
  /** Difficulty tushdi. */
  leveledDown: boolean
  /** 2 ketma-ket xato — mikro-tushuntirish blokini ko'rsatish kerak. */
  needsReteach: boolean
  /** pMastery ≥ 0.85 — ko'nikma yopildi. */
  mastered: boolean
  /** Bu urinishda birinchi marta mastered bo'ldimi (badge/XP uchun). */
  justMastered: boolean
}

/* ------------------------------------------------------------------ */
/* Qiyinlik qoidalari                                                  */
/* ------------------------------------------------------------------ */

function clampDifficulty(value: number): number {
  const rounded = Math.round(Number.isFinite(value) ? value : ADAPTIVE.MIN_DIFFICULTY)
  return Math.min(ADAPTIVE.MAX_DIFFICULTY, Math.max(ADAPTIVE.MIN_DIFFICULTY, rounded))
}

/**
 * PLAN 6.2–6.3 qoidalari.
 * Seriyalar `applyAttempt` ichida allaqachon yangilangan holda beriladi.
 *
 * @returns yangi difficulty (1..5)
 */
export function nextDifficulty(state: DifficultyState): number {
  const current = clampDifficulty(state.currentDifficulty)
  if (state.streakCorrect >= ADAPTIVE.LEVEL_UP_STREAK) {
    return clampDifficulty(current + 1)
  }
  if (state.streakWrong >= ADAPTIVE.LEVEL_DOWN_STREAK) {
    return clampDifficulty(current - 1)
  }
  return current
}

/**
 * Diagnostika bali (0–100) → boshlang'ich difficulty (1–5).
 * PLAN 6.1. Chegaralar `scoreToLabel` bilan uyg'un:
 *   0–19 → 1 (A2), 20–39 → 2, 40–59 → 3 (B1), 60–79 → 4 (B2), 80–100 → 5 (C1)
 */
export function startingDifficulty(skillScore: number): number {
  if (!Number.isFinite(skillScore)) return 2
  if (skillScore < 20) return 1
  if (skillScore < 40) return 2
  if (skillScore < 60) return 3
  if (skillScore < 80) return 4
  return 5
}

/** Difficulty → taxminiy CEFR (UI yorlig'i uchun). */
export function difficultyToCefr(difficulty: number): CefrLevel {
  return DIFFICULTY_CEFR[clampDifficulty(difficulty)] ?? 'B1'
}

/** Bo'sh (yangi) mastery holati — birinchi urinishdan oldin. */
export function emptyMasteryState(diagnosticScore?: number): MasteryState {
  return {
    pMastery: initialMastery(diagnosticScore),
    currentDifficulty: startingDifficulty(diagnosticScore ?? 40),
    streakCorrect: 0,
    streakWrong: 0,
    attempts: 0,
    correct: 0,
  }
}

/* ------------------------------------------------------------------ */
/* Asosiy: bitta urinishni qo'llash                                    */
/* ------------------------------------------------------------------ */

export interface ApplyAttemptOptions {
  /**
   * Nazorat guruhi uchun `false` — difficulty o'zgarmaydi va reteach
   * bloki ko'rsatilmaydi (PLAN 6.8). pMastery baribir hisoblanadi, chunki u
   * ilmiy ma'lumot sifatida ikkala guruhda ham kerak.
   */
  adaptive?: boolean
  params?: BktParams
}

/**
 * Urinishni mastery holatiga qo'llash: BKT + seriyalar + qiyinlik qoidalari.
 *
 * @param mastery joriy holat (yo'q bo'lsa `emptyMasteryState()` bering)
 * @param attempt urinish natijasi
 */
export function applyAttempt(
  mastery: MasteryState,
  attempt: AttemptSignal,
  options: ApplyAttemptOptions = {}
): AttemptOutcome {
  const { adaptive = true, params = DEFAULT_BKT_PARAMS } = options
  const wasMastered = isMastered(mastery.pMastery)

  // Yordam (hint) ishlatilgan to'g'ri javob seriyani uzmaydi, lekin uni
  // oshirmaydi ham — talaba mustaqil bajarganini rag'batlantiramiz.
  const clean = (attempt.hintsUsed ?? 0) === 0

  const streakCorrect = attempt.isCorrect
    ? clean
      ? mastery.streakCorrect + 1
      : mastery.streakCorrect
    : 0
  const streakWrong = attempt.isCorrect ? 0 : mastery.streakWrong + 1

  const pMastery = updateMastery(mastery.pMastery, attempt.isCorrect, params)

  const proposed = nextDifficulty({
    currentDifficulty: mastery.currentDifficulty,
    streakCorrect,
    streakWrong,
  })

  const currentDifficulty = adaptive ? proposed : clampDifficulty(mastery.currentDifficulty)
  const leveledUp = currentDifficulty > mastery.currentDifficulty
  const leveledDown = currentDifficulty < mastery.currentDifficulty

  // Daraja o'zgargach seriyalar nolga tushadi — yangi darajada toza sanoq
  const resetStreaks = leveledUp || leveledDown

  const mastered = isMastered(pMastery)

  return {
    pMastery,
    currentDifficulty,
    streakCorrect: resetStreaks ? 0 : streakCorrect,
    streakWrong: resetStreaks ? 0 : streakWrong,
    attempts: mastery.attempts + 1,
    correct: mastery.correct + (attempt.isCorrect ? 1 : 0),
    leveledUp,
    leveledDown,
    needsReteach: adaptive && !attempt.isCorrect && streakWrong >= ADAPTIVE.LEVEL_DOWN_STREAK,
    mastered,
    justMastered: mastered && !wasMastered,
  }
}

/* ------------------------------------------------------------------ */
/* Keyingi mashqni tanlash                                             */
/* ------------------------------------------------------------------ */

export type SelectableItem = ItemDoc & WithId

export interface PickOptions {
  /** Faqat shu ko'nikma (berilmasa — barcha). */
  skill?: Skill
  /** Faqat shu mavzu. */
  topic?: string
  /** Qidiruv oynasi maksimal kengligi (difficulty ± window). */
  maxWindow?: number
  /** Tasodifiylik uchun tanlash funksiyasi (testda deterministik qilish oson). */
  random?: () => number
}

export interface PickResult {
  item: SelectableItem | null
  /** Qanchalik kengaytirishga to'g'ri keldi (0 = aynan mos difficulty). */
  window: number
  /** Barcha itemlar ko'rib chiqilgan bo'lsa — takrorlashga ruxsat berildi. */
  reused: boolean
}

/**
 * Keyingi mashqni tanlash (PLAN 6, "Chiqish: keyingi item").
 *
 * Strategiya:
 *   1. Faqat `status === 'approved'` itemlar (o'qituvchi tasdig'i — human-in-the-loop).
 *   2. Skill/topic filtri.
 *   3. Yaqinda ko'rilganlarni (`recentItemIds`) chetlab o'tish — takrorlanish emas,
 *      yangi kontekstda mashq qilish muhim.
 *   4. Aynan `currentDifficulty` dagi itemlardan tanlash; topilmasa oynani
 *      bosqichma-bosqich kengaytirish (±1, ±2 …).
 *   5. Hech narsa qolmasa — eng eski ko'rilganini qayta beramiz (`reused: true`),
 *      chunki bo'sh ekran ko'rsatishdan ko'ra takrorlash foydaliroq.
 */
export function pickNextItem(
  items: readonly SelectableItem[],
  mastery: Pick<MasteryState, 'currentDifficulty'>,
  recentItemIds: readonly string[] = [],
  options: PickOptions = {}
): PickResult {
  const {
    skill,
    topic,
    maxWindow = ADAPTIVE.MAX_DIFFICULTY - ADAPTIVE.MIN_DIFFICULTY,
    random = Math.random,
  } = options

  const target = clampDifficulty(mastery.currentDifficulty)
  const recent = new Set(recentItemIds)

  const eligible = items.filter((item) => {
    if (item.status !== 'approved') return false
    if (skill && item.skill !== skill) return false
    if (topic && item.topic !== topic) return false
    return true
  })

  if (!eligible.length) return { item: null, window: 0, reused: false }

  const unseen = eligible.filter((item) => !recent.has(item.id))
  const pool = unseen.length ? unseen : eligible

  for (let window = 0; window <= maxWindow; window += 1) {
    const candidates = pool.filter(
      (item) => Math.abs(clampDifficulty(item.difficulty) - target) <= window
    )
    if (candidates.length) {
      const index = Math.floor(clamp01(random()) * candidates.length)
      const chosen = candidates[Math.min(index, candidates.length - 1)]
      return { item: chosen, window, reused: unseen.length === 0 }
    }
  }

  // Nazariy jihatdan yetib kelmaydi (oyna 4 da hamma difficulty qamrab olinadi)
  return { item: pool[0] ?? null, window: maxWindow, reused: unseen.length === 0 }
}

/**
 * Bitta mashq sessiyasi uchun N ta item tanlash (Practice Zone).
 * Har tanlovdan keyin tanlangan item "ko'rilgan" ro'yxatiga qo'shiladi.
 */
export function pickSession(
  items: readonly SelectableItem[],
  mastery: Pick<MasteryState, 'currentDifficulty'>,
  count: number,
  recentItemIds: readonly string[] = [],
  options: PickOptions = {}
): SelectableItem[] {
  const seen = [...recentItemIds]
  const out: SelectableItem[] = []
  for (let i = 0; i < count; i += 1) {
    const { item } = pickNextItem(items, mastery, seen, options)
    if (!item || out.some((existing) => existing.id === item.id)) break
    out.push(item)
    seen.push(item.id)
  }
  return out
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(0.999999, Math.max(0, value))
}
