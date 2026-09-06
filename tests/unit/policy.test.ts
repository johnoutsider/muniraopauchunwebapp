import { describe, expect, it } from 'vitest'

import {
  applyAttempt,
  difficultyToCefr,
  emptyMasteryState,
  nextDifficulty,
  pickNextItem,
  pickSession,
  startingDifficulty,
  type MasteryState,
} from '@/lib/adaptive/policy'
import { makeItem, makeItemsByDifficulty } from '../factories'

/**
 * Adaptiv siyosat testlari — PLAN 6.1–6.3, 6.8.
 * Asosiy qoidalar: 3 to'g'ri → +1, 2 xato → −1, chegara [1..5].
 */

function state(overrides: Partial<MasteryState> = {}): MasteryState {
  return {
    pMastery: 0.5,
    currentDifficulty: 3,
    streakCorrect: 0,
    streakWrong: 0,
    attempts: 0,
    correct: 0,
    ...overrides,
  }
}

describe('policy — nextDifficulty', () => {
  it("3 ta ketma-ket to'g'ri → daraja +1", () => {
    expect(nextDifficulty({ currentDifficulty: 2, streakCorrect: 3, streakWrong: 0 })).toBe(3)
  })

  it('2 ta ketma-ket xato → daraja −1', () => {
    expect(nextDifficulty({ currentDifficulty: 3, streakCorrect: 0, streakWrong: 2 })).toBe(2)
  })

  it('2 ta to‘g‘ri yoki 1 ta xato darajani o‘zgartirmaydi', () => {
    expect(nextDifficulty({ currentDifficulty: 3, streakCorrect: 2, streakWrong: 0 })).toBe(3)
    expect(nextDifficulty({ currentDifficulty: 3, streakCorrect: 0, streakWrong: 1 })).toBe(3)
  })

  it('maksimum 5 dan oshmaydi', () => {
    expect(nextDifficulty({ currentDifficulty: 5, streakCorrect: 9, streakWrong: 0 })).toBe(5)
  })

  it('minimum 1 dan tushmaydi', () => {
    expect(nextDifficulty({ currentDifficulty: 1, streakCorrect: 0, streakWrong: 7 })).toBe(1)
  })

  it('chegaradan tashqari kirish qiymatlari siqiladi', () => {
    expect(nextDifficulty({ currentDifficulty: 99, streakCorrect: 0, streakWrong: 0 })).toBe(5)
    expect(nextDifficulty({ currentDifficulty: -3, streakCorrect: 0, streakWrong: 0 })).toBe(1)
  })
})

describe('policy — startingDifficulty va difficultyToCefr', () => {
  it('diagnostika bali → boshlang‘ich daraja', () => {
    expect(startingDifficulty(0)).toBe(1)
    expect(startingDifficulty(19)).toBe(1)
    expect(startingDifficulty(20)).toBe(2)
    expect(startingDifficulty(45)).toBe(3)
    expect(startingDifficulty(79)).toBe(4)
    expect(startingDifficulty(80)).toBe(5)
    expect(startingDifficulty(100)).toBe(5)
  })

  it('noto‘g‘ri kirish uchun xavfsiz standart (2)', () => {
    expect(startingDifficulty(Number.NaN)).toBe(2)
  })

  it('difficulty → CEFR', () => {
    expect(difficultyToCefr(1)).toBe('A2')
    expect(difficultyToCefr(5)).toBe('C1')
    expect(difficultyToCefr(99)).toBe('C1')
  })
})

describe('policy — emptyMasteryState', () => {
  it('diagnostika baliga mos boshlang‘ich holat', () => {
    const fresh = emptyMasteryState(80)
    expect(fresh.currentDifficulty).toBe(5)
    // initialMastery(80) = 0.25 + 0.8·(0.9 − 0.25) = 0.77
    expect(fresh.pMastery).toBeCloseTo(0.77, 6)
    expect(fresh.attempts).toBe(0)
    expect(fresh.streakCorrect).toBe(0)
  })
})

describe('policy — applyAttempt: daraja oshishi', () => {
  it("3 ta ketma-ket to'g'ri javobdan keyin daraja oshadi va seriyalar nollanadi", () => {
    let current = state({ currentDifficulty: 2 })
    let outcome = applyAttempt(current, { isCorrect: true })
    expect(outcome.leveledUp).toBe(false)
    expect(outcome.streakCorrect).toBe(1)

    current = outcome
    outcome = applyAttempt(current, { isCorrect: true })
    expect(outcome.leveledUp).toBe(false)
    expect(outcome.streakCorrect).toBe(2)

    current = outcome
    outcome = applyAttempt(current, { isCorrect: true })
    expect(outcome.leveledUp).toBe(true)
    expect(outcome.currentDifficulty).toBe(3)
    expect(outcome.streakCorrect).toBe(0)
    expect(outcome.streakWrong).toBe(0)
    expect(outcome.attempts).toBe(3)
    expect(outcome.correct).toBe(3)
  })

  it('5-darajada daraja oshmaydi (clamping)', () => {
    const outcome = applyAttempt(state({ currentDifficulty: 5, streakCorrect: 2 }), {
      isCorrect: true,
    })
    expect(outcome.currentDifficulty).toBe(5)
    expect(outcome.leveledUp).toBe(false)
  })
})

describe('policy — applyAttempt: daraja tushishi va reteach', () => {
  it('2 ta ketma-ket xatodan keyin daraja tushadi va tushuntirish so‘raladi', () => {
    let outcome = applyAttempt(state({ currentDifficulty: 3 }), { isCorrect: false })
    expect(outcome.leveledDown).toBe(false)
    expect(outcome.needsReteach).toBe(false)
    expect(outcome.streakWrong).toBe(1)

    outcome = applyAttempt(outcome, { isCorrect: false })
    expect(outcome.leveledDown).toBe(true)
    expect(outcome.needsReteach).toBe(true)
    expect(outcome.currentDifficulty).toBe(2)
    expect(outcome.streakWrong).toBe(0)
  })

  it('1-darajada daraja tushmaydi (clamping)', () => {
    const outcome = applyAttempt(state({ currentDifficulty: 1, streakWrong: 1 }), {
      isCorrect: false,
    })
    expect(outcome.currentDifficulty).toBe(1)
    expect(outcome.leveledDown).toBe(false)
  })

  it("to'g'ri javob xato seriyasini nolga tushiradi", () => {
    const outcome = applyAttempt(state({ streakWrong: 1 }), { isCorrect: true })
    expect(outcome.streakWrong).toBe(0)
    expect(outcome.streakCorrect).toBe(1)
  })
})

describe('policy — nazorat guruhi (adaptive: false)', () => {
  it('daraja o‘zgarmaydi va reteach ko‘rsatilmaydi, lekin pMastery hisoblanadi', () => {
    let outcome = applyAttempt(state({ currentDifficulty: 3 }), { isCorrect: false }, { adaptive: false })
    outcome = applyAttempt(outcome, { isCorrect: false }, { adaptive: false })

    expect(outcome.currentDifficulty).toBe(3)
    expect(outcome.leveledDown).toBe(false)
    expect(outcome.needsReteach).toBe(false)
    expect(outcome.pMastery).toBeLessThan(0.5)
    expect(outcome.attempts).toBe(2)
  })
})

describe('policy — hint bilan javob', () => {
  it("yordam ishlatilgan to'g'ri javob seriyani oshirmaydi", () => {
    const outcome = applyAttempt(state({ streakCorrect: 2 }), { isCorrect: true, hintsUsed: 1 })
    expect(outcome.streakCorrect).toBe(2)
    expect(outcome.leveledUp).toBe(false)
    expect(outcome.correct).toBe(1)
  })
})

describe('policy — justMastered', () => {
  it("mastery chegarasidan birinchi marta o'tganda bayroq ko'tariladi", () => {
    const first = applyAttempt(state({ pMastery: 0.8 }), { isCorrect: true })
    expect(first.mastered).toBe(true)
    expect(first.justMastered).toBe(true)

    const second = applyAttempt(first, { isCorrect: true })
    expect(second.mastered).toBe(true)
    expect(second.justMastered).toBe(false)
  })
})

describe('policy — pickNextItem', () => {
  const always0 = () => 0

  it('aynan mos qiyinlikdagi itemni tanlaydi (window = 0)', () => {
    const items = makeItemsByDifficulty([1, 2, 3, 4, 5])
    const result = pickNextItem(items, { currentDifficulty: 3 }, [], { random: always0 })
    expect(result.item?.difficulty).toBe(3)
    expect(result.window).toBe(0)
    expect(result.reused).toBe(false)
  })

  it('tasdiqlanmagan (draft) itemlarni chetlab o‘tadi', () => {
    const items = [
      makeItem({ id: 'draft', difficulty: 3, status: 'draft' }),
      makeItem({ id: 'ok', difficulty: 3, status: 'approved' }),
    ]
    const result = pickNextItem(items, { currentDifficulty: 3 }, [], { random: always0 })
    expect(result.item?.id).toBe('ok')
  })

  it('mos item bo‘lmasa null qaytaradi', () => {
    const items = [makeItem({ id: 'x', status: 'rejected' })]
    expect(pickNextItem(items, { currentDifficulty: 3 }).item).toBeNull()
    expect(pickNextItem([], { currentDifficulty: 3 }).item).toBeNull()
  })

  it('skill va topic bo‘yicha filtrlaydi', () => {
    const items = [
      makeItem({ id: 'g', difficulty: 3, skill: 'grammar', topic: 'present_perfect' }),
      makeItem({ id: 'v', difficulty: 3, skill: 'vocabulary', topic: 'finance' }),
    ]
    expect(
      pickNextItem(items, { currentDifficulty: 3 }, [], { skill: 'vocabulary', random: always0 })
        .item?.id
    ).toBe('v')
    expect(
      pickNextItem(items, { currentDifficulty: 3 }, [], { topic: 'present_perfect', random: always0 })
        .item?.id
    ).toBe('g')
  })

  it("yaqinda ko'rilgan itemni takrorlamaydi", () => {
    const items = [
      makeItem({ id: 'a', difficulty: 3 }),
      makeItem({ id: 'b', difficulty: 3 }),
    ]
    const result = pickNextItem(items, { currentDifficulty: 3 }, ['a'], { random: always0 })
    expect(result.item?.id).toBe('b')
    expect(result.reused).toBe(false)
  })

  it("hamma item ko'rilgan bo'lsa takrorlashga ruxsat beradi (reused)", () => {
    const items = [makeItem({ id: 'a', difficulty: 3 })]
    const result = pickNextItem(items, { currentDifficulty: 3 }, ['a'], { random: always0 })
    expect(result.item?.id).toBe('a')
    expect(result.reused).toBe(true)
  })

  it('mos qiyinlik yo‘q bo‘lsa oynani kengaytiradi', () => {
    const items = makeItemsByDifficulty([5])
    const result = pickNextItem(items, { currentDifficulty: 1 }, [], { random: always0 })
    expect(result.item?.difficulty).toBe(5)
    expect(result.window).toBe(4)
  })
})

describe('policy — pickSession', () => {
  it('takrorlanmaydigan N ta item beradi', () => {
    const items = makeItemsByDifficulty([3, 3, 3, 3])
    const session = pickSession(items, { currentDifficulty: 3 }, 3, [], { random: () => 0 })
    expect(session).toHaveLength(3)
    expect(new Set(session.map((item) => item.id)).size).toBe(3)
  })

  it('item yetmasa borini qaytaradi', () => {
    const items = makeItemsByDifficulty([3])
    const session = pickSession(items, { currentDifficulty: 3 }, 5, [], { random: () => 0 })
    expect(session).toHaveLength(1)
  })
})
