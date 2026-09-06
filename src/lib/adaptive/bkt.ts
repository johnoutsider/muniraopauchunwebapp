/**
 * Bayesian Knowledge Tracing (BKT) — soddalashtirilgan model.
 * PLAN.md 6-bo'lim, 4-qoida.
 *
 * PEDAGOGIK MAQSAD:
 * Talabaning bir ko'nikma (masalan `grammar.present_perfect`) bo'yicha "bilim
 * ehtimoli" ni (`pMastery`) har urinishdan keyin yangilab boradi. Bu bir nechta
 * to'g'ri javobni tasodifiy topib olishdan ("guess") va bilgan holda xato
 * qilishdan ("slip") ajratib turadi — shu sababli oddiy "to'g'ri javoblar
 * foizi" dan ancha adolatliroq.
 *
 * MODEL PARAMETRLARI (`ADAPTIVE.BKT`):
 *   pInit  = 0.25 — o'rganishdan oldingi boshlang'ich bilim ehtimoli P(L_0)
 *   pLearn = 0.20 — har urinishdan keyin o'rganib olish ehtimoli P(T)
 *   pGuess = 0.25 — bilmasdan to'g'ri topish ehtimoli P(G)   (4 variantli MCQ ≈ 1/4)
 *   pSlip  = 0.10 — bilgan holda xato qilish ehtimoli P(S)
 *
 * FORMULALAR:
 *
 * 1) Kuzatuvdan keyingi posterior (Bayes qoidasi):
 *
 *    To'g'ri javob berilganda:
 *                              P(L) · (1 − P(S))
 *      P(L | correct) = ───────────────────────────────────────
 *                        P(L) · (1 − P(S)) + (1 − P(L)) · P(G)
 *
 *    Xato javob berilganda:
 *                              P(L) · P(S)
 *      P(L | wrong)   = ───────────────────────────────────────────
 *                        P(L) · P(S) + (1 − P(L)) · (1 − P(G))
 *
 * 2) O'rganish (transition) qadami — kuzatuvdan keyin talaba mavzuni
 *    o'zlashtirib olishi mumkin:
 *
 *      P(L_{n+1}) = P(L | obs) + (1 − P(L | obs)) · P(T)
 *
 * 3) Keyingi urinishda to'g'ri javob berish ehtimoli (prognoz uchun):
 *
 *      P(correct) = P(L) · (1 − P(S)) + (1 − P(L)) · P(G)
 *
 * Modul TOZA (pure) — Firestore, React yoki `server-only` importlari yo'q,
 * shuning uchun unit-testda ham, brauzerda ham ishlaydi.
 */

import { ADAPTIVE } from '@/config/constants'

/** BKT parametrlari to'plami. */
export interface BktParams {
  /** P(L_0) — boshlang'ich bilim ehtimoli */
  pInit: number
  /** P(T) — o'rganib olish ehtimoli */
  pLearn: number
  /** P(G) — bilmasdan to'g'ri topish ehtimoli */
  pGuess: number
  /** P(S) — bilgan holda xato qilish ehtimoli */
  pSlip: number
}

/** `constants.ts` dagi standart parametrlar (PLAN 6.4). */
export const DEFAULT_BKT_PARAMS: BktParams = {
  pInit: ADAPTIVE.BKT.pInit,
  pLearn: ADAPTIVE.BKT.pLearn,
  pGuess: ADAPTIVE.BKT.pGuess,
  pSlip: ADAPTIVE.BKT.pSlip,
}

/** Ehtimolni [0,1] oralig'ida ushlab turish (raqamli barqarorlik uchun). */
function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * Boshlang'ich pMastery.
 * Diagnostika bali berilgan bo'lsa (0–100), P(L_0) shunga qarab siljitiladi:
 * kuchli talaba nolinchi darajadan boshlamasligi kerak.
 */
export function initialMastery(
  diagnosticScore?: number,
  params: BktParams = DEFAULT_BKT_PARAMS
): number {
  if (diagnosticScore === undefined || !Number.isFinite(diagnosticScore)) return params.pInit
  const normalised = clamp01(diagnosticScore / 100)
  // pInit va 0.9 orasida chiziqli interpolyatsiya
  return clamp01(params.pInit + normalised * (0.9 - params.pInit))
}

/**
 * Bitta urinishdan keyin pMastery ni yangilash (posterior + transition).
 *
 * @param pMastery joriy P(L_n), 0..1
 * @param isCorrect javob to'g'rimi
 * @param params    BKT parametrlari (test uchun almashtirish mumkin)
 * @returns yangi P(L_{n+1}), 0..1
 */
export function updateMastery(
  pMastery: number,
  isCorrect: boolean,
  params: BktParams = DEFAULT_BKT_PARAMS
): number {
  const pL = clamp01(Number.isFinite(pMastery) ? pMastery : params.pInit)
  const { pLearn, pGuess, pSlip } = params

  let posterior: number
  if (isCorrect) {
    const numerator = pL * (1 - pSlip)
    const denominator = numerator + (1 - pL) * pGuess
    posterior = denominator > 0 ? numerator / denominator : pL
  } else {
    const numerator = pL * pSlip
    const denominator = numerator + (1 - pL) * (1 - pGuess)
    posterior = denominator > 0 ? numerator / denominator : pL
  }

  // O'rganish qadami: kuzatuvdan keyin mavzuni o'zlashtirib olish mumkin
  return clamp01(posterior + (1 - posterior) * pLearn)
}

/**
 * Bir nechta urinishni ketma-ket qo'llash (masalan diagnostika bo'limi yoki
 * migratsiya paytida tarixni qayta hisoblash).
 */
export function updateMasterySequence(
  pMastery: number,
  results: readonly boolean[],
  params: BktParams = DEFAULT_BKT_PARAMS
): number {
  return results.reduce((p, isCorrect) => updateMastery(p, isCorrect, params), clamp01(pMastery))
}

/**
 * Ko'nikma "o'zlashtirilgan" deb hisoblanadimi?
 * PLAN 6.4: pMastery ≥ 0.85 → Learning Path keyingi qadamga o'tadi.
 */
export function isMastered(
  pMastery: number,
  threshold: number = ADAPTIVE.MASTERY_THRESHOLD
): boolean {
  return clamp01(pMastery) >= threshold
}

/**
 * Keyingi urinishda to'g'ri javob berish ehtimoli (prognoz).
 * Progress dashboard va `predictProgress` uchun.
 */
export function predictCorrect(pMastery: number, params: BktParams = DEFAULT_BKT_PARAMS): number {
  const pL = clamp01(pMastery)
  return clamp01(pL * (1 - params.pSlip) + (1 - pL) * params.pGuess)
}

/**
 * pMastery → 0..100 ball (UI progress bar va statistika uchun).
 * Chiziqli, ammo talabaga tushunarli bo'lsin deb butun songa yaxlitlanadi.
 */
export function masteryToScore(pMastery: number): number {
  return Math.round(clamp01(pMastery) * 100)
}

/**
 * O'zlashtirishgacha taxminan yana nechta to'g'ri javob kerak.
 * "Yana 3 ta to'g'ri javob — va bu mavzu yopiladi" xabari uchun.
 */
export function attemptsToMastery(
  pMastery: number,
  threshold: number = ADAPTIVE.MASTERY_THRESHOLD,
  params: BktParams = DEFAULT_BKT_PARAMS,
  maxSteps = 50
): number {
  let p = clamp01(pMastery)
  let steps = 0
  while (p < threshold && steps < maxSteps) {
    p = updateMastery(p, true, params)
    steps += 1
  }
  return steps
}
