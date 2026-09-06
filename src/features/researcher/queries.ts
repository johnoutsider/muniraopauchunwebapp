import 'server-only'

import { cache } from 'react'

import { COL, type ExperimentGroup, type Skill } from '@/config/constants'
import { adminDb } from '@/lib/firebase/admin'
import { serialize, toMillis } from '@/lib/utils/format'
import type {
  CohortDoc,
  ErrorProfileDoc,
  ExperimentDoc,
  GroupDoc,
  StatsDailyDoc,
  StatsGroupDailyDoc,
  SurveyDoc,
  SurveyResponseDoc,
  TestAttemptDoc,
  TestDoc,
  UserDoc,
  WithId,
} from '@/types'

/**
 * Tadqiqotchi hududi uchun Firestore o'qishlari (PLAN.md 8.18, 9).
 *
 * ANONIMLIK QOIDASI: bu moduldagi funksiyalar (bitta istisnodan tashqari —
 * `listParticipantsConfidential`) talabani FAQAT `participantCode` bilan
 * qaytaradi. `uid` faqat server ichida birlashtirish (join) uchun ishlatiladi
 * va hech qachon klient komponentga yoki eksport fayliga chiqmaydi.
 */

type Doc<T> = T & WithId

function mapDocs<T>(snap: FirebaseFirestore.QuerySnapshot): Doc<T>[] {
  return snap.docs.map((d) => serialize({ id: d.id, ...(d.data() as T) }))
}

function mapDoc<T>(snap: FirebaseFirestore.DocumentSnapshot): Doc<T> | null {
  if (!snap.exists) return null
  return serialize({ id: snap.id, ...(snap.data() as T) })
}

export function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

/* ------------------------------------------------------------------ */
/* Ma'lumot sifati chegaralari (PLAN 8.18 — data quality)              */
/* ------------------------------------------------------------------ */

/**
 * Tahlilga kiritish uchun minimal faollik. Bu chegaradan pastdagi talaba
 * amalda "aralashuvni olmagan" hisoblanadi va tadqiqotchi uni tahlildan
 * chiqarib tashlashi mumkin (dissertatsiyada bu mezon aniq yozilishi shart).
 */
export const MIN_ACTIVITY = {
  minutes: 120,
  attempts: 30,
  activeDays: 5,
} as const

/* ------------------------------------------------------------------ */
/* Eksperiment                                                         */
/* ------------------------------------------------------------------ */

/** Joriy (oxirgi yaratilgan) eksperiment. MVP'da bitta eksperiment bo'ladi. */
export const getExperiment = cache(async (): Promise<Doc<ExperimentDoc> | null> => {
  const snap = await adminDb().collection(COL.experiments).limit(20).get()
  const list = mapDocs<ExperimentDoc>(snap)
  if (!list.length) return null
  return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))[0]
})

export const getExperimentById = cache(async (id: string): Promise<Doc<ExperimentDoc> | null> => {
  return mapDoc<ExperimentDoc>(await adminDb().collection(COL.experiments).doc(id).get())
})

/* ------------------------------------------------------------------ */
/* Kohort / guruh / foydalanuvchi                                      */
/* ------------------------------------------------------------------ */

export const listCohorts = cache(async (): Promise<Doc<CohortDoc>[]> => {
  const snap = await adminDb().collection(COL.cohorts).get()
  return mapDocs<CohortDoc>(snap).sort((a, b) => a.name.localeCompare(b.name))
})

export const listAllGroups = cache(async (): Promise<Doc<GroupDoc>[]> => {
  const snap = await adminDb().collection(COL.groups).get()
  return mapDocs<GroupDoc>(snap).sort((a, b) => a.name.localeCompare(b.name))
})

export const listTeachers = cache(async (): Promise<Doc<UserDoc>[]> => {
  const snap = await adminDb().collection(COL.users).where('role', 'in', ['teacher', 'admin']).get()
  return mapDocs<UserDoc>(snap).sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/** Barcha talabalar (server ichida — ism/email bilan). Faqat join uchun. */
export const listStudentsRaw = cache(async (): Promise<StudentDoc[]> => {
  const snap = await adminDb().collection(COL.users).where('role', '==', 'student').get()
  return mapDocs<UserDoc & ResearchFields>(snap)
})

/* ------------------------------------------------------------------ */
/* Ishtirokchilar                                                      */
/* ------------------------------------------------------------------ */

/** `users` hujjatiga tadqiqot uchun qo'shiladigan maydonlar. */
export interface ResearchFields {
  researchWithdrawn?: boolean
  researchWithdrawnAt?: unknown
  researchWithdrawReason?: string
  /** Diagnostika testining umumiy foizi — stratifikatsiya uchun. */
  diagnosticTotal?: number
}

export type StudentDoc = Doc<UserDoc> & ResearchFields

/** Anonim ishtirokchi qatori — barcha ilmiy ko'rinishlar shundan foydalanadi. */
export interface ParticipantRow {
  participantCode: string
  expGroup: ExperimentGroup | null
  groupId: string | null
  groupName: string
  cohortId: string | null
  consentGiven: boolean
  withdrawn: boolean
  status: UserDoc['status']
  lastActiveAt: string | null
}

/** Maxfiy xarita — FAQAT `/researcher/participants` sahifasida ishlatiladi. */
export interface ParticipantMappingRow extends ParticipantRow {
  uid: string
  displayName: string
  email: string
  university: string | null
  faculty: string | null
  consentAt: string | null
  withdrawReason: string | null
}

function groupNameOf(groups: Doc<GroupDoc>[], groupId?: string | null): string {
  if (!groupId) return '—'
  return groups.find((g) => g.id === groupId)?.name ?? groupId
}

export function isWithdrawn(student: StudentDoc): boolean {
  return student.researchWithdrawn === true
}

/** Tahlilga va eksportga kiradigan ishtirokchi: rozilik bergan va chiqmagan. */
export function isIncluded(student: StudentDoc): boolean {
  return student.consentGiven === true && !isWithdrawn(student)
}

export const listParticipants = cache(async (): Promise<ParticipantRow[]> => {
  const [students, groups] = await Promise.all([listStudentsRaw(), listAllGroups()])
  return students
    .map((s) => ({
      participantCode: s.participantCode ?? '—',
      expGroup: s.expGroup ?? null,
      groupId: s.groupId ?? null,
      groupName: groupNameOf(groups, s.groupId),
      cohortId: s.cohortId ?? null,
      consentGiven: s.consentGiven === true,
      withdrawn: isWithdrawn(s),
      status: s.status,
      lastActiveAt: s.lastActiveAt ? new Date(toMillis(s.lastActiveAt)).toISOString() : null,
    }))
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode))
})

export const listParticipantsConfidential = cache(async (): Promise<ParticipantMappingRow[]> => {
  const [students, groups] = await Promise.all([listStudentsRaw(), listAllGroups()])
  return students
    .map((s) => ({
      uid: s.id,
      displayName: s.displayName,
      email: s.email,
      university: s.university ?? null,
      faculty: s.faculty ?? null,
      participantCode: s.participantCode ?? '—',
      expGroup: s.expGroup ?? null,
      groupId: s.groupId ?? null,
      groupName: groupNameOf(groups, s.groupId),
      cohortId: s.cohortId ?? null,
      consentGiven: s.consentGiven === true,
      consentAt: s.consentAt ? new Date(toMillis(s.consentAt)).toISOString() : null,
      withdrawn: isWithdrawn(s),
      withdrawReason: s.researchWithdrawReason ?? null,
      status: s.status,
      lastActiveAt: s.lastActiveAt ? new Date(toMillis(s.lastActiveAt)).toISOString() : null,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

/* ------------------------------------------------------------------ */
/* Testlar va so'rovnomalar                                            */
/* ------------------------------------------------------------------ */

export const listAllTests = cache(async (): Promise<Doc<TestDoc>[]> => {
  const snap = await adminDb().collection(COL.tests).get()
  return mapDocs<TestDoc>(snap).sort((a, b) => a.title.localeCompare(b.title))
})

export const getTestById = cache(async (id: string): Promise<Doc<TestDoc> | null> => {
  return mapDoc<TestDoc>(await adminDb().collection(COL.tests).doc(id).get())
})

export const listAllSurveys = cache(async (): Promise<Doc<SurveyDoc>[]> => {
  const snap = await adminDb().collection(COL.surveys).get()
  return mapDocs<SurveyDoc>(snap).sort((a, b) => a.title.localeCompare(b.title))
})

export const getSurveyById = cache(async (id: string): Promise<Doc<SurveyDoc> | null> => {
  return mapDoc<SurveyDoc>(await adminDb().collection(COL.surveys).doc(id).get())
})

export const listTestAttempts = cache(async (testId: string): Promise<Doc<TestAttemptDoc>[]> => {
  const snap = await adminDb().collection(COL.testAttempts).where('testId', '==', testId).get()
  return mapDocs<TestAttemptDoc>(snap)
})

export const listAllSurveyResponses = cache(async (): Promise<Doc<SurveyResponseDoc>[]> => {
  const snap = await adminDb().collection(COL.surveyResponses).limit(5000).get()
  return mapDocs<SurveyResponseDoc>(snap)
})

export const listSurveyResponses = cache(
  async (surveyId: string): Promise<Doc<SurveyResponseDoc>[]> => {
    const snap = await adminDb()
      .collection(COL.surveyResponses)
      .where('surveyId', '==', surveyId)
      .get()
    return mapDocs<SurveyResponseDoc>(snap)
  }
)

/** Test bo'yicha talabalar kesimida tugallanish holati (anonim). */
export interface CompletionRow {
  participantCode: string
  expGroup: ExperimentGroup | null
  groupName: string
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded'
  percent: number | null
  finishedAt: string | null
}

export async function getTestCompletion(testId: string): Promise<{
  rows: CompletionRow[]
  submitted: number
  total: number
}> {
  const [attempts, students, groups, test] = await Promise.all([
    listTestAttempts(testId),
    listStudentsRaw(),
    listAllGroups(),
    getTestById(testId),
  ])

  const byUid = new Map<string, Doc<TestAttemptDoc>>()
  for (const attempt of attempts) {
    const existing = byUid.get(attempt.uid)
    if (!existing || toMillis(attempt.startedAt) > toMillis(existing.startedAt)) {
      byUid.set(attempt.uid, attempt)
    }
  }

  const assigned = test?.assignedTo?.groupIds ?? []

  const rows: CompletionRow[] = students
    .filter((s) => !assigned.length || (s.groupId ? assigned.includes(s.groupId) : false))
    .map((s) => {
      const attempt = byUid.get(s.id)
      return {
        participantCode: s.participantCode ?? '—',
        expGroup: s.expGroup ?? null,
        groupName: groupNameOf(groups, s.groupId),
        status: attempt ? attempt.status : ('not_started' as const),
        percent: attempt && attempt.status !== 'in_progress' ? Math.round(attempt.percent) : null,
        finishedAt: attempt?.finishedAt
          ? new Date(toMillis(attempt.finishedAt)).toISOString()
          : null,
      }
    })
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode))

  return {
    rows,
    submitted: rows.filter((r) => r.status === 'submitted' || r.status === 'graded').length,
    total: rows.length,
  }
}

export interface SurveyCompletionRow {
  participantCode: string
  expGroup: ExperimentGroup | null
  groupName: string
  responses: number
  lastAt: string | null
  scoreTotal: number | null
}

export async function getSurveyCompletion(surveyId: string): Promise<{
  rows: SurveyCompletionRow[]
  answered: number
  total: number
}> {
  const [responses, students, groups] = await Promise.all([
    listSurveyResponses(surveyId),
    listStudentsRaw(),
    listAllGroups(),
  ])

  const byUid = new Map<string, Doc<SurveyResponseDoc>[]>()
  for (const response of responses) {
    const list = byUid.get(response.uid) ?? []
    list.push(response)
    byUid.set(response.uid, list)
  }

  const rows: SurveyCompletionRow[] = students
    .map((s) => {
      const list = (byUid.get(s.id) ?? []).sort((a, b) => toMillis(b.ts) - toMillis(a.ts))
      return {
        participantCode: s.participantCode ?? '—',
        expGroup: s.expGroup ?? null,
        groupName: groupNameOf(groups, s.groupId),
        responses: list.length,
        lastAt: list[0] ? new Date(toMillis(list[0].ts)).toISOString() : null,
        scoreTotal: typeof list[0]?.scoreTotal === 'number' ? list[0].scoreTotal : null,
      }
    })
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode))

  return { rows, answered: rows.filter((r) => r.responses > 0).length, total: rows.length }
}

/* ------------------------------------------------------------------ */
/* Topshiriqlar statistikasi (item analysis, CTT)                      */
/* ------------------------------------------------------------------ */

export interface ItemStatRow {
  itemId: string
  sectionId: string
  skill: Skill
  order: number
  responses: number
  correct: number
  /** p — qiyinlik indeksi (to'g'ri javob ulushi, 0..1) */
  difficultyIndex: number
  /** D — diskriminatsiya (yuqori 27% − quyi 27%); null — hisoblab bo'lmadi */
  discrimination: number | null
  /** Nuqtali-biserial korrelyatsiya (topshiriq ↔ umumiy ball) */
  pointBiserial: number | null
  flag: 'ok' | 'too_easy' | 'too_hard' | 'weak_discrimination'
}

/**
 * Klassik test nazariyasi (CTT) bo'yicha topshiriq statistikasi.
 *
 *   p    = to'g'ri javoblar / javoblar soni
 *   D    = p(yuqori 27%) − p(quyi 27%)              (Kelley 1939)
 *   r_pb = (M1 − M0)/SD_umumiy · √(p·q)             (nuqtali-biserial)
 *
 * Talqin: p < 0.2 — juda qiyin, p > 0.9 — juda oson, D < 0.2 — zaif
 * ajratuvchi topshiriq (item bankidan olib tashlash tavsiya etiladi).
 */
export async function getItemAnalysis(testId: string): Promise<{
  rows: ItemStatRow[]
  attempts: number
  kr20: number | null
}> {
  const [test, attempts] = await Promise.all([getTestById(testId), listTestAttempts(testId)])
  if (!test) return { rows: [], attempts: 0, kr20: null }

  const graded = attempts.filter((a) => a.status !== 'in_progress')
  const itemMeta = new Map<string, { sectionId: string; skill: Skill; order: number }>()
  let order = 0
  for (const section of test.sections ?? []) {
    for (const itemId of section.itemIds ?? []) {
      order += 1
      itemMeta.set(itemId, { sectionId: section.id, skill: section.skill, order })
    }
  }

  // Har urinish uchun: itemId → 0/1 va umumiy foiz
  // `total` — shu testdagi TO'G'RI TOPSHIRIQLAR SONI (foiz emas).
  // KR-20 va diskriminatsiya klassik formulalari aynan shu shkalada ishlaydi.
  const scored = graded.map((attempt) => {
    const map = new Map<string, number>()
    for (const raw of attempt.rawAnswers ?? []) {
      if (!itemMeta.has(raw.itemId)) continue
      const value = typeof raw.score === 'number' ? (raw.score > 0 ? 1 : 0) : raw.isCorrect ? 1 : 0
      map.set(raw.itemId, value)
    }
    let total = 0
    for (const value of map.values()) total += value
    return { map, total }
  })

  const sortedByTotal = [...scored].sort((a, b) => b.total - a.total)
  const cutoff = Math.max(1, Math.round(sortedByTotal.length * 0.27))
  const upper = sortedByTotal.slice(0, cutoff)
  const lower = sortedByTotal.slice(-cutoff)

  const totals = scored.map((s) => s.total)
  const totalMean = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
  const totalSd =
    totals.length > 1
      ? Math.sqrt(
          totals.reduce((sum, value) => sum + (value - totalMean) ** 2, 0) / (totals.length - 1)
        )
      : 0

  const rows: ItemStatRow[] = []
  for (const [itemId, meta] of itemMeta) {
    const values = scored.filter((s) => s.map.has(itemId))
    const responses = values.length
    const correct = values.reduce((sum, s) => sum + (s.map.get(itemId) ?? 0), 0)
    const p = responses ? correct / responses : 0

    const share = (list: typeof scored): number | null => {
      const present = list.filter((s) => s.map.has(itemId))
      if (!present.length) return null
      return present.reduce((sum, s) => sum + (s.map.get(itemId) ?? 0), 0) / present.length
    }
    const upperP = share(upper)
    const lowerP = share(lower)
    const discrimination =
      upperP !== null && lowerP !== null ? Math.round((upperP - lowerP) * 1000) / 1000 : null

    let pointBiserial: number | null = null
    if (responses > 2 && totalSd > 0 && p > 0 && p < 1) {
      const withItem = values.filter((s) => (s.map.get(itemId) ?? 0) === 1).map((s) => s.total)
      const withoutItem = values.filter((s) => (s.map.get(itemId) ?? 0) === 0).map((s) => s.total)
      const m1 = withItem.length ? withItem.reduce((a, b) => a + b, 0) / withItem.length : 0
      const m0 = withoutItem.length ? withoutItem.reduce((a, b) => a + b, 0) / withoutItem.length : 0
      pointBiserial = Math.round(((m1 - m0) / totalSd) * Math.sqrt(p * (1 - p)) * 1000) / 1000
    }

    let flag: ItemStatRow['flag'] = 'ok'
    if (responses >= 5) {
      if (p > 0.9) flag = 'too_easy'
      else if (p < 0.2) flag = 'too_hard'
      else if (discrimination !== null && discrimination < 0.2) flag = 'weak_discrimination'
    }

    rows.push({
      itemId,
      sectionId: meta.sectionId,
      skill: meta.skill,
      order: meta.order,
      responses,
      correct,
      difficultyIndex: Math.round(p * 1000) / 1000,
      discrimination,
      pointBiserial,
      flag,
    })
  }

  // KR-20 ichki izchillik koeffitsienti (Kuder–Richardson 20):
  //   KR-20 = k/(k−1) · (1 − Σp·q / σ²_umumiy)
  // bu yerda σ² — to'g'ri topshiriqlar SONI bo'yicha dispersiya.
  // Talqin: ≥ 0.70 maqbul, ≥ 0.80 yaxshi. Manfiy qiymat — testda bir-biriga
  // zid ishlaydigan topshiriqlar borligini bildiradi.
  let kr20: number | null = null
  const k = rows.length
  if (k > 1 && totalSd > 0) {
    const sumPq = rows.reduce((sum, row) => sum + row.difficultyIndex * (1 - row.difficultyIndex), 0)
    const value = (k / (k - 1)) * (1 - sumPq / totalSd ** 2)
    kr20 = Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null
  }

  return { rows: rows.sort((a, b) => a.order - b.order), attempts: graded.length, kr20 }
}

/* ------------------------------------------------------------------ */
/* Kunlik statistika                                                   */
/* ------------------------------------------------------------------ */

export const listStatsDaily = cache(
  async (from?: string, to?: string): Promise<Doc<StatsDailyDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb().collection(COL.statsDaily)
    if (from) query = query.where('date', '>=', from)
    if (to) query = query.where('date', '<=', to)
    const snap = await query.limit(20000).get()
    return mapDocs<StatsDailyDoc>(snap)
  }
)

export const listStatsGroupDaily = cache(
  async (from?: string, to?: string): Promise<Doc<StatsGroupDailyDoc>[]> => {
    let query: FirebaseFirestore.Query = adminDb().collection(COL.statsGroupDaily)
    if (from) query = query.where('date', '>=', from)
    if (to) query = query.where('date', '<=', to)
    const snap = await query.limit(10000).get()
    return mapDocs<StatsGroupDailyDoc>(snap)
  }
)

export const listErrorProfiles = cache(async (): Promise<Doc<ErrorProfileDoc>[]> => {
  const snap = await adminDb().collection(COL.errorProfiles).limit(1000).get()
  return mapDocs<ErrorProfileDoc>(snap)
})

/* ------------------------------------------------------------------ */
/* Eksport tarixi (auditLogs)                                          */
/* ------------------------------------------------------------------ */

export interface ExportHistoryRow {
  id: string
  actorUid: string
  actorName: string
  datasets: string[]
  format: string
  rows: number
  files: number
  at: string | null
}

export async function listExportHistory(limit = 25): Promise<ExportHistoryRow[]> {
  const snap = await adminDb()
    .collection(COL.auditLogs)
    .where('action', '==', 'research.export')
    .limit(200)
    .get()

  const rows: ExportHistoryRow[] = snap.docs.map((d) => {
    const data = d.data() as { actorUid: string; meta?: Record<string, unknown>; ts?: unknown }
    const meta = data.meta ?? {}
    return {
      id: d.id,
      actorUid: data.actorUid,
      actorName: String(meta.actorName ?? data.actorUid),
      datasets: Array.isArray(meta.datasets) ? (meta.datasets as string[]) : [],
      format: String(meta.format ?? '—'),
      rows: Number(meta.rows ?? 0),
      files: Number(meta.files ?? 0),
      at: data.ts ? new Date(toMillis(data.ts as never)).toISOString() : null,
    }
  })

  return rows.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? '')).slice(0, limit)
}

export { mapDoc, mapDocs }
export type { Doc }
