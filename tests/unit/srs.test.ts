import { describe, expect, it } from 'vitest'

import {
  daysUntilDue,
  dueWords,
  isDue,
  newSrs,
  qualityFromAttempt,
  reviewWord,
  type SrsState,
} from '@/lib/adaptive/srs'

/**
 * SM-2 testlari — PLAN 6.6, 8.1.
 * Barcha kutilgan qiymatlar SuperMemo-2 formulasidan qo'lda hisoblangan:
 *   ease' = max(1.3, ease + 0.1 − (5 − q)·(0.08 + (5 − q)·0.02))
 */

const NOW = new Date('2027-02-01T09:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / DAY_MS)
}

describe('srs — newSrs', () => {
  it('yangi so‘z darhol takrorlashga tayyor', () => {
    const fresh = newSrs(NOW)
    expect(fresh.interval).toBe(0)
    expect(fresh.ease).toBeCloseTo(2.5, 10)
    expect(fresh.reps).toBe(0)
    expect(fresh.lapses).toBe(0)
    expect(fresh.due.getTime()).toBe(NOW.getTime())
  })
})

describe('srs — oraliqlar 1 → 6 → ease bilan kengayadi', () => {
  it('birinchi muvaffaqiyatli takrorlash → 1 kun', () => {
    const first = reviewWord(null, 5, NOW)
    expect(first.reps).toBe(1)
    expect(first.interval).toBe(1)
    // ease: 2.5 + 0.1 − 0 = 2.6
    expect(first.ease).toBeCloseTo(2.6, 10)
    expect(daysBetween(first.due, NOW)).toBe(1)
  })

  it('ikkinchi takrorlash → 6 kun', () => {
    const first = reviewWord(null, 5, NOW)
    const second = reviewWord(first, 5, NOW)
    expect(second.reps).toBe(2)
    expect(second.interval).toBe(6)
    expect(second.ease).toBeCloseTo(2.7, 10)
    expect(daysBetween(second.due, NOW)).toBe(6)
  })

  it('uchinchi takrorlash → oldingi oraliq × ease (6 × 2.8 = 17 kun)', () => {
    const third = reviewWord(reviewWord(reviewWord(null, 5, NOW), 5, NOW), 5, NOW)
    expect(third.reps).toBe(3)
    expect(third.ease).toBeCloseTo(2.8, 10)
    expect(third.interval).toBe(17)
    expect(daysBetween(third.due, NOW)).toBe(17)
  })

  it('oraliq har takrorlashda o‘sib boradi', () => {
    let srs = reviewWord(null, 5, NOW)
    const intervals: number[] = [srs.interval]
    for (let i = 0; i < 4; i += 1) {
      srs = reviewWord(srs, 5, NOW)
      intervals.push(srs.interval)
    }
    for (let i = 1; i < intervals.length; i += 1) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1])
    }
  })
})

describe('srs — ease koeffitsienti', () => {
  it('q = 4 ease ni o‘zgartirmaydi (delta = 0)', () => {
    const result = reviewWord(null, 4, NOW)
    expect(result.ease).toBeCloseTo(2.5, 10)
  })

  it('q = 3 ease ni 0.14 ga kamaytiradi', () => {
    const result = reviewWord(null, 3, NOW)
    expect(result.ease).toBeCloseTo(2.36, 10)
  })

  it('q = 5 ease ni 0.1 ga oshiradi', () => {
    expect(reviewWord(null, 5, NOW).ease).toBeCloseTo(2.6, 10)
  })

  it('ease hech qachon 1.3 dan pastga tushmaydi', () => {
    let srs: SrsState = newSrs(NOW)
    for (let i = 0; i < 6; i += 1) {
      srs = reviewWord(srs, 0, NOW)
    }
    expect(srs.ease).toBeCloseTo(1.3, 10)
  })
})

describe('srs — unutish (lapse)', () => {
  it('q < 3 → reps nolga tushadi, oraliq 1 kun, lapses oshadi', () => {
    const learned = reviewWord(reviewWord(reviewWord(null, 5, NOW), 5, NOW), 5, NOW)
    expect(learned.interval).toBe(17)

    const lapsed = reviewWord(learned, 1, NOW)
    expect(lapsed.reps).toBe(0)
    expect(lapsed.interval).toBe(1)
    expect(lapsed.lapses).toBe(1)
    expect(daysBetween(lapsed.due, NOW)).toBe(1)
  })

  it('lapses to‘planib boradi', () => {
    const once = reviewWord(null, 0, NOW)
    const twice = reviewWord(once, 2, NOW)
    expect(once.lapses).toBe(1)
    expect(twice.lapses).toBe(2)
  })

  it('unutgandan keyin qayta o‘rganish 1 → 6 tartibida boshlanadi', () => {
    const lapsed = reviewWord(reviewWord(reviewWord(null, 5, NOW), 5, NOW), 1, NOW)
    const again = reviewWord(lapsed, 5, NOW)
    expect(again.reps).toBe(1)
    expect(again.interval).toBe(1)
  })
})

describe('srs — noto‘g‘ri kirish qiymatlari', () => {
  it('quality chegaradan tashqarida bo‘lsa [0,5] ga siqiladi', () => {
    expect(reviewWord(null, 99, NOW).interval).toBe(1)
    expect(reviewWord(null, -5, NOW).lapses).toBe(1)
    expect(reviewWord(null, Number.NaN, NOW).lapses).toBe(1)
  })

  it('buzilgan holat standart qiymatlar bilan tiklanadi', () => {
    const broken = {
      interval: Number.NaN,
      ease: Number.NaN,
      due: 'x',
      reps: Number.NaN,
      lapses: Number.NaN,
    } as unknown as SrsState
    const result = reviewWord(broken, 5, NOW)
    expect(Number.isFinite(result.interval)).toBe(true)
    expect(result.reps).toBe(1)
    expect(result.lapses).toBe(0)
    expect(result.ease).toBeCloseTo(2.6, 10)
  })
})

describe('srs — isDue / daysUntilDue / dueWords', () => {
  it('holati yo‘q so‘z darhol muddatli', () => {
    expect(isDue(null, NOW)).toBe(true)
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it('kelajakdagi sana → muddati kelmagan', () => {
    const future = reviewWord(null, 5, NOW)
    expect(isDue({ ...future, due: future.due }, NOW)).toBe(false)
    expect(isDue({ ...future, due: future.due }, new Date(NOW.getTime() + 2 * DAY_MS))).toBe(true)
  })

  it('daysUntilDue kunlarni to‘g‘ri sanaydi', () => {
    const srs = reviewWord(null, 5, NOW)
    expect(daysUntilDue(srs, NOW)).toBe(1)
    expect(daysUntilDue(srs, new Date(NOW.getTime() + 3 * DAY_MS))).toBe(-2)
  })

  it('dueWords eng ko‘p kechikkanini birinchi qaytaradi va limitni hurmat qiladi', () => {
    const words = [
      { id: 'a', srs: { ...newSrs(NOW), due: new Date(NOW.getTime() - 1 * DAY_MS) } },
      { id: 'b', srs: { ...newSrs(NOW), due: new Date(NOW.getTime() - 5 * DAY_MS) } },
      { id: 'c', srs: { ...newSrs(NOW), due: new Date(NOW.getTime() + 5 * DAY_MS) } },
    ]
    const due = dueWords(words, NOW, 10)
    expect(due.map((word) => word.id)).toEqual(['b', 'a'])
    expect(dueWords(words, NOW, 1).map((word) => word.id)).toEqual(['b'])
    expect(dueWords(words, NOW, 0)).toHaveLength(0)
  })
})

describe('srs — qualityFromAttempt', () => {
  it("to'g'ri, yordamsiz va tez → 5", () => {
    expect(qualityFromAttempt(true, 0, 3000)).toBe(5)
  })

  it("to'g'ri, lekin sekin (>15s) → 4", () => {
    expect(qualityFromAttempt(true, 0, 20_000)).toBe(4)
  })

  it("to'g'ri, lekin yordam bilan → 3 (hali ham takrorlash davom etadi)", () => {
    expect(qualityFromAttempt(true, 1, 1000)).toBe(3)
  })

  it('xato → 3 dan past (lapse)', () => {
    expect(qualityFromAttempt(false, 0)).toBeLessThan(3)
    expect(qualityFromAttempt(false, 2)).toBeLessThan(3)
  })
})
