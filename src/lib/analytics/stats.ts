/**
 * Ilmiy statistika — in-app dastlabki tahlil (PLAN.md 8.18).
 *
 * MUHIM ILMIY IZOH:
 * Bu modul tadqiqotchiga NATIJANI TEZDA KO'RISH imkonini beradi (dashboard
 * grafiklari, guruhlararo taqqoslash, pre/post o'sish). YAKUNIY va rasmiy
 * tahlil — dissertatsiyada keltiriladigan raqamlar — SPSS'da bajariladi
 * (9-bo'lim eksporti). Shuning uchun bu yerdagi p-qiymatlar APPROKSIMATSIYA
 * (pastda batafsil izohlangan) va ular ilmiy ishda birlamchi manba
 * sifatida keltirilmaydi.
 *
 * Modul TOZA (pure): Firestore yo'q, faqat `simple-statistics` +
 * o'z raqamli funksiyalarimiz. Unit-test qilinadi.
 */

import {
  max as ssMax,
  mean as ssMean,
  median as ssMedian,
  min as ssMin,
  sampleCorrelation,
  sampleStandardDeviation,
} from 'simple-statistics'

/* ------------------------------------------------------------------ */
/* Tiplar                                                              */
/* ------------------------------------------------------------------ */

export interface Describe {
  n: number
  mean: number
  sd: number
  min: number
  max: number
  median: number
  /** O'rtachaning standart xatosi: sd / √n */
  se: number
  /** 95% ishonch oralig'i (t taqsimoti bo'yicha) */
  ci95: [number, number]
}

export interface TTestResult {
  t: number
  df: number
  /** Ikki tomonlama p (approksimatsiya — pastdagi izohga qarang) */
  p: number
  meanA: number
  meanB: number
  /** O'rtachalar farqi (B − A: post − pre yoki eksperimental − nazorat) */
  meanDiff: number
  n1: number
  n2: number
  /** Effekt hajmi (Cohen's d) */
  d: number
  /** `p < 0.05` */
  significant: boolean
  /** Qaysi test bajarilgani (hisobotda ko'rsatiladi) */
  test: 'paired' | 'welch'
}

export interface CorrelationResult {
  r: number
  n: number
  /** df = n − 2 */
  df: number
  t: number
  p: number
  significant: boolean
}

export interface MannWhitneyResult {
  u: number
  u1: number
  u2: number
  z: number
  p: number
  n1: number
  n2: number
  medianA: number
  medianB: number
  /** Rank-biserial korrelyatsiya — noparametrik effekt hajmi */
  effectSize: number
  significant: boolean
}

/* ------------------------------------------------------------------ */
/* Asosiy deskriptiv statistika                                        */
/* ------------------------------------------------------------------ */

function clean(values: readonly number[]): number[] {
  return values.filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  )
}

/** O'rtacha arifmetik. Bo'sh massivda 0. */
export function mean(values: readonly number[]): number {
  const data = clean(values)
  return data.length ? ssMean(data) : 0
}

/** Tanlanma standart og'ishi (n − 1). Bo'sh yoki bitta qiymatda 0. */
export function sd(values: readonly number[]): number {
  const data = clean(values)
  return data.length > 1 ? sampleStandardDeviation(data) : 0
}

/** To'liq deskriptiv jamlanma — dashboard kartalari va jadvallar uchun. */
export function describe(values: readonly number[]): Describe {
  const data = clean(values)
  const n = data.length
  if (!n) {
    return { n: 0, mean: 0, sd: 0, min: 0, max: 0, median: 0, se: 0, ci95: [0, 0] }
  }
  const m = ssMean(data)
  const s = n > 1 ? sampleStandardDeviation(data) : 0
  const se = n > 1 ? s / Math.sqrt(n) : 0
  const crit = n > 1 ? tCritical95(n - 1) : 0
  return {
    n,
    mean: round(m),
    sd: round(s),
    min: ssMin(data),
    max: ssMax(data),
    median: round(ssMedian(data)),
    se: round(se),
    ci95: [round(m - crit * se), round(m + crit * se)],
  }
}

/* ------------------------------------------------------------------ */
/* t-testlar                                                           */
/* ------------------------------------------------------------------ */

/**
 * Bog'liq (paired) t-test — bir xil talabalarning PRE va POST ballari.
 * Eksperimentning asosiy ichki-guruh tahlili (PLAN 8.18, 9.2).
 *
 *   d_i = post_i − pre_i
 *   t = mean(d) / (sd(d) / √n),   df = n − 1
 *
 * Massivlar bir xil uzunlikda va bir xil tartibda bo'lishi SHART
 * (i-element — bitta talaba).
 */
export function pairedTTest(pre: readonly number[], post: readonly number[]): TTestResult {
  const pairs: Array<[number, number]> = []
  const length = Math.min(pre.length, post.length)
  for (let i = 0; i < length; i += 1) {
    if (Number.isFinite(pre[i]) && Number.isFinite(post[i])) pairs.push([pre[i], post[i]])
  }

  const n = pairs.length
  const preValues = pairs.map((pair) => pair[0])
  const postValues = pairs.map((pair) => pair[1])
  const meanA = mean(preValues)
  const meanB = mean(postValues)

  if (n < 2) {
    return emptyTTest('paired', meanA, meanB, n, n)
  }

  const diffs = pairs.map(([a, b]) => b - a)
  const meanDiff = ssMean(diffs)
  const sdDiff = sampleStandardDeviation(diffs)
  const df = n - 1
  const t = sdDiff === 0 ? (meanDiff === 0 ? 0 : Infinity) : meanDiff / (sdDiff / Math.sqrt(n))
  const p = Number.isFinite(t) ? tTestPValue(t, df) : 0

  return {
    t: round(t),
    df,
    p: round(p, 6),
    meanA: round(meanA),
    meanB: round(meanB),
    meanDiff: round(meanDiff),
    n1: n,
    n2: n,
    // Bog'liq namunalar uchun Cohen's d_z = mean(d) / sd(d)
    d: sdDiff === 0 ? 0 : round(meanDiff / sdDiff),
    significant: p < 0.05,
    test: 'paired',
  }
}

/**
 * Mustaqil namunalar uchun WELCH t-testi (teng bo'lmagan dispersiya).
 * Eksperimental vs nazorat guruhini taqqoslash (PLAN 8.18).
 *
 *   t = (mean_b − mean_a) / √(s²_a/n_a + s²_b/n_b)
 *
 *   Welch–Satterthwaite erkinlik darajasi:
 *          (s²_a/n_a + s²_b/n_b)²
 *   df = ─────────────────────────────────────────
 *        (s²_a/n_a)²/(n_a−1) + (s²_b/n_b)²/(n_b−1)
 *
 * Welch tanlangan, chunki guruhlar hajmi (masalan 100 va 95) va tarqoqligi
 * odatda teng bo'lmaydi — Student t-testidan ko'ra ishonchliroq.
 */
export function independentTTest(a: readonly number[], b: readonly number[]): TTestResult {
  const dataA = clean(a)
  const dataB = clean(b)
  const n1 = dataA.length
  const n2 = dataB.length
  const meanA = mean(dataA)
  const meanB = mean(dataB)

  if (n1 < 2 || n2 < 2) return emptyTTest('welch', meanA, meanB, n1, n2)

  const varA = sampleStandardDeviation(dataA) ** 2
  const varB = sampleStandardDeviation(dataB) ** 2
  const sA = varA / n1
  const sB = varB / n2
  const denominator = Math.sqrt(sA + sB)

  const t = denominator === 0 ? (meanB - meanA === 0 ? 0 : Infinity) : (meanB - meanA) / denominator
  const dfDenominator = sA ** 2 / (n1 - 1) + sB ** 2 / (n2 - 1)
  const df = dfDenominator === 0 ? n1 + n2 - 2 : (sA + sB) ** 2 / dfDenominator
  const p = Number.isFinite(t) ? tTestPValue(t, df) : 0

  return {
    t: round(t),
    df: round(df, 2),
    p: round(p, 6),
    meanA: round(meanA),
    meanB: round(meanB),
    meanDiff: round(meanB - meanA),
    n1,
    n2,
    d: cohensD(dataA, dataB),
    significant: p < 0.05,
    test: 'welch',
  }
}

function emptyTTest(
  test: TTestResult['test'],
  meanA: number,
  meanB: number,
  n1: number,
  n2: number
): TTestResult {
  return {
    t: 0,
    df: 0,
    p: 1,
    meanA: round(meanA),
    meanB: round(meanB),
    meanDiff: round(meanB - meanA),
    n1,
    n2,
    d: 0,
    significant: false,
    test,
  }
}

/**
 * Cohen's d — effekt hajmi (birlashtirilgan/pooled SD bilan).
 *
 *   s_pooled = √( ((n_a−1)·s²_a + (n_b−1)·s²_b) / (n_a + n_b − 2) )
 *   d = (mean_b − mean_a) / s_pooled
 *
 * Talqin (Cohen 1988): 0.2 kichik, 0.5 o'rta, 0.8 katta.
 */
export function cohensD(a: readonly number[], b: readonly number[]): number {
  const dataA = clean(a)
  const dataB = clean(b)
  if (dataA.length < 2 || dataB.length < 2) return 0
  const varA = sampleStandardDeviation(dataA) ** 2
  const varB = sampleStandardDeviation(dataB) ** 2
  const pooled = Math.sqrt(
    ((dataA.length - 1) * varA + (dataB.length - 1) * varB) / (dataA.length + dataB.length - 2)
  )
  if (pooled === 0) return 0
  return round((ssMean(dataB) - ssMean(dataA)) / pooled)
}

/** Cohen's d ni o'zbekcha yorliqqa aylantirish (hisobot matni uchun). */
export function effectSizeLabel(d: number): 'negligible' | 'small' | 'medium' | 'large' {
  const abs = Math.abs(d)
  if (abs < 0.2) return 'negligible'
  if (abs < 0.5) return 'small'
  if (abs < 0.8) return 'medium'
  return 'large'
}

/* ------------------------------------------------------------------ */
/* Korrelyatsiya                                                       */
/* ------------------------------------------------------------------ */

/**
 * Pearson korrelyatsiyasi + ahamiyatlilik testi.
 * PLAN 8.18: "korrelyatsiya (AI interaction ↔ gain)".
 *
 *   t = r · √((n − 2) / (1 − r²)),  df = n − 2
 */
export function pearson(x: readonly number[], y: readonly number[]): CorrelationResult {
  const pairs: Array<[number, number]> = []
  const length = Math.min(x.length, y.length)
  for (let i = 0; i < length; i += 1) {
    if (Number.isFinite(x[i]) && Number.isFinite(y[i])) pairs.push([x[i], y[i]])
  }
  const n = pairs.length
  if (n < 3) return { r: 0, n, df: Math.max(0, n - 2), t: 0, p: 1, significant: false }

  const xs = pairs.map((pair) => pair[0])
  const ys = pairs.map((pair) => pair[1])

  // Dispersiya nol bo'lsa korrelyatsiya aniqlanmagan
  if (sampleStandardDeviation(xs) === 0 || sampleStandardDeviation(ys) === 0) {
    return { r: 0, n, df: n - 2, t: 0, p: 1, significant: false }
  }

  const r = sampleCorrelation(xs, ys)
  const df = n - 2
  const t = Math.abs(r) >= 1 ? Infinity : r * Math.sqrt(df / (1 - r * r))
  const p = Number.isFinite(t) ? tTestPValue(t, df) : 0

  return { r: round(r), n, df, t: round(t), p: round(p, 6), significant: p < 0.05 }
}

/* ------------------------------------------------------------------ */
/* Mann–Whitney U (noparametrik)                                       */
/* ------------------------------------------------------------------ */

/**
 * Mann–Whitney U testi — normal taqsimlanmagan ballar uchun
 * (masalan Likert so'rovnoma yoki kichik guruhlar; PLAN 8.18).
 *
 *   U_1 = R_1 − n_1(n_1+1)/2 ,  U = min(U_1, U_2)
 *
 * p — normal approksimatsiya (n ≥ ~10 da yaxshi ishlaydi), bog'lanishlar
 * (ties) uchun dispersiya tuzatiladi:
 *
 *   μ_U = n_1·n_2/2
 *   σ²_U = (n_1·n_2/12) · [ (N+1) − Σ(t³−t)/(N(N−1)) ]
 *   z = (U − μ_U ± 0.5) / σ_U        (uzluksizlik tuzatishi bilan)
 */
export function mannWhitneyU(a: readonly number[], b: readonly number[]): MannWhitneyResult {
  const dataA = clean(a)
  const dataB = clean(b)
  const n1 = dataA.length
  const n2 = dataB.length

  if (!n1 || !n2) {
    return {
      u: 0,
      u1: 0,
      u2: 0,
      z: 0,
      p: 1,
      n1,
      n2,
      medianA: n1 ? ssMedian(dataA) : 0,
      medianB: n2 ? ssMedian(dataB) : 0,
      effectSize: 0,
      significant: false,
    }
  }

  const combined = [
    ...dataA.map((value) => ({ value, group: 0 })),
    ...dataB.map((value) => ({ value, group: 1 })),
  ].sort((x, y) => x.value - y.value)

  // O'rtacha ranglar (ties → bir xil o'rtacha rank)
  const ranks = new Array<number>(combined.length)
  const tieGroups: number[] = []
  let i = 0
  while (i < combined.length) {
    let j = i
    while (j + 1 < combined.length && combined[j + 1].value === combined[i].value) j += 1
    const avgRank = (i + j + 2) / 2 // ranklar 1 dan boshlanadi
    for (let k = i; k <= j; k += 1) ranks[k] = avgRank
    if (j > i) tieGroups.push(j - i + 1)
    i = j + 1
  }

  let rankSumA = 0
  for (let k = 0; k < combined.length; k += 1) {
    if (combined[k].group === 0) rankSumA += ranks[k]
  }

  const u1 = rankSumA - (n1 * (n1 + 1)) / 2
  const u2 = n1 * n2 - u1
  const u = Math.min(u1, u2)

  const N = n1 + n2
  const muU = (n1 * n2) / 2
  const tieCorrection = tieGroups.reduce((sum, t) => sum + (t ** 3 - t), 0)
  const varU = N > 1 ? ((n1 * n2) / 12) * (N + 1 - tieCorrection / (N * (N - 1))) : 0
  const sigma = Math.sqrt(Math.max(varU, 0))

  const z = sigma === 0 ? 0 : (u - muU + 0.5) / sigma
  const p = sigma === 0 ? 1 : 2 * normalCdf(-Math.abs(z))

  return {
    u,
    u1,
    u2,
    z: round(z),
    p: round(p, 6),
    n1,
    n2,
    medianA: round(ssMedian(dataA)),
    medianB: round(ssMedian(dataB)),
    // Rank-biserial r = 1 − 2U/(n1·n2)
    effectSize: round(1 - (2 * u) / (n1 * n2)),
    significant: p < 0.05,
  }
}

/* ------------------------------------------------------------------ */
/* Ball normalizatsiyasi va o'sish (gain)                              */
/* ------------------------------------------------------------------ */

/** Xom ballni 0–100 shkalasiga keltirish (bo'limlar maksimal bali har xil). */
export function normalizeScore(raw: number, max: number): number {
  if (!Number.isFinite(raw) || !Number.isFinite(max) || max <= 0) return 0
  return round(Math.min(100, Math.max(0, (raw / max) * 100)), 2)
}

/** Absolyut o'sish: post − pre. */
export function gain(pre: number, post: number): number {
  if (!Number.isFinite(pre) || !Number.isFinite(post)) return 0
  return round(post - pre, 2)
}

/**
 * Nisbiy o'sish, %: (post − pre) / pre × 100.
 * `pre = 0` bo'lsa nolga bo'linmaydi — 0 dan boshlab o'sganda 100% qaytadi.
 */
export function gainPercent(pre: number, post: number): number {
  if (!Number.isFinite(pre) || !Number.isFinite(post)) return 0
  if (pre === 0) return post > 0 ? 100 : 0
  return round(((post - pre) / pre) * 100, 2)
}

/**
 * Normalizatsiyalangan o'sish (Hake gain) — ta'lim tadqiqotlarida keng
 * ishlatiladi: <g> = (post − pre) / (max − pre).
 * "Tavan effekti" ni hisobga oladi: 90 dan 95 ga o'sish 40 dan 45 ga
 * o'sishdan qiyinroq.
 */
export function normalizedGain(pre: number, post: number, maxScore = 100): number {
  if (!Number.isFinite(pre) || !Number.isFinite(post)) return 0
  const room = maxScore - pre
  if (room <= 0) return 0
  return round((post - pre) / room, 3)
}

/* ------------------------------------------------------------------ */
/* p-qiymat approksimatsiyasi                                          */
/* ------------------------------------------------------------------ */

/**
 * APPROKSIMATSIYA HAQIDA (muhim, dissertatsiya metodologiyasi uchun).
 *
 * Student t taqsimotining ikki tomonlama p-qiymati regulyarlashtirilgan
 * to'liqsiz beta funksiyasi orqali hisoblanadi:
 *
 *   p = I_x(df/2, 1/2),   bu yerda x = df / (df + t²)
 *
 * `I_x` (incomplete beta) Lentz'ning uzluksiz kasr (continued fraction)
 * algoritmi bilan hisoblanadi (Numerical Recipes, 6.4-bo'lim), log-gamma
 * uchun Lanczos approksimatsiyasi ishlatiladi.
 *
 * ANIQLIK: tipik df (10–400) va |t| < 20 oralig'ida xato ≈ 1e-10 dan kichik,
 * ya'ni amalda "aniq" qiymat. Cheklovlar:
 *   • juda katta |t| (> 40) da p 0 ga yaxlitlanadi ("p < 0.001" deb ko'rsating);
 *   • uzluksiz kasr 200 iteratsiyada yaqinlashmasa, natija taxminiy bo'ladi.
 *
 * Shunga qaramay, DISSERTATSIYADA KELTIRILADIGAN p-qiymatlar SPSS'dan
 * olinadi (9.3-bo'lim eksporti) — bu yerdagi qiymat faqat platformadagi
 * tezkor ko'rish uchun.
 */
export function tTestPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return 1
  const x = df / (df + t * t)
  const p = incompleteBeta(x, df / 2, 0.5)
  return Math.min(1, Math.max(0, p))
}

/** Standart normal taqsimotning kumulyativ funksiyasi (Abramowitz–Stegun 7.1.26 asosida erf). */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

function erf(x: number): number {
  // Maksimal absolyut xato ≈ 1.5e-7 (Abramowitz & Stegun 7.1.26)
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * absX)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-absX * absX)
  return sign * y
}

/** log Γ(x) — Lanczos approksimatsiyasi (g = 7, n = 9). */
function logGamma(x: number): number {
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    // Refleksiya formulasi: Γ(x)Γ(1−x) = π / sin(πx)
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const z = x - 1
  let a = coefficients[0]
  const t = z + 7.5
  for (let i = 1; i < coefficients.length; i += 1) a += coefficients[i] / (z + i)
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Regulyarlashtirilgan to'liqsiz beta funksiyasi I_x(a, b). */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  )
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(x, a, b)) / a
  }
  return (
    1 -
    (Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + b * Math.log(1 - x) + a * Math.log(x)) *
      betaContinuedFraction(1 - x, b, a)) /
      b
  )
}

/** Lentz algoritmi — beta uzluksiz kasri. */
function betaContinuedFraction(x: number, a: number, b: number): number {
  const tiny = 1e-30
  const epsilon = 3e-12
  const qab = a + b
  const qap = a + 1
  const qam = a - 1

  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < tiny) d = tiny
  d = 1 / d
  let h = d

  for (let m = 1; m <= 200; m += 1) {
    const m2 = 2 * m
    // Juft qadam
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    h *= d * c
    // Toq qadam
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < epsilon) break
  }
  return h
}

/**
 * 95% ishonch oralig'i uchun t kritik qiymati (ikki tomonlama, α = 0.05).
 * Kichik df lar jadvaldan, kattalari uchun Cornish–Fisher tipidagi
 * approksimatsiya (z = 1.96 ga intiladi).
 */
export function tCritical95(df: number): number {
  const table: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    11: 2.201,
    12: 2.179,
    13: 2.16,
    14: 2.145,
    15: 2.131,
    16: 2.12,
    17: 2.11,
    18: 2.101,
    19: 2.093,
    20: 2.086,
    21: 2.08,
    22: 2.074,
    23: 2.069,
    24: 2.064,
    25: 2.06,
    26: 2.056,
    27: 2.052,
    28: 2.048,
    29: 2.045,
    30: 2.042,
    40: 2.021,
    50: 2.009,
    60: 2.0,
    80: 1.99,
    100: 1.984,
    120: 1.98,
  }
  const rounded = Math.round(df)
  if (table[rounded]) return table[rounded]
  if (rounded < 1) return 12.706
  if (rounded > 120) return 1.96
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b)
  const upper = keys.find((key) => key >= rounded) ?? 120
  const lower = [...keys].reverse().find((key) => key <= rounded) ?? 1
  if (upper === lower) return table[upper]
  const ratio = (rounded - lower) / (upper - lower)
  return table[lower] + ratio * (table[upper] - table[lower])
}

/** p-qiymatni hisobot uchun formatlash. */
export function formatP(p: number): string {
  if (!Number.isFinite(p)) return '—'
  if (p < 0.001) return 'p < .001'
  return `p = ${p.toFixed(3).replace(/^0/, '')}`
}

function round(value: number, digits = 4): number {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
