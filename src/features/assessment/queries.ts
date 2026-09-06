import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis } from '@/lib/utils/format'
import { getItems, getTest, listTests, type Doc } from '@/features/shared/queries'
import type {
  ItemDoc,
  SpeakingSubmissionDoc,
  TestDoc,
  WithId,
  WritingSubmissionDoc,
} from '@/types'

import { collectItemIds, toRunnerTest } from './runner-content'
import type {
  AssessmentTestCard,
  AttemptRecord,
  AttemptSummary,
  RunnerTest,
  TestAvailability,
} from './types'

/**
 * Assessment Center o'qishlari (PLAN 8.11).
 *
 * DIQQAT: `getRunnerTest` klientga uzatiladigan XAVFSIZ tuzilma qaytaradi
 * (`answerKey` yo'q). To'liq `ItemDoc` faqat `loadTestItems` orqali va faqat
 * server tomonda (baholash uchun) o'qiladi.
 */

/* ------------------------------------------------------------------ */
/* Test + itemlar                                                      */
/* ------------------------------------------------------------------ */

export const loadTestItems = cache(
  async (test: Pick<TestDoc, 'sections'>): Promise<Array<ItemDoc & WithId>> => {
    return getItems(collectItemIds(test))
  }
)

export interface LoadedTest {
  test: Doc<TestDoc>
  runner: RunnerTest
}

/** Test + itemlarni yuklab, klient uchun xavfsiz ko'rinishga aylantirish. */
export const getRunnerTest = cache(async (testId: string): Promise<LoadedTest | null> => {
  const test = await getTest(testId)
  if (!test || !test.published) return null
  const items = await loadTestItems(test)
  return { test, runner: toRunnerTest(test, items) }
})

/* ------------------------------------------------------------------ */
/* Urinishlar                                                          */
/* ------------------------------------------------------------------ */

function mapAttempt(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): Doc<AttemptRecord> {
  return serialize({ id: doc.id, ...(doc.data() as AttemptRecord) })
}

export const getAttempt = cache(async (attemptId: string): Promise<Doc<AttemptRecord> | null> => {
  const snap = await adminDb().collection(COL.testAttempts).doc(attemptId).get()
  if (!snap.exists) return null
  return mapAttempt(snap)
})

/**
 * Tugallanmagan urinish (autosave) — "davom ettirish" ekrani uchun.
 * Index: testAttempts(uid ASC, status ASC, startedAt DESC).
 */
export const getInProgressAttempt = cache(
  async (uid: string, testId?: string): Promise<Doc<AttemptRecord> | null> => {
    const snap = await adminDb()
      .collection(COL.testAttempts)
      .where('uid', '==', uid)
      .where('status', '==', 'in_progress')
      .orderBy('startedAt', 'desc')
      .limit(10)
      .get()
    const attempts = snap.docs.map(mapAttempt)
    return attempts.find((attempt) => !testId || attempt.testId === testId) ?? null
  }
)

/** Tugallangan urinishlar (yangi → eski). */
export const listFinishedAttempts = cache(
  async (uid: string, max = 30): Promise<Doc<AttemptRecord>[]> => {
    const snap = await adminDb()
      .collection(COL.testAttempts)
      .where('uid', '==', uid)
      .where('status', 'in', ['submitted', 'graded'])
      .orderBy('startedAt', 'desc')
      .limit(max)
      .get()
    return snap.docs.map(mapAttempt)
  }
)

/** Berilgan tur bo'yicha oxirgi tugallangan urinish (pre/post taqqoslash uchun). */
export const getLatestAttemptOfType = cache(
  async (uid: string, type: TestDoc['type']): Promise<Doc<AttemptRecord> | null> => {
    const snap = await adminDb()
      .collection(COL.testAttempts)
      .where('uid', '==', uid)
      .where('type', '==', type)
      .orderBy('finishedAt', 'desc')
      .limit(5)
      .get()
    const attempts = snap.docs.map(mapAttempt)
    return attempts.find((attempt) => attempt.status !== 'in_progress') ?? null
  }
)

export function toAttemptSummary(attempt: Doc<AttemptRecord>, title?: string): AttemptSummary {
  return {
    id: attempt.id,
    testId: attempt.testId,
    testTitle: title ?? attempt.testTitle ?? 'Test',
    type: attempt.type,
    status: attempt.status,
    percent: attempt.percent ?? 0,
    totalScore: attempt.totalScore ?? 0,
    totalMax: attempt.totalMax ?? 0,
    startedAt: toMillis(attempt.startedAt),
    finishedAt: toMillis(attempt.finishedAt),
  }
}

/* ------------------------------------------------------------------ */
/* Tayinlangan testlar va ochiqlik oynasi                              */
/* ------------------------------------------------------------------ */

/**
 * Test talabaga ochiqmi?
 * `assignedTo` bo'lmasa — hammaga ochiq (diagnostika, progress).
 * `assignedTo` bo'lsa — faqat tayinlangan guruhga va faqat `from`…`to` oralig'ida
 * (pre/post test: tadqiqotchi oynani boshqaradi, PLAN 9).
 */
export function testAvailability(
  test: Pick<TestDoc, 'assignedTo'>,
  groupId: string | undefined,
  now = Date.now()
): TestAvailability {
  const assigned = test.assignedTo
  if (!assigned?.groupIds?.length) return { state: 'available' }
  if (!groupId || !assigned.groupIds.includes(groupId)) return { state: 'not_assigned' }

  const from = assigned.from ? toMillis(assigned.from) : 0
  const to = assigned.to ? toMillis(assigned.to) : 0
  if (from && now < from) return { state: 'not_open', from }
  if (to && now > to) return { state: 'closed', to }
  return { state: 'available' }
}

/** Faqat tadqiqotchi ANIQ tayinlagan testlar (pre/post uchun). */
export const listAssignedTests = cache(
  async (type: TestDoc['type'], groupId: string | undefined): Promise<Doc<TestDoc>[]> => {
    if (!groupId) return []
    const tests = await listTests(type)
    return tests.filter((test) => test.assignedTo?.groupIds?.includes(groupId))
  }
)

/* ------------------------------------------------------------------ */
/* Assessment Center hub                                               */
/* ------------------------------------------------------------------ */

function cardFor(
  test: Doc<TestDoc>,
  groupId: string | undefined,
  attempts: Doc<AttemptRecord>[],
  inProgress: Doc<AttemptRecord> | null
): AssessmentTestCard {
  const finished = attempts.filter((attempt) => attempt.testId === test.id)
  return {
    test: {
      id: test.id,
      title: test.title,
      type: test.type,
      sectionCount: test.sections?.length ?? 0,
      itemCount: collectItemIds(test).length,
    },
    availability: testAvailability(test, groupId),
    lastAttempt: finished[0] ? toAttemptSummary(finished[0], test.title) : null,
    inProgressAttemptId:
      inProgress && inProgress.testId === test.id ? inProgress.id : null,
  }
}

export interface AssessmentOverview {
  diagnostic: AssessmentTestCard | null
  progressTests: AssessmentTestCard[]
  preTests: AssessmentTestCard[]
  postTests: AssessmentTestCard[]
  history: AttemptSummary[]
  hasProfile: boolean
}

export const getAssessmentOverview = cache(
  async (uid: string, groupId: string | undefined): Promise<AssessmentOverview> => {
    const [allTests, attempts, inProgress, pathSnap] = await Promise.all([
      listTests(),
      listFinishedAttempts(uid, 40),
      getInProgressAttempt(uid),
      adminDb().collection(COL.learningPaths).doc(uid).get(),
    ])

    const titleById = new Map(allTests.map((test) => [test.id, test.title]))
    const visible = allTests.filter(
      (test) => testAvailability(test, groupId).state !== 'not_assigned'
    )

    const byType = (type: TestDoc['type']) =>
      visible
        .filter((test) => test.type === type)
        .map((test) => cardFor(test, groupId, attempts, inProgress))

    const diagnosticCards = byType('diagnostic')

    return {
      diagnostic: diagnosticCards[0] ?? null,
      progressTests: byType('progress'),
      preTests: byType('pre'),
      postTests: byType('post'),
      history: attempts.map((attempt) => toAttemptSummary(attempt, titleById.get(attempt.testId))),
      hasProfile: pathSnap.exists,
    }
  }
)

/* ------------------------------------------------------------------ */
/* Natijalar sahifasi uchun qo'shimcha ma'lumot                        */
/* ------------------------------------------------------------------ */

export interface OpenReview {
  sectionId: string
  kind: 'writing' | 'speaking'
  title: string
  score?: number
  teacherComment?: string
}

/**
 * Ochiq bo'limlar bo'yicha o'qituvchi/AI navbatidagi hujjatlar.
 * Nazorat guruhida natijalar sahifasida AYNAN shu (AI emas, inson) izohi
 * ko'rsatiladi — PLAN 1.5.
 */
export const getOpenReviews = cache(
  async (attempt: Doc<AttemptRecord>): Promise<OpenReview[]> => {
    const submissions = attempt.openSubmissions ?? []
    const withIds = submissions.filter((item) => item.submissionId && item.submissionKind)
    if (!withIds.length) return []

    const db = adminDb()
    const refs = withIds.map((item) =>
      db
        .collection(item.submissionKind === 'writing' ? COL.writingSubmissions : COL.speakingSubmissions)
        .doc(item.submissionId as string)
    )
    const snaps = await db.getAll(...refs)

    return withIds.map((item, index) => {
      const snap = snaps[index]
      const data = snap?.exists
        ? (snap.data() as Partial<WritingSubmissionDoc & SpeakingSubmissionDoc>)
        : undefined
      return {
        sectionId: item.sectionId,
        kind: item.submissionKind as 'writing' | 'speaking',
        title: data?.taskTitle ?? item.sectionId,
        score: data?.teacherFeedback?.score ?? item.score,
        teacherComment: data?.teacherFeedback?.text,
      }
    })
  }
)

/**
 * Taqqoslash uchun urinish: post → pre (yoki diagnostika), qolganlari → diagnostika.
 * Ikkalasi ham bo'lsa natijalar sahifasida radar ustiga ikkinchi chiziq chiziladi.
 */
export const getComparisonAttempt = cache(
  async (uid: string, attempt: Doc<AttemptRecord>): Promise<Doc<AttemptRecord> | null> => {
    const order: Array<TestDoc['type']> =
      attempt.type === 'post' ? ['pre', 'diagnostic'] : ['diagnostic', 'pre']

    for (const type of order) {
      if (type === attempt.type) continue
      const found = await getLatestAttemptOfType(uid, type)
      if (found && found.id !== attempt.id) return found
    }
    return null
  }
)
