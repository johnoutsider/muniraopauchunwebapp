'use server'

import { revalidatePath } from 'next/cache'

import { COL, type ExperimentGroup } from '@/config/constants'
import { aggregateGroupDay, predictProgress } from '@/lib/analytics/aggregate'
import { adminBucket, adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireUser, setUserClaims } from '@/lib/firebase/session'
import { dayKey, toMillis } from '@/lib/utils/format'
import {
  CONTROL_GROUP_FLAGS,
  EXPERIMENTAL_GROUP_FLAGS,
  type ActionResult,
  type ExperimentDoc,
  type FeatureFlags,
  type GroupDoc,
  type TestAttemptDoc,
} from '@/types'

import { logAudit } from '@/features/admin/audit'

import {
  buildCodebook,
  buildDatasets,
  buildSpssPackage,
  toCsvBuffer,
  toXlsxBuffer,
  xlsxFileName,
  type DatasetName,
} from '@/lib/export'

import type { DatasetSchemaPreview } from './export-meta'
import { chunk, getExperiment } from './queries'

/**
 * Tadqiqotchi server amallari (PLAN.md 8.18, 9).
 * Har bir o'zgarish `auditLogs` ga yoziladi.
 */

const RESEARCH_ROLES = ['researcher', 'admin'] as const

function fail(err: unknown, fallback: string): ActionResult<never> {
  const message = err instanceof Error ? err.message : fallback
  console.error('[researcher/actions]', message)
  return { ok: false, error: message }
}

/* ================================================================== */
/* 1. Eksperiment                                                      */
/* ================================================================== */

export interface ExperimentInput {
  id?: string
  title: string
  hypothesis: string
  design: string
  preTestId?: string
  postTestId?: string
  surveyIds: string[]
  experimentalGroupIds: string[]
  controlGroupIds: string[]
  start: string
  midpoint?: string
  end: string
  status: ExperimentDoc['status']
}

export async function saveExperimentAction(
  input: ExperimentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    if (!input.title.trim()) return { ok: false, error: 'Eksperiment nomi bo‘sh bo‘lmasligi kerak.' }
    if (!input.start || !input.end) return { ok: false, error: 'Boshlanish va tugash sanasi shart.' }
    if (new Date(input.end) <= new Date(input.start)) {
      return { ok: false, error: 'Tugash sanasi boshlanish sanasidan keyin bo‘lishi kerak.' }
    }

    const overlap = input.experimentalGroupIds.filter((id) => input.controlGroupIds.includes(id))
    if (overlap.length) {
      return {
        ok: false,
        error: 'Bitta guruh bir vaqtda ham eksperimental, ham nazorat bo‘la olmaydi.',
      }
    }

    const db = adminDb()
    const payload: Omit<ExperimentDoc, 'createdAt'> & { createdAt?: unknown } = {
      title: input.title.trim(),
      hypothesis: input.hypothesis.trim(),
      design: input.design.trim(),
      preTestId: input.preTestId || undefined,
      postTestId: input.postTestId || undefined,
      surveyIds: input.surveyIds,
      groupIds: { experimental: input.experimentalGroupIds, control: input.controlGroupIds },
      timeline: {
        start: new Date(input.start),
        midpoint: input.midpoint ? new Date(input.midpoint) : undefined,
        end: new Date(input.end),
      },
      status: input.status,
    }

    let id = input.id
    if (id) {
      await db.collection(COL.experiments).doc(id).set(payload, { merge: true })
    } else {
      const ref = await db
        .collection(COL.experiments)
        .add({ ...payload, createdAt: FieldValue.serverTimestamp() })
      id = ref.id
    }

    await logAudit(user, input.id ? 'experiment.update' : 'experiment.create', id, {
      title: payload.title,
      status: payload.status,
    })

    revalidatePath('/researcher/experiment')
    revalidatePath('/researcher/dashboard')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Eksperimentni saqlashda xatolik')
  }
}

export async function setExperimentStatusAction(
  id: string,
  status: ExperimentDoc['status']
): Promise<ActionResult<{ status: ExperimentDoc['status'] }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    await adminDb().collection(COL.experiments).doc(id).set({ status }, { merge: true })
    await logAudit(user, 'experiment.status', id, { status })
    revalidatePath('/researcher/experiment')
    revalidatePath('/researcher/dashboard')
    return { ok: true, data: { status } }
  } catch (err) {
    return fail(err, 'Holatni o‘zgartirishda xatolik')
  }
}

/* ================================================================== */
/* 2. Guruhlar                                                         */
/* ================================================================== */

export interface GroupInput {
  id?: string
  cohortId: string
  name: string
  type: ExperimentGroup
  teacherId?: string
  featureFlags?: Partial<FeatureFlags>
}

export async function saveGroupAction(input: GroupInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    if (!input.name.trim()) return { ok: false, error: 'Guruh nomi bo‘sh bo‘lmasligi kerak.' }
    if (!input.cohortId) return { ok: false, error: 'Kohortni tanlang.' }

    const db = adminDb()
    const base = input.type === 'control' ? CONTROL_GROUP_FLAGS : EXPERIMENTAL_GROUP_FLAGS
    const featureFlags: FeatureFlags = { ...base, ...(input.featureFlags ?? {}) }

    let id = input.id
    if (id) {
      await db
        .collection(COL.groups)
        .doc(id)
        .set(
          {
            cohortId: input.cohortId,
            name: input.name.trim(),
            type: input.type,
            teacherId: input.teacherId ?? null,
            featureFlags,
          },
          { merge: true }
        )
    } else {
      const ref = await db.collection(COL.groups).add({
        cohortId: input.cohortId,
        name: input.name.trim(),
        type: input.type,
        teacherId: input.teacherId ?? null,
        studentCount: 0,
        featureFlags,
        createdAt: FieldValue.serverTimestamp(),
      })
      id = ref.id
    }

    if (input.teacherId) {
      await db
        .collection(COL.users)
        .doc(input.teacherId)
        .set({ groupIds: FieldValue.arrayUnion(id) }, { merge: true })
    }

    await logAudit(user, input.id ? 'group.update' : 'group.create', id, {
      name: input.name,
      type: input.type,
    })

    revalidatePath('/researcher/groups')
    revalidatePath('/admin/groups')
    return { ok: true, data: { id } }
  } catch (err) {
    return fail(err, 'Guruhni saqlashda xatolik')
  }
}

/* ================================================================== */
/* 3. Randomizatsiya                                                   */
/* ================================================================== */

export type RandomisationMethod = 'random' | 'stratified'

export interface RandomisationInput {
  cohortId: string
  method: RandomisationMethod
  /** Takrorlanuvchanlik uchun urug' — hisobotda keltiriladi */
  seed: string
  experimentalGroupId: string
  controlGroupId: string
  /** Faqat guruhi yo'q talabalarni taqsimlash */
  onlyUnassigned?: boolean
}

export interface RandomisationAssignment {
  uid: string
  participantCode: string
  displayName: string
  diagnosticTotal: number | null
  stratum: string
  target: ExperimentGroup
}

export interface RandomisationPreview {
  seed: string
  method: RandomisationMethod
  total: number
  assignments: RandomisationAssignment[]
  strata: Array<{
    stratum: string
    experimental: number
    control: number
    meanExperimental: number | null
    meanControl: number | null
  }>
  balance: {
    experimental: { n: number; mean: number | null; sd: number | null }
    control: { n: number; mean: number | null; sd: number | null }
  }
  warnings: string[]
}

/** xmur3 — matnli urug'ni 32-bitli songa aylantirish. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

/** mulberry32 — deterministik PRNG (bir xil urug' → bir xil taqsimot). */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(list: T[], rand: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function meanOf(values: number[]): number | null {
  if (!values.length) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
}

function sdOf(values: number[]): number | null {
  if (values.length < 2) return null
  const m = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1)
  return Math.round(Math.sqrt(variance) * 100) / 100
}

async function diagnosticScores(): Promise<Map<string, number>> {
  const snap = await adminDb()
    .collection(COL.testAttempts)
    .where('type', '==', 'diagnostic')
    .limit(2000)
    .get()
  const byUid = new Map<string, { percent: number; at: number }>()
  for (const doc of snap.docs) {
    const attempt = doc.data() as TestAttemptDoc
    if (attempt.status === 'in_progress') continue
    const at = toMillis(attempt.finishedAt ?? attempt.startedAt)
    const existing = byUid.get(attempt.uid)
    if (!existing || at > existing.at) byUid.set(attempt.uid, { percent: attempt.percent, at })
  }
  return new Map([...byUid].map(([uid, value]) => [uid, Math.round(value.percent * 100) / 100]))
}

/** Taqsimotni hisoblaydi, lekin HECH NARSA yozmaydi — oldindan ko'rish uchun. */
export async function previewRandomisationAction(
  input: RandomisationInput
): Promise<ActionResult<RandomisationPreview>> {
  try {
    await requireUser([...RESEARCH_ROLES])
    if (!input.cohortId) return { ok: false, error: 'Kohortni tanlang.' }
    if (!input.experimentalGroupId || !input.controlGroupId) {
      return { ok: false, error: 'Eksperimental va nazorat guruhini tanlang.' }
    }
    if (input.experimentalGroupId === input.controlGroupId) {
      return { ok: false, error: 'Eksperimental va nazorat guruhi bir xil bo‘lishi mumkin emas.' }
    }

    const db = adminDb()
    const snap = await db
      .collection(COL.users)
      .where('role', '==', 'student')
      .where('cohortId', '==', input.cohortId)
      .get()

    let students = snap.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as { displayName: string; participantCode?: string; groupId?: string }),
    }))
    if (input.onlyUnassigned) students = students.filter((s) => !s.groupId)

    const warnings: string[] = []
    if (!students.length) {
      return { ok: false, error: 'Bu kohortda taqsimlanadigan talaba topilmadi.' }
    }

    const scores = await diagnosticScores()
    const withScore = students.filter((s) => scores.has(s.uid)).length
    if (input.method === 'stratified' && withScore < students.length) {
      warnings.push(
        `${students.length - withScore} ta talabada diagnostika bali yo‘q — ular "ball yo‘q" stratasiga tushadi.`
      )
    }
    if (students.length < 30) {
      warnings.push('Namuna hajmi kichik — randomizatsiya muvozanatni kafolatlamaydi.')
    }

    const rand = mulberry32(xmur3(input.seed || 'seed')())
    const assignments: RandomisationAssignment[] = []

    const assignPairwise = (list: typeof students, stratum: string) => {
      const shuffled = shuffle(list, rand)
      shuffled.forEach((student, index) => {
        assignments.push({
          uid: student.uid,
          participantCode: student.participantCode ?? '—',
          displayName: student.displayName,
          diagnosticTotal: scores.get(student.uid) ?? null,
          stratum,
          // Blok ichida navbatma-navbat — guruh hajmlari teng bo'ladi
          target: index % 2 === 0 ? 'experimental' : 'control',
        })
      })
    }

    if (input.method === 'random') {
      assignPairwise(students, 'umumiy')
    } else {
      const scored = students
        .filter((s) => scores.has(s.uid))
        .sort((a, b) => (scores.get(b.uid) ?? 0) - (scores.get(a.uid) ?? 0))
      const unscored = students.filter((s) => !scores.has(s.uid))

      // Kvartillar bo'yicha 4 ta strata
      const size = Math.ceil(scored.length / 4) || 1
      const labels = ['Q1 (eng yuqori)', 'Q2', 'Q3', 'Q4 (eng past)']
      for (let i = 0; i < 4; i += 1) {
        const slice = scored.slice(i * size, (i + 1) * size)
        if (slice.length) assignPairwise(slice, labels[i])
      }
      if (unscored.length) assignPairwise(unscored, 'ball yo‘q')
    }

    const strataNames = [...new Set(assignments.map((a) => a.stratum))]
    const strata = strataNames.map((stratum) => {
      const rows = assignments.filter((a) => a.stratum === stratum)
      const expScores = rows
        .filter((a) => a.target === 'experimental' && a.diagnosticTotal !== null)
        .map((a) => a.diagnosticTotal as number)
      const ctrlScores = rows
        .filter((a) => a.target === 'control' && a.diagnosticTotal !== null)
        .map((a) => a.diagnosticTotal as number)
      return {
        stratum,
        experimental: rows.filter((a) => a.target === 'experimental').length,
        control: rows.filter((a) => a.target === 'control').length,
        meanExperimental: meanOf(expScores),
        meanControl: meanOf(ctrlScores),
      }
    })

    const expAll = assignments
      .filter((a) => a.target === 'experimental' && a.diagnosticTotal !== null)
      .map((a) => a.diagnosticTotal as number)
    const ctrlAll = assignments
      .filter((a) => a.target === 'control' && a.diagnosticTotal !== null)
      .map((a) => a.diagnosticTotal as number)

    const expMean = meanOf(expAll)
    const ctrlMean = meanOf(ctrlAll)
    if (expMean !== null && ctrlMean !== null && Math.abs(expMean - ctrlMean) > 5) {
      warnings.push(
        `Guruhlar o‘rtacha diagnostika bali ${Math.abs(Math.round((expMean - ctrlMean) * 10) / 10)} ballga farq qiladi — boshqa urug‘ni sinab ko‘ring.`
      )
    }

    return {
      ok: true,
      data: {
        seed: input.seed,
        method: input.method,
        total: assignments.length,
        assignments,
        strata,
        balance: {
          experimental: {
            n: assignments.filter((a) => a.target === 'experimental').length,
            mean: expMean,
            sd: sdOf(expAll),
          },
          control: {
            n: assignments.filter((a) => a.target === 'control').length,
            mean: ctrlMean,
            sd: sdOf(ctrlAll),
          },
        },
        warnings,
      },
    }
  } catch (err) {
    return fail(err, 'Randomizatsiyani hisoblashda xatolik')
  }
}

/** Kod: LE-0001 ko'rinishida (tartib raqami bo'yicha). */
function participantCodeFor(index: number): string {
  return `LE-${String(index).padStart(4, '0')}`
}

export async function applyRandomisationAction(
  input: RandomisationInput
): Promise<ActionResult<{ assigned: number; experimental: number; control: number }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    const preview = await previewRandomisationAction(input)
    if (!preview.ok) return preview

    const db = adminDb()
    const { assignments } = preview.data

    // Mavjud kodlar — yangi kodni ulardan keyin boshlaymiz
    const allStudents = await db.collection(COL.users).where('role', '==', 'student').get()
    let maxIndex = 0
    for (const doc of allStudents.docs) {
      const code = (doc.data() as { participantCode?: string }).participantCode
      const match = code?.match(/^LE-(\d+)$/)
      if (match) maxIndex = Math.max(maxIndex, Number(match[1]))
    }

    const batch = db.batch()
    const claimJobs: Array<{ uid: string; groupId: string; expGroup: ExperimentGroup; code: string }> =
      []

    for (const assignment of assignments) {
      const groupId =
        assignment.target === 'experimental' ? input.experimentalGroupId : input.controlGroupId
      let code = assignment.participantCode
      if (!code || code === '—') {
        maxIndex += 1
        code = participantCodeFor(maxIndex)
      }
      batch.set(
        db.collection(COL.users).doc(assignment.uid),
        { groupId, expGroup: assignment.target, participantCode: code },
        { merge: true }
      )
      claimJobs.push({ uid: assignment.uid, groupId, expGroup: assignment.target, code })
    }

    await batch.commit()

    // Custom claims — kichik guruhlarda parallel
    for (const jobs of chunk(claimJobs, 10)) {
      await Promise.all(
        jobs.map((job) =>
          setUserClaims(job.uid, {
            groupId: job.groupId,
            expGroup: job.expGroup,
            participantCode: job.code,
          }).catch((err) => console.error('[randomise] claims failed', job.uid, err))
        )
      )
    }

    // Guruh hisoblagichlari
    await Promise.all(
      [input.experimentalGroupId, input.controlGroupId].map(async (groupId) => {
        const count = await db
          .collection(COL.users)
          .where('role', '==', 'student')
          .where('groupId', '==', groupId)
          .count()
          .get()
        await db
          .collection(COL.groups)
          .doc(groupId)
          .set({ studentCount: count.data().count }, { merge: true })
      })
    )

    const experimental = assignments.filter((a) => a.target === 'experimental').length
    const control = assignments.length - experimental

    await logAudit(user, 'experiment.randomize', input.cohortId, {
      method: input.method,
      seed: input.seed,
      experimental,
      control,
      experimentalGroupId: input.experimentalGroupId,
      controlGroupId: input.controlGroupId,
    })

    revalidatePath('/researcher/groups')
    revalidatePath('/researcher/participants')
    revalidatePath('/researcher/dashboard')

    return { ok: true, data: { assigned: assignments.length, experimental, control } }
  } catch (err) {
    return fail(err, 'Randomizatsiyani qo‘llashda xatolik')
  }
}

/* ================================================================== */
/* 4. Test / so'rovnoma biriktirish                                    */
/* ================================================================== */

export async function assignTestAction(input: {
  testId: string
  groupIds: string[]
  from?: string
  to?: string
}): Promise<ActionResult<{ testId: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    if (!input.testId) return { ok: false, error: 'Testni tanlang.' }
    if (input.from && input.to && new Date(input.to) <= new Date(input.from)) {
      return { ok: false, error: 'Yopilish vaqti ochilish vaqtidan keyin bo‘lishi kerak.' }
    }

    await adminDb()
      .collection(COL.tests)
      .doc(input.testId)
      .set(
        {
          assignedTo: {
            groupIds: input.groupIds,
            from: input.from ? new Date(input.from) : null,
            to: input.to ? new Date(input.to) : null,
          },
        },
        { merge: true }
      )

    await logAudit(user, 'experiment.assign_test', input.testId, {
      groups: input.groupIds.length,
      from: input.from ?? null,
      to: input.to ?? null,
    })

    revalidatePath('/researcher/tests')
    return { ok: true, data: { testId: input.testId } }
  } catch (err) {
    return fail(err, 'Testni biriktirishda xatolik')
  }
}

export async function assignSurveyAction(input: {
  surveyId: string
  groupIds: string[]
  from?: string
  to?: string
  active: boolean
}): Promise<ActionResult<{ surveyId: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    if (!input.surveyId) return { ok: false, error: 'So‘rovnomani tanlang.' }

    await adminDb()
      .collection(COL.surveys)
      .doc(input.surveyId)
      .set(
        {
          active: input.active,
          assignedTo: {
            groupIds: input.groupIds,
            from: input.from ? new Date(input.from) : null,
            to: input.to ? new Date(input.to) : null,
          },
        },
        { merge: true }
      )

    await logAudit(user, 'experiment.assign_survey', input.surveyId, {
      groups: input.groupIds.length,
      active: input.active,
    })

    revalidatePath('/researcher/surveys')
    return { ok: true, data: { surveyId: input.surveyId } }
  } catch (err) {
    return fail(err, 'So‘rovnomani biriktirishda xatolik')
  }
}

/* ================================================================== */
/* 5. Ishtirokchilar                                                   */
/* ================================================================== */

export async function withdrawParticipantAction(input: {
  uid: string
  reason?: string
}): Promise<ActionResult<{ uid: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    await adminDb()
      .collection(COL.users)
      .doc(input.uid)
      .set(
        {
          researchWithdrawn: true,
          researchWithdrawnAt: FieldValue.serverTimestamp(),
          researchWithdrawReason: input.reason ?? '',
          consentGiven: false,
        },
        { merge: true }
      )

    await logAudit(user, 'participant.withdraw', input.uid, { reason: input.reason ?? '' })
    revalidatePath('/researcher/participants')
    revalidatePath('/researcher/dashboard')
    return { ok: true, data: { uid: input.uid } }
  } catch (err) {
    return fail(err, 'Ishtirokchini chiqarishda xatolik')
  }
}

export async function restoreParticipantAction(
  uid: string
): Promise<ActionResult<{ uid: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    await adminDb()
      .collection(COL.users)
      .doc(uid)
      .set(
        {
          researchWithdrawn: false,
          researchWithdrawReason: FieldValue.delete(),
          researchWithdrawnAt: FieldValue.delete(),
        },
        { merge: true }
      )
    await logAudit(user, 'participant.restore', uid, {})
    revalidatePath('/researcher/participants')
    return { ok: true, data: { uid } }
  } catch (err) {
    return fail(err, 'Ishtirokchini qaytarishda xatolik')
  }
}

/** Kodi yo'q talabalarga `participantCode` beradi (anonimlashtirish sharti). */
export async function assignParticipantCodesAction(): Promise<ActionResult<{ assigned: number }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    const db = adminDb()
    const snap = await db.collection(COL.users).where('role', '==', 'student').get()

    let maxIndex = 0
    const missing: string[] = []
    for (const doc of snap.docs) {
      const code = (doc.data() as { participantCode?: string }).participantCode
      const match = code?.match(/^LE-(\d+)$/)
      if (match) maxIndex = Math.max(maxIndex, Number(match[1]))
      if (!code) missing.push(doc.id)
    }
    if (!missing.length) return { ok: true, data: { assigned: 0 } }

    const batch = db.batch()
    const jobs: Array<{ uid: string; code: string }> = []
    for (const uid of missing) {
      maxIndex += 1
      const code = participantCodeFor(maxIndex)
      batch.set(db.collection(COL.users).doc(uid), { participantCode: code }, { merge: true })
      jobs.push({ uid, code })
    }
    await batch.commit()

    for (const group of chunk(jobs, 10)) {
      await Promise.all(
        group.map((job) =>
          setUserClaims(job.uid, { participantCode: job.code }).catch((err) =>
            console.error('[codes] claims failed', job.uid, err)
          )
        )
      )
    }

    await logAudit(user, 'participant.code', undefined, { assigned: jobs.length })
    revalidatePath('/researcher/participants')
    return { ok: true, data: { assigned: jobs.length } }
  } catch (err) {
    return fail(err, 'Kodlarni berishda xatolik')
  }
}

/* ================================================================== */
/* 6. Eksport (PLAN 9-bo'lim)                                          */
/* ================================================================== */

export type ExportFormat = 'xlsx' | 'csv' | 'spss'

export interface ExportInput {
  datasets: DatasetName[]
  format: ExportFormat
}

export interface ExportedFile {
  name: string
  url: string
  size: number
}

const SIGNED_URL_MINUTES = 60

const ANONYMITY_NOTE =
  'Fayllar anonimlashtirilgan: uid, ism, email va foto yo‘q — faqat participantCode. ' +
  'Kod ↔ talaba xaritasi eksport qilinmaydi (informed consent sharti).'

/**
 * Ilmiy datasetlarni yaratadi, Storage'ga yuklaydi va qisqa muddatli
 * imzolangan havola qaytaradi (PLAN 9.3).
 *
 * Ma'lumot `@/lib/export` orqali quriladi — u ishtirokchilarni bitta joyda
 * filtrlaydi: faqat eksperiment guruhlaridagi, `participantCode` berilgan va
 * ROZILIK BERGAN talabalar. Tadqiqotdan chiqarilgan ishtirokchida
 * `consentGiven = false` bo‘lgani uchun uning ma'lumoti ham chiqib ketadi.
 */
export async function generateExportAction(
  input: ExportInput
): Promise<ActionResult<{ files: ExportedFile[]; expiresAt: string; rows: number }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    if (!input.datasets.length) return { ok: false, error: 'Kamida bitta dataset tanlang.' }

    const experiment = await getExperiment()
    if (!experiment) {
      return {
        ok: false,
        error: 'Eksperiment topilmadi. Avval «Eksperiment» sahifasida uni sozlang.',
      }
    }
    if (
      !experiment.groupIds?.experimental?.length &&
      !experiment.groupIds?.control?.length
    ) {
      return {
        ok: false,
        error: 'Eksperimentga guruhlar biriktirilmagan — eksport uchun ishtirokchi topilmaydi.',
      }
    }

    const datasets = await buildDatasets(experiment.id, input.datasets)
    const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0)
    if (!totalRows) {
      return {
        ok: false,
        error:
          'Tanlangan datasetlar bo‘sh. Ishtirokchilarda rozilik va ishtirokchi kodi borligini tekshiring.',
      }
    }

    const generatedAt = new Date()
    const meta = {
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      hypothesis: experiment.hypothesis,
      design: experiment.design,
      generatedAt,
      generatedByRole: user.role,
      note: ANONYMITY_NOTE,
    }

    const files: Array<{ name: string; body: Buffer; contentType: string }> = []

    if (input.format === 'xlsx') {
      files.push({
        name: xlsxFileName(generatedAt),
        body: await toXlsxBuffer(datasets, meta),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    } else {
      for (const dataset of datasets) {
        files.push({
          name: `${dataset.name}.csv`,
          body: toCsvBuffer(dataset.columns, dataset.rows),
          contentType: 'text/csv; charset=utf-8',
        })
      }
    }

    if (input.format === 'spss') {
      // codebook.md + har dataset uchun import sintaksisi (.sps)
      for (const file of buildSpssPackage(datasets, meta)) {
        files.push({
          name: file.name,
          body: Buffer.from(file.content, 'utf8'),
          contentType: file.contentType,
        })
      }
    }

    const bucket = adminBucket()
    const folder = `exports/${generatedAt.toISOString().replace(/[:.]/g, '-')}`
    const expires = Date.now() + SIGNED_URL_MINUTES * 60 * 1000
    const uploaded: ExportedFile[] = []

    for (const file of files) {
      const ref = bucket.file(`${folder}/${file.name}`)
      await ref.save(file.body, {
        contentType: file.contentType,
        resumable: false,
        metadata: { cacheControl: 'private, max-age=0' },
      })
      const [url] = await ref.getSignedUrl({ action: 'read', expires })
      uploaded.push({ name: file.name, url, size: file.body.byteLength })
    }

    await logAudit(user, 'research.export', folder, {
      datasets: datasets.map((dataset) => dataset.name),
      format: input.format,
      rows: totalRows,
      files: uploaded.length,
      experimentId: experiment.id,
    })

    revalidatePath('/researcher/export')

    return {
      ok: true,
      data: { files: uploaded, expiresAt: new Date(expires).toISOString(), rows: totalRows },
    }
  } catch (err) {
    return fail(err, 'Eksport yaratishda xatolik')
  }
}

/**
 * Ustunlar sxemasi va codebook'ni QATORLARSIZ qaytaradi — eksport oldidan
 * ko'rib chiqish uchun (o'lchov darajalari, qiymat yorliqlari, kodlar kitobi).
 */
export async function previewExportSchemaAction(input: {
  datasets: DatasetName[]
}): Promise<ActionResult<{ schema: DatasetSchemaPreview[]; codebook: string }>> {
  try {
    await requireUser([...RESEARCH_ROLES])
    if (!input.datasets.length) return { ok: false, error: 'Kamida bitta dataset tanlang.' }

    const experiment = await getExperiment()
    if (!experiment) {
      return { ok: false, error: 'Eksperiment topilmadi. Avval uni sozlang.' }
    }

    const datasets = await buildDatasets(experiment.id, input.datasets)

    const schema: DatasetSchemaPreview[] = datasets.map((dataset) => ({
      name: dataset.name,
      label: dataset.label,
      description: dataset.description,
      rows: dataset.rows.length,
      columns: dataset.columns.map((column) => ({
        name: column.name,
        label: column.label,
        type: column.type,
        measure: column.measure,
        values: column.values
          ? Object.entries(column.values)
              .map(([key, label]) => `${key} = ${label}`)
              .join('; ')
          : null,
      })),
    }))

    const codebook = buildCodebook(datasets, {
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      hypothesis: experiment.hypothesis,
      design: experiment.design,
    })

    return { ok: true, data: { schema, codebook } }
  } catch (err) {
    return fail(err, 'Sxemani tayyorlashda xatolik')
  }
}

/* ================================================================== */
/* 7. Xizmat amallari                                                  */
/* ================================================================== */

/** `statsGroupDaily` ni qayta hisoblash (grafiklar eskirgan bo'lsa). */
export async function recomputeGroupStatsAction(
  date?: string
): Promise<ActionResult<{ groups: number; date: string }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    const target = date ?? dayKey()
    const snap = await adminDb().collection(COL.groups).get()
    let count = 0
    for (const doc of snap.docs) {
      await aggregateGroupDay(doc.id, target)
      count += 1
    }
    await logAudit(user, 'stats.recompute', target, { groups: count })
    revalidatePath('/researcher/analytics')
    revalidatePath('/researcher/dashboard')
    return { ok: true, data: { groups: count, date: target } }
  } catch (err) {
    return fail(err, 'Statistikani qayta hisoblashda xatolik')
  }
}

/** Xavf ostidagi talabalarni aniqlash uchun prognozlarni yangilash. */
export async function refreshPredictionsAction(
  limit = 60
): Promise<ActionResult<{ updated: number; highRisk: number }>> {
  try {
    const user = await requireUser([...RESEARCH_ROLES])
    const db = adminDb()
    const snap = await db.collection(COL.users).where('role', '==', 'student').limit(limit).get()

    let updated = 0
    let highRisk = 0
    for (const docs of chunk(snap.docs, 5)) {
      const results = await Promise.all(
        docs.map((doc) =>
          predictProgress(doc.id).catch((err) => {
            console.error('[predictions] failed', doc.id, err)
            return null
          })
        )
      )
      for (const result of results) {
        if (!result) continue
        updated += 1
        if (result.riskLevel === 'high') highRisk += 1
      }
    }

    await logAudit(user, 'predictions.refresh', undefined, { updated, highRisk })
    revalidatePath('/researcher/dashboard')
    return { ok: true, data: { updated, highRisk } }
  } catch (err) {
    return fail(err, 'Prognozlarni yangilashda xatolik')
  }
}

/** Guruh sozlamalarini o'qish uchun kichik yordamchi (klient formasi uchun). */
export async function getGroupFlagsAction(
  groupId: string
): Promise<ActionResult<{ flags: FeatureFlags; type: ExperimentGroup }>> {
  try {
    await requireUser([...RESEARCH_ROLES])
    const snap = await adminDb().collection(COL.groups).doc(groupId).get()
    const group = snap.data() as GroupDoc | undefined
    if (!group) return { ok: false, error: 'Guruh topilmadi.' }
    return { ok: true, data: { flags: group.featureFlags, type: group.type } }
  } catch (err) {
    return fail(err, 'Guruh sozlamalarini o‘qishda xatolik')
  }
}
