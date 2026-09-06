/**
 * SM-2 spaced repetition — lug'at takrorlash (PLAN.md 6-bo'lim, 6-qoida; 8.1).
 *
 * PEDAGOGIK MAQSAD:
 * Kasbiy terminlar (inflation, revenue, market share …) faqat bir marta
 * ko'rilganda unutiladi. SM-2 algoritmi har so'zni "unutish egri chizig'i"
 * bo'ylab — tobora uzayib boruvchi oraliqlarda — qaytaradi. Talaba
 * "Today's Tasks" da faqat MUDDATI KELGAN so'zlarni ko'radi, shuning uchun
 * kunlik yuk kichik, ammo uzoq muddatli eslab qolish sezilarli oshadi.
 *
 * ALGORITM (SuperMemo-2, Wozniak 1987 — soddalashtirilgan):
 *   quality q ∈ 0..5   (0 — umuman eslamadi, 5 — darhol va ishonch bilan)
 *
 *   ease' = ease + (0.1 − (5 − q) · (0.08 + (5 − q) · 0.02))
 *   ease' = max(ease', 1.3)
 *
 *   q < 3  (xato)  → reps = 0, lapses += 1, interval = 1 kun
 *   q ≥ 3  (to'g'ri) →
 *        reps = 1 → interval = 1 kun
 *        reps = 2 → interval = 6 kun
 *        reps > 2 → interval = round(oldingi interval × ease')
 *
 *   due = hozir + interval kun
 *
 * Modul TOZA (pure) — hech qanday tashqi kutubxona yoki Firestore yo'q.
 */

import { SRS } from '@/config/constants'
import type { TimeValue } from '@/types'
import { toDate } from '@/lib/utils/format'

const DAY_MS = 24 * 60 * 60 * 1000

/** Firestore'dagi `userVocab/{uid}/words/{wordId}.srs` shakli. */
export interface SrsState {
  /** Kunlarda */
  interval: number
  /** Osonlik koeffitsienti (≥ 1.3) */
  ease: number
  /** Keyingi takrorlash sanasi */
  due: TimeValue
  /** Muvaffaqiyatli ketma-ket takrorlashlar soni */
  reps: number
  /** Necha marta unutilgan (q < 3) */
  lapses: number
}

/** `reviewWord` natijasi — `due` aniq `Date` sifatida qaytadi. */
export interface SrsResult {
  interval: number
  ease: number
  due: Date
  reps: number
  lapses: number
}

/** 0–5 baholash shkalasining UI yorliqlari. */
export const SRS_QUALITY_LABELS: Record<number, { uz: string; en: string }> = {
  0: { uz: 'Umuman eslamadim', en: 'Blackout' },
  1: { uz: 'Noto‘g‘ri', en: 'Incorrect' },
  2: { uz: 'Qiyin bo‘ldi', en: 'Hard' },
  3: { uz: 'Zo‘rg‘a esladim', en: 'Difficult recall' },
  4: { uz: 'Esladim', en: 'Good' },
  5: { uz: 'Oson', en: 'Easy' },
}

/** Yangi so'z uchun boshlang'ich SRS holati. */
export function newSrs(now: Date = new Date()): SrsResult {
  return {
    interval: 0,
    ease: SRS.INITIAL_EASE,
    due: new Date(now.getTime()),
    reps: 0,
    lapses: 0,
  }
}

function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0
  return Math.min(5, Math.max(0, Math.round(quality)))
}

/**
 * Bitta takrorlashni qayd etish va keyingi muddatni hisoblash.
 *
 * @param srs          joriy holat (yo'q bo'lsa `newSrs()`)
 * @param quality0to5  talabaning o'z-o'zini baholashi yoki mashq natijasi
 * @param now          hozirgi vaqt (testda deterministik qilish uchun)
 */
export function reviewWord(
  srs: SrsState | null | undefined,
  quality0to5: number,
  now: Date = new Date()
): SrsResult {
  const state: SrsState = srs ?? newSrs(now)
  const q = clampQuality(quality0to5)

  // 1) Osonlik koeffitsienti
  const easeDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  const ease = Math.max(
    SRS.MIN_EASE,
    (Number.isFinite(state.ease) ? state.ease : SRS.INITIAL_EASE) + easeDelta
  )

  const prevInterval = Number.isFinite(state.interval) ? state.interval : 0
  const prevReps = Number.isFinite(state.reps) ? state.reps : 0
  const prevLapses = Number.isFinite(state.lapses) ? state.lapses : 0

  let reps: number
  let interval: number
  let lapses = prevLapses

  if (q < 3) {
    // Unutildi — noldan boshlanadi, ertaga yana ko'rsatiladi
    reps = 0
    interval = SRS.FIRST_INTERVAL_DAYS
    lapses = prevLapses + 1
  } else {
    reps = prevReps + 1
    if (reps === 1) interval = SRS.FIRST_INTERVAL_DAYS
    else if (reps === 2) interval = SRS.SECOND_INTERVAL_DAYS
    else interval = Math.max(1, Math.round((prevInterval || SRS.SECOND_INTERVAL_DAYS) * ease))
  }

  return {
    interval,
    ease: Math.round(ease * 1000) / 1000,
    due: new Date(now.getTime() + interval * DAY_MS),
    reps,
    lapses,
  }
}

/** So'z takrorlash muddati kelganmi? */
export function isDue(srs: SrsState | null | undefined, now: Date = new Date()): boolean {
  if (!srs) return true
  const due = toDate(srs.due)
  if (!due) return true
  return due.getTime() <= now.getTime()
}

/** Muddatigacha necha kun qolgan (manfiy = kechikkan). */
export function daysUntilDue(srs: SrsState | null | undefined, now: Date = new Date()): number {
  const due = toDate(srs?.due)
  if (!due) return 0
  return Math.round((due.getTime() - now.getTime()) / DAY_MS)
}

/**
 * Bugungi takrorlash ro'yxati: muddati kelgan so'zlar, eng ko'p kechikkani
 * birinchi. `limit` — kunlik yukni cheklash uchun (PLAN 8.1).
 */
export function dueWords<T extends { srs?: SrsState | null }>(
  words: readonly T[],
  now: Date = new Date(),
  limit = 20
): T[] {
  return words
    .filter((word) => isDue(word.srs, now))
    .sort((a, b) => (toDate(a.srs?.due)?.getTime() ?? 0) - (toDate(b.srs?.due)?.getTime() ?? 0))
    .slice(0, Math.max(0, limit))
}

/**
 * To'g'ri/xato javobni SM-2 sifat bahosiga aylantirish — avtomatik mashqlar
 * (matching, gap-fill) uchun, talaba o'zini baholamaganda.
 */
export function qualityFromAttempt(isCorrect: boolean, hintsUsed = 0, timeMs?: number): number {
  if (!isCorrect) return hintsUsed > 0 ? 1 : 2
  if (hintsUsed > 0) return 3
  if (timeMs !== undefined && timeMs > 15_000) return 4
  return 5
}
