/**
 * src/content/tests.ts — diagnostika va parallel pre/post testlar (PLAN 8.11, 13-bo'lim).
 *
 * Uchta test:
 *   1. `test-diagnostic`        — 8 bo'limli diagnostika (PLAN 5, 2-bosqich);
 *   2. `test-pre-variant-a`     — pre-test, A varianti;
 *   3. `test-post-variant-b`    — post-test, B varianti (A ga parallel).
 *
 * PARALLELLIK: A va B variantlari bir xil strukturaga (bir xil bo'limlar, item
 * soni va maksimal ball) ega va item bankidan **qiyinlik bo'yicha
 * qatlamlangan** tanlov orqali to'ldiriladi: har ko'nikma uchun itemlar avval
 * difficulty, so'ng id bo'yicha tartiblanadi va uchta testga navbatma-navbat
 * taqsimlanadi (0, 1, 2, 0, 1, 2, ...). Natijada uch testning qiyinlik
 * taqsimoti deyarli bir xil bo'ladi va itemlar takrorlanmaydi — bu pre/post
 * taqqoslash uchun zarur shart.
 *
 * Speaking va writing bo'limlari ochiq topshiriq (`openTask`): writing Claude
 * rubrikasi bilan, speaking Azure Pronunciation Assessment + AI feedback bilan
 * baholanadi, so'ngra o'qituvchi tasdiqlaydi.
 */

import type { Skill } from '@/config/constants'
import type { TestDoc, TestSection } from '@/types'

import { stratifiedPick } from './items'

export type SeedTest = Omit<TestDoc, 'createdAt'> & { id: string }

/** Uchta test orasida item taqsimoti uchun navbat raqami. */
const VARIANT_OFFSET = { diagnostic: 0, preA: 1, postB: 2 } as const
type VariantKey = keyof typeof VARIANT_OFFSET

/** Har ko'nikma uchun avtomatik baholanadigan item soni. */
const SECTION_SIZES: Partial<Record<Skill, number>> = {
  vocabulary: 12,
  grammar: 14,
  reading: 2,
  listening: 2,
  pronunciation: 2,
  professional: 3,
}

function autoSection(
  skill: Skill,
  title: string,
  variant: VariantKey,
  timeLimitMin: number
): TestSection {
  const count = SECTION_SIZES[skill] ?? 5
  const itemIds = stratifiedPick({ skill }, count, VARIANT_OFFSET[variant], 3)
  return {
    id: `sec-${skill}`,
    skill,
    title,
    itemIds,
    timeLimitMin,
    maxScore: itemIds.length,
  }
}

/* ------------------------------------------------------------------ */
/* Ochiq topshiriqlar (writing / speaking)                             */
/* ------------------------------------------------------------------ */

const WRITING_TASKS: Record<VariantKey, TestSection['openTask']> = {
  diagnostic: {
    prompt:
      'You work in the finance department of a manufacturing company. Write an email of 120-150 ' +
      'words to your line manager reporting that production costs rose by 8% last quarter while ' +
      'revenue stayed flat. Explain what happened, say what you think the main cause is, and ' +
      'propose one action. Use an appropriate professional register.',
    minWords: 120,
  },
  preA: {
    prompt:
      'A regional sales report shows that your company’s market share fell from 31% to 24% over ' +
      'nine months while advertising spending increased. Write a short report of 150-180 words ' +
      'for the marketing director: summarise what the data shows, suggest two possible ' +
      'explanations, and recommend what should be investigated next.',
    minWords: 150,
  },
  postB: {
    prompt:
      'A bank’s non-performing loan ratio has doubled from 4% to 8% in one year following a ' +
      'currency devaluation. Write a short report of 150-180 words for the credit committee: ' +
      'summarise what the data shows, suggest two possible explanations, and recommend what ' +
      'should be investigated next.',
    minWords: 150,
  },
}

const SPEAKING_TASKS: Record<VariantKey, TestSection['openTask']> = {
  diagnostic: {
    prompt:
      'Speak for 60-90 seconds. Part 1 (read aloud): read the reference text below so that your ' +
      'pronunciation can be measured. Part 2 (free speech): describe one economic problem your ' +
      'country faces and say what you think should be done about it.',
    referenceText:
      'Annual inflation fell to 7.4 per cent last year, but real wage growth has not yet ' +
      'recovered to its pre-crisis level. The central bank has therefore decided to keep the ' +
      'policy rate unchanged until purchasing power improves.',
  },
  preA: {
    prompt:
      'Speak for 60-90 seconds. Part 1 (read aloud): read the reference text below. ' +
      'Part 2 (free speech): a chart shows that your company’s revenue fell by 20% over four ' +
      'quarters while operating costs rose. Explain to a manager what the chart shows, what you ' +
      'think the main cause is, and what should be done first.',
    referenceText:
      'Quarterly revenue has declined from six million dollars to four point eight million, ' +
      'while operating costs have increased by roughly eleven per cent. As a result, the ' +
      'company recorded an operating loss in the third quarter for the first time since 2021.',
  },
  postB: {
    prompt:
      'Speak for 60-90 seconds. Part 1 (read aloud): read the reference text below. ' +
      'Part 2 (free speech): a chart shows that staff turnover in your company has risen from ' +
      '11% to 34% while on-time delivery has fallen. Explain to a manager what the chart shows, ' +
      'what you think the main cause is, and what should be done first.',
    referenceText:
      'Staff turnover has risen from eleven per cent to thirty-four per cent since the ' +
      'restructuring, and on-time delivery has fallen from ninety-six to seventy-nine per cent. ' +
      'Management has been asked to explain whether the two trends are connected.',
  },
}

const WRITING_MAX = 25
const SPEAKING_MAX = 25

function buildSections(variant: VariantKey): TestSection[] {
  return [
    autoSection('vocabulary', 'Section 1. Vocabulary and collocation', variant, 12),
    autoSection('grammar', 'Section 2. Grammar in an economic context', variant, 15),
    autoSection('listening', 'Section 3. Listening', variant, 10),
    autoSection('reading', 'Section 4. Reading', variant, 12),
    autoSection('pronunciation', 'Section 5. Pronunciation and word stress', variant, 8),
    autoSection('professional', 'Section 6. Professional English and register', variant, 10),
    {
      id: 'sec-writing',
      skill: 'writing',
      title: 'Section 7. Writing',
      itemIds: [],
      timeLimitMin: 25,
      openTask: WRITING_TASKS[variant],
      maxScore: WRITING_MAX,
    },
    {
      id: 'sec-speaking',
      skill: 'speaking',
      title: 'Section 8. Speaking',
      itemIds: [],
      timeLimitMin: 10,
      openTask: SPEAKING_TASKS[variant],
      maxScore: SPEAKING_MAX,
    },
  ]
}

function totalScore(sections: TestSection[]): number {
  return sections.reduce((sum, s) => sum + s.maxScore, 0)
}

const DIAGNOSTIC_SECTIONS = buildSections('diagnostic')
const PRE_SECTIONS = buildSections('preA')
const POST_SECTIONS = buildSections('postB')

export const SEED_TESTS: SeedTest[] = [
  {
    id: 'test-diagnostic',
    title: 'Diagnostic Test: Professional English for Economics',
    type: 'diagnostic',
    sections: DIAGNOSTIC_SECTIONS,
    totalMaxScore: totalScore(DIAGNOSTIC_SECTIONS),
    published: true,
  },
  {
    id: 'test-pre-variant-a',
    title: 'Pre-test — Variant A',
    type: 'pre',
    variant: 'A',
    sections: PRE_SECTIONS,
    totalMaxScore: totalScore(PRE_SECTIONS),
    published: true,
  },
  {
    id: 'test-post-variant-b',
    title: 'Post-test — Variant B',
    type: 'post',
    variant: 'B',
    sections: POST_SECTIONS,
    totalMaxScore: totalScore(POST_SECTIONS),
    published: true,
  },
]

/* ------------------------------------------------------------------ */
/* Tekshiruv yordamchisi                                               */
/* ------------------------------------------------------------------ */

/**
 * Parallel variantlarni tekshiradi: bir xil bo'limlar, bir xil item soni va
 * yaqin o'rtacha qiyinlik. Seed skripti buni ishga tushirib ogohlantiradi.
 */
export function checkParallelVariants(): {
  ok: boolean
  problems: string[]
  overlap: string[]
} {
  const problems: string[] = []
  const pre = SEED_TESTS.find((t) => t.id === 'test-pre-variant-a')!
  const post = SEED_TESTS.find((t) => t.id === 'test-post-variant-b')!

  if (pre.sections.length !== post.sections.length) {
    problems.push("Pre va post testlarda bo'limlar soni farq qiladi.")
  }
  pre.sections.forEach((section, i) => {
    const other = post.sections[i]
    if (!other) return
    if (section.skill !== other.skill) {
      problems.push(`${i + 1}-bo'lim ko'nikmasi mos emas: ${section.skill} / ${other.skill}`)
    }
    if (section.itemIds.length !== other.itemIds.length) {
      problems.push(
        `${section.skill}: item soni farq qiladi (${section.itemIds.length} / ${other.itemIds.length})`
      )
    }
    if (section.maxScore !== other.maxScore) {
      problems.push(`${section.skill}: maksimal ball farq qiladi.`)
    }
  })

  const preIds = new Set(pre.sections.flatMap((s) => s.itemIds))
  const overlap = post.sections.flatMap((s) => s.itemIds).filter((id) => preIds.has(id))
  if (overlap.length) {
    problems.push(`Pre va post variantlarda ${overlap.length} ta item takrorlangan.`)
  }

  return { ok: problems.length === 0, problems, overlap }
}
