import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BKT_PARAMS,
  attemptsToMastery,
  initialMastery,
  isMastered,
  masteryToScore,
  predictCorrect,
  updateMastery,
  updateMasterySequence,
} from '@/lib/adaptive/bkt'

/**
 * BKT testlari — PLAN 6.4.
 * Kutilgan qiymatlar QO'LDA hisoblangan (izohlarda formulasi bilan), shuning
 * uchun kod o'zgarsa test darhol xato beradi.
 */
describe('bkt — initialMastery', () => {
  it('diagnostika bali berilmasa pInit (0.25) qaytaradi', () => {
    expect(initialMastery()).toBe(DEFAULT_BKT_PARAMS.pInit)
    expect(initialMastery(Number.NaN)).toBe(DEFAULT_BKT_PARAMS.pInit)
  })

  it('0 ball → pInit, 100 ball → 0.9 (chiziqli interpolyatsiya)', () => {
    expect(initialMastery(0)).toBeCloseTo(0.25, 10)
    expect(initialMastery(100)).toBeCloseTo(0.9, 10)
    // 50 ball → 0.25 + 0.5·(0.9 − 0.25) = 0.575
    expect(initialMastery(50)).toBeCloseTo(0.575, 10)
  })

  it('chegaradan tashqari ballar [0,1] ga siqiladi', () => {
    expect(initialMastery(1000)).toBeCloseTo(0.9, 10)
    expect(initialMastery(-50)).toBeCloseTo(0.25, 10)
  })
})

describe('bkt — updateMastery (qo‘lda hisoblangan qiymatlar)', () => {
  it("to'g'ri javob: 0.25 → 0.636364", () => {
    // posterior = (0.25·0.9) / (0.25·0.9 + 0.75·0.25) = 0.225/0.4125 = 0.545455
    // P(L') = 0.545455 + (1 − 0.545455)·0.2 = 0.636364
    expect(updateMastery(0.25, true)).toBeCloseTo(0.636364, 6)
  })

  it('xato javob: 0.25 → 0.234043', () => {
    // posterior = (0.25·0.1) / (0.25·0.1 + 0.75·0.75) = 0.025/0.5875 = 0.042553
    // P(L') = 0.042553 + (1 − 0.042553)·0.2 = 0.234043
    expect(updateMastery(0.25, false)).toBeCloseTo(0.234043, 6)
  })

  it("to'g'ri javob pMastery ni oshiradi, xato — kamaytiradi", () => {
    expect(updateMastery(0.5, true)).toBeGreaterThan(0.5)
    expect(updateMastery(0.5, false)).toBeLessThan(0.5)
  })
})

describe('bkt — chegaralar (bounds)', () => {
  it('natija har doim [0,1] oralig‘ida', () => {
    for (const p of [-5, -0.1, 0, 0.5, 1, 1.4, 99]) {
      for (const correct of [true, false]) {
        const next = updateMastery(p, correct)
        expect(next).toBeGreaterThanOrEqual(0)
        expect(next).toBeLessThanOrEqual(1)
      }
    }
  })

  it('p = 1 da to‘g‘ri javob 1 dan oshib ketmaydi', () => {
    expect(updateMastery(1, true)).toBeCloseTo(1, 10)
  })

  it('NaN kirish pInit sifatida talqin qilinadi', () => {
    expect(updateMastery(Number.NaN, true)).toBeCloseTo(updateMastery(0.25, true), 10)
  })
})

describe('bkt — konvergensiya', () => {
  it("ketma-ket to'g'ri javoblar bilan mastery 0.85 dan oshadi", () => {
    const after5 = updateMasterySequence(0.25, [true, true, true, true, true])
    expect(after5).toBeGreaterThanOrEqual(0.85)
    expect(after5).toBeLessThanOrEqual(1)
    expect(isMastered(after5)).toBe(true)
  })

  it("to'g'ri javoblar ketma-ketligi qat'iy o'sib boradi", () => {
    let p = 0.25
    const seq: number[] = []
    for (let i = 0; i < 4; i += 1) {
      p = updateMastery(p, true)
      seq.push(p)
    }
    for (let i = 1; i < seq.length; i += 1) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1])
    }
  })

  it('ketma-ket xatolar past qiymatga yaqinlashadi va manfiy bo‘lmaydi', () => {
    const after10 = updateMasterySequence(0.9, Array.from({ length: 10 }, () => false))
    expect(after10).toBeLessThan(0.3)
    expect(after10).toBeGreaterThanOrEqual(0)
  })

  it('bo‘sh ketma-ketlik holatni o‘zgartirmaydi', () => {
    expect(updateMasterySequence(0.42, [])).toBeCloseTo(0.42, 10)
  })
})

describe('bkt — yordamchi funksiyalar', () => {
  it('isMastered chegarasi 0.85', () => {
    expect(isMastered(0.85)).toBe(true)
    expect(isMastered(0.8499)).toBe(false)
    expect(isMastered(1)).toBe(true)
    expect(isMastered(0)).toBe(false)
  })

  it('predictCorrect: p=1 → 1−pSlip, p=0 → pGuess', () => {
    expect(predictCorrect(1)).toBeCloseTo(0.9, 10)
    expect(predictCorrect(0)).toBeCloseTo(0.25, 10)
    // p = 0.5 → 0.5·0.9 + 0.5·0.25 = 0.575
    expect(predictCorrect(0.5)).toBeCloseTo(0.575, 10)
  })

  it('masteryToScore 0..100 butun son', () => {
    expect(masteryToScore(0)).toBe(0)
    expect(masteryToScore(1)).toBe(100)
    expect(masteryToScore(0.856)).toBe(86)
    expect(masteryToScore(2)).toBe(100)
  })

  it('attemptsToMastery: allaqachon o‘zlashtirilgan bo‘lsa 0', () => {
    expect(attemptsToMastery(0.9)).toBe(0)
  })

  it('attemptsToMastery: 0.25 dan bir necha qadam kerak', () => {
    const steps = attemptsToMastery(0.25)
    expect(steps).toBeGreaterThan(0)
    expect(steps).toBeLessThan(10)
  })
})
