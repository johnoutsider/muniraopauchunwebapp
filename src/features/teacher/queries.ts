import 'server-only'

import { cache } from 'react'

import { adminBucket, adminDb } from '@/lib/firebase/admin'
import {
  COL,
  ERROR_TAG_LABELS,
  SKILLS,
  SKILL_LABELS,
  scoreToLabel,
  type ErrorTag,
  type ExperimentGroup,
  type ProficiencyLabel,
  type Skill,
} from '@/config/constants'
import { dayKey, serialize, toMillis } from '@/lib/utils/format'
import { mapDocs, type Doc } from '@/features/shared/queries'
import type {
  AiSessionDoc,
  AssignmentDoc,
  AttemptDoc,
  ChatDoc,
  ContributionDoc,
  ErrorProfileDoc,
  GroupDoc,
  ItemDoc,
  LearningPathDoc,
  LessonDoc,
  LexiconDoc,
  MasteryDoc,
  PredictionDoc,
  ProjectDoc,
  ReflectionDoc,
  SessionUser,
  SpeakingSubmissionDoc,
  StatsDailyDoc,
  StreakDoc,
  TestAttemptDoc,
  UserDoc,
  WithId,
  WritingSubmissionDoc,
} from '@/types'

import {
  assertTeachesGroup,
  assertTeachesStudent,
  getTeacherGroupDocs,
  getTeacherGroupIds,
} from './guards'

/**
 * O'qituvchi ish maydoni uchun barcha Firestore o'qishlari (PLAN 8.17).
 * Har bir funksiya `guards.ts` orqali avtorizatsiyani qayta tekshiradi.
 * Qaytariladigan qiymatlar JSON-safe (serialize) — Client komponentga uzatiladi.
 */

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

const IN_CHUNK = 10

function chunk<T>(arr: T[], size = IN_CHUNK): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function daysAgoKey(days: number): string {
  return dayKey(new Date(Date.now() - days * 86400000))
}

function safeRate(correct: number, attempts: number): number {
  if (!attempts) return 0
  return Math.round((correct / attempts) * 100)
}

/** `users/{uid}` hujjatidagi o'qituvchi izohlari (turlar faylida yo'q — kengaytma). */
export interface TeacherNote {
  text: string
  byUid: string
  byName: string
  at: string | number
}

type UserDocWithNotes = UserDoc & { teacherNotes?: Record<string, TeacherNote> }

/* ------------------------------------------------------------------ */
/* Talabalar ro'yxati (guruh jadvali va dashboard uchun)               */
/* ------------------------------------------------------------------ */

export interface TeacherStudentRow {
  uid: string
  displayName: string
  email: string
  participantCode: string
  groupId: string
  groupName: string
  groupType: ExperimentGroup | null
  expGroup: ExperimentGroup | null
  lastActiveAt: number | null
  daysInactive: number | null
  profileLabel: ProficiencyLabel | null
  profileAvg: number | null
  skillScores: Partial<Record<Skill, number>>
  attempts: number
  correct: number
  correctRate: number
  timeOnTaskMin: number
  aiMessages: number
  totalXp: number
  streak: number
  riskLevel: 'low' | 'medium' | 'high' | null
  /** Oxirgi 7 kun va undan oldingi 7 kun to'g'ri javob foizi farqi */
  trend: number
  pathProgress: number
  hasPath: boolean
}

/** `statsDaily` yozuvlarini guruhlar bo'yicha o'qish. */
async function fetchGroupDailyStats(
  groupIds: string[],
  sinceDate: string
): Promise<Doc<StatsDailyDoc>[]> {
  if (!groupIds.length) return []
  const db = adminDb()
  const results = await Promise.all(
    chunk(groupIds).map((ids) =>
      db.collection(COL.statsDaily).where('groupId', 'in', ids).where('date', '>=', sinceDate).get()
    )
  )
  return results.flatMap((snap) => mapDocs<StatsDailyDoc>(snap))
}

/** Talaba qatorlarini yig'ish — guruh jadvali va «e'tibor talab qiladi» ro'yxati. */
async function buildStudentRows(
  students: Array<UserDoc & WithId>,
  groups: Array<GroupDoc & WithId>,
  windowDays = 30
): Promise<TeacherStudentRow[]> {
  if (!students.length) return []

  const db = adminDb()
  const uids = students.map((s) => s.id)
  const groupById = new Map(groups.map((g) => [g.id, g]))
  const since = daysAgoKey(windowDays)

  const [pathSnaps, streakSnaps, predictionSnaps, stats] = await Promise.all([
    db.getAll(...uids.map((uid) => db.collection(COL.learningPaths).doc(uid))),
    db.getAll(...uids.map((uid) => db.collection(COL.streaks).doc(uid))),
    db.getAll(...uids.map((uid) => db.collection(COL.predictions).doc(uid))),
    fetchGroupDailyStats(
      [...new Set(students.map((s) => s.groupId).filter((g): g is string => Boolean(g)))],
      since
    ),
  ])

  const paths = new Map<string, LearningPathDoc>()
  for (const snap of pathSnaps) if (snap.exists) paths.set(snap.id, snap.data() as LearningPathDoc)

  const streaks = new Map<string, StreakDoc>()
  for (const snap of streakSnaps) if (snap.exists) streaks.set(snap.id, snap.data() as StreakDoc)

  const predictions = new Map<string, PredictionDoc>()
  for (const snap of predictionSnaps) {
    if (snap.exists) predictions.set(snap.id, snap.data() as PredictionDoc)
  }

  const week1 = daysAgoKey(7)
  const week2 = daysAgoKey(14)

  const byUid = new Map<string, Doc<StatsDailyDoc>[]>()
  for (const row of stats) {
    if (!row.uid) continue
    const list = byUid.get(row.uid)
    if (list) list.push(row)
    else byUid.set(row.uid, [row])
  }

  const now = Date.now()

  return students.map((student) => {
    const rows = byUid.get(student.id) ?? []
    const attempts = rows.reduce((sum, r) => sum + (r.attempts ?? 0), 0)
    const correct = rows.reduce((sum, r) => sum + (r.correct ?? 0), 0)
    const timeOnTaskMin = rows.reduce((sum, r) => sum + (r.timeOnTaskMin ?? 0), 0)
    const aiMessages = rows.reduce((sum, r) => sum + (r.aiMessages ?? 0), 0)

    const recent = rows.filter((r) => r.date >= week1)
    const previous = rows.filter((r) => r.date >= week2 && r.date < week1)
    const recentRate = safeRate(
      recent.reduce((s, r) => s + (r.correct ?? 0), 0),
      recent.reduce((s, r) => s + (r.attempts ?? 0), 0)
    )
    const previousRate = safeRate(
      previous.reduce((s, r) => s + (r.correct ?? 0), 0),
      previous.reduce((s, r) => s + (r.attempts ?? 0), 0)
    )
    const trend = previous.length && recent.length ? recentRate - previousRate : 0

    const path = paths.get(student.id)
    const profile = path?.linguisticProfile ?? {}
    const skillScores: Partial<Record<Skill, number>> = {}
    for (const skill of SKILLS) {
      const entry = profile[skill]
      if (entry && typeof entry.score === 'number') skillScores[skill] = Math.round(entry.score)
    }
    const scoreValues = Object.values(skillScores)
    const profileAvg = scoreValues.length
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : null

    const steps = path?.steps ?? []
    const doneSteps = steps.filter((s) => s.status === 'done').length
    const pathProgress = steps.length ? Math.round((doneSteps / steps.length) * 100) : 0

    // Oxirgi faollik: users.lastActiveAt yoki eng so'nggi statsDaily kuni
    const lastStatDate = rows.length
      ? rows
          .map((r) => r.date)
          .sort()
          .at(-1)
      : undefined
    const lastActiveAt =
      Math.max(
        toMillis(student.lastActiveAt),
        lastStatDate ? new Date(`${lastStatDate}T00:00:00.000Z`).getTime() : 0
      ) || null

    const group = student.groupId ? groupById.get(student.groupId) : undefined

    return {
      uid: student.id,
      displayName: student.displayName || student.email || student.id,
      email: student.email ?? '',
      participantCode: student.participantCode ?? '—',
      groupId: student.groupId ?? '',
      groupName: group?.name ?? '—',
      groupType: group?.type ?? null,
      expGroup: student.expGroup ?? group?.type ?? null,
      lastActiveAt,
      daysInactive: lastActiveAt ? Math.floor((now - lastActiveAt) / 86400000) : null,
      profileLabel: profileAvg === null ? null : scoreToLabel(profileAvg),
      profileAvg,
      skillScores,
      attempts,
      correct,
      correctRate: safeRate(correct, attempts),
      timeOnTaskMin: Math.round(timeOnTaskMin),
      aiMessages,
      totalXp: student.totalXp ?? 0,
      streak: streaks.get(student.id)?.current ?? 0,
      riskLevel: predictions.get(student.id)?.riskLevel ?? null,
      trend,
      pathProgress,
      hasPath: Boolean(path),
    }
  })
}

/** O'qituvchining barcha guruhlaridagi talabalar (guard bilan). */
export const listMyStudents = cache(async (user: SessionUser): Promise<Array<UserDoc & WithId>> => {
  const groupIds = await getTeacherGroupIds(user)
  if (!groupIds.length) return []
  const db = adminDb()
  const results = await Promise.all(
    chunk(groupIds).map((ids) =>
      db.collection(COL.users).where('role', '==', 'student').where('groupId', 'in', ids).get()
    )
  )
  return results
    .flatMap((snap) => mapDocs<UserDoc>(snap))
    .sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
})

/* ------------------------------------------------------------------ */
/* 1. Dashboard                                                        */
/* ------------------------------------------------------------------ */

/** Recharts `Record<string, unknown>` kutgani uchun `type` (implicit index signature). */
export type ActivityPoint = {
  date: string
  faol: number
  urinishlar: number
  togriFoiz: number
}

export interface TeacherDashboardData {
  groups: Array<GroupDoc & WithId>
  studentCount: number
  activeLast7: number
  avgCorrectRate: number
  pendingReview: { writing: number; speaking: number; project: number; total: number }
  pendingContent: number
  upcomingAssignments: Array<Doc<AssignmentDoc> & { groupName: string }>
  activity: ActivityPoint[]
  attention: TeacherStudentRow[]
}

export const getTeacherDashboard = cache(
  async (user: SessionUser): Promise<TeacherDashboardData> => {
    const [groups, students] = await Promise.all([getTeacherGroupDocs(user), listMyStudents(user)])
    const groupIds = groups.map((g) => g.id)

    if (!groupIds.length) {
      return {
        groups: [],
        studentCount: 0,
        activeLast7: 0,
        avgCorrectRate: 0,
        pendingReview: { writing: 0, speaking: 0, project: 0, total: 0 },
        pendingContent: 0,
        upcomingAssignments: [],
        activity: [],
        attention: [],
      }
    }

    const db = adminDb()
    const since = daysAgoKey(30)

    const [rows, stats, reviewCounts, contentSnap, assignmentSnaps] = await Promise.all([
      buildStudentRows(students, groups, 30),
      fetchGroupDailyStats(groupIds, since),
      countPendingReview(user),
      db.collection(COL.items).where('status', '==', 'draft').limit(200).get(),
      Promise.all(
        groupIds.map((groupId) =>
          db
            .collection(COL.assignments)
            .where('groupId', '==', groupId)
            .where('dueAt', '>=', new Date())
            .orderBy('dueAt', 'asc')
            .limit(5)
            .get()
        )
      ),
    ])

    const groupNames = new Map(groups.map((g) => [g.id, g.name]))
    const upcomingAssignments = assignmentSnaps
      .flatMap((snap) => mapDocs<AssignmentDoc>(snap))
      .map((a) => ({ ...a, groupName: groupNames.get(a.groupId) ?? '—' }))
      .sort((a, b) => toMillis(a.dueAt) - toMillis(b.dueAt))
      .slice(0, 6)

    // 30 kunlik faollik grafigi
    const byDate = new Map<string, { uids: Set<string>; attempts: number; correct: number }>()
    for (const row of stats) {
      const bucket = byDate.get(row.date) ?? { uids: new Set<string>(), attempts: 0, correct: 0 }
      if (row.uid && (row.attempts ?? 0) > 0) bucket.uids.add(row.uid)
      bucket.attempts += row.attempts ?? 0
      bucket.correct += row.correct ?? 0
      byDate.set(row.date, bucket)
    }
    const activity: ActivityPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const date = daysAgoKey(i)
      const bucket = byDate.get(date)
      activity.push({
        date: date.slice(5),
        faol: bucket?.uids.size ?? 0,
        urinishlar: bucket?.attempts ?? 0,
        togriFoiz: safeRate(bucket?.correct ?? 0, bucket?.attempts ?? 0),
      })
    }

    const totalAttempts = rows.reduce((s, r) => s + r.attempts, 0)
    const totalCorrect = rows.reduce((s, r) => s + r.correct, 0)

    const attention = rows
      .filter(
        (r) =>
          (r.daysInactive !== null && r.daysInactive >= 7) ||
          r.trend <= -10 ||
          r.riskLevel === 'high' ||
          r.riskLevel === 'medium' ||
          (!r.hasPath && r.attempts === 0)
      )
      .sort((a, b) => attentionScore(b) - attentionScore(a))
      .slice(0, 12)

    return {
      groups,
      studentCount: students.length,
      activeLast7: rows.filter((r) => r.daysInactive !== null && r.daysInactive <= 7).length,
      avgCorrectRate: safeRate(totalCorrect, totalAttempts),
      pendingReview: reviewCounts,
      pendingContent: contentSnap.size,
      upcomingAssignments,
      activity,
      attention,
    }
  }
)

function attentionScore(row: TeacherStudentRow): number {
  let score = 0
  if (row.riskLevel === 'high') score += 100
  if (row.riskLevel === 'medium') score += 50
  if (row.daysInactive !== null) score += Math.min(row.daysInactive, 60)
  if (row.trend < 0) score += Math.min(-row.trend, 40)
  if (!row.hasPath) score += 10
  return score
}

export function attentionReasons(row: TeacherStudentRow): string[] {
  const reasons: string[] = []
  if (row.daysInactive === null) reasons.push('Hech qachon kirmagan')
  else if (row.daysInactive >= 7) reasons.push(`${row.daysInactive} kundan beri faol emas`)
  if (row.trend <= -10) reasons.push(`Natija ${Math.abs(row.trend)}% pasaygan`)
  if (row.riskLevel === 'high') reasons.push('Prognoz: yuqori xavf')
  else if (row.riskLevel === 'medium') reasons.push('Prognoz: o‘rtacha xavf')
  if (!row.hasPath) reasons.push('O‘quv yo‘nalishi tuzilmagan')
  if (!reasons.length) reasons.push('Kuzatuv talab qiladi')
  return reasons
}

/* ------------------------------------------------------------------ */
/* 2. Guruhlar                                                         */
/* ------------------------------------------------------------------ */

export interface TeacherGroupSummary extends GroupDoc {
  id: string
  studentCountActual: number
  avgProgress: number
  avgCorrectRate: number
  activeLast7: number
}

export const listTeacherGroups = cache(
  async (user: SessionUser): Promise<TeacherGroupSummary[]> => {
    const [groups, students] = await Promise.all([getTeacherGroupDocs(user), listMyStudents(user)])
    if (!groups.length) return []

    const rows = await buildStudentRows(students, groups, 30)
    const byGroup = new Map<string, TeacherStudentRow[]>()
    for (const row of rows) {
      const list = byGroup.get(row.groupId)
      if (list) list.push(row)
      else byGroup.set(row.groupId, [row])
    }

    return groups.map((group) => {
      const list = byGroup.get(group.id) ?? []
      const attempts = list.reduce((s, r) => s + r.attempts, 0)
      const correct = list.reduce((s, r) => s + r.correct, 0)
      return {
        ...group,
        studentCountActual: list.length,
        avgProgress: list.length
          ? Math.round(list.reduce((s, r) => s + r.pathProgress, 0) / list.length)
          : 0,
        avgCorrectRate: safeRate(correct, attempts),
        activeLast7: list.filter((r) => r.daysInactive !== null && r.daysInactive <= 7).length,
      }
    })
  }
)

export interface GroupDetailData {
  group: GroupDoc & WithId
  rows: TeacherStudentRow[]
  skillAverages: Array<{ name: string; value: number }>
  progressSeries: Array<{ date: string; togriFoiz: number; faol: number }>
  assignments: Doc<AssignmentDoc>[]
  avgCorrectRate: number
  activeLast7: number
}

export const getGroupDetail = cache(
  async (user: SessionUser, groupId: string): Promise<GroupDetailData> => {
    const group = await assertTeachesGroup(user, groupId)
    const db = adminDb()

    const [studentsSnap, statsRows, assignmentsSnap] = await Promise.all([
      db.collection(COL.users).where('groupId', '==', groupId).where('role', '==', 'student').get(),
      fetchGroupDailyStats([groupId], daysAgoKey(30)),
      db
        .collection(COL.assignments)
        .where('groupId', '==', groupId)
        .orderBy('dueAt', 'desc')
        .limit(10)
        .get(),
    ])

    const students = mapDocs<UserDoc>(studentsSnap).sort((a, b) =>
      (a.displayName ?? '').localeCompare(b.displayName ?? '')
    )
    const rows = await buildStudentRows(students, [group], 30)

    const skillAverages = SKILLS.map((skill) => {
      const values = rows
        .map((r) => r.skillScores[skill])
        .filter((v): v is number => typeof v === 'number')
      return {
        skill,
        value: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
      }
    })
      .filter((entry) => entry.value > 0)
      .map((entry) => ({ name: SKILL_LABELS[entry.skill].uz, value: entry.value }))

    const byDate = new Map<string, { attempts: number; correct: number; uids: Set<string> }>()
    for (const row of statsRows) {
      const bucket = byDate.get(row.date) ?? { attempts: 0, correct: 0, uids: new Set<string>() }
      bucket.attempts += row.attempts ?? 0
      bucket.correct += row.correct ?? 0
      if (row.uid && (row.attempts ?? 0) > 0) bucket.uids.add(row.uid)
      byDate.set(row.date, bucket)
    }
    const progressSeries: Array<{ date: string; togriFoiz: number; faol: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = daysAgoKey(i)
      const bucket = byDate.get(date)
      progressSeries.push({
        date: date.slice(5),
        togriFoiz: safeRate(bucket?.correct ?? 0, bucket?.attempts ?? 0),
        faol: bucket?.uids.size ?? 0,
      })
    }

    const attempts = rows.reduce((s, r) => s + r.attempts, 0)
    const correct = rows.reduce((s, r) => s + r.correct, 0)

    return {
      group,
      rows,
      skillAverages,
      progressSeries,
      assignments: mapDocs<AssignmentDoc>(assignmentsSnap),
      avgCorrectRate: safeRate(correct, attempts),
      activeLast7: rows.filter((r) => r.daysInactive !== null && r.daysInactive <= 7).length,
    }
  }
)

/* ------------------------------------------------------------------ */
/* 3. Individual talaba                                                */
/* ------------------------------------------------------------------ */

export interface StudentDetailData {
  student: UserDoc & WithId
  group: GroupDoc & WithId
  row: TeacherStudentRow
  path: Doc<LearningPathDoc> | null
  mastery: Doc<MasteryDoc>[]
  errorProfile: Doc<ErrorProfileDoc> | null
  recentAttempts: Doc<AttemptDoc>[]
  speaking: Doc<SpeakingSubmissionDoc>[]
  writing: Doc<WritingSubmissionDoc>[]
  reflections: Doc<ReflectionDoc>[]
  testAttempts: Doc<TestAttemptDoc>[]
  /** Faqat SON — AI suhbat mazmuni o'qituvchiga ko'rsatilmaydi (maxfiylik). */
  aiUsage: { sessions: number; messages: number }
  prediction: Doc<PredictionDoc> | null
  teacherNote: TeacherNote | null
  chatId: string | null
}

export const getStudentDetail = cache(
  async (user: SessionUser, uid: string): Promise<StudentDetailData> => {
    const student = await assertTeachesStudent(user, uid)
    const group = await assertTeachesGroup(user, student.groupId)
    const db = adminDb()

    const [
      pathSnap,
      masterySnap,
      errorSnap,
      attemptsSnap,
      speakingSnap,
      writingSnap,
      reflectionsSnap,
      testsSnap,
      aiSnap,
      predictionSnap,
      chatSnap,
      rawUserSnap,
    ] = await Promise.all([
      db.collection(COL.learningPaths).doc(uid).get(),
      db.collection(COL.mastery).doc(uid).collection('skills').get(),
      db.collection(COL.errorProfiles).doc(uid).get(),
      db.collection(COL.attempts).where('uid', '==', uid).orderBy('ts', 'desc').limit(25).get(),
      db
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .orderBy('ts', 'desc')
        .limit(10)
        .get(),
      db
        .collection(COL.writingSubmissions)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
      db.collection(COL.reflections).where('uid', '==', uid).orderBy('ts', 'desc').limit(10).get(),
      // orderBy yo'q: `testAttempts` uchun (uid, finishedAt) kompozit indeksi mavjud emas —
      // saralash xotirada bajariladi.
      db.collection(COL.testAttempts).where('uid', '==', uid).limit(20).get(),
      db
        .collection(COL.aiSessions)
        .where('uid', '==', uid)
        .orderBy('lastMessageAt', 'desc')
        .limit(100)
        .get(),
      db.collection(COL.predictions).doc(uid).get(),
      db
        .collection(COL.chats)
        .where('memberUids', 'array-contains', user.uid)
        .where('type', '==', 'teacher')
        .limit(50)
        .get(),
      db.collection(COL.users).doc(uid).get(),
    ])

    const rows = await buildStudentRows([student], [group], 30)
    const notes = (rawUserSnap.data() as UserDocWithNotes | undefined)?.teacherNotes ?? {}

    const chat = chatSnap.docs.find((d) => ((d.data() as ChatDoc).memberUids ?? []).includes(uid))

    return {
      student,
      group,
      row: rows[0],
      path: pathSnap.exists
        ? serialize({ id: pathSnap.id, ...(pathSnap.data() as LearningPathDoc) })
        : null,
      mastery: mapDocs<MasteryDoc>(masterySnap),
      errorProfile: errorSnap.exists
        ? serialize({ id: errorSnap.id, ...(errorSnap.data() as ErrorProfileDoc) })
        : null,
      recentAttempts: mapDocs<AttemptDoc>(attemptsSnap),
      speaking: mapDocs<SpeakingSubmissionDoc>(speakingSnap),
      writing: mapDocs<WritingSubmissionDoc>(writingSnap),
      reflections: mapDocs<ReflectionDoc>(reflectionsSnap),
      testAttempts: mapDocs<TestAttemptDoc>(testsSnap)
        .sort(
          (a, b) => toMillis(b.finishedAt ?? b.startedAt) - toMillis(a.finishedAt ?? a.startedAt)
        )
        .slice(0, 5),
      aiUsage: {
        sessions: aiSnap.size,
        messages: aiSnap.docs.reduce(
          (sum, d) => sum + ((d.data() as AiSessionDoc).messageCount ?? 0),
          0
        ),
      },
      prediction: predictionSnap.exists
        ? serialize({ id: predictionSnap.id, ...(predictionSnap.data() as PredictionDoc) })
        : null,
      teacherNote: serialize(notes[user.uid] ?? null),
      chatId: chat?.id ?? null,
    }
  }
)

/* ------------------------------------------------------------------ */
/* 4. Baholash navbati (review queue)                                  */
/* ------------------------------------------------------------------ */

export type ReviewKind = 'writing' | 'speaking' | 'project'

export interface ReviewQueueRow {
  id: string
  kind: ReviewKind
  studentUid: string
  studentName: string
  participantCode: string
  groupId: string
  groupName: string
  taskTitle: string
  submittedAt: number
  hasAiFeedback: boolean
  reviewed: boolean
  score: number | null
  extra?: string
}

interface StudentIndex {
  byUid: Map<string, UserDoc & WithId>
  groupNames: Map<string, string>
  uids: string[]
  groupIds: string[]
}

const getStudentIndex = cache(async (user: SessionUser): Promise<StudentIndex> => {
  const [students, groups] = await Promise.all([listMyStudents(user), getTeacherGroupDocs(user)])
  return {
    byUid: new Map(students.map((s) => [s.id, s])),
    groupNames: new Map(groups.map((g) => [g.id, g.name])),
    uids: students.map((s) => s.id),
    groupIds: groups.map((g) => g.id),
  }
})

async function countPendingReview(
  user: SessionUser
): Promise<{ writing: number; speaking: number; project: number; total: number }> {
  const queue = await getReviewQueue(user)
  const writing = queue.filter((r) => r.kind === 'writing' && !r.reviewed).length
  const speaking = queue.filter((r) => r.kind === 'speaking' && !r.reviewed).length
  const project = queue.filter((r) => r.kind === 'project' && !r.reviewed).length
  return { writing, speaking, project, total: writing + speaking + project }
}

/** Uch turdagi topshiriqlar navbati (baholanganlar ham ko'rinadi — tarix uchun). */
export const getReviewQueue = cache(async (user: SessionUser): Promise<ReviewQueueRow[]> => {
  const index = await getStudentIndex(user)
  if (!index.uids.length) return []

  const db = adminDb()

  const [writingSnaps, speakingSnaps, projectSnaps] = await Promise.all([
    // Eslatma: Firestore bitta so'rovda faqat bitta `in` shartiga ruxsat beradi —
    // status bo'yicha filtr xotirada bajariladi.
    Promise.all(
      chunk(index.uids).map((uids) =>
        db
          .collection(COL.writingSubmissions)
          .where('uid', 'in', uids)
          .orderBy('createdAt', 'desc')
          .limit(150)
          .get()
      )
    ),
    Promise.all(
      chunk(index.uids).map((uids) =>
        db
          .collection(COL.speakingSubmissions)
          .where('uid', 'in', uids)
          .orderBy('ts', 'desc')
          .limit(150)
          .get()
      )
    ),
    Promise.all(
      chunk(index.groupIds, IN_CHUNK).map((groupIds) =>
        db.collection(COL.projects).where('groupId', 'in', groupIds).limit(60).get()
      )
    ),
  ])

  const rows: ReviewQueueRow[] = []

  for (const snap of writingSnaps) {
    for (const doc of mapDocs<WritingSubmissionDoc>(snap)) {
      const student = index.byUid.get(doc.uid)
      if (!student) continue
      if (doc.status !== 'submitted' && doc.status !== 'reviewed') continue
      rows.push({
        id: doc.id,
        kind: 'writing',
        studentUid: doc.uid,
        studentName: student.displayName ?? doc.uid,
        participantCode: student.participantCode ?? '—',
        groupId: student.groupId ?? '',
        groupName: index.groupNames.get(student.groupId ?? '') ?? '—',
        taskTitle: doc.taskTitle || 'Writing topshirig‘i',
        submittedAt: toMillis(doc.submittedAt ?? doc.createdAt),
        hasAiFeedback: (doc.drafts ?? []).some((d) => Boolean(d.aiFeedback)),
        reviewed: doc.status === 'reviewed',
        score: doc.teacherFeedback?.score ?? null,
        extra: `${doc.wordCount ?? 0} so‘z · ${(doc.drafts ?? []).length} qoralama`,
      })
    }
  }

  for (const snap of speakingSnaps) {
    for (const doc of mapDocs<SpeakingSubmissionDoc>(snap)) {
      const student = index.byUid.get(doc.uid)
      if (!student) continue
      rows.push({
        id: doc.id,
        kind: 'speaking',
        studentUid: doc.uid,
        studentName: student.displayName ?? doc.uid,
        participantCode: student.participantCode ?? '—',
        groupId: student.groupId ?? '',
        groupName: index.groupNames.get(student.groupId ?? '') ?? '—',
        taskTitle: doc.taskTitle || 'Speaking topshirig‘i',
        submittedAt: toMillis(doc.ts),
        hasAiFeedback: Boolean(doc.aiFeedback),
        reviewed: Boolean(doc.teacherFeedback),
        score: doc.teacherFeedback?.score ?? doc.azure?.pronScore ?? null,
        extra: `${Math.round(doc.durationSec ?? 0)} s · ${doc.attemptNo ?? 1}-urinish`,
      })
    }
  }

  for (const snap of projectSnaps) {
    for (const doc of mapDocs<ProjectDoc>(snap)) {
      if (doc.status !== 'submitted' && doc.status !== 'graded') continue
      rows.push({
        id: doc.id,
        kind: 'project',
        studentUid: doc.memberUids?.[0] ?? '',
        studentName: `${(doc.members ?? []).map((m) => m.name).join(', ') || 'Jamoa'}`,
        participantCode: `${doc.memberUids?.length ?? 0} a’zo`,
        groupId: doc.groupId,
        groupName: index.groupNames.get(doc.groupId) ?? '—',
        taskTitle: doc.title || 'Guruh loyihasi',
        submittedAt: toMillis(doc.deadline ?? doc.createdAt),
        hasAiFeedback: Boolean(doc.aiRubricScores),
        reviewed: doc.status === 'graded',
        score: null,
        extra: `${doc.presentationFiles?.length ?? 0} fayl`,
      })
    }
  }

  return rows.sort((a, b) => {
    if (a.reviewed !== b.reviewed) return a.reviewed ? 1 : -1
    return b.submittedAt - a.submittedAt
  })
})

/** Writing topshirig'i — to'liq ko'rinish (guard bilan). */
export const getWritingForReview = cache(
  async (
    user: SessionUser,
    id: string
  ): Promise<{ submission: Doc<WritingSubmissionDoc>; student: UserDoc & WithId } | null> => {
    const snap = await adminDb().collection(COL.writingSubmissions).doc(id).get()
    if (!snap.exists) return null
    const submission = serialize({ id: snap.id, ...(snap.data() as WritingSubmissionDoc) })
    const student = await assertTeachesStudent(user, submission.uid)
    return { submission, student }
  }
)

export const getSpeakingForReview = cache(
  async (
    user: SessionUser,
    id: string
  ): Promise<{
    submission: Doc<SpeakingSubmissionDoc>
    student: UserDoc & WithId
    audioUrl: string | null
  } | null> => {
    const snap = await adminDb().collection(COL.speakingSubmissions).doc(id).get()
    if (!snap.exists) return null
    const submission = serialize({ id: snap.id, ...(snap.data() as SpeakingSubmissionDoc) })
    const student = await assertTeachesStudent(user, submission.uid)
    return { submission, student, audioUrl: await resolveAudioUrl(submission) }
  }
)

async function resolveAudioUrl(submission: SpeakingSubmissionDoc): Promise<string | null> {
  if (submission.audioUrl) return submission.audioUrl
  if (!submission.audioPath) return null
  try {
    const [url] = await adminBucket()
      .file(submission.audioPath)
      .getSignedUrl({ action: 'read', expires: Date.now() + 60 * 60 * 1000 })
    return url
  } catch {
    return null
  }
}

export const getProjectForReview = cache(
  async (
    user: SessionUser,
    id: string
  ): Promise<{
    project: Doc<ProjectDoc>
    group: GroupDoc & WithId
    contributions: Doc<ContributionDoc>[]
  } | null> => {
    const db = adminDb()
    const snap = await db.collection(COL.projects).doc(id).get()
    if (!snap.exists) return null
    const project = serialize({ id: snap.id, ...(snap.data() as ProjectDoc) })
    const group = await assertTeachesGroup(user, project.groupId)
    const contribSnap = await db.collection(COL.projects).doc(id).collection('contributions').get()
    return { project, group, contributions: mapDocs<ContributionDoc>(contribSnap) }
  }
)

/* ------------------------------------------------------------------ */
/* 5. Kontent tasdiqlash                                               */
/* ------------------------------------------------------------------ */

export interface ContentQueueData {
  items: Doc<ItemDoc>[]
  lessons: Doc<LessonDoc>[]
  lexicon: Doc<LexiconDoc>[]
}

export const getContentQueue = cache(async (): Promise<ContentQueueData> => {
  const db = adminDb()
  const [itemsSnap, lessonsSnap, lexiconSnap] = await Promise.all([
    db.collection(COL.items).where('status', '==', 'draft').limit(150).get(),
    db.collection(COL.lessons).where('published', '==', false).limit(60).get(),
    db.collection(COL.lexicon).where('status', '==', 'draft').limit(80).get(),
  ])

  return {
    items: mapDocs<ItemDoc>(itemsSnap).sort(
      (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
    ),
    lessons: mapDocs<LessonDoc>(lessonsSnap).sort(
      (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
    ),
    lexicon: mapDocs<LexiconDoc>(lexiconSnap).sort((a, b) => a.word.localeCompare(b.word)),
  }
})

/* ------------------------------------------------------------------ */
/* 6. Topshiriqlar                                                     */
/* ------------------------------------------------------------------ */

export interface AssignmentCompletion {
  uid: string
  name: string
  participantCode: string
  done: boolean
  detail?: string
}

export interface AssignmentRow extends AssignmentDoc {
  id: string
  groupName: string
  completion: AssignmentCompletion[]
  doneCount: number
  totalCount: number
}

export const listTeacherAssignments = cache(
  async (user: SessionUser, groupId?: string): Promise<AssignmentRow[]> => {
    const groupIds = groupId
      ? [(await assertTeachesGroup(user, groupId)).id]
      : await getTeacherGroupIds(user)
    if (!groupIds.length) return []

    const db = adminDb()
    const [groups, students, snaps] = await Promise.all([
      getTeacherGroupDocs(user),
      listMyStudents(user),
      Promise.all(
        groupIds.map((id) =>
          db
            .collection(COL.assignments)
            .where('groupId', '==', id)
            .orderBy('dueAt', 'desc')
            .limit(30)
            .get()
        )
      ),
    ])

    const assignments = snaps
      .flatMap((snap) => mapDocs<AssignmentDoc>(snap))
      .sort((a, b) => toMillis(b.dueAt) - toMillis(a.dueAt))
      .slice(0, 40)

    const groupNames = new Map(groups.map((g) => [g.id, g.name]))
    const relevantUids = students
      .filter((s) => s.groupId && groupIds.includes(s.groupId))
      .map((s) => s.id)

    const [writingDocs, speakingDocs, testDocs, projectDocs, attemptDocs] = await Promise.all([
      collectByUid<WritingSubmissionDoc>(COL.writingSubmissions, relevantUids, 'createdAt', 200),
      collectByUid<SpeakingSubmissionDoc>(COL.speakingSubmissions, relevantUids, 'ts', 200),
      collectByUid<TestAttemptDoc>(COL.testAttempts, relevantUids, null, 200),
      groupIds.length
        ? Promise.all(
            chunk(groupIds).map((ids) =>
              db.collection(COL.projects).where('groupId', 'in', ids).limit(60).get()
            )
          ).then((snapList) => snapList.flatMap((s) => mapDocs<ProjectDoc>(s)))
        : Promise.resolve([] as Doc<ProjectDoc>[]),
      collectByUid<AttemptDoc>(COL.attempts, relevantUids, 'ts', 400),
    ])

    return assignments.map((assignment) => {
      const groupStudents = students.filter((s) => s.groupId === assignment.groupId)
      const completion: AssignmentCompletion[] = groupStudents.map((student) => {
        const done = isAssignmentDone(assignment, student.id, {
          writingDocs,
          speakingDocs,
          testDocs,
          projectDocs,
          attemptDocs,
        })
        return {
          uid: student.id,
          name: student.displayName ?? student.id,
          participantCode: student.participantCode ?? '—',
          done: done.done,
          detail: done.detail,
        }
      })

      return {
        ...assignment,
        groupName: groupNames.get(assignment.groupId) ?? '—',
        completion,
        doneCount: completion.filter((c) => c.done).length,
        totalCount: completion.length,
      }
    })
  }
)

/**
 * `uid in [...]` bo'yicha hujjatlarni chunk'lar bilan o'qish.
 * `orderField` faqat mos kompozit indeks mavjud bo'lgan kolleksiyalar uchun beriladi
 * (`firestore.indexes.json`); aks holda `null` — saralash xotirada.
 */
async function collectByUid<T>(
  collection: string,
  uids: string[],
  orderField: string | null,
  perChunk: number
): Promise<Doc<T>[]> {
  if (!uids.length) return []
  const db = adminDb()
  const snaps = await Promise.all(
    chunk(uids).map((ids) => {
      let query: FirebaseFirestore.Query = db.collection(collection).where('uid', 'in', ids)
      if (orderField) query = query.orderBy(orderField, 'desc')
      return query.limit(perChunk).get()
    })
  )
  return snaps.flatMap((snap) => mapDocs<T>(snap))
}

function isAssignmentDone(
  assignment: Doc<AssignmentDoc>,
  uid: string,
  data: {
    writingDocs: Doc<WritingSubmissionDoc>[]
    speakingDocs: Doc<SpeakingSubmissionDoc>[]
    testDocs: Doc<TestAttemptDoc>[]
    projectDocs: Doc<ProjectDoc>[]
    attemptDocs: Doc<AttemptDoc>[]
  }
): { done: boolean; detail?: string } {
  const createdAt = toMillis(assignment.createdAt)
  const ref = assignment.refId

  switch (assignment.kind) {
    case 'writing': {
      const hit = data.writingDocs.find(
        (d) =>
          d.uid === uid &&
          (!ref || d.taskId === ref) &&
          d.status !== 'draft' &&
          toMillis(d.createdAt) >= createdAt
      )
      return { done: Boolean(hit), detail: hit ? `${hit.wordCount ?? 0} so‘z` : undefined }
    }
    case 'speaking': {
      const hit = data.speakingDocs.find(
        (d) => d.uid === uid && (!ref || d.taskId === ref) && toMillis(d.ts) >= createdAt
      )
      return { done: Boolean(hit), detail: hit ? `${hit.attemptNo ?? 1}-urinish` : undefined }
    }
    case 'test': {
      const hit = data.testDocs.find(
        (d) => d.uid === uid && (!ref || d.testId === ref) && d.status !== 'in_progress'
      )
      return { done: Boolean(hit), detail: hit ? `${Math.round(hit.percent ?? 0)}%` : undefined }
    }
    case 'project': {
      const hit = data.projectDocs.find(
        (p) => (p.memberUids ?? []).includes(uid) && (!ref || p.id === ref)
      )
      return {
        done: Boolean(hit && hit.status !== 'active'),
        detail: hit ? hit.status : undefined,
      }
    }
    default: {
      const hits = data.attemptDocs.filter(
        (a) =>
          a.uid === uid &&
          toMillis(a.ts) >= createdAt &&
          (!ref || a.contextId === ref || a.topic === ref)
      )
      return {
        done: hits.length > 0,
        detail: hits.length ? `${hits.length} urinish` : undefined,
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 7. Suhbatlar                                                        */
/* ------------------------------------------------------------------ */

export interface TeacherChatRow {
  id: string
  title: string
  studentUid: string
  participantCode: string
  groupName: string
  lastText: string
  lastAt: number
  lastSenderUid: string
}

export const listTeacherChats = cache(async (user: SessionUser): Promise<TeacherChatRow[]> => {
  const index = await getStudentIndex(user)
  const snap = await adminDb()
    .collection(COL.chats)
    .where('memberUids', 'array-contains', user.uid)
    .limit(100)
    .get()

  return mapDocs<ChatDoc>(snap)
    .map((chat) => {
      const studentUid = (chat.memberUids ?? []).find((uid) => uid !== user.uid) ?? ''
      const student = index.byUid.get(studentUid)
      if (!student) return null
      return {
        id: chat.id,
        title: chat.title || student.displayName || studentUid,
        studentUid,
        participantCode: student.participantCode ?? '—',
        groupName: index.groupNames.get(student.groupId ?? '') ?? '—',
        lastText: chat.lastMessage?.text ?? '',
        lastAt: toMillis(chat.lastMessage?.ts ?? chat.createdAt),
        lastSenderUid: chat.lastMessage?.senderUid ?? '',
      }
    })
    .filter((row): row is TeacherChatRow => row !== null)
    .sort((a, b) => b.lastAt - a.lastAt)
})

/** Chat sahifasi uchun: o'qituvchi yozishi mumkin bo'lgan talabalar. */
export const listChatCandidates = cache(
  async (user: SessionUser): Promise<Array<{ uid: string; name: string; groupName: string }>> => {
    const index = await getStudentIndex(user)
    return [...index.byUid.values()].map((student) => ({
      uid: student.id,
      name: student.displayName ?? student.id,
      groupName: index.groupNames.get(student.groupId ?? '') ?? '—',
    }))
  }
)

/* ------------------------------------------------------------------ */
/* 8. Analitika                                                        */
/* ------------------------------------------------------------------ */

export interface HardItemRow {
  id: string
  stem: string
  skill: string
  topic: string
  difficulty: number
  attempts: number
  correctRate: number
}

export interface TeacherAnalyticsData {
  group: GroupDoc & WithId
  skillSeries: Array<Record<string, string | number>>
  skillKeys: Skill[]
  errorDistribution: Array<{ name: string; value: number; tag: ErrorTag }>
  hardestItems: HardItemRow[]
  timeSeries: Array<{ date: string; daqiqa: number }>
  aiSeries: Array<{ date: string; xabarlar: number }>
  totals: {
    students: number
    attempts: number
    correctRate: number
    timeOnTaskMin: number
    aiMessages: number
    avgTimePerStudentMin: number
  }
}

export const getGroupAnalytics = cache(
  async (user: SessionUser, groupId: string, days = 30): Promise<TeacherAnalyticsData> => {
    const group = await assertTeachesGroup(user, groupId)
    const db = adminDb()
    const sinceDate = daysAgoKey(days)
    const sinceTs = new Date(Date.now() - days * 86400000)

    const [studentsSnap, stats, attemptsSnap] = await Promise.all([
      db.collection(COL.users).where('groupId', '==', groupId).where('role', '==', 'student').get(),
      fetchGroupDailyStats([groupId], sinceDate),
      db
        .collection(COL.attempts)
        .where('groupId', '==', groupId)
        .where('ts', '>=', sinceTs)
        .orderBy('ts', 'desc')
        .limit(1500)
        .get(),
    ])

    const students = mapDocs<UserDoc>(studentsSnap)
    const attempts = mapDocs<AttemptDoc>(attemptsSnap)

    // Xatolar taqsimoti: attempts.errorTags + errorProfiles
    const errorCounts = new Map<ErrorTag, number>()
    for (const attempt of attempts) {
      for (const tag of attempt.errorTags ?? []) {
        errorCounts.set(tag, (errorCounts.get(tag) ?? 0) + 1)
      }
    }
    if (students.length) {
      const profileSnaps = await db.getAll(
        ...students.map((s) => db.collection(COL.errorProfiles).doc(s.id))
      )
      for (const snap of profileSnaps) {
        if (!snap.exists) continue
        const counts = (snap.data() as ErrorProfileDoc).counts ?? {}
        for (const [tag, value] of Object.entries(counts)) {
          if (typeof value !== 'number') continue
          errorCounts.set(tag as ErrorTag, (errorCounts.get(tag as ErrorTag) ?? 0) + value)
        }
      }
    }

    // Mashq sifati: eng past to'g'ri javob foizli itemlar
    const itemAgg = new Map<string, { attempts: number; correct: number }>()
    for (const attempt of attempts) {
      if (!attempt.itemId) continue
      const bucket = itemAgg.get(attempt.itemId) ?? { attempts: 0, correct: 0 }
      bucket.attempts += 1
      if (attempt.isCorrect) bucket.correct += 1
      itemAgg.set(attempt.itemId, bucket)
    }
    const candidates = [...itemAgg.entries()]
      .filter(([, v]) => v.attempts >= 3)
      .sort((a, b) => a[1].correct / a[1].attempts - b[1].correct / b[1].attempts)
      .slice(0, 15)

    let hardestItems: HardItemRow[] = []
    if (candidates.length) {
      const snaps = await db.getAll(...candidates.map(([id]) => db.collection(COL.items).doc(id)))
      const itemById = new Map(
        snaps.filter((s) => s.exists).map((s) => [s.id, s.data() as ItemDoc])
      )
      hardestItems = candidates.map(([id, agg]) => {
        const item = itemById.get(id)
        return {
          id,
          stem: item?.stem ?? '(o‘chirilgan mashq)',
          skill: item?.skill ?? '—',
          topic: item?.topic ?? '—',
          difficulty: item?.difficulty ?? 0,
          attempts: agg.attempts,
          correctRate: safeRate(agg.correct, agg.attempts),
        }
      })
    }

    // Kunlik qatorlar
    const statsByDate = new Map<string, Doc<StatsDailyDoc>[]>()
    for (const row of stats) {
      const list = statsByDate.get(row.date)
      if (list) list.push(row)
      else statsByDate.set(row.date, [row])
    }

    const skillSeries: Array<Record<string, string | number>> = []
    const timeSeries: Array<{ date: string; daqiqa: number }> = []
    const aiSeries: Array<{ date: string; xabarlar: number }> = []
    const usedSkills = new Set<Skill>()

    for (let i = days - 1; i >= 0; i--) {
      const date = daysAgoKey(i)
      const rows = statsByDate.get(date) ?? []
      const point: Record<string, string | number> = { date: date.slice(5) }
      for (const skill of SKILLS) {
        const values = rows
          .map((r) => r.skillScores?.[skill])
          .filter((v): v is number => typeof v === 'number')
        if (values.length) {
          point[skill] = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          usedSkills.add(skill)
        }
      }
      skillSeries.push(point)
      timeSeries.push({
        date: date.slice(5),
        daqiqa: Math.round(rows.reduce((s, r) => s + (r.timeOnTaskMin ?? 0), 0)),
      })
      aiSeries.push({
        date: date.slice(5),
        xabarlar: rows.reduce((s, r) => s + (r.aiMessages ?? 0), 0),
      })
    }

    const totalAttempts = stats.reduce((s, r) => s + (r.attempts ?? 0), 0)
    const totalCorrect = stats.reduce((s, r) => s + (r.correct ?? 0), 0)
    const totalMinutes = stats.reduce((s, r) => s + (r.timeOnTaskMin ?? 0), 0)

    return {
      group,
      skillSeries,
      skillKeys: [...usedSkills],
      errorDistribution: [...errorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tag, value]) => ({ tag, name: ERROR_TAG_LABELS[tag]?.uz ?? tag, value })),
      hardestItems,
      timeSeries,
      aiSeries,
      totals: {
        students: students.length,
        attempts: totalAttempts,
        correctRate: safeRate(totalCorrect, totalAttempts),
        timeOnTaskMin: Math.round(totalMinutes),
        aiMessages: stats.reduce((s, r) => s + (r.aiMessages ?? 0), 0),
        avgTimePerStudentMin: students.length ? Math.round(totalMinutes / students.length) : 0,
      },
    }
  }
)

export { chunk, safeRate, daysAgoKey }
