import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize } from '@/lib/utils/format'
import type {
  BadgeDoc,
  CaseStudyDoc,
  CourseDoc,
  GroupDoc,
  ItemDoc,
  LearningPathDoc,
  LessonDoc,
  LexiconDoc,
  ModuleDoc,
  ScenarioDoc,
  StatsDailyDoc,
  SurveyDoc,
  TestDoc,
  UserDoc,
  WithId,
} from '@/types'

/**
 * Umumiy Firestore o'qishlari.
 * Barcha funksiyalar JSON-safe (serialize) qiymat qaytaradi —
 * Server komponentdan Client komponentga bemalol uzatiladi.
 */

type Doc<T> = T & WithId

function mapDocs<T>(
  snap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Doc<T>[] {
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as T) }))
}

function mapDoc<T>(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Doc<T> | null {
  if (!snap.exists) return null
  return serialize({ id: snap.id, ...(snap.data() as T) })
}

/* ------------------------------------------------------------------ */
/* Foydalanuvchi va guruh                                              */
/* ------------------------------------------------------------------ */

export const getUserDoc = cache(async (uid: string): Promise<Doc<UserDoc> | null> => {
  return mapDoc<UserDoc>(await adminDb().collection(COL.users).doc(uid).get())
})

export const getGroup = cache(async (groupId: string): Promise<Doc<GroupDoc> | null> => {
  return mapDoc<GroupDoc>(await adminDb().collection(COL.groups).doc(groupId).get())
})

export const listGroupStudents = cache(async (groupId: string): Promise<Doc<UserDoc>[]> => {
  const snap = await adminDb()
    .collection(COL.users)
    .where('groupId', '==', groupId)
    .where('role', '==', 'student')
    .get()
  return mapDocs<UserDoc>(snap).sort((a, b) => a.displayName.localeCompare(b.displayName))
})

export const listTeacherStudents = cache(async (groupIds: string[]): Promise<Doc<UserDoc>[]> => {
  if (!groupIds.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < groupIds.length; i += 10) chunks.push(groupIds.slice(i, i + 10))

  const results = await Promise.all(
    chunks.map((chunk) =>
      adminDb()
        .collection(COL.users)
        .where('role', '==', 'student')
        .where('groupId', 'in', chunk)
        .get()
    )
  )
  return results
    .flatMap((snap) => mapDocs<UserDoc>(snap))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/* ------------------------------------------------------------------ */
/* O'quv yo'nalishi                                                    */
/* ------------------------------------------------------------------ */

export const getLearningPath = cache(async (uid: string): Promise<Doc<LearningPathDoc> | null> => {
  return mapDoc<LearningPathDoc>(await adminDb().collection(COL.learningPaths).doc(uid).get())
})

/* ------------------------------------------------------------------ */
/* Kontent                                                             */
/* ------------------------------------------------------------------ */

export const listCourses = cache(async (publishedOnly = true): Promise<Doc<CourseDoc>[]> => {
  let query: FirebaseFirestore.Query = adminDb().collection(COL.courses)
  if (publishedOnly) query = query.where('published', '==', true)
  const snap = await query.get()
  return mapDocs<CourseDoc>(snap).sort((a, b) => a.order - b.order)
})

export const listModules = cache(
  async (courseId?: string, publishedOnly = true): Promise<Doc<ModuleDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb().collection(COL.modules)
    if (courseId) query = query.where('courseId', '==', courseId)
    if (publishedOnly) query = query.where('published', '==', true)
    const snap = await query.get()
    return mapDocs<ModuleDoc>(snap).sort((a, b) => a.order - b.order)
  }
)

export const getModule = cache(async (id: string): Promise<Doc<ModuleDoc> | null> => {
  return mapDoc<ModuleDoc>(await adminDb().collection(COL.modules).doc(id).get())
})

export const listLessons = cache(
  async (moduleId: string, publishedOnly = true): Promise<Doc<LessonDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb()
      .collection(COL.lessons)
      .where('moduleId', '==', moduleId)
    if (publishedOnly) query = query.where('published', '==', true)
    const snap = await query.get()
    return mapDocs<LessonDoc>(snap).sort((a, b) => a.order - b.order)
  }
)

export const getLesson = cache(async (id: string): Promise<Doc<LessonDoc> | null> => {
  return mapDoc<LessonDoc>(await adminDb().collection(COL.lessons).doc(id).get())
})

export const getItems = cache(async (ids: string[]): Promise<Doc<ItemDoc>[]> => {
  if (!ids.length) return []
  const db = adminDb()
  const refs = ids.map((id) => db.collection(COL.items).doc(id))
  const snaps = await db.getAll(...refs)
  return snaps.filter((s) => s.exists).map((s) => serialize({ id: s.id, ...(s.data() as ItemDoc) }))
})

/** Adaptiv mashq uchun item tanlash bazasi. */
export const listItemsFor = cache(
  async (params: {
    skill: string
    topic?: string
    difficulty?: number
    limit?: number
  }): Promise<Doc<ItemDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb()
      .collection(COL.items)
      .where('status', '==', 'approved')
      .where('skill', '==', params.skill)
    if (params.topic) query = query.where('topic', '==', params.topic)
    if (params.difficulty) query = query.where('difficulty', '==', params.difficulty)
    const snap = await query.limit(params.limit ?? 40).get()
    return mapDocs<ItemDoc>(snap)
  }
)

export const listLexicon = cache(
  async (
    params: { domain?: string; cefr?: string; limit?: number } = {}
  ): Promise<Doc<LexiconDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb()
      .collection(COL.lexicon)
      .where('status', '==', 'approved')
    if (params.domain) query = query.where('domains', 'array-contains', params.domain)
    if (params.cefr) query = query.where('cefr', '==', params.cefr)
    const snap = await query.limit(params.limit ?? 100).get()
    return mapDocs<LexiconDoc>(snap).sort((a, b) => a.word.localeCompare(b.word))
  }
)

export const getLexiconWord = cache(async (id: string): Promise<Doc<LexiconDoc> | null> => {
  return mapDoc<LexiconDoc>(await adminDb().collection(COL.lexicon).doc(id).get())
})

export const listCaseStudies = cache(async (): Promise<Doc<CaseStudyDoc>[]> => {
  const snap = await adminDb().collection(COL.caseStudies).where('published', '==', true).get()
  return mapDocs<CaseStudyDoc>(snap)
})

export const getCaseStudy = cache(async (id: string): Promise<Doc<CaseStudyDoc> | null> => {
  return mapDoc<CaseStudyDoc>(await adminDb().collection(COL.caseStudies).doc(id).get())
})

export const listScenarios = cache(async (): Promise<Doc<ScenarioDoc>[]> => {
  const snap = await adminDb().collection(COL.scenarios).where('published', '==', true).get()
  return mapDocs<ScenarioDoc>(snap)
})

export const getScenario = cache(async (id: string): Promise<Doc<ScenarioDoc> | null> => {
  return mapDoc<ScenarioDoc>(await adminDb().collection(COL.scenarios).doc(id).get())
})

export const listBadges = cache(async (): Promise<Doc<BadgeDoc>[]> => {
  const snap = await adminDb().collection(COL.badges).get()
  return mapDocs<BadgeDoc>(snap)
})

export const listSurveys = cache(async (activeOnly = true): Promise<Doc<SurveyDoc>[]> => {
  let query: FirebaseFirestore.Query = adminDb().collection(COL.surveys)
  if (activeOnly) query = query.where('active', '==', true)
  const snap = await query.get()
  return mapDocs<SurveyDoc>(snap)
})

export const getSurvey = cache(async (id: string): Promise<Doc<SurveyDoc> | null> => {
  return mapDoc<SurveyDoc>(await adminDb().collection(COL.surveys).doc(id).get())
})

export const getTest = cache(async (id: string): Promise<Doc<TestDoc> | null> => {
  return mapDoc<TestDoc>(await adminDb().collection(COL.tests).doc(id).get())
})

export const listTests = cache(
  async (type?: TestDoc['type'], groupId?: string): Promise<Doc<TestDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb()
      .collection(COL.tests)
      .where('published', '==', true)
    if (type) query = query.where('type', '==', type)
    const snap = await query.get()
    const tests = mapDocs<TestDoc>(snap)
    if (!groupId) return tests
    return tests.filter(
      (t) => !t.assignedTo?.groupIds?.length || t.assignedTo.groupIds.includes(groupId)
    )
  }
)

/* ------------------------------------------------------------------ */
/* Statistika                                                          */
/* ------------------------------------------------------------------ */

export const getRecentDailyStats = cache(
  async (uid: string, days = 30): Promise<Doc<StatsDailyDoc>[]> => {
    const snap = await adminDb()
      .collection(COL.statsDaily)
      .where('uid', '==', uid)
      .orderBy('date', 'desc')
      .limit(days)
      .get()
    return mapDocs<StatsDailyDoc>(snap).reverse()
  }
)

export { mapDoc, mapDocs }
export type { Doc }
