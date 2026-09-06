import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL, SKILLS, XP, type Skill } from '@/config/constants'
import { dayKey, serialize, toMillis } from '@/lib/utils/format'
import { getLearningPath, getRecentDailyStats, type Doc } from '@/features/shared/queries'
import type {
  AssignmentDoc,
  ErrorProfileDoc,
  MasteryDoc,
  NotificationDoc,
  PathStep,
  ReflectionDoc,
  SpeakingSubmissionDoc,
  StatsDailyDoc,
  StreakDoc,
  TestAttemptDoc,
  UserBadgeDoc,
  UserVocabDoc,
  WritingSubmissionDoc,
} from '@/types'

/** Student dashboard uchun yig'ma ma'lumot (PLAN 12, 2-sahifa). */
export interface StudentDashboardData {
  path: Doc<import('@/types').LearningPathDoc> | null
  nextSteps: PathStep[]
  todayStats: StatsDailyDoc | null
  weekStats: Doc<StatsDailyDoc>[]
  streak: { current: number; longest: number }
  totalXp: number
  badgeCount: number
  dueWordCount: number
  pendingAssignments: Doc<AssignmentDoc>[]
  unreadNotifications: number
  lastDiagnostic: Doc<TestAttemptDoc> | null
  skillScores: Partial<Record<Skill, number>>
  recentFeedback: Array<{
    id: string
    kind: 'speaking' | 'writing'
    title: string
    score?: number
    ts: number
  }>
}

export const getStudentDashboard = cache(
  async (uid: string, groupId?: string): Promise<StudentDashboardData> => {
    const db = adminDb()
    const today = dayKey()

    const [
      path,
      todaySnap,
      weekStats,
      streakSnap,
      userSnap,
      badgesSnap,
      vocabSnap,
      assignmentsSnap,
      notificationsSnap,
      diagnosticSnap,
      speakingSnap,
      writingSnap,
    ] = await Promise.all([
      getLearningPath(uid),
      db.collection(COL.statsDaily).doc(`${uid}_${today}`).get(),
      getRecentDailyStats(uid, 7),
      db.collection(COL.streaks).doc(uid).get(),
      db.collection(COL.users).doc(uid).get(),
      db.collection(COL.userBadges).doc(uid).collection('items').limit(50).get(),
      db
        .collection(COL.userVocab)
        .doc(uid)
        .collection('words')
        .where('srs.due', '<=', new Date())
        .limit(50)
        .get(),
      groupId
        ? db
            .collection(COL.assignments)
            .where('groupId', '==', groupId)
            .where('dueAt', '>=', new Date())
            .orderBy('dueAt', 'asc')
            .limit(5)
            .get()
        : null,
      db
        .collection(COL.notifications)
        .doc(uid)
        .collection('items')
        .where('read', '==', false)
        .limit(20)
        .get(),
      db
        .collection(COL.testAttempts)
        .where('uid', '==', uid)
        .where('type', '==', 'diagnostic')
        .orderBy('finishedAt', 'desc')
        .limit(1)
        .get(),
      db
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .orderBy('ts', 'desc')
        .limit(3)
        .get(),
      db
        .collection(COL.writingSubmissions)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get(),
    ])

    const diagnostic = diagnosticSnap.docs[0]
      ? serialize({
          id: diagnosticSnap.docs[0].id,
          ...(diagnosticSnap.docs[0].data() as TestAttemptDoc),
        })
      : null

    const skillScores: Partial<Record<Skill, number>> = {}
    for (const skill of SKILLS) {
      const fromPath = path?.linguisticProfile?.[skill]?.score
      const fromTest = diagnostic?.sectionScores?.[skill]?.percent
      const score = fromPath ?? fromTest
      if (typeof score === 'number') skillScores[skill] = Math.round(score)
    }

    const recentFeedback = [
      ...speakingSnap.docs.map((d) => {
        const data = d.data() as SpeakingSubmissionDoc
        return {
          id: d.id,
          kind: 'speaking' as const,
          title: data.taskTitle,
          score: data.azure?.pronScore,
          ts: toMillis(data.ts),
        }
      }),
      ...writingSnap.docs.map((d) => {
        const data = d.data() as WritingSubmissionDoc
        return {
          id: d.id,
          kind: 'writing' as const,
          title: data.taskTitle,
          score: data.teacherFeedback?.score,
          ts: toMillis(data.createdAt),
        }
      }),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5)

    const streak = (streakSnap.data() as StreakDoc | undefined) ?? { current: 0, longest: 0 }
    const nextSteps = (path?.steps ?? [])
      .filter((s) => s.status === 'available' || s.status === 'in_progress')
      .slice(0, 4)

    return {
      path,
      nextSteps,
      todayStats: (todaySnap.data() as StatsDailyDoc | undefined) ?? null,
      weekStats,
      streak: { current: streak.current ?? 0, longest: streak.longest ?? 0 },
      totalXp: (userSnap.data()?.totalXp as number | undefined) ?? 0,
      badgeCount: badgesSnap.size,
      dueWordCount: vocabSnap.size,
      pendingAssignments: assignmentsSnap
        ? assignmentsSnap.docs.map((d) => serialize({ id: d.id, ...(d.data() as AssignmentDoc) }))
        : [],
      unreadNotifications: notificationsSnap.size,
      lastDiagnostic: diagnostic,
      skillScores,
      recentFeedback,
    }
  }
)

/** Bugungi vazifalar: yo'nalish qadamlari + takrorlanadigan so'zlar + topshiriqlar. */
export interface TodayTask {
  id: string
  kind: PathStep['kind'] | 'vocab_review' | 'assignment' | 'reflection'
  title: string
  subtitle?: string
  href: string
  xp: number
  done: boolean
}

export const getTodayTasks = cache(async (uid: string, groupId?: string): Promise<TodayTask[]> => {
  const data = await getStudentDashboard(uid, groupId)
  const tasks: TodayTask[] = []

  for (const step of data.nextSteps.slice(0, 3)) {
    tasks.push({
      id: step.id,
      kind: step.kind,
      title: step.title,
      subtitle: step.reason,
      href: pathStepHref(step),
      xp: step.kind === 'test' ? XP.TEST_COMPLETE : XP.LESSON_COMPLETE,
      done: step.status === 'done',
    })
  }

  if (data.dueWordCount > 0) {
    tasks.push({
      id: 'vocab-review',
      kind: 'vocab_review',
      title: `${data.dueWordCount} ta so‘zni takrorlash`,
      subtitle: 'Spaced repetition — bugun takrorlash vaqti keldi',
      href: '/student/practice/vocabulary?mode=review',
      xp: XP.ITEM_CORRECT * Math.min(data.dueWordCount, 10),
      done: false,
    })
  }

  for (const assignment of data.pendingAssignments.slice(0, 2)) {
    tasks.push({
      id: assignment.id,
      kind: 'assignment',
      title: assignment.title,
      subtitle: 'O‘qituvchi topshirig‘i',
      href: assignmentHref(assignment),
      xp: XP.LESSON_COMPLETE,
      done: false,
    })
  }

  const todayReflection = await hasReflectionToday(uid)
  if (!todayReflection) {
    tasks.push({
      id: 'reflection',
      kind: 'reflection',
      title: 'Kunlik refleksiya',
      subtitle: 'Bugun nima yaxshi bo‘ldi? Nimani yaxshilash kerak?',
      href: '/student/reflection',
      xp: XP.REFLECTION,
      done: false,
    })
  }

  return tasks
})

export function pathStepHref(step: PathStep): string {
  switch (step.kind) {
    case 'lesson':
      return `/student/learn/${step.refId}`
    case 'practice':
      return `/student/practice/${step.skill}?topic=${encodeURIComponent(step.refId)}`
    case 'speaking':
      return `/student/speaking-lab?task=${step.refId}`
    case 'writing':
      return `/student/writing-lab?task=${step.refId}`
    case 'test':
      return `/student/assessment/progress?test=${step.refId}`
    case 'project':
      return `/student/projects/${step.refId}`
    case 'prompt_lab':
      return `/student/prompt-lab?exercise=${step.refId}`
    default:
      return '/student/path'
  }
}

export function assignmentHref(assignment: Doc<AssignmentDoc>): string {
  switch (assignment.kind) {
    case 'lesson':
      return `/student/learn/${assignment.refId}`
    case 'writing':
      return `/student/writing-lab?task=${assignment.refId ?? ''}`
    case 'speaking':
      return `/student/speaking-lab?task=${assignment.refId ?? ''}`
    case 'test':
      return `/student/assessment/progress?test=${assignment.refId ?? ''}`
    case 'project':
      return `/student/projects/${assignment.refId ?? ''}`
    default:
      return '/student/practice'
  }
}

export const hasReflectionToday = cache(async (uid: string): Promise<boolean> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const snap = await adminDb()
    .collection(COL.reflections)
    .where('uid', '==', uid)
    .where('ts', '>=', start)
    .limit(1)
    .get()
  return !snap.empty
})

export const getMasteryOverview = cache(async (uid: string): Promise<Doc<MasteryDoc>[]> => {
  const snap = await adminDb().collection(COL.mastery).doc(uid).collection('skills').get()
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as MasteryDoc) }))
})

export const getErrorProfile = cache(async (uid: string): Promise<Doc<ErrorProfileDoc> | null> => {
  const snap = await adminDb().collection(COL.errorProfiles).doc(uid).get()
  if (!snap.exists) return null
  return serialize({ id: snap.id, ...(snap.data() as ErrorProfileDoc) })
})

export const getDueVocab = cache(async (uid: string, limit = 20): Promise<Doc<UserVocabDoc>[]> => {
  const snap = await adminDb()
    .collection(COL.userVocab)
    .doc(uid)
    .collection('words')
    .where('srs.due', '<=', new Date())
    .orderBy('srs.due', 'asc')
    .limit(limit)
    .get()
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as UserVocabDoc) }))
})

export const listReflections = cache(
  async (uid: string, limit = 20): Promise<Doc<ReflectionDoc>[]> => {
    const snap = await adminDb()
      .collection(COL.reflections)
      .where('uid', '==', uid)
      .orderBy('ts', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as ReflectionDoc) }))
  }
)

export const listUserBadges = cache(async (uid: string): Promise<Doc<UserBadgeDoc>[]> => {
  const snap = await adminDb().collection(COL.userBadges).doc(uid).collection('items').get()
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as UserBadgeDoc) }))
})

export const listNotifications = cache(
  async (uid: string, limit = 20): Promise<Doc<NotificationDoc>[]> => {
    const snap = await adminDb()
      .collection(COL.notifications)
      .doc(uid)
      .collection('items')
      .orderBy('ts', 'desc')
      .limit(limit)
      .get()
    return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as NotificationDoc) }))
  }
)
