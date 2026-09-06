import 'server-only'

import { cache } from 'react'

import { COL, type CefrLevel, type Domain, type Skill } from '@/config/constants'
import { SEED_CONTENT_COUNTS } from '@/content'
import { adminDb } from '@/lib/firebase/admin'
import { serialize, toMillis } from '@/lib/utils/format'
import type {
  AuditLogDoc,
  CohortDoc,
  CourseDoc,
  GlobalSettingsDoc,
  GroupDoc,
  ItemDoc,
  LessonDoc,
  LexiconDoc,
  ModuleDoc,
  StatsDailyDoc,
  UserDoc,
  WithId,
} from '@/types'

/** Administrator hududi uchun Firestore o'qishlari (PLAN.md 8.19). */

type Doc<T> = T & WithId

function mapDocs<T>(snap: FirebaseFirestore.QuerySnapshot): Doc<T>[] {
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as T) }))
}

function mapDoc<T>(snap: FirebaseFirestore.DocumentSnapshot): Doc<T> | null {
  if (!snap.exists) return null
  return serialize({ id: snap.id, ...(snap.data() as T) })
}

/* ------------------------------------------------------------------ */
/* Foydalanuvchilar                                                    */
/* ------------------------------------------------------------------ */

export interface AdminUserRow {
  uid: string
  displayName: string
  email: string
  role: UserDoc['role']
  status: UserDoc['status']
  groupId: string | null
  groupName: string
  cohortName: string
  expGroup: UserDoc['expGroup'] | null
  participantCode: string | null
  university: string | null
  lastActiveAt: string | null
  createdAt: string | null
}

export const listAdminUsers = cache(async (): Promise<AdminUserRow[]> => {
  const db = adminDb()
  const [usersSnap, groupsSnap, cohortsSnap] = await Promise.all([
    db.collection(COL.users).limit(2000).get(),
    db.collection(COL.groups).get(),
    db.collection(COL.cohorts).get(),
  ])

  const groups = new Map(groupsSnap.docs.map((d) => [d.id, d.data() as GroupDoc]))
  const cohorts = new Map(cohortsSnap.docs.map((d) => [d.id, d.data() as CohortDoc]))

  return usersSnap.docs
    .map((doc) => {
      const user = doc.data() as UserDoc
      const group = user.groupId ? groups.get(user.groupId) : undefined
      const cohortId = user.cohortId ?? group?.cohortId
      return {
        uid: doc.id,
        displayName: user.displayName ?? '—',
        email: user.email ?? '',
        role: user.role,
        status: user.status ?? 'active',
        groupId: user.groupId ?? null,
        groupName: group?.name ?? '—',
        cohortName: cohortId ? (cohorts.get(cohortId)?.name ?? cohortId) : '—',
        expGroup: user.expGroup ?? null,
        participantCode: user.participantCode ?? null,
        university: user.university ?? null,
        lastActiveAt: user.lastActiveAt
          ? new Date(toMillis(user.lastActiveAt)).toISOString()
          : null,
        createdAt: user.createdAt ? new Date(toMillis(user.createdAt)).toISOString() : null,
      }
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/* ------------------------------------------------------------------ */
/* Kohort va guruhlar                                                  */
/* ------------------------------------------------------------------ */

export const listAdminCohorts = cache(async (): Promise<Doc<CohortDoc>[]> => {
  const snap = await adminDb().collection(COL.cohorts).get()
  return mapDocs<CohortDoc>(snap).sort((a, b) => a.name.localeCompare(b.name))
})

export const listAdminGroups = cache(async (): Promise<Doc<GroupDoc>[]> => {
  const snap = await adminDb().collection(COL.groups).get()
  return mapDocs<GroupDoc>(snap).sort((a, b) => a.name.localeCompare(b.name))
})

/* ------------------------------------------------------------------ */
/* Kontent: kurslar, modullar, darslar                                 */
/* ------------------------------------------------------------------ */

export const listAdminCourses = cache(async (): Promise<Doc<CourseDoc>[]> => {
  const snap = await adminDb().collection(COL.courses).get()
  return mapDocs<CourseDoc>(snap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

export const listAdminModules = cache(async (courseId?: string): Promise<Doc<ModuleDoc>[]> => {
  let query: FirebaseFirestore.Query = adminDb().collection(COL.modules)
  if (courseId) query = query.where('courseId', '==', courseId)
  const snap = await query.limit(500).get()
  return mapDocs<ModuleDoc>(snap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

export const listAdminLessons = cache(async (moduleId?: string): Promise<Doc<LessonDoc>[]> => {
  let query: FirebaseFirestore.Query = adminDb().collection(COL.lessons)
  if (moduleId) query = query.where('moduleId', '==', moduleId)
  const snap = await query.limit(500).get()
  return mapDocs<LessonDoc>(snap).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

export const getAdminLesson = cache(async (id: string): Promise<Doc<LessonDoc> | null> => {
  return mapDoc<LessonDoc>(await adminDb().collection(COL.lessons).doc(id).get())
})

/* ------------------------------------------------------------------ */
/* Mashq banki                                                         */
/* ------------------------------------------------------------------ */

export interface ItemFilters {
  skill?: Skill
  topic?: string
  difficulty?: number
  status?: ItemDoc['status']
  source?: ItemDoc['source']
  domain?: Domain
  cefr?: CefrLevel
}

export const listAdminItems = cache(async (filters: ItemFilters = {}): Promise<Doc<ItemDoc>[]> => {
  let query: FirebaseFirestore.Query = adminDb().collection(COL.items)
  if (filters.skill) query = query.where('skill', '==', filters.skill)
  if (filters.status) query = query.where('status', '==', filters.status)
  if (filters.source) query = query.where('source', '==', filters.source)
  if (filters.difficulty) query = query.where('difficulty', '==', filters.difficulty)
  if (filters.domain) query = query.where('domain', '==', filters.domain)
  if (filters.cefr) query = query.where('cefr', '==', filters.cefr)

  const snap = await query.limit(500).get()
  let rows = mapDocs<ItemDoc>(snap)
  if (filters.topic) {
    const needle = filters.topic.toLowerCase()
    rows = rows.filter((row) => row.topic?.toLowerCase().includes(needle))
  }
  return rows
})

export const getAdminItem = cache(async (id: string): Promise<Doc<ItemDoc> | null> => {
  return mapDoc<ItemDoc>(await adminDb().collection(COL.items).doc(id).get())
})

/* ------------------------------------------------------------------ */
/* Lug'at (lexicon)                                                    */
/* ------------------------------------------------------------------ */

export const listAdminLexicon = cache(
  async (filters: { domain?: Domain; cefr?: CefrLevel; status?: LexiconDoc['status'] } = {}) => {
    let query: FirebaseFirestore.Query = adminDb().collection(COL.lexicon)
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.cefr) query = query.where('cefr', '==', filters.cefr)
    if (filters.domain) query = query.where('domains', 'array-contains', filters.domain)
    const snap = await query.limit(500).get()
    return mapDocs<LexiconDoc>(snap).sort((a, b) => a.word.localeCompare(b.word))
  }
)

export const getAdminLexiconWord = cache(async (id: string): Promise<Doc<LexiconDoc> | null> => {
  return mapDoc<LexiconDoc>(await adminDb().collection(COL.lexicon).doc(id).get())
})

/* ------------------------------------------------------------------ */
/* Sozlamalar                                                          */
/* ------------------------------------------------------------------ */

export const getSettings = cache(async (): Promise<GlobalSettingsDoc | null> => {
  const snap = await adminDb().collection(COL.settings).doc('global').get()
  return (snap.data() as GlobalSettingsDoc | undefined) ?? null
})

/* ------------------------------------------------------------------ */
/* Audit jurnali                                                       */
/* ------------------------------------------------------------------ */

export interface AuditRow {
  id: string
  actorUid: string
  actorName: string
  actorRole: string
  action: string
  target: string | null
  meta: Record<string, unknown>
  ts: string | null
}

export interface AuditFilters {
  action?: string
  actorUid?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export async function listAuditLogs(filters: AuditFilters = {}): Promise<{
  rows: AuditRow[]
  total: number
  page: number
  pageSize: number
  actions: string[]
  actors: Array<{ uid: string; name: string }>
}> {
  const pageSize = filters.pageSize ?? 25
  const page = Math.max(1, filters.page ?? 1)

  let query: FirebaseFirestore.Query = adminDb().collection(COL.auditLogs)
  if (filters.action) query = query.where('action', '==', filters.action)
  if (filters.actorUid) query = query.where('actorUid', '==', filters.actorUid)

  const snap = await query.limit(2000).get()

  let rows: AuditRow[] = snap.docs.map((doc) => {
    const data = doc.data() as AuditLogDoc
    const meta = (data.meta ?? {}) as Record<string, unknown>
    return {
      id: doc.id,
      actorUid: data.actorUid,
      actorName: String(meta.actorName ?? data.actorUid),
      actorRole: data.actorRole,
      action: data.action,
      target: data.target ?? null,
      meta,
      ts: data.ts ? new Date(toMillis(data.ts)).toISOString() : null,
    }
  })

  if (filters.from) {
    const fromMs = new Date(`${filters.from}T00:00:00.000Z`).getTime()
    rows = rows.filter((row) => (row.ts ? new Date(row.ts).getTime() >= fromMs : false))
  }
  if (filters.to) {
    const toMs = new Date(`${filters.to}T23:59:59.999Z`).getTime()
    rows = rows.filter((row) => (row.ts ? new Date(row.ts).getTime() <= toMs : false))
  }

  rows.sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''))

  const actions = [...new Set(rows.map((row) => row.action))].sort()
  const actorMap = new Map(rows.map((row) => [row.actorUid, row.actorName]))
  const actors = [...actorMap].map(([uid, name]) => ({ uid, name }))

  const total = rows.length
  const start = (page - 1) * pageSize

  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    actions,
    actors,
  }
}

/* ------------------------------------------------------------------ */
/* Tizim holati                                                        */
/* ------------------------------------------------------------------ */

/**
 * AI narxining taxminiy hisobi. Kirish/chiqish tokenlari alohida saqlanmagani
 * uchun aralash (blended) tarif ishlatiladi — bu FAQAT byudjetni kuzatish
 * uchun taxminiy ko'rsatkich, hisob-fakturaning o'rnini bosmaydi.
 */
export const AI_COST_PER_MILLION_USD = 6

const COUNTED_COLLECTIONS = [
  COL.users,
  COL.cohorts,
  COL.groups,
  COL.courses,
  COL.modules,
  COL.lessons,
  COL.items,
  COL.lexicon,
  COL.tests,
  COL.surveys,
  COL.caseStudies,
  COL.scenarios,
  COL.promptExercises,
  COL.badges,
  COL.attempts,
  COL.testAttempts,
  COL.aiSessions,
  COL.speakingSubmissions,
  COL.writingSubmissions,
  COL.surveyResponses,
  COL.statsDaily,
  COL.auditLogs,
  COL.corpusDocs,
] as const

/**
 * Seed qilinishi kerak bo'lgan kontent kolleksiyalari (PLAN 14).
 * `expected` — `src/content/` dagi haqiqiy hajmdan olinadi, shuning uchun
 * `pnpm seed` dan keyin hamma qator "ok" bo'ladi. Qo'lda kiritilgan raqamlar
 * kontent o'sganda yolg'on ogohlantirish beradi.
 */
const SEED_COLLECTIONS: Array<{ name: string; label: string; expected: number }> = [
  { name: COL.courses, label: 'Kurslar', expected: SEED_CONTENT_COUNTS.courses },
  { name: COL.modules, label: 'Modullar', expected: SEED_CONTENT_COUNTS.modules },
  { name: COL.lessons, label: 'Darslar', expected: SEED_CONTENT_COUNTS.lessons },
  { name: COL.grammarLessons, label: 'Grammatika darslari', expected: SEED_CONTENT_COUNTS.grammarLessons },
  { name: COL.items, label: 'Mashqlar', expected: SEED_CONTENT_COUNTS.items },
  { name: COL.lexicon, label: 'Lug‘at', expected: SEED_CONTENT_COUNTS.lexicon },
  { name: COL.caseStudies, label: 'Keys-stadilar', expected: SEED_CONTENT_COUNTS.caseStudies },
  { name: COL.scenarios, label: 'Role-play stsenariylari', expected: SEED_CONTENT_COUNTS.scenarios },
  { name: COL.promptExercises, label: 'Prompt mashqlari', expected: SEED_CONTENT_COUNTS.promptExercises },
  { name: COL.badges, label: 'Nishonlar', expected: SEED_CONTENT_COUNTS.badges },
  { name: COL.surveys, label: 'So‘rovnomalar', expected: SEED_CONTENT_COUNTS.surveys },
  { name: COL.tests, label: 'Testlar', expected: SEED_CONTENT_COUNTS.tests },
]

export interface SystemStatus {
  counts: Array<{ collection: string; count: number }>
  seeding: Array<{ label: string; collection: string; count: number; expected: number; ok: boolean }>
  ai: {
    days: Array<{ date: string; messages: number; tokens: number }>
    totalMessages: number
    totalTokens: number
    estimatedCostUsd: number
    activeUsers: number
  }
  settings: GlobalSettingsDoc | null
  errors: Array<{ id: string; message: string; context: string; ts: string | null }>
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const db = adminDb()

  const counts = await Promise.all(
    COUNTED_COLLECTIONS.map(async (name) => {
      try {
        const snap = await db.collection(name).count().get()
        return { collection: name, count: snap.data().count }
      } catch {
        return { collection: name, count: -1 }
      }
    })
  )

  const countByName = new Map<string, number>(
    counts.map((row) => [row.collection as string, row.count])
  )

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const statsSnap = await db
    .collection(COL.statsDaily)
    .where('date', '>=', since)
    .limit(20000)
    .get()

  const byDate = new Map<string, { messages: number; tokens: number }>()
  const activeUsers = new Set<string>()
  for (const doc of statsSnap.docs) {
    const row = doc.data() as StatsDailyDoc
    const entry = byDate.get(row.date) ?? { messages: 0, tokens: 0 }
    entry.messages += row.aiMessages ?? 0
    entry.tokens += row.aiTokens ?? 0
    byDate.set(row.date, entry)
    if ((row.attempts ?? 0) > 0 || (row.timeOnTaskMin ?? 0) > 0) activeUsers.add(row.uid)
  }

  const days = [...byDate]
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalTokens = days.reduce((sum, day) => sum + day.tokens, 0)
  const totalMessages = days.reduce((sum, day) => sum + day.messages, 0)

  let errors: SystemStatus['errors'] = []
  try {
    const errorSnap = await db.collection('systemErrors').limit(20).get()
    errors = errorSnap.docs
      .map((doc) => {
        const data = doc.data() as { message?: string; context?: string; ts?: unknown }
        return {
          id: doc.id,
          message: String(data.message ?? 'Noma’lum xatolik'),
          context: String(data.context ?? '—'),
          ts: data.ts ? new Date(toMillis(data.ts as never)).toISOString() : null,
        }
      })
      .sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''))
  } catch {
    errors = []
  }

  return {
    counts,
    seeding: SEED_COLLECTIONS.map((entry) => {
      const count = countByName.get(entry.name) ?? 0
      return {
        label: entry.label,
        collection: entry.name,
        count,
        expected: entry.expected,
        ok: count >= entry.expected,
      }
    }),
    ai: {
      days,
      totalMessages,
      totalTokens,
      estimatedCostUsd: Math.round((totalTokens / 1_000_000) * AI_COST_PER_MILLION_USD * 100) / 100,
      activeUsers: activeUsers.size,
    },
    settings: await getSettings(),
    errors,
  }
}

export type { Doc }
