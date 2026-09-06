import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL, type Domain, type Skill } from '@/config/constants'
import { serialize } from '@/lib/utils/format'
import {
  getItems,
  getLearningPath,
  getLesson,
  getModule,
  listCourses,
  listModules,
  type Doc,
} from '@/features/shared/queries'
import { toRunnerItem } from '@/features/practice/queries'
import type { RunnerItem } from '@/features/practice/types'
import type { CourseDoc, LessonDoc, LexiconDoc, ModuleDoc, PathStep } from '@/types'

/* ------------------------------------------------------------------ */
/* Dars progressi — users/{uid}/lessonProgress/{lessonId}              */
/* ------------------------------------------------------------------ */

export interface LessonProgressDoc {
  lessonId: string
  moduleId: string
  courseId: string
  status: 'in_progress' | 'done'
  timeMs?: number
  completedAt?: number | string
}

export const LESSON_PROGRESS = 'lessonProgress'

export const getLessonProgress = cache(
  async (uid: string): Promise<Record<string, LessonProgressDoc>> => {
    const snap = await adminDb()
      .collection(COL.users)
      .doc(uid)
      .collection(LESSON_PROGRESS)
      .limit(500)
      .get()
    const out: Record<string, LessonProgressDoc> = {}
    for (const doc of snap.docs) {
      out[doc.id] = serialize({ ...(doc.data() as LessonProgressDoc), lessonId: doc.id })
    }
    return out
  }
)

/* ------------------------------------------------------------------ */
/* Katalog: kurs → modul → dars                                        */
/* ------------------------------------------------------------------ */

export interface LessonRow {
  id: string
  title: string
  summary?: string
  type: LessonDoc['type']
  cefr: string
  estimatedMin: number
  order: number
  done: boolean
}

export interface ModuleRow {
  id: string
  title: string
  description?: string
  skill: Skill
  domain: Domain
  stage: number
  estimatedMin: number
  lessons: LessonRow[]
  doneCount: number
  progress: number
}

export interface CourseRow {
  id: string
  title: string
  description: string
  modules: ModuleRow[]
  lessonCount: number
  doneCount: number
}

export interface LearnCatalogue {
  courses: CourseRow[]
  skills: Skill[]
  domains: Domain[]
  totals: { lessons: number; done: number; minutes: number }
}

/** Barcha nashr qilingan darslarni bir marta o'qish (modulga bog'lab). */
const listAllLessons = cache(async (): Promise<Array<Doc<LessonDoc>>> => {
  const snap = await adminDb().collection(COL.lessons).where('published', '==', true).get()
  return snap.docs
    .map((doc) => serialize({ id: doc.id, ...(doc.data() as LessonDoc) }))
    .sort((a, b) => a.order - b.order)
})

export const getLearnCatalogue = cache(async (uid: string): Promise<LearnCatalogue> => {
  const [courses, modules, lessons, progress] = await Promise.all([
    listCourses(true),
    listModules(undefined, true),
    listAllLessons(),
    getLessonProgress(uid),
  ])

  const lessonsByModule = new Map<string, Array<Doc<LessonDoc>>>()
  for (const lesson of lessons) {
    const bucket = lessonsByModule.get(lesson.moduleId) ?? []
    bucket.push(lesson)
    lessonsByModule.set(lesson.moduleId, bucket)
  }

  const modulesByCourse = new Map<string, Array<Doc<ModuleDoc>>>()
  for (const mod of modules) {
    const bucket = modulesByCourse.get(mod.courseId) ?? []
    bucket.push(mod)
    modulesByCourse.set(mod.courseId, bucket)
  }

  const skills = new Set<Skill>()
  const domains = new Set<Domain>()
  let totalLessons = 0
  let totalDone = 0
  let totalMinutes = 0

  const courseRows: CourseRow[] = (courses as Array<Doc<CourseDoc>>).map((course) => {
    const moduleRows: ModuleRow[] = (modulesByCourse.get(course.id) ?? []).map((module) => {
      const moduleLessons = lessonsByModule.get(module.id) ?? []
      skills.add(module.skill)
      domains.add(module.domain)

      const rows: LessonRow[] = moduleLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        type: lesson.type,
        cefr: lesson.cefr,
        estimatedMin: lesson.estimatedMin ?? 10,
        order: lesson.order,
        done: progress[lesson.id]?.status === 'done',
      }))

      const doneCount = rows.filter((row) => row.done).length
      const minutes =
        module.estimatedMin ?? rows.reduce((sum, row) => sum + (row.estimatedMin ?? 0), 0)

      totalLessons += rows.length
      totalDone += doneCount
      totalMinutes += minutes

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        skill: module.skill,
        domain: module.domain,
        stage: module.stage,
        estimatedMin: minutes,
        lessons: rows,
        doneCount,
        progress: rows.length ? Math.round((doneCount / rows.length) * 100) : 0,
      }
    })

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      modules: moduleRows,
      lessonCount: moduleRows.reduce((sum, module) => sum + module.lessons.length, 0),
      doneCount: moduleRows.reduce((sum, module) => sum + module.doneCount, 0),
    }
  })

  return {
    courses: courseRows.filter((course) => course.modules.length > 0),
    skills: [...skills],
    domains: [...domains],
    totals: { lessons: totalLessons, done: totalDone, minutes: totalMinutes },
  }
})

/* ------------------------------------------------------------------ */
/* Dars ko'rinishi                                                     */
/* ------------------------------------------------------------------ */

export interface LessonNeighbour {
  id: string
  title: string
}

export interface LessonView {
  lesson: Doc<LessonDoc>
  module: Doc<ModuleDoc> | null
  course: { id: string; title: string } | null
  prev: LessonNeighbour | null
  next: LessonNeighbour | null
  /** vocab bloklaridagi so'zlar (wordId → hujjat) */
  words: Record<string, Doc<LexiconDoc>>
  /** exercises bloklaridagi mashqlar (klientga xavfsiz proyeksiya) */
  exercises: Record<string, RunnerItem[]>
  done: boolean
  /** Shu darsga mos yo'nalish qadami (yakunlanganda `done` bo'ladi) */
  pathStep: PathStep | null
  positionInModule: { index: number; total: number }
}

export const getLessonView = cache(
  async (uid: string, lessonId: string): Promise<LessonView | null> => {
    const lesson = await getLesson(lessonId)
    if (!lesson) return null

    const wordIds = new Set<string>()
    const itemIds = new Set<string>()
    for (const block of lesson.blocks ?? []) {
      if (block.kind === 'vocab') block.wordIds.forEach((id) => wordIds.add(id))
      if (block.kind === 'exercises') block.itemIds.forEach((id) => itemIds.add(id))
    }

    const db = adminDb()
    const [module, siblingsSnap, wordSnaps, items, progressSnap, path, courseSnap] =
      await Promise.all([
        getModule(lesson.moduleId),
        db
          .collection(COL.lessons)
          .where('moduleId', '==', lesson.moduleId)
          .where('published', '==', true)
          .get(),
        wordIds.size
          ? db.getAll(...[...wordIds].map((id) => db.collection(COL.lexicon).doc(id)))
          : Promise.resolve([]),
        getItems([...itemIds]),
        db.collection(COL.users).doc(uid).collection(LESSON_PROGRESS).doc(lessonId).get(),
        getLearningPath(uid),
        lesson.courseId
          ? db.collection(COL.courses).doc(lesson.courseId).get()
          : Promise.resolve(null),
      ])

    const siblings = siblingsSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as LessonDoc) }))
      .sort((a, b) => a.order - b.order)
    const index = siblings.findIndex((entry) => entry.id === lessonId)

    const words: Record<string, Doc<LexiconDoc>> = {}
    for (const snap of wordSnaps) {
      if (snap.exists) words[snap.id] = serialize({ id: snap.id, ...(snap.data() as LexiconDoc) })
    }

    const itemsById = new Map(items.map((item) => [item.id, item]))
    const exercises: Record<string, RunnerItem[]> = {}
    for (const [blockIndex, block] of (lesson.blocks ?? []).entries()) {
      if (block.kind !== 'exercises') continue
      exercises[String(blockIndex)] = block.itemIds
        .map((id) => itemsById.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map(toRunnerItem)
    }

    const pathStep =
      path?.steps?.find((step) => step.kind === 'lesson' && step.refId === lessonId) ?? null

    return {
      lesson,
      module,
      course: courseSnap?.exists
        ? { id: courseSnap.id, title: (courseSnap.data() as CourseDoc).title }
        : null,
      prev: index > 0 ? { id: siblings[index - 1].id, title: siblings[index - 1].title } : null,
      next:
        index >= 0 && index < siblings.length - 1
          ? { id: siblings[index + 1].id, title: siblings[index + 1].title }
          : null,
      words,
      exercises,
      done: (progressSnap.data() as LessonProgressDoc | undefined)?.status === 'done',
      pathStep,
      positionInModule: { index: index >= 0 ? index + 1 : 1, total: siblings.length || 1 },
    }
  }
)
