import 'server-only'

/**
 * Individual Learning Path (Individual o'quv yo'li) generatori.
 * PLAN.md 5-bo'lim (1–2 bosqichlar), 4.3 `learningPaths/{uid}`, 6.7.
 *
 * METODIK MANTIQ:
 * Diagnostika (2-bosqich) natijasidan Individual Linguistic Profile tuziladi —
 * har ko'nikma bo'yicha 0–100 ball, yorliq (weak / needs improvement /
 * intermediate / strong), taxminiy CEFR va boshlang'ich difficulty.
 * Keyin yo'l ENG ZAIF ko'nikmadan boshlab, 8 bosqichli algoritm tartibida
 * quriladi:
 *
 *   3-bosqich  → Prompt Practice Lab   (faqat AI yoqilgan guruhda)
 *   4-bosqich  → zaif ko'nikmalar bo'yicha darslar
 *   5-bosqich  → mashq (Practice Zone), adaptiv
 *   6-bosqich  → Speaking Lab / Writing Lab (produktiv-kommunikativ)
 *   7-bosqich  → case study loyihasi (integrativ-kasbiy)
 *   8-bosqich  → progress test + refleksiya
 *
 * Har qadamda `reason` maydoni bor — talaba NIMA UCHUN aynan shu qadamni
 * olayotganini o'qiy oladi ("Grammar: articles zaif → 2 ta qo'shimcha dars").
 * Bu metodikaning "shaffoflik va avtonomiya" tamoyili (PLAN 15, 10-bo'lim).
 */

import {
  COL,
  SKILLS,
  SKILL_LABELS,
  scoreToLabel,
  type Domain,
  type Skill,
  type Stage,
} from '@/config/constants'
import { adminDb, FieldValue } from '@/lib/firebase/admin'
import type {
  CaseStudyDoc,
  FeatureFlags,
  LearningPathDoc,
  LessonDoc,
  LinguisticProfile,
  ModuleDoc,
  PathStep,
  PromptExerciseDoc,
  SkillProfileEntry,
  TestAttemptDoc,
  TestDoc,
  UserDoc,
  WithId,
} from '@/types'

import { difficultyToCefr, startingDifficulty } from './policy'

/* ------------------------------------------------------------------ */
/* 1-2 bosqich: Linguistic Profile                                     */
/* ------------------------------------------------------------------ */

/** Bitta ko'nikma bo'yicha profil yozuvini yasash. */
export function toProfileEntry(score: number): SkillProfileEntry {
  const clamped = Math.min(100, Math.max(0, Math.round(score)))
  const startDifficulty = startingDifficulty(clamped)
  return {
    score: clamped,
    label: scoreToLabel(clamped),
    cefr: difficultyToCefr(startDifficulty),
    startDifficulty,
  }
}

/**
 * Diagnostika urinishidan Individual Linguistic Profile (PLAN 5, 2-bosqich).
 * `sectionScores` da bo'lmagan ko'nikmalar profilga kiritilmaydi — ular
 * hali o'lchanmagan (bo'sh emas, noma'lum).
 */
export function buildLinguisticProfile(
  testAttempt: Pick<TestAttemptDoc, 'sectionScores'>
): LinguisticProfile {
  const profile: LinguisticProfile = {}
  for (const skill of SKILLS) {
    const section = testAttempt.sectionScores?.[skill]
    if (!section) continue
    const percent =
      typeof section.percent === 'number'
        ? section.percent
        : section.max > 0
          ? (section.score / section.max) * 100
          : 0
    profile[skill] = toProfileEntry(percent)
  }
  return profile
}

/** Profildagi ko'nikmalar zaifdan kuchliga qarab tartiblangan ro'yxati. */
export function weakestFirst(
  profile: LinguisticProfile
): Array<{ skill: Skill; entry: SkillProfileEntry }> {
  return (Object.entries(profile) as Array<[Skill, SkillProfileEntry]>)
    .map(([skill, entry]) => ({ skill, entry }))
    .sort((a, b) => a.entry.score - b.entry.score)
}

/** Profil bo'yicha umumiy ball (0–100) — dashboard va prognoz uchun. */
export function profileAverage(profile: LinguisticProfile): number {
  const entries = Object.values(profile).filter(Boolean) as SkillProfileEntry[]
  if (!entries.length) return 0
  return Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length)
}

/* ------------------------------------------------------------------ */
/* Yo'l generatori                                                     */
/* ------------------------------------------------------------------ */

/** Yo'l qurish uchun kontent katalogi (Firestore'dan bir marta o'qiladi). */
export interface PathCatalogue {
  modules: Array<ModuleDoc & WithId>
  lessons: Array<LessonDoc & WithId>
  caseStudies?: Array<CaseStudyDoc & WithId>
  tests?: Array<TestDoc & WithId>
  promptExercises?: Array<PromptExerciseDoc & WithId>
}

export interface GeneratePathInput {
  uid: string
  profile: LinguisticProfile
  /** Kasbiy yo'nalish (onboarding) — kontent domainini tanlash uchun. */
  track: Domain
  goals?: string[]
  catalogue: PathCatalogue
  /** AI bayroqlari — 3-bosqich (Prompt Lab) faqat yoqilganda qo'shiladi. */
  flags?: Partial<FeatureFlags>
  /** Nechta zaif ko'nikma qamrab olinsin (standart 3). */
  focusSkills?: number
  /** Har zaif ko'nikma uchun maksimal dars soni. */
  lessonsPerSkill?: number
}

const WEAK_LABELS = new Set(['weak', 'needs_improvement'])

function skillName(skill: Skill): string {
  return SKILL_LABELS[skill]?.uz ?? skill
}

/** Domainga moslik bali: aynan mos > iqtisodiy > umumiy. */
function domainScore(domain: Domain, track: Domain): number {
  if (domain === track) return 3
  if (domain === 'economics' || domain === 'business_communication') return 2
  if (domain === 'general' || domain === 'academic') return 1
  return 0
}

function makeStep(
  order: number,
  kind: PathStep['kind'],
  refId: string,
  title: string,
  skill: Skill,
  stage: Stage,
  reason: string
): PathStep {
  return {
    id: `${kind}_${refId}_${order}`,
    order,
    kind,
    refId,
    title,
    skill,
    stage,
    reason,
    status: order === 1 ? 'available' : 'locked',
  }
}

/**
 * Individual o'quv yo'lini yaratish.
 * TOZA funksiya — Firestore'ga tegmaydi, shuning uchun unit-test qilinadi.
 */
export function generatePath(input: GeneratePathInput): PathStep[] {
  const { profile, track, catalogue, flags, focusSkills = 3, lessonsPerSkill = 2 } = input

  const ranked = weakestFirst(profile)
  const weak = ranked.filter(({ entry }) => WEAK_LABELS.has(entry.label))
  // Zaif ko'nikma topilmasa ham eng past 2 tasi bilan ishlaymiz (yo'l bo'sh qolmasin)
  const focus = (weak.length ? weak : ranked).slice(0, Math.max(1, focusSkills))
  const focusSet = new Set(focus.map((f) => f.skill))

  const steps: PathStep[] = []
  let order = 1
  const push = (
    kind: PathStep['kind'],
    refId: string,
    title: string,
    skill: Skill,
    stage: Stage,
    reason: string
  ) => {
    steps.push(makeStep(order, kind, refId, title, skill, stage, reason))
    order += 1
  }

  /* --- 3-bosqich: AI bilan ishlashga tayyorgarlik ------------------- */
  if (flags?.promptLab || flags?.aiTutor) {
    const exercise = [...(catalogue.promptExercises ?? [])]
      .sort((a, b) => a.order - b.order)
      .find((item) => item.level === 'simple')
    push(
      'prompt_lab',
      exercise?.id ?? 'intro',
      'Prompt Practice Lab: AI bilan ishlash asoslari',
      'professional',
      3,
      'AI yordamchisidan samarali foydalanish uchun kirish bosqichi (aniq prompt, javobni tekshirish, akademik halollik).'
    )
  }

  /* --- 4-bosqich: zaif ko'nikmalar bo'yicha darslar ----------------- */
  const usedLessonIds = new Set<string>()
  const moduleById = new Map(catalogue.modules.map((module) => [module.id, module]))

  for (const { skill, entry } of focus) {
    const lessons = catalogue.lessons
      .filter((lesson) => {
        if (!lesson.published) return false
        if (usedLessonIds.has(lesson.id)) return false
        const lessonModule = moduleById.get(lesson.moduleId)
        return lessonModule?.skill === skill
      })
      .sort((a, b) => {
        const ma = moduleById.get(a.moduleId)
        const mb = moduleById.get(b.moduleId)
        const da = domainScore(ma?.domain ?? 'general', track)
        const db = domainScore(mb?.domain ?? 'general', track)
        if (da !== db) return db - da
        return a.order - b.order
      })
      .slice(0, lessonsPerSkill)

    for (const lesson of lessons) {
      usedLessonIds.add(lesson.id)
      push(
        'lesson',
        lesson.id,
        lesson.title,
        skill,
        4,
        `${skillName(skill)}: diagnostika bali ${entry.score}/100 (${entry.label}) — tushuntirish va namunalar bilan mustahkamlash.`
      )
    }

    /* --- 5-bosqich: mashq --------------------------------------------- */
    push(
      'practice',
      `${skill}:${track}`,
      `${skillName(skill)} — adaptiv mashq`,
      skill,
      5,
      `Boshlang'ich qiyinlik ${entry.startDifficulty}/5 (${entry.cefr}); 3 ta ketma-ket to'g'ri javobda daraja oshadi.`
    )
  }

  /* --- 6-bosqich: produktiv-kommunikativ --------------------------- */
  if (focusSet.has('pronunciation') || focusSet.has('speaking') || !focus.length) {
    const skill: Skill = focusSet.has('pronunciation') ? 'pronunciation' : 'speaking'
    push(
      'speaking',
      `lab:${track}`,
      'Speaking & Pronunciation Lab',
      skill,
      6,
      'Record → Analyze → Feedback → Retry: talaffuz, urg‘u va ravonlik ustida ishlash.'
    )
  }
  if (focusSet.has('writing') || focusSet.has('grammar')) {
    push(
      'writing',
      `lab:${track}`,
      'Writing Lab: kasbiy matn yozish',
      'writing',
      6,
      'Write → Feedback → Revise → Submit: biznes email va hisobot janrlarida amaliyot.'
    )
  }

  /* --- 7-bosqich: integrativ-kasbiy loyiha -------------------------- */
  const caseStudy = (catalogue.caseStudies ?? [])
    .filter((item) => item.published)
    .sort((a, b) => domainScore(b.domain, track) - domainScore(a.domain, track))[0]
  if (caseStudy) {
    push(
      'project',
      caseStudy.id,
      caseStudy.title,
      'professional',
      7,
      'Integrativ case study: matn tahlili → lug‘at → grammatika → muhokama → yechim → hisobot → prezentatsiya.'
    )
  }

  /* --- 8-bosqich: baholash ------------------------------------------ */
  const progressTest = (catalogue.tests ?? []).find(
    (test) => test.published && (test.type === 'progress' || test.type === 'post')
  )
  if (progressTest) {
    push(
      'test',
      progressTest.id,
      progressTest.title,
      'professional',
      8,
      'Progress test: o‘zlashtirishni o‘lchash va o‘quv yo‘lini qayta sozlash.'
    )
  }

  return steps
}

/* ------------------------------------------------------------------ */
/* Firestore qatlami                                                   */
/* ------------------------------------------------------------------ */

/** Yo'l qurish uchun tasdiqlangan/nashr qilingan kontentni yuklash. */
export async function loadCatalogue(): Promise<PathCatalogue> {
  const db = adminDb()
  const [modules, lessons, caseStudies, tests, promptExercises] = await Promise.all([
    db.collection(COL.modules).where('published', '==', true).get(),
    db.collection(COL.lessons).where('published', '==', true).get(),
    db.collection(COL.caseStudies).where('published', '==', true).get(),
    db.collection(COL.tests).where('published', '==', true).get(),
    db.collection(COL.promptExercises).get(),
  ])
  return {
    modules: modules.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ModuleDoc) })),
    lessons: lessons.docs.map((doc) => ({ id: doc.id, ...(doc.data() as LessonDoc) })),
    caseStudies: caseStudies.docs.map((doc) => ({ id: doc.id, ...(doc.data() as CaseStudyDoc) })),
    tests: tests.docs.map((doc) => ({ id: doc.id, ...(doc.data() as TestDoc) })),
    promptExercises: promptExercises.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as PromptExerciseDoc),
    })),
  }
}

/** Mavjud yo'lni o'qish. */
export async function getLearningPath(uid: string): Promise<LearningPathDoc | null> {
  const snap = await adminDb().collection(COL.learningPaths).doc(uid).get()
  return (snap.data() as LearningPathDoc | undefined) ?? null
}

/** Oxirgi diagnostika/pre-test urinishidan profil tuzish. */
export async function profileFromLatestDiagnostic(uid: string): Promise<LinguisticProfile | null> {
  const snap = await adminDb()
    .collection(COL.testAttempts)
    .where('uid', '==', uid)
    .where('status', '==', 'graded')
    .orderBy('finishedAt', 'desc')
    .limit(5)
    .get()
  const attempt = snap.docs
    .map((doc) => doc.data() as TestAttemptDoc)
    .find((item) => item.type === 'diagnostic' || item.type === 'pre' || item.type === 'progress')
  return attempt ? buildLinguisticProfile(attempt) : null
}

export interface RegenerateResult {
  path: LearningPathDoc
  created: boolean
}

/**
 * Yo'lni qayta generatsiya qilish (PLAN 6.7):
 * progress testdan keyin, 7 kunlik cron'da yoki talaba maqsadini o'zgartirganda.
 * `version` oshiriladi — eski versiyalar tahlil uchun eventda qoladi.
 */
export async function regeneratePath(uid: string, reason: string): Promise<RegenerateResult> {
  const db = adminDb()
  const [userSnap, existing, catalogue] = await Promise.all([
    db.collection(COL.users).doc(uid).get(),
    getLearningPath(uid),
    loadCatalogue(),
  ])

  const user = userSnap.data() as UserDoc | undefined
  const profile = (await profileFromLatestDiagnostic(uid)) ?? existing?.linguisticProfile ?? {}
  const track: Domain =
    user?.onboarding?.professionalTrack ?? existing?.professionalTrack ?? 'economics'
  const goals = user?.onboarding?.goal ? [user.onboarding.goal] : (existing?.goals ?? [])

  const groupSnap = user?.groupId ? await db.collection(COL.groups).doc(user.groupId).get() : null
  const flags = (groupSnap?.data() as { featureFlags?: FeatureFlags } | undefined)?.featureFlags

  const steps = generatePath({ uid, profile, track, goals, catalogue, flags })

  const path: LearningPathDoc = {
    uid,
    linguisticProfile: profile,
    goals,
    professionalTrack: track,
    steps,
    version: (existing?.version ?? 0) + 1,
    generatedAt: Date.now(),
    generatedBy: 'rules',
    note: reason,
  }

  await db
    .collection(COL.learningPaths)
    .doc(uid)
    .set({ ...path, generatedAt: FieldValue.serverTimestamp() }, { merge: false })

  return { path, created: !existing }
}

/** Qadam holatini yangilash (dars/mashq tugagach). */
export async function markStepDone(uid: string, stepId: string): Promise<void> {
  const db = adminDb()
  const ref = db.collection(COL.learningPaths).doc(uid)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() as LearningPathDoc | undefined
    if (!data?.steps?.length) return
    let unlockNext = false
    const steps = data.steps.map((step) => {
      if (step.id === stepId) {
        unlockNext = true
        return { ...step, status: 'done' as const, completedAt: Date.now() }
      }
      if (unlockNext && step.status === 'locked') {
        unlockNext = false
        return { ...step, status: 'available' as const }
      }
      return step
    })
    tx.set(ref, { steps }, { merge: true })
  })
}
