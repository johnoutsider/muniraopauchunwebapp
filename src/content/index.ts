/**
 * src/content/index.ts — seed kontentning yagona kirish nuqtasi.
 *
 * Bu papka platformaning pedagogik yadrosi (PLAN 14-bo'lim, "Kontent tayyorlash
 * rejasi"): lug'at, grammatika darslari, mashq banki, case study'lar, role-play
 * stsenariylari, prompt mashqlari, so'rovnomalar, testlar, kurs/modul/darslar va
 * badge'lar. Hammasi `src/types/index.ts` dagi Firestore tiplariga mos.
 *
 * Firestore'ga yozish: `npx tsx scripts/seed.ts` (idempotent, merge: true).
 */

/* ---------------- Lug'at (PLAN 8.1) ---------------- */
export { SEED_LEXICON, SEED_LEXICON_BY_DOMAIN, type SeedLexiconEntry } from './lexicon'

/* ---------------- Grammatika darslari (PLAN 8.2) ---------------- */
export {
  SEED_GRAMMAR_LESSONS,
  type GrammarCommonError,
  type GrammarLessonSeed,
} from './grammar'

/* ---------------- Mashq banki (PLAN 8.2, 8.4) ---------------- */
export {
  SEED_ITEMS,
  SEED_GRAMMAR_ITEMS,
  SEED_VOCAB_ITEMS,
  SEED_ITEMS_BY_SKILL,
  SEED_ITEMS_BY_TOPIC,
  SEED_ITEMS_BY_DOMAIN,
  filterItems,
  itemIds,
  itemBankStats,
  stratifiedPick,
  type ItemFilter,
  type SeedItem,
} from './items'

/* ---------------- Case study'lar (PLAN 8.10, 5-bosqich 7) ---------------- */
export { SEED_CASE_STUDIES, type SeedCaseStudy } from './case-studies'

/* ---------------- AI role-play stsenariylari (PLAN 8.6) ---------------- */
export { SEED_SCENARIOS, type SeedScenario } from './scenarios'

/* ---------------- Prompt Practice Lab (PLAN 8.15) ---------------- */
export { SEED_PROMPT_EXERCISES, type SeedPromptExercise } from './prompt-exercises'

/* ---------------- So'rovnomalar (PLAN 9.1) ---------------- */
export { SEED_SURVEYS, type SeedSurvey } from './surveys'

/* ---------------- Testlar (PLAN 8.11) ---------------- */
export { SEED_TESTS, checkParallelVariants, type SeedTest } from './tests'

/* ---------------- Kurs, modul, darslar (PLAN 4.2) ---------------- */
export {
  COURSE_ID,
  SEED_COURSES,
  SEED_MODULES,
  SEED_LESSONS,
  lessonsOfModule,
  modulesOfStage,
  type SeedCourse,
  type SeedLesson,
  type SeedModule,
} from './courses'

/* ---------------- Gamifikatsiya (PLAN 8.12) ---------------- */
export { SEED_BADGES, type SeedBadge } from './badges'

/* ================================================================== */
/* Umumiy statistika — seed skripti xulosasi va CMS uchun              */
/* ================================================================== */

import { SEED_BADGES } from './badges'
import { SEED_CASE_STUDIES } from './case-studies'
import { SEED_COURSES, SEED_LESSONS, SEED_MODULES } from './courses'
import { SEED_GRAMMAR_LESSONS } from './grammar'
import { SEED_ITEMS } from './items'
import { SEED_LEXICON } from './lexicon'
import { SEED_PROMPT_EXERCISES } from './prompt-exercises'
import { SEED_SCENARIOS } from './scenarios'
import { SEED_SURVEYS } from './surveys'
import { SEED_TESTS } from './tests'

/** Seed kontent hajmi — `scripts/seed.ts` xulosa jadvalida ishlatiladi. */
export const SEED_CONTENT_COUNTS = {
  lexicon: SEED_LEXICON.length,
  grammarLessons: SEED_GRAMMAR_LESSONS.length,
  items: SEED_ITEMS.length,
  caseStudies: SEED_CASE_STUDIES.length,
  scenarios: SEED_SCENARIOS.length,
  promptExercises: SEED_PROMPT_EXERCISES.length,
  surveys: SEED_SURVEYS.length,
  surveyQuestions: SEED_SURVEYS.reduce((n, s) => n + s.questions.length, 0),
  tests: SEED_TESTS.length,
  courses: SEED_COURSES.length,
  modules: SEED_MODULES.length,
  lessons: SEED_LESSONS.length,
  badges: SEED_BADGES.length,
} as const

export type SeedContentCounts = typeof SEED_CONTENT_COUNTS
