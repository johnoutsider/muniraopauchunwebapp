'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { COL, XP, type Domain } from '@/config/constants'
import { awardXp, bumpDailyStats, logEvent } from '@/lib/analytics/events'
import {
  buildLinguisticProfile,
  generatePath,
  getLearningPath,
  loadCatalogue,
} from '@/lib/adaptive/path'
import { wordCount as countWords } from '@/lib/utils/format'
import type {
  ActionResult,
  AttemptDoc,
  ItemDoc,
  LearningPathDoc,
  SessionUser,
  SpeakingSubmissionDoc,
  TestDoc,
  UserDoc,
  WithId,
  WritingSubmissionDoc,
} from '@/types'

import { collectItemIds } from './runner-content'
import { gradeAttempt } from './scoring'
import { testAvailability } from './queries'
import type {
  AnswerMap,
  AttemptProgress,
  AttemptRecord,
  AutosavePayload,
  OpenAnswerMap,
  OpenSubmissionRecord,
  StartAttemptResult,
  SubmitAttemptResult,
} from './types'

/**
 * Assessment Center server action'lari (PLAN 8.11, 2- va 8-bosqichlar).
 *
 * PRINSIPLAR:
 *  • Baholash FAQAT serverda va faqat `gradeItem` qoidalari bo'yicha —
 *    klient hech qachon `isCorrect` yoki ball yubormaydi.
 *  • Autosave javobni yo'qotmaydi: har saqlashda to'liq holat yoziladi,
 *    topshirilgan urinish esa qayta yozilmaydi (status tekshiriladi).
 *  • Topshirish IDEMPOTENT: takroriy chaqiruv ikkinchi marta ball bermaydi
 *    va yo'lni qayta generatsiya qilmaydi (tranzaksiyada "band qilinadi").
 */

const MAX_TEXT_LENGTH = 20000
const MAX_ANSWER_PARTS = 60
const BATCH_LIMIT = 400

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

/* ------------------------------------------------------------------ */
/* Kirish ma'lumotini tozalash                                         */
/* ------------------------------------------------------------------ */

function sanitizeAnswers(answers: AnswerMap | undefined, allowed: Set<string>): AnswerMap {
  const out: AnswerMap = {}
  if (!answers) return out
  for (const [itemId, value] of Object.entries(answers)) {
    if (!allowed.has(itemId)) continue
    if (!Array.isArray(value)) continue
    out[itemId] = value
      .slice(0, MAX_ANSWER_PARTS)
      .map((part) => (typeof part === 'string' ? part.slice(0, 2000) : ''))
  }
  return out
}

function sanitizeOpen(open: OpenAnswerMap | undefined, allowed: Set<string>): OpenAnswerMap {
  const out: OpenAnswerMap = {}
  if (!open) return out
  for (const [sectionId, value] of Object.entries(open)) {
    if (!allowed.has(sectionId) || !value || typeof value !== 'object') continue
    const text = typeof value.text === 'string' ? value.text.slice(0, MAX_TEXT_LENGTH) : undefined
    const audioPath =
      typeof value.audioPath === 'string' && value.audioPath.startsWith('speaking/')
        ? value.audioPath.slice(0, 500)
        : undefined
    out[sectionId] = {
      text,
      audioPath,
      durationSec:
        typeof value.durationSec === 'number' && Number.isFinite(value.durationSec)
          ? Math.max(0, Math.min(3600, Math.round(value.durationSec)))
          : undefined,
      wordCount: text ? countWords(text) : undefined,
    }
  }
  return out
}

function sanitizeProgress(progress: AttemptProgress | undefined): AttemptProgress {
  const safeNumber = (value: unknown, max = 999): number => {
    const num = Number(value)
    return Number.isFinite(num) ? Math.max(0, Math.min(max, Math.round(num))) : 0
  }
  const startedAt: Record<string, number> = {}
  for (const [key, value] of Object.entries(progress?.sectionStartedAt ?? {})) {
    const num = Number(value)
    if (Number.isFinite(num) && num > 0) startedAt[key] = Math.round(num)
  }
  const locked = progress?.lockedSections
  return {
    sectionIndex: safeNumber(progress?.sectionIndex),
    itemIndex: safeNumber(progress?.itemIndex),
    sectionStartedAt: startedAt,
    lockedSections: Array.isArray(locked)
      ? locked.filter((id): id is string => typeof id === 'string').slice(0, 32)
      : [],
    updatedAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* Firestore ↔ klient shakl almashinuvi                                */
/* ------------------------------------------------------------------ */

function answersToRows(answers: AnswerMap): AttemptRecord['rawAnswers'] {
  return Object.entries(answers).map(([itemId, answer]) => ({ itemId, answer }))
}

function rowsToAnswers(rows: AttemptRecord['rawAnswers'] | undefined): AnswerMap {
  const out: AnswerMap = {}
  for (const row of rows ?? []) {
    if (row?.itemId) out[row.itemId] = Array.isArray(row.answer) ? row.answer : []
  }
  return out
}

function openToRows(
  open: OpenAnswerMap,
  skillBySection: Map<string, OpenSubmissionRecord['skill']>
): OpenSubmissionRecord[] {
  return Object.entries(open).map(([sectionId, value]) => ({
    sectionId,
    skill: skillBySection.get(sectionId) ?? 'writing',
    text: value.text,
    audioPath: value.audioPath,
    durationSec: value.durationSec,
    wordCount: value.wordCount,
    status: 'pending' as const,
  }))
}

function rowsToOpen(rows: OpenSubmissionRecord[] | undefined): OpenAnswerMap {
  const out: OpenAnswerMap = {}
  for (const row of rows ?? []) {
    if (!row?.sectionId) continue
    out[row.sectionId] = {
      text: row.text,
      audioPath: row.audioPath,
      durationSec: row.durationSec,
      wordCount: row.wordCount,
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

async function loadTest(testId: string): Promise<(TestDoc & WithId) | null> {
  const snap = await adminDb().collection(COL.tests).doc(testId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...(snap.data() as TestDoc) }
}

async function loadItems(ids: string[]): Promise<Map<string, ItemDoc & WithId>> {
  if (!ids.length) return new Map()
  const db = adminDb()
  const map = new Map<string, ItemDoc & WithId>()
  for (let i = 0; i < ids.length; i += 250) {
    const refs = ids.slice(i, i + 250).map((id) => db.collection(COL.items).doc(id))
    const snaps = await db.getAll(...refs)
    for (const snap of snaps) {
      if (snap.exists) map.set(snap.id, { id: snap.id, ...(snap.data() as ItemDoc) })
    }
  }
  return map
}

function initialProgress(sectionId: string | undefined): AttemptProgress {
  return {
    sectionIndex: 0,
    itemIndex: 0,
    sectionStartedAt: sectionId ? { [sectionId]: Date.now() } : {},
    lockedSections: [],
    updatedAt: Date.now(),
  }
}

/* ------------------------------------------------------------------ */
/* 1. Urinishni boshlash / davom ettirish                              */
/* ------------------------------------------------------------------ */

export async function startAttemptAction(
  testId: string
): Promise<ActionResult<StartAttemptResult>> {
  const user = await requireStudent()

  const test = await loadTest(testId)
  if (!test || !test.published) return fail('Test topilmadi yoki nashr qilinmagan.', 'not_found')

  // Ochiqlik oynasi SERVERDA tekshiriladi (post-test faqat tadqiqotchi
  // belgilagan muddatda topshiriladi — PLAN 9)
  const availability = testAvailability(test, user.groupId)
  if (availability.state !== 'available') {
    return fail('Bu test hozir siz uchun ochiq emas.', availability.state)
  }

  const db = adminDb()
  const existing = await db
    .collection(COL.testAttempts)
    .where('uid', '==', user.uid)
    .where('status', '==', 'in_progress')
    .orderBy('startedAt', 'desc')
    .limit(10)
    .get()

  const resumeDoc = existing.docs.find(
    (doc) => (doc.data() as AttemptRecord).testId === testId
  )

  if (resumeDoc) {
    const data = resumeDoc.data() as AttemptRecord
    return {
      ok: true,
      data: {
        attemptId: resumeDoc.id,
        resumed: true,
        answers: rowsToAnswers(data.rawAnswers),
        open: rowsToOpen(data.openSubmissions),
        progress: data.progress ?? initialProgress(test.sections[0]?.id),
      },
    }
  }

  const ref = db.collection(COL.testAttempts).doc()
  const doc: Record<string, unknown> = {
    uid: user.uid,
    testId,
    testTitle: test.title,
    type: test.type,
    participantCode: user.participantCode ?? null,
    expGroup: user.expGroup ?? null,
    sectionScores: {},
    totalScore: 0,
    totalMax: 0,
    percent: 0,
    status: 'in_progress',
    rawAnswers: [],
    openSubmissions: [],
    progress: initialProgress(test.sections[0]?.id),
    startedAt: FieldValue.serverTimestamp(),
  }
  await ref.set(doc)

  await logEvent(user, 'test_start', { testId, type: test.type, attemptId: ref.id })

  return {
    ok: true,
    data: {
      attemptId: ref.id,
      resumed: false,
      answers: {},
      open: {},
      progress: initialProgress(test.sections[0]?.id),
    },
  }
}

/* ------------------------------------------------------------------ */
/* 2. Autosave                                                         */
/* ------------------------------------------------------------------ */

/**
 * Har o'zgarishda (debounce bilan) chaqiriladi. Ulanish uzilsa ham
 * oxirgi saqlangan holat Firestore'da qoladi va "davom ettirish"da tiklanadi.
 */
export async function autosaveAttemptAction(
  attemptId: string,
  payload: AutosavePayload
): Promise<ActionResult<{ savedAt: number }>> {
  const user = await requireStudent()
  const db = adminDb()
  const ref = db.collection(COL.testAttempts).doc(attemptId)

  const snap = await ref.get()
  const attempt = snap.data() as AttemptRecord | undefined
  if (!attempt) return fail('Urinish topilmadi.', 'not_found')
  if (attempt.uid !== user.uid) return fail('Ruxsat yo‘q.', 'forbidden')
  if (attempt.status !== 'in_progress') return fail('Test allaqachon topshirilgan.', 'finished')

  const test = await loadTest(attempt.testId)
  if (!test) return fail('Test topilmadi.', 'not_found')

  const allowedItems = new Set(collectItemIds(test))
  const allowedSections = new Set(test.sections.map((section) => section.id))
  const skillBySection = new Map(test.sections.map((section) => [section.id, section.skill]))

  const answers = sanitizeAnswers(payload.answers, allowedItems)
  const open = sanitizeOpen(payload.open, allowedSections)

  await ref.update({
    rawAnswers: answersToRows(answers),
    openSubmissions: openToRows(open, skillBySection),
    progress: sanitizeProgress(payload.progress),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { ok: true, data: { savedAt: Date.now() } }
}

/* ------------------------------------------------------------------ */
/* 3. Tugallanmagan urinishni bekor qilish                             */
/* ------------------------------------------------------------------ */

export async function discardAttemptAction(attemptId: string): Promise<ActionResult<null>> {
  const user = await requireStudent()
  const ref = adminDb().collection(COL.testAttempts).doc(attemptId)
  const snap = await ref.get()
  const attempt = snap.data() as AttemptRecord | undefined
  if (!attempt) return fail('Urinish topilmadi.', 'not_found')
  if (attempt.uid !== user.uid) return fail('Ruxsat yo‘q.', 'forbidden')
  if (attempt.status !== 'in_progress') {
    return fail('Topshirilgan urinishni o‘chirib bo‘lmaydi.', 'finished')
  }
  await ref.delete()
  revalidatePath('/student/assessment')
  return { ok: true, data: null }
}

/* ------------------------------------------------------------------ */
/* 4. Topshirish va baholash                                           */
/* ------------------------------------------------------------------ */

/** Ochiq bo'limlarni o'qituvchi/AI navbatiga qo'yish (bloklamasdan). */
async function queueOpenSections(
  user: SessionUser,
  test: TestDoc & WithId,
  attemptId: string,
  open: OpenAnswerMap
): Promise<OpenSubmissionRecord[]> {
  const db = adminDb()
  const batch = db.batch()
  const records: OpenSubmissionRecord[] = []

  for (const section of test.sections) {
    const answer = open[section.id]
    const hasText = Boolean(answer?.text?.trim())
    const hasAudio = Boolean(answer?.audioPath)
    if (!section.openTask?.prompt && !hasText && !hasAudio) continue

    const base: OpenSubmissionRecord = {
      sectionId: section.id,
      skill: section.skill,
      text: answer?.text,
      audioPath: answer?.audioPath,
      durationSec: answer?.durationSec,
      wordCount: answer?.text ? countWords(answer.text) : undefined,
      status: 'pending',
    }

    if (!hasText && !hasAudio) {
      // Talaba ochiq topshiriqni bajarmagan — navbatga qo'yilmaydi
      records.push(base)
      continue
    }

    const taskTitle = `${test.title} — ${section.title}`
    const taskId = `test:${attemptId}:${section.id}`

    if (hasAudio) {
      const ref = db.collection(COL.speakingSubmissions).doc()
      const doc: SpeakingSubmissionDoc = {
        uid: user.uid,
        participantCode: user.participantCode,
        expGroup: user.expGroup,
        taskId,
        taskTitle,
        type: section.skill === 'pronunciation' ? 'sentence' : 'presentation',
        audioPath: answer?.audioPath as string,
        durationSec: answer?.durationSec ?? 0,
        referenceText: section.openTask?.referenceText,
        attemptNo: 1,
        ts: FieldValue.serverTimestamp() as unknown as SpeakingSubmissionDoc['ts'],
      }
      batch.set(ref, doc)
      records.push({ ...base, submissionId: ref.id, submissionKind: 'speaking' })
      continue
    }

    const ref = db.collection(COL.writingSubmissions).doc()
    const text = answer?.text ?? ''
    const doc: WritingSubmissionDoc = {
      uid: user.uid,
      participantCode: user.participantCode,
      expGroup: user.expGroup,
      taskId,
      taskTitle,
      genre: 'essay',
      drafts: [
        {
          text,
          wordCount: countWords(text),
          ts: Date.now(),
        },
      ],
      finalText: text,
      wordCount: countWords(text),
      status: 'submitted',
      createdAt: FieldValue.serverTimestamp() as unknown as WritingSubmissionDoc['createdAt'],
      submittedAt: FieldValue.serverTimestamp() as unknown as WritingSubmissionDoc['submittedAt'],
    }
    batch.set(ref, doc)
    records.push({ ...base, submissionId: ref.id, submissionKind: 'writing' })
  }

  await batch.commit()
  return records
}

/** Har bir yopiq item uchun `attempts` yozuvi — ilmiy datasetning manbai (PLAN 9.2). */
async function writeItemAttempts(
  user: SessionUser,
  attemptId: string,
  graded: ReturnType<typeof gradeAttempt>
): Promise<void> {
  const db = adminDb()
  const rows = graded.items.filter((item) => !item.result.needsAi)
  for (let i = 0; i < rows.length; i += BATCH_LIMIT) {
    const batch = db.batch()
    for (const row of rows.slice(i, i + BATCH_LIMIT)) {
      const doc: AttemptDoc = {
        uid: user.uid,
        groupId: user.groupId,
        expGroup: user.expGroup,
        participantCode: user.participantCode,
        itemId: row.itemId,
        skill: row.skill,
        topic: row.topic,
        context: 'test',
        contextId: attemptId,
        answer: row.answer,
        isCorrect: row.result.isCorrect,
        score: row.result.score,
        timeMs: 0,
        hintsUsed: 0,
        errorTags: row.result.errorTags,
        difficultyAtTime: row.difficulty,
        ts: FieldValue.serverTimestamp() as unknown as AttemptDoc['ts'],
      }
      batch.set(db.collection(COL.attempts).doc(), doc)
    }
    await batch.commit()
  }
}

/**
 * Individual Linguistic Profile + Learning Path (PLAN 5, 2-bosqich).
 * `buildLinguisticProfile` va `generatePath` — `@/lib/adaptive/path` dagi
 * toza funksiyalar; bu yerda ular Firestore bilan bog'lanadi.
 */
async function rebuildLearningPath(
  user: SessionUser,
  attempt: { sectionScores: AttemptRecord['sectionScores'] },
  note: string
): Promise<boolean> {
  const profile = buildLinguisticProfile(attempt)
  if (!Object.keys(profile).length) return false

  const db = adminDb()
  const [userSnap, existing, catalogue, flags] = await Promise.all([
    db.collection(COL.users).doc(user.uid).get(),
    getLearningPath(user.uid),
    loadCatalogue(),
    resolveFlags(user),
  ])

  const userDoc = userSnap.data() as UserDoc | undefined
  const track: Domain =
    userDoc?.onboarding?.professionalTrack ?? existing?.professionalTrack ?? 'economics'
  const goals = userDoc?.onboarding?.goal ? [userDoc.onboarding.goal] : (existing?.goals ?? [])

  const steps = generatePath({ uid: user.uid, profile, track, goals, catalogue, flags })

  const path: Omit<LearningPathDoc, 'generatedAt'> = {
    uid: user.uid,
    linguisticProfile: profile,
    goals,
    professionalTrack: track,
    steps,
    version: (existing?.version ?? 0) + 1,
    generatedBy: 'rules',
    note,
  }

  await db
    .collection(COL.learningPaths)
    .doc(user.uid)
    .set({ ...path, generatedAt: FieldValue.serverTimestamp() })

  return true
}

export async function submitAttemptAction(
  attemptId: string,
  payload: AutosavePayload
): Promise<ActionResult<SubmitAttemptResult>> {
  const user = await requireStudent()
  const db = adminDb()
  const ref = db.collection(COL.testAttempts).doc(attemptId)

  // --- Bosqich 1: urinishni "band qilish" (takroriy topshirishning oldini olish)
  let claimed: { alreadyFinished: boolean; attempt: AttemptRecord }
  try {
    claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const attempt = snap.data() as AttemptRecord | undefined
      if (!attempt) throw new Error('not_found')
      if (attempt.uid !== user.uid) throw new Error('forbidden')
      if (attempt.status !== 'in_progress') {
        return { alreadyFinished: true, attempt }
      }
      tx.update(ref, { status: 'submitted', finishedAt: FieldValue.serverTimestamp() })
      return { alreadyFinished: false, attempt }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'forbidden') return fail('Ruxsat yo‘q.', 'forbidden')
    if (message === 'not_found') return fail('Urinish topilmadi.', 'not_found')
    return fail('Testni topshirishda xatolik yuz berdi. Qaytadan urinib ko‘ring.')
  }

  if (claimed.alreadyFinished) {
    // Idempotent: takroriy chaqiruvda mavjud natija qaytariladi
    return {
      ok: true,
      data: { attemptId, percent: claimed.attempt.percent ?? 0, pathGenerated: false },
    }
  }

  /**
   * "Band qilish" bekor qilinadi: baholash tugallanmasa urinish `in_progress`
   * holatiga QAYTARILADI — aks holda talaba javoblariga qaytolmay qolardi.
   */
  const releaseClaim = async () => {
    try {
      await ref.update({ status: 'in_progress', finishedAt: FieldValue.delete() })
    } catch (error) {
      console.error('[assessment] releaseClaim failed', error)
    }
  }

  const test = await loadTest(claimed.attempt.testId)
  if (!test) {
    await releaseClaim()
    return fail('Test topilmadi.', 'not_found')
  }

  const allowedItems = new Set(collectItemIds(test))
  const allowedSections = new Set(test.sections.map((section) => section.id))
  const skillBySection = new Map(test.sections.map((section) => [section.id, section.skill]))

  // Saqlangan holat + klientning oxirgi holati birlashtiriladi (klient ustun)
  const answers: AnswerMap = {
    ...rowsToAnswers(claimed.attempt.rawAnswers),
    ...sanitizeAnswers(payload.answers, allowedItems),
  }
  const open: OpenAnswerMap = {
    ...rowsToOpen(claimed.attempt.openSubmissions),
    ...sanitizeOpen(payload.open, allowedSections),
  }

  let graded: ReturnType<typeof gradeAttempt>
  try {
    // --- Bosqich 2: deterministik baholash
    const itemsById = await loadItems(collectItemIds(test))
    graded = gradeAttempt(test.sections, itemsById, answers)

    // --- Bosqich 3: ochiq bo'limlarni navbatga qo'yish (AI CHAQIRILMAYDI)
    let openRecords: OpenSubmissionRecord[]
    try {
      openRecords = await queueOpenSections(user, test, attemptId, open)
    } catch (error) {
      console.error('[assessment] queueOpenSections failed', error)
      openRecords = openToRows(open, skillBySection)
    }

    // --- Bosqich 4: natijani yozish
    await ref.update({
      sectionScores: graded.sectionScores,
      rawAnswers: graded.rawAnswers,
      openSubmissions: openRecords,
      errorTagCounts: graded.errorTagCounts,
      pendingSections: graded.pendingSections,
      totalScore: graded.totalScore,
      totalMax: graded.totalMax,
      percent: graded.percent,
      // Deterministik qism yakunlangani uchun `graded`: ochiq bo'limlar ballari
      // keyinroq `openSubmissions[].score` orqali qo'shiladi (PLAN 8.11).
      status: 'graded',
      progress: sanitizeProgress(payload.progress),
    })
  } catch (error) {
    console.error('[assessment] grading failed', error)
    await releaseClaim()
    return fail(
      'Natijani hisoblashda xatolik yuz berdi. Javoblaringiz saqlangan — qaytadan topshirib ko‘ring.'
    )
  }

  // --- Bosqich 5: profil va o'quv yo'li
  let pathGenerated = false
  try {
    pathGenerated = await rebuildLearningPath(
      user,
      { sectionScores: graded.sectionScores },
      `${test.title} natijasi asosida qayta tuzildi`
    )
  } catch (error) {
    console.error('[assessment] rebuildLearningPath failed', error)
  }

  // --- Bosqich 6: analitika (ilovani hech qachon to'xtatmaydi)
  const correct = graded.items.filter((item) => !item.result.needsAi && item.result.isCorrect).length
  const closed = graded.items.filter((item) => !item.result.needsAi).length

  try {
    await writeItemAttempts(user, attemptId, graded)
  } catch (error) {
    console.error('[assessment] writeItemAttempts failed', error)
  }

  await Promise.all([
    logEvent(user, 'test_submit', {
      attemptId,
      testId: test.id,
      type: test.type,
      percent: graded.percent,
      totalScore: graded.totalScore,
      totalMax: graded.totalMax,
      sectionScores: graded.sectionScores,
      pendingSections: graded.pendingSections,
    }),
    awardXp(user, XP.TEST_COMPLETE, `test_${test.type}`, attemptId),
    bumpDailyStats(user, { attempts: closed, correct }),
  ])

  if (pathGenerated) {
    await logEvent(user, 'path_generated', {
      source: 'test_submit',
      attemptId,
      testId: test.id,
      type: test.type,
    })
  }

  revalidatePath('/student/assessment')
  revalidatePath('/student/path')
  revalidatePath('/student/dashboard')

  return {
    ok: true,
    data: { attemptId, percent: graded.percent, pathGenerated },
  }
}

/* ------------------------------------------------------------------ */
/* 5. Natijalar sahifasidagi AI hisobotini keshlash                    */
/* ------------------------------------------------------------------ */

/**
 * AI Feedback Report matnini urinish hujjatiga saqlash — har ochilganda
 * qayta generatsiya qilinmasligi uchun (xarajat nazorati, PLAN 7.4).
 * Nazorat guruhida bu action ishlamaydi: `aiFeedback` bayrog'i o'chirilgan.
 */
export async function saveFeedbackReportAction(
  attemptId: string,
  report: unknown
): Promise<ActionResult<null>> {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  if (!flags.aiFeedback) return fail('Bu imkoniyat guruhingiz uchun yoqilmagan.', 'flag_off')

  const ref = adminDb().collection(COL.testAttempts).doc(attemptId)
  const snap = await ref.get()
  const attempt = snap.data() as AttemptRecord | undefined
  if (!attempt) return fail('Urinish topilmadi.', 'not_found')
  if (attempt.uid !== user.uid) return fail('Ruxsat yo‘q.', 'forbidden')

  await ref.update({ aiFeedbackReport: report, aiFeedbackAt: FieldValue.serverTimestamp() })
  return { ok: true, data: null }
}
