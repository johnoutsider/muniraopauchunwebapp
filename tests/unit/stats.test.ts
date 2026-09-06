import { describe, expect, it } from 'vitest'

import {
  cohensD,
  describe as describeStats,
  effectSizeLabel,
  formatP,
  gain,
  gainPercent,
  independentTTest,
  mean,
  normalizeScore,
  normalizedGain,
  pairedTTest,
  pearson,
  sd,
  tCritical95,
} from '@/lib/analytics/stats'

/**
 * Statistika testlari — PLAN 8.18, 9.
 * Kutilgan qiymatlar QO'LDA hisoblangan (izohlarda). Bu modul dissertatsiyaning
 * dastlabki tahlilini beradi, shuning uchun har bir formulaning to'g'riligi
 * alohida tekshiriladi.
 */

describe('stats — mean va sd', () => {
  it("o'rtacha arifmetik", () => {
    // (2+4+4+4+5+5+7+9) / 8 = 40 / 8 = 5
    expect(mean([2, 4, 4, 4, 5, 5, 7, 9])).toBe(5)
    expect(mean([1, 2, 3, 4, 5])).toBe(3)
  })

  it('tanlanma standart og‘ishi (n − 1)', () => {
    // [1..5]: devs² = 4+1+0+1+4 = 10; 10/(5−1) = 2.5; √2.5 = 1.5811388
    expect(sd([1, 2, 3, 4, 5])).toBeCloseTo(1.5811388, 6)
    // [2,4,4,4,5,5,7,9]: Σdevs² = 32; 32/7 = 4.5714286; √ = 2.1380899
    expect(sd([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.1380899, 6)
  })

  it('bo‘sh va bir elementli massivlarda 0 (xato bermaydi)', () => {
    expect(mean([])).toBe(0)
    expect(sd([])).toBe(0)
    expect(sd([42])).toBe(0)
  })

  it('NaN/Infinity qiymatlarni chetlab o‘tadi', () => {
    expect(mean([1, Number.NaN, 3, Number.POSITIVE_INFINITY])).toBe(2)
  })
})

describe('stats — describe (deskriptiv jamlanma)', () => {
  it('n, mean, sd, min, max, median, se, ci95', () => {
    const result = describeStats([1, 2, 3, 4, 5])
    expect(result.n).toBe(5)
    expect(result.mean).toBe(3)
    expect(result.sd).toBeCloseTo(1.5811, 4)
    expect(result.min).toBe(1)
    expect(result.max).toBe(5)
    expect(result.median).toBe(3)
    // se = 1.5811388 / √5 = 0.7071068
    expect(result.se).toBeCloseTo(0.7071, 4)
    // ci95 = 3 ± t(4)·se = 3 ± 2.776·0.7071068 = 3 ± 1.9629
    expect(result.ci95[0]).toBeCloseTo(1.0371, 3)
    expect(result.ci95[1]).toBeCloseTo(4.9629, 3)
  })

  it('bo‘sh massiv uchun nol jamlanma', () => {
    const result = describeStats([])
    expect(result).toEqual({ n: 0, mean: 0, sd: 0, min: 0, max: 0, median: 0, se: 0, ci95: [0, 0] })
  })
})

describe('stats — pairedTTest (pre/post)', () => {
  const pre = [50, 55, 60, 65, 70]
  const post = [60, 62, 75, 70, 80]

  /*
   * d_i          = [10, 7, 15, 5, 10]
   * mean(d)      = 47 / 5 = 9.4
   * Σ(d − d̄)²   = 0.36 + 5.76 + 31.36 + 19.36 + 0.36 = 57.2
   * sd(d)        = √(57.2 / 4) = √14.3 = 3.7815344
   * t            = 9.4 / (3.7815344 / √5) = 9.4 / 1.6911558 = 5.5583
   * df           = 4
   * d_z          = 9.4 / 3.7815344 = 2.4858
   */
  it('t, df va o‘rtachalar qo‘lda hisoblangan qiymatlarga mos', () => {
    const result = pairedTTest(pre, post)
    expect(result.test).toBe('paired')
    expect(result.n1).toBe(5)
    expect(result.df).toBe(4)
    expect(result.meanA).toBe(60)
    expect(result.meanB).toBe(69.4)
    expect(result.meanDiff).toBeCloseTo(9.4, 6)
    expect(result.t).toBeCloseTo(5.5583, 3)
    expect(result.d).toBeCloseTo(2.4858, 3)
  })

  it('p < 0.05 → statistik ahamiyatli', () => {
    const result = pairedTTest(pre, post)
    expect(result.p).toBeGreaterThan(0)
    expect(result.p).toBeLessThan(0.05)
    expect(result.significant).toBe(true)
  })

  it('o‘zgarish bo‘lmasa t = 0 va ahamiyatsiz', () => {
    const result = pairedTTest([50, 60, 70], [50, 60, 70])
    expect(result.t).toBe(0)
    expect(result.meanDiff).toBe(0)
    expect(result.significant).toBe(false)
  })

  it('juftlik yetarli bo‘lmasa xavfsiz bo‘sh natija', () => {
    const result = pairedTTest([50], [60])
    expect(result.p).toBe(1)
    expect(result.significant).toBe(false)
    expect(result.t).toBe(0)
  })

  it('teng bo‘lmagan uzunlikda faqat juftlashgan qismini oladi', () => {
    const result = pairedTTest([50, 55, 60, 65, 70, 80], [60, 62, 75, 70, 80])
    expect(result.n1).toBe(5)
  })
})

describe('stats — independentTTest (Welch, guruhlararo)', () => {
  /*
   * a: mean 14, s² = 10, n = 5 → s²/n = 2
   * b: mean 24, s² = 10, n = 5 → s²/n = 2
   * t  = (24 − 14) / √(2 + 2) = 10 / 2 = 5
   * df = (2 + 2)² / (2²/4 + 2²/4) = 16 / 2 = 8
   */
  it('Welch t va df qo‘lda hisoblangan qiymatlarga mos', () => {
    const result = independentTTest([10, 12, 14, 16, 18], [20, 22, 24, 26, 28])
    expect(result.test).toBe('welch')
    expect(result.meanA).toBe(14)
    expect(result.meanB).toBe(24)
    expect(result.t).toBeCloseTo(5, 6)
    expect(result.df).toBeCloseTo(8, 6)
    expect(result.significant).toBe(true)
  })

  it('bir xil guruhlar → farq yo‘q', () => {
    const result = independentTTest([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])
    expect(result.meanDiff).toBe(0)
    expect(result.t).toBe(0)
    expect(result.significant).toBe(false)
  })
})

describe("stats — cohensD (effekt hajmi)", () => {
  /*
   * a: mean 14, s² = 10, n = 5
   * b: mean 18, s² = 10, n = 5
   * s_pooled = √((4·10 + 4·10) / 8) = √10 = 3.1622777
   * d = (18 − 14) / 3.1622777 = 1.2649
   */
  it('birlashtirilgan SD bilan hisoblanadi', () => {
    expect(cohensD([10, 12, 14, 16, 18], [14, 16, 18, 20, 22])).toBeCloseTo(1.2649, 4)
  })

  it('bir xil guruhlarda d = 0', () => {
    expect(cohensD([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(0)
  })

  it('teskari yo‘nalishda manfiy', () => {
    expect(cohensD([14, 16, 18, 20, 22], [10, 12, 14, 16, 18])).toBeCloseTo(-1.2649, 4)
  })

  it('ma‘lumot yetarli bo‘lmasa 0', () => {
    expect(cohensD([1], [2])).toBe(0)
    expect(cohensD([], [])).toBe(0)
  })

  it('Cohen (1988) talqin yorliqlari', () => {
    expect(effectSizeLabel(0.1)).toBe('negligible')
    expect(effectSizeLabel(0.3)).toBe('small')
    expect(effectSizeLabel(0.6)).toBe('medium')
    expect(effectSizeLabel(1.2649)).toBe('large')
    expect(effectSizeLabel(-0.9)).toBe('large')
  })
})

describe('stats — korrelyatsiya', () => {
  it('mukammal musbat bog‘liqlik r = 1', () => {
    const result = pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])
    expect(result.r).toBeCloseTo(1, 6)
    expect(result.n).toBe(5)
    expect(result.df).toBe(3)
  })

  it('mukammal manfiy bog‘liqlik r = −1', () => {
    expect(pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]).r).toBeCloseTo(-1, 6)
  })

  it('dispersiya nol bo‘lsa r = 0 (xato emas)', () => {
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4]).r).toBe(0)
  })

  it('3 tadan kam juftlikda 0', () => {
    expect(pearson([1, 2], [2, 4]).r).toBe(0)
  })
})

describe('stats — ball normalizatsiyasi va gain', () => {
  it('normalizeScore 0–100 ga keltiradi', () => {
    expect(normalizeScore(30, 40)).toBe(75)
    expect(normalizeScore(40, 40)).toBe(100)
    expect(normalizeScore(0, 40)).toBe(0)
    expect(normalizeScore(10, 0)).toBe(0)
  })

  it('gain = post − pre', () => {
    expect(gain(50, 65)).toBe(15)
    expect(gain(65, 50)).toBe(-15)
  })

  it('gainPercent nolga bo‘lishdan himoyalangan', () => {
    expect(gainPercent(50, 65)).toBe(30)
    expect(gainPercent(0, 10)).toBe(100)
    expect(gainPercent(0, 0)).toBe(0)
  })

  it('normalizedGain (Hake) tavan effektini hisobga oladi', () => {
    // (60 − 40) / (100 − 40) = 0.333
    expect(normalizedGain(40, 60)).toBeCloseTo(0.333, 3)
    // (95 − 90) / (100 − 90) = 0.5 — kichik o'sish, lekin yuqori <g>
    expect(normalizedGain(90, 95)).toBeCloseTo(0.5, 3)
    expect(normalizedGain(100, 100)).toBe(0)
  })
})

describe('stats — hisobot formatlash', () => {
  it('formatP APA uslubida', () => {
    expect(formatP(0.0005)).toBe('p < .001')
    expect(formatP(0.032)).toBe('p = .032')
    expect(formatP(Number.NaN)).toBe('—')
  })

  it('tCritical95 jadval qiymatlari', () => {
    expect(tCritical95(4)).toBeCloseTo(2.776, 3)
    expect(tCritical95(30)).toBeCloseTo(2.042, 3)
    expect(tCritical95(1000)).toBeCloseTo(1.96, 3)
  })
})
