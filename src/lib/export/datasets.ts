import 'server-only'

/**
 * Ilmiy ma'lumot eksporti — datasetlar qurish (PLAN.md 9-bo'lim).
 *
 * ETIKA VA ANONIMLIK (PLAN 9.3, 9.4):
 * Bu modul qaytaradigan HECH QAYSI qatorda `uid`, email, ism yoki boshqa
 * identifikator BO'LMAYDI — faqat `participantCode` (E-042 / C-017).
 * Kodlar bilan shaxslar o'rtasidagi moslik faqat tadqiqotchining alohida
 * sahifasida saqlanadi va eksportga hech qachon qo'shilmaydi.
 * Roziligini bermagan (`consentGiven !== true`) talabalar ma'lumotlari
 * eksportga umuman kirmaydi — ular platformadan foydalanaveradi.
 *
 * SPSS UCHUN KODLASH:
 *   group: 1 = experimental, 2 = control
 *   correct/consent kabi mantiqiy maydonlar: 0 = yo'q, 1 = ha
 *   bo'sh qiymat — bo'sh katak (SPSS'da system-missing)
 */

import {
  COL,
  ERROR_TAGS,
  SKILLS,
  eventsCollection,
  type ExperimentGroup,
} from '@/config/constants'
import { adminDb, Timestamp } from '@/lib/firebase/admin'
import { toDate } from '@/lib/utils/format'
import type {
  AiSessionDoc,
  AttemptDoc,
  EventDoc,
  ExperimentDoc,
  SpeakingSubmissionDoc,
  StatsDailyDoc,
  SurveyDoc,
  SurveyResponseDoc,
  TestAttemptDoc,
  TimeValue,
  UserDoc,
  WritingSubmissionDoc,
} from '@/types'

/* ------------------------------------------------------------------ */
/* Tiplar                                                              */
/* ------------------------------------------------------------------ */

/** SPSS o'lchov darajasi (VARIABLE LEVEL). */
export type Measure = 'nominal' | 'ordinal' | 'scale'

export interface ColumnDef {
  /** SPSS-xavfsiz o'zgaruvchi nomi (≤ 64 belgi, bo'shliqsiz). */
  name: string
  /** To'liq yorliq (VARIABLE LABELS). */
  label: string
  type: 'string' | 'number' | 'date'
  measure: Measure
  /** Qiymat yorliqlari (VALUE LABELS), masalan `{ 1: 'experimental' }`. */
  values?: Record<string | number, string>
}

export interface Dataset {
  /** Fayl/varaq nomi: `participants`, `attempts_long` … */
  name: string
  /** O'zbekcha sarlavha (Excel varag'i va codebook uchun). */
  label: string
  description: string
  columns: ColumnDef[]
  rows: Array<Record<string, unknown>>
}

/** Guruh kodlari — barcha datasetlarda bir xil (PLAN 9.3). */
export const GROUP_VALUES: Record<number, string> = { 1: 'experimental', 2: 'control' }

export const YES_NO_VALUES: Record<number, string> = { 0: 'no', 1: 'yes' }

function groupCode(group: ExperimentGroup | undefined): number | '' {
  if (group === 'experimental') return 1
  if (group === 'control') return 2
  return ''
}

/** ISO 8601 sana (SPSS `GET DATA` uchun barqaror format). */
function iso(value: TimeValue | null | undefined): string {
  const date = toDate(value)
  return date ? date.toISOString() : ''
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/* ------------------------------------------------------------------ */
/* Ishtirokchilar indeksi                                              */
/* ------------------------------------------------------------------ */

export interface Participant {
  uid: string
  participantCode: string
  group: ExperimentGroup
  groupId: string
  cohortId?: string
}

export interface ParticipantIndex {
  experiment: ExperimentDoc
  experimentId: string
  participants: Participant[]
  byUid: Map<string, Participant>
  uids: string[]
}

/**
 * Eksperiment ishtirokchilarini yuklash: rozilik bergan, `participantCode`
 * berilgan talabalar. Bu funksiya barcha datasetlar uchun yagona filtr —
 * shu tufayli datasetlar bir xil ishtirokchilar to'plamiga ega bo'ladi.
 */
export async function loadParticipants(experimentId: string): Promise<ParticipantIndex> {
  const db = adminDb()
  const snap = await db.collection(COL.experiments).doc(experimentId).get()
  const experiment = snap.data() as ExperimentDoc | undefined
  if (!experiment) throw new Error(`Eksperiment topilmadi: ${experimentId}`)

  const groupOf = new Map<string, ExperimentGroup>()
  for (const id of experiment.groupIds?.experimental ?? []) groupOf.set(id, 'experimental')
  for (const id of experiment.groupIds?.control ?? []) groupOf.set(id, 'control')

  const groupIds = [...groupOf.keys()]
  const participants: Participant[] = []

  if (groupIds.length) {
    const snaps = await Promise.all(
      chunk(groupIds, 30).map((ids) =>
        db.collection(COL.users).where('groupId', 'in', ids).where('role', '==', 'student').get()
      )
    )
    for (const userSnap of snaps) {
      for (const doc of userSnap.docs) {
        const user = doc.data() as UserDoc
        const group = user.groupId ? groupOf.get(user.groupId) : undefined
        // ANONIMLIK + ETIKA: kodsiz yoki roziligi yo'q ishtirokchi eksportga kirmaydi
        if (!group || !user.participantCode || user.consentGiven !== true) continue
        participants.push({
          uid: doc.id,
          participantCode: user.participantCode,
          group,
          groupId: user.groupId as string,
          cohortId: user.cohortId,
        })
      }
    }
  }

  participants.sort((a, b) => a.participantCode.localeCompare(b.participantCode))
  return {
    experiment,
    experimentId,
    participants,
    byUid: new Map(participants.map((p) => [p.uid, p])),
    uids: participants.map((p) => p.uid),
  }
}

/** `uid in [...]` bo'yicha kolleksiyani bo'laklab o'qish. */
async function fetchByUids<T>(
  collection: string,
  uids: readonly string[],
  extra?: (query: FirebaseFirestore.Query) => FirebaseFirestore.Query
): Promise<Array<{ id: string; data: T }>> {
  if (!uids.length) return []
  const db = adminDb()
  const snaps = await Promise.all(
    chunk(uids, 30).map((ids) => {
      let query: FirebaseFirestore.Query = db.collection(collection).where('uid', 'in', ids)
      if (extra) query = extra(query)
      return query.get()
    })
  )
  return snaps.flatMap((snap) => snap.docs.map((doc) => ({ id: doc.id, data: doc.data() as T })))
}

/* ------------------------------------------------------------------ */
/* Umumiy ustunlar                                                     */
/* ------------------------------------------------------------------ */

const COL_PARTICIPANT: ColumnDef = {
  name: 'participantCode',
  label: 'Ishtirokchi kodi (anonim)',
  type: 'string',
  measure: 'nominal',
}

const COL_GROUP: ColumnDef = {
  name: 'expGroup',
  label: 'Eksperiment guruhi (1=eksperimental, 2=nazorat)',
  type: 'number',
  measure: 'nominal',
  values: GROUP_VALUES,
}

const COL_TS: ColumnDef = {
  name: 'ts',
  label: 'Vaqt belgisi (ISO 8601, UTC)',
  type: 'date',
  measure: 'scale',
}

/* ------------------------------------------------------------------ */
/* 1. participants (wide)                                              */
/* ------------------------------------------------------------------ */

const SURVEY_TYPE_TO_PREFIX: Record<string, string> = {
  motivation: 'motivation',
  ai_literacy: 'ailiteracy',
  satisfaction: 'satisfaction',
}

/**
 * 1-dataset: `participants` — har ishtirokchi uchun BITTA qator (wide format).
 * SPSS'da paired t-test (pre vs post) va independent t-test (guruhlar)
 * aynan shu jadvaldan bajariladi (PLAN 9.2, 1-band).
 */
export async function buildParticipantsWide(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const { experiment, uids } = index

  const testIds = [experiment.preTestId, experiment.postTestId].filter(Boolean) as string[]

  const [testAttempts, surveyResponses, dailyStats, badgesSnap, surveysSnap] = await Promise.all([
    testIds.length
      ? fetchByUids<TestAttemptDoc>(COL.testAttempts, uids, (q) => q.where('testId', 'in', testIds))
      : Promise.resolve([]),
    fetchByUids<SurveyResponseDoc>(COL.surveyResponses, uids),
    fetchByUids<StatsDailyDoc>(COL.statsDaily, uids),
    adminDb()
      .collection(COL.userBadges)
      .get()
      .catch(() => null),
    adminDb().collection(COL.surveys).get(),
  ])

  const surveyById = new Map(surveysSnap.docs.map((doc) => [doc.id, doc.data() as SurveyDoc]))

  // uid → yig'ilgan qiymatlar
  type Row = Record<string, unknown>
  const rowByUid = new Map<string, Row>()
  for (const participant of index.participants) {
    rowByUid.set(participant.uid, {
      participantCode: participant.participantCode,
      expGroup: groupCode(participant.group),
      groupId: participant.groupId,
      cohortId: participant.cohortId ?? '',
    })
  }

  // --- pre/post ball ---
  for (const { data } of testAttempts) {
    const row = rowByUid.get(data.uid)
    if (!row) continue
    const slot = data.testId === experiment.preTestId ? 'pre' : 'post'
    for (const skill of SKILLS) {
      const section = data.sectionScores?.[skill]
      if (!section) continue
      const percent = section.percent ?? (section.max ? (section.score / section.max) * 100 : 0)
      row[`${slot}_${skill}`] = round2(percent)
    }
    row[`${slot}_total`] = round2(data.percent ?? 0)
  }

  // --- gain ---
  for (const row of rowByUid.values()) {
    for (const key of [...SKILLS, 'total']) {
      const pre = row[`pre_${key}`]
      const post = row[`post_${key}`]
      if (typeof pre === 'number' && typeof post === 'number') {
        row[`gain_${key}`] = round2(post - pre)
      }
    }
  }

  // --- so'rovnomalar ---
  for (const { data } of surveyResponses) {
    const row = rowByUid.get(data.uid)
    if (!row) continue
    const survey = surveyById.get(data.surveyId)
    const prefix = SURVEY_TYPE_TO_PREFIX[data.surveyType ?? survey?.type ?? ''] ?? null
    if (!prefix) continue
    const score = data.scoreTotal ?? likertMean(data.answers)
    if (score === null) continue
    // Bir xil turdagi ikkinchi javob = post o'lchov
    const key = row[`${prefix}_pre`] === undefined ? `${prefix}_pre` : `${prefix}_post`
    row[key] = round2(score)
  }

  // --- faollik agregatlari ---
  for (const { data } of dailyStats) {
    const row = rowByUid.get(data.uid)
    if (!row) continue
    row.totalTimeMin = (asNumber(row.totalTimeMin) ?? 0) + (data.timeOnTaskMin ?? 0)
    row.attempts = (asNumber(row.attempts) ?? 0) + (data.attempts ?? 0)
    row.correct = (asNumber(row.correct) ?? 0) + (data.correct ?? 0)
    row.aiMessages = (asNumber(row.aiMessages) ?? 0) + (data.aiMessages ?? 0)
    row.aiTokens = (asNumber(row.aiTokens) ?? 0) + (data.aiTokens ?? 0)
    row.wordsLearned = (asNumber(row.wordsLearned) ?? 0) + (data.wordsLearned ?? 0)
    row.lessonsDone = (asNumber(row.lessonsDone) ?? 0) + (data.lessonsDone ?? 0)
    row.speakingSubmissions =
      (asNumber(row.speakingSubmissions) ?? 0) + (data.speakingSubmissions ?? 0)
    row.writingSubmissions =
      (asNumber(row.writingSubmissions) ?? 0) + (data.writingSubmissions ?? 0)
    row.activeDays = (asNumber(row.activeDays) ?? 0) + ((data.attempts ?? 0) > 0 ? 1 : 0)
    row.xp = (asNumber(row.xp) ?? 0) + (data.xp ?? 0)
  }

  // --- badge'lar ---
  if (badgesSnap) {
    for (const doc of badgesSnap.docs) {
      const row = rowByUid.get(doc.id)
      if (!row) continue
      const count = (doc.data().count as number | undefined) ?? 0
      row.badges = count
    }
  }

  // Bo'sh sonli maydonlarni 0 ga to'ldirish (faoliyat yo'qligi = 0, missing emas)
  const activityKeys = [
    'totalTimeMin',
    'attempts',
    'correct',
    'aiMessages',
    'aiTokens',
    'wordsLearned',
    'lessonsDone',
    'speakingSubmissions',
    'writingSubmissions',
    'activeDays',
    'xp',
    'badges',
  ]
  for (const row of rowByUid.values()) {
    for (const key of activityKeys) if (row[key] === undefined) row[key] = 0
    const attempts = asNumber(row.attempts) ?? 0
    const correct = asNumber(row.correct) ?? 0
    row.correctRate = attempts ? round2((correct / attempts) * 100) : ''
  }

  const columns: ColumnDef[] = [
    COL_PARTICIPANT,
    COL_GROUP,
    { name: 'groupId', label: 'Akademik guruh identifikatori', type: 'string', measure: 'nominal' },
    { name: 'cohortId', label: 'Kohorta identifikatori', type: 'string', measure: 'nominal' },
  ]

  for (const slot of ['pre', 'post', 'gain'] as const) {
    const slotLabel =
      slot === 'pre' ? 'Pre-test' : slot === 'post' ? 'Post-test' : 'O‘sish (post−pre)'
    for (const skill of SKILLS) {
      columns.push({
        name: `${slot}_${skill}`,
        label: `${slotLabel}: ${skill} (0–100)`,
        type: 'number',
        measure: 'scale',
      })
    }
    columns.push({
      name: `${slot}_total`,
      label: `${slotLabel}: umumiy ball (0–100)`,
      type: 'number',
      measure: 'scale',
    })
  }

  for (const prefix of ['motivation', 'ailiteracy', 'satisfaction']) {
    for (const slot of ['pre', 'post'] as const) {
      columns.push({
        name: `${prefix}_${slot}`,
        label: `So‘rovnoma o‘rtachasi: ${prefix} (${slot})`,
        type: 'number',
        measure: 'scale',
      })
    }
  }

  columns.push(
    { name: 'totalTimeMin', label: 'Umumiy vaqt (daqiqa)', type: 'number', measure: 'scale' },
    { name: 'attempts', label: 'Mashq urinishlari soni', type: 'number', measure: 'scale' },
    { name: 'correct', label: 'To‘g‘ri javoblar soni', type: 'number', measure: 'scale' },
    { name: 'correctRate', label: 'To‘g‘ri javoblar ulushi (%)', type: 'number', measure: 'scale' },
    { name: 'aiMessages', label: 'AI bilan xabarlar soni', type: 'number', measure: 'scale' },
    { name: 'aiTokens', label: 'AI tokenlari (jami)', type: 'number', measure: 'scale' },
    { name: 'wordsLearned', label: 'Takrorlangan so‘zlar soni', type: 'number', measure: 'scale' },
    { name: 'lessonsDone', label: 'Tugallangan darslar', type: 'number', measure: 'scale' },
    {
      name: 'speakingSubmissions',
      label: 'Speaking topshiriqlari',
      type: 'number',
      measure: 'scale',
    },
    {
      name: 'writingSubmissions',
      label: 'Writing topshiriqlari',
      type: 'number',
      measure: 'scale',
    },
    { name: 'activeDays', label: 'Faol kunlar soni', type: 'number', measure: 'scale' },
    { name: 'xp', label: 'Yig‘ilgan XP', type: 'number', measure: 'scale' },
    { name: 'badges', label: 'Olingan badge‘lar soni', type: 'number', measure: 'scale' }
  )

  return {
    name: 'participants',
    label: 'Ishtirokchilar (wide)',
    description:
      'Har ishtirokchi uchun bitta qator: pre/post ballar, o‘sish, so‘rovnoma o‘rtachalari va faollik ko‘rsatkichlari. Asosiy gipoteza shu jadvalda sinaladi.',
    columns,
    rows: orderRows(index, rowByUid),
  }
}

/* ------------------------------------------------------------------ */
/* 2. attempts_long                                                    */
/* ------------------------------------------------------------------ */

/** 2-dataset: har urinish — alohida qator (PLAN 9.2, 2-band). */
export async function buildAttemptsLong(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const attempts = await fetchByUids<AttemptDoc>(COL.attempts, index.uids)

  const rows = attempts
    .map(({ id, data }) => {
      const participant = index.byUid.get(data.uid)
      if (!participant) return null
      return {
        attemptId: id,
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(data.ts),
        itemId: data.itemId,
        skill: data.skill ?? '',
        topic: data.topic ?? '',
        context: data.context ?? '',
        difficulty: data.difficultyAtTime ?? '',
        correct: data.isCorrect ? 1 : 0,
        score: round2(data.score ?? 0),
        timeMs: data.timeMs ?? '',
        hintsUsed: data.hintsUsed ?? 0,
        errorTags: (data.errorTags ?? []).join(';'),
        errorCount: (data.errorTags ?? []).length,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode) || a.ts.localeCompare(b.ts))

  return {
    name: 'attempts_long',
    label: 'Mashq urinishlari (long)',
    description:
      'Har bir mashq urinishi alohida qator. Xato taksonomiyasi, qiyinlik va vaqt tahlili uchun (aralash modellar, o‘sish egri chiziqlari).',
    columns: [
      { name: 'attemptId', label: 'Urinish identifikatori', type: 'string', measure: 'nominal' },
      COL_PARTICIPANT,
      COL_GROUP,
      COL_TS,
      { name: 'itemId', label: 'Mashq identifikatori', type: 'string', measure: 'nominal' },
      {
        name: 'skill',
        label: 'Ko‘nikma',
        type: 'string',
        measure: 'nominal',
        values: Object.fromEntries(SKILLS.map((skill) => [skill, skill])),
      },
      { name: 'topic', label: 'Mavzu', type: 'string', measure: 'nominal' },
      {
        name: 'context',
        label: 'Kontekst (lesson/practice/test/project)',
        type: 'string',
        measure: 'nominal',
      },
      { name: 'difficulty', label: 'Qiyinlik darajasi (1–5)', type: 'number', measure: 'ordinal' },
      {
        name: 'correct',
        label: 'To‘g‘ri javob (0/1)',
        type: 'number',
        measure: 'nominal',
        values: YES_NO_VALUES,
      },
      { name: 'score', label: 'Qisman ball (0–1)', type: 'number', measure: 'scale' },
      { name: 'timeMs', label: 'Sarflangan vaqt (ms)', type: 'number', measure: 'scale' },
      { name: 'hintsUsed', label: 'Ishlatilgan yordamlar soni', type: 'number', measure: 'scale' },
      {
        name: 'errorTags',
        label: 'Xato teglari (; bilan ajratilgan)',
        type: 'string',
        measure: 'nominal',
        values: Object.fromEntries(ERROR_TAGS.map((tag) => [tag, tag])),
      },
      { name: 'errorCount', label: 'Xato teglari soni', type: 'number', measure: 'scale' },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* 3. speaking_long                                                    */
/* ------------------------------------------------------------------ */

/** 3a-dataset: talaffuz/speaking topshiriqlari bo'yicha ballar (PLAN 9.2, 3-band). */
export async function buildSpeakingLong(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const submissions = await fetchByUids<SpeakingSubmissionDoc>(COL.speakingSubmissions, index.uids)

  const rows = submissions
    .map(({ id, data }) => {
      const participant = index.byUid.get(data.uid)
      if (!participant) return null
      const azure = data.azure
      return {
        submissionId: id,
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(data.ts),
        taskId: data.taskId ?? '',
        taskType: data.type ?? '',
        attemptNo: data.attemptNo ?? 1,
        durationSec: round2(data.durationSec ?? 0),
        scripted: data.referenceText ? 1 : 0,
        accuracyScore: azure ? round2(azure.accuracyScore) : '',
        fluencyScore: azure ? round2(azure.fluencyScore) : '',
        completenessScore: azure ? round2(azure.completenessScore) : '',
        prosodyScore: azure?.prosodyScore !== undefined ? round2(azure.prosodyScore) : '',
        pronScore: azure ? round2(azure.pronScore) : '',
        wordCount: azure?.words?.length ?? '',
        teacherScore: data.teacherFeedback?.score ?? '',
        hasAiFeedback: data.aiFeedback ? 1 : 0,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode) || a.ts.localeCompare(b.ts))

  return {
    name: 'speaking_long',
    label: 'Speaking / talaffuz topshiriqlari',
    description:
      'Har topshirilgan audio uchun Azure Pronunciation Assessment ballari (accuracy, fluency, completeness, prosody) va o‘qituvchi bahosi. Urinishlar (attemptNo) bo‘yicha o‘sishni kuzatish mumkin.',
    columns: [
      {
        name: 'submissionId',
        label: 'Topshiriq identifikatori',
        type: 'string',
        measure: 'nominal',
      },
      COL_PARTICIPANT,
      COL_GROUP,
      COL_TS,
      { name: 'taskId', label: 'Vazifa identifikatori', type: 'string', measure: 'nominal' },
      {
        name: 'taskType',
        label: 'Vazifa turi (word/sentence/dialogue/presentation)',
        type: 'string',
        measure: 'nominal',
      },
      { name: 'attemptNo', label: 'Urinish tartib raqami', type: 'number', measure: 'ordinal' },
      { name: 'durationSec', label: 'Audio davomiyligi (s)', type: 'number', measure: 'scale' },
      {
        name: 'scripted',
        label: 'Matn bo‘yicha o‘qish (1) yoki erkin nutq (0)',
        type: 'number',
        measure: 'nominal',
        values: { 0: 'unscripted', 1: 'scripted' },
      },
      { name: 'accuracyScore', label: 'Azure: aniqlik (0–100)', type: 'number', measure: 'scale' },
      { name: 'fluencyScore', label: 'Azure: ravonlik (0–100)', type: 'number', measure: 'scale' },
      {
        name: 'completenessScore',
        label: 'Azure: to‘liqlik (0–100)',
        type: 'number',
        measure: 'scale',
      },
      { name: 'prosodyScore', label: 'Azure: prosodiya (0–100)', type: 'number', measure: 'scale' },
      {
        name: 'pronScore',
        label: 'Azure: umumiy talaffuz bali (0–100)',
        type: 'number',
        measure: 'scale',
      },
      { name: 'wordCount', label: 'Baholangan so‘zlar soni', type: 'number', measure: 'scale' },
      { name: 'teacherScore', label: 'O‘qituvchi bahosi', type: 'number', measure: 'scale' },
      {
        name: 'hasAiFeedback',
        label: 'AI feedback berilgan (0/1)',
        type: 'number',
        measure: 'nominal',
        values: YES_NO_VALUES,
      },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* 4. writing_long                                                     */
/* ------------------------------------------------------------------ */

/** 3b-dataset: yozma ishlar bo'yicha rubrika ballari (PLAN 9.2, 3-band). */
export async function buildWritingLong(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const submissions = await fetchByUids<WritingSubmissionDoc>(COL.writingSubmissions, index.uids)

  const rubricKeys = [
    'task_achievement',
    'vocabulary_range',
    'grammar_accuracy',
    'coherence',
    'register',
  ]

  const rows = submissions
    .map(({ id, data }) => {
      const participant = index.byUid.get(data.uid)
      if (!participant) return null
      const lastFeedback = [...(data.drafts ?? [])]
        .reverse()
        .find((draft) => draft.aiFeedback)?.aiFeedback
      const row: Record<string, unknown> = {
        submissionId: id,
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(data.submittedAt ?? data.createdAt),
        taskId: data.taskId ?? '',
        genre: data.genre ?? '',
        status: data.status ?? '',
        draftCount: data.drafts?.length ?? 0,
        wordCount: data.wordCount ?? 0,
        aiErrorCount: lastFeedback?.errors?.length ?? '',
        teacherScore: data.teacherFeedback?.score ?? '',
      }
      for (const key of rubricKeys) {
        row[`rubric_${key}`] = data.rubricScores?.[key] ?? lastFeedback?.rubricScores?.[key] ?? ''
      }
      const values = rubricKeys
        .map((key) => row[`rubric_${key}`])
        .filter((value): value is number => typeof value === 'number')
      row.rubric_total = values.length ? round2(values.reduce((sum, value) => sum + value, 0)) : ''
      return row
    })
    .filter((row): row is Record<string, unknown> => row !== null)
    .sort(
      (a, b) =>
        String(a.participantCode).localeCompare(String(b.participantCode)) ||
        String(a.ts).localeCompare(String(b.ts))
    )

  return {
    name: 'writing_long',
    label: 'Yozma ishlar',
    description:
      'Har yozma topshiriq: janr, draftlar soni, so‘zlar soni, rubrika ballari (0–5) va o‘qituvchi bahosi. Draftlar soni — "revise" jarayonining ko‘rsatkichi.',
    columns: [
      { name: 'submissionId', label: 'Ish identifikatori', type: 'string', measure: 'nominal' },
      COL_PARTICIPANT,
      COL_GROUP,
      COL_TS,
      { name: 'taskId', label: 'Vazifa identifikatori', type: 'string', measure: 'nominal' },
      {
        name: 'genre',
        label: 'Janr (email/report/summary/memo/case)',
        type: 'string',
        measure: 'nominal',
      },
      {
        name: 'status',
        label: 'Holat (draft/submitted/reviewed)',
        type: 'string',
        measure: 'nominal',
      },
      { name: 'draftCount', label: 'Draftlar soni', type: 'number', measure: 'scale' },
      { name: 'wordCount', label: 'So‘zlar soni', type: 'number', measure: 'scale' },
      ...rubricKeys.map<ColumnDef>((key) => ({
        name: `rubric_${key}`,
        label: `Rubrika: ${key} (0–5)`,
        type: 'number',
        measure: 'ordinal',
      })),
      { name: 'rubric_total', label: 'Rubrika jami (0–25)', type: 'number', measure: 'scale' },
      {
        name: 'aiErrorCount',
        label: 'AI aniqlagan xatolar soni',
        type: 'number',
        measure: 'scale',
      },
      { name: 'teacherScore', label: 'O‘qituvchi bahosi', type: 'number', measure: 'scale' },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* 5. ai_interactions                                                  */
/* ------------------------------------------------------------------ */

/**
 * 4-dataset: AI bilan muloqot (PLAN 9.2, 4-band).
 * Qator — bitta AI sessiyasi. `helpful` ovozlari `ai_message` eventlaridan
 * sessiya bo'yicha yig'iladi (talaba "Was this helpful?" tugmasini bosganda).
 */
export async function buildAiInteractions(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const sessions = await fetchByUids<AiSessionDoc>(COL.aiSessions, index.uids)
  const events = await loadEvents(index, ['ai_message'])

  const helpfulBySession = new Map<string, { yes: number; no: number }>()
  for (const event of events) {
    const sessionId = event.sessionId ?? (event.payload?.sessionId as string | undefined)
    if (!sessionId) continue
    const helpful = event.payload?.helpful
    if (typeof helpful !== 'boolean') continue
    const entry = helpfulBySession.get(sessionId) ?? { yes: 0, no: 0 }
    if (helpful) entry.yes += 1
    else entry.no += 1
    helpfulBySession.set(sessionId, entry)
  }

  const rows = sessions
    .map(({ id, data }) => {
      const participant = index.byUid.get(data.uid)
      if (!participant) return null
      const helpful = helpfulBySession.get(id)
      const started = toDate(data.startedAt)
      const last = toDate(data.lastMessageAt)
      return {
        sessionId: id,
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(data.startedAt),
        mode: data.mode ?? '',
        persona: data.persona ?? '',
        model: data.model ?? '',
        scaffoldLevel: data.scaffoldLevel ?? '',
        messageCount: data.messageCount ?? 0,
        tokensIn: data.tokensIn ?? 0,
        tokensOut: data.tokensOut ?? 0,
        tokensTotal: (data.tokensIn ?? 0) + (data.tokensOut ?? 0),
        durationMin:
          started && last ? round2(Math.max(0, (last.getTime() - started.getTime()) / 60000)) : '',
        helpfulYes: helpful?.yes ?? 0,
        helpfulNo: helpful?.no ?? 0,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode) || a.ts.localeCompare(b.ts))

  return {
    name: 'ai_interactions',
    label: 'AI bilan muloqot',
    description:
      'Har AI sessiyasi: rejim, model, xabarlar va tokenlar soni, davomiylik, foydalilik ovozlari. Nazorat guruhida bu jadval bo‘sh bo‘lishi kutiladi (AI o‘chirilgan).',
    columns: [
      { name: 'sessionId', label: 'Sessiya identifikatori', type: 'string', measure: 'nominal' },
      COL_PARTICIPANT,
      COL_GROUP,
      { ...COL_TS, label: 'Sessiya boshlangan vaqt (ISO 8601, UTC)' },
      {
        name: 'mode',
        label: 'Rejim (tutor/roleplay/explain/…)',
        type: 'string',
        measure: 'nominal',
      },
      { name: 'persona', label: 'Role-play personasi', type: 'string', measure: 'nominal' },
      { name: 'model', label: 'AI modeli', type: 'string', measure: 'nominal' },
      {
        name: 'scaffoldLevel',
        label: 'Prompt scaffolding darajasi',
        type: 'string',
        measure: 'ordinal',
        values: { simple: 'simple', guided: 'guided', independent: 'independent' },
      },
      { name: 'messageCount', label: 'Xabarlar soni', type: 'number', measure: 'scale' },
      { name: 'tokensIn', label: 'Kiruvchi tokenlar', type: 'number', measure: 'scale' },
      { name: 'tokensOut', label: 'Chiquvchi tokenlar', type: 'number', measure: 'scale' },
      { name: 'tokensTotal', label: 'Jami tokenlar', type: 'number', measure: 'scale' },
      {
        name: 'durationMin',
        label: 'Sessiya davomiyligi (daqiqa)',
        type: 'number',
        measure: 'scale',
      },
      { name: 'helpfulYes', label: '"Foydali" ovozlari', type: 'number', measure: 'scale' },
      { name: 'helpfulNo', label: '"Foydali emas" ovozlari', type: 'number', measure: 'scale' },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* 6. survey_items                                                     */
/* ------------------------------------------------------------------ */

const LIKERT5_VALUES: Record<number, string> = {
  1: 'strongly disagree',
  2: 'disagree',
  3: 'neutral',
  4: 'agree',
  5: 'strongly agree',
}

const LIKERT7_VALUES: Record<number, string> = {
  1: 'strongly disagree',
  2: 'disagree',
  3: 'somewhat disagree',
  4: 'neutral',
  5: 'somewhat agree',
  6: 'agree',
  7: 'strongly agree',
}

/**
 * 6-dataset: so'rovnoma javoblari — HAR SAVOL alohida qator (PLAN 9.2, 6-band).
 * Bu format ishonchlilik (Cronbach's α) va faktor tahlili uchun zarur.
 * Teskari (`reverse`) savollar `answerRecoded` ustunida to'g'rilangan holda beriladi.
 */
export async function buildSurveyItems(experimentId: string): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const [responses, surveysSnap] = await Promise.all([
    fetchByUids<SurveyResponseDoc>(COL.surveyResponses, index.uids),
    adminDb().collection(COL.surveys).get(),
  ])

  const surveyById = new Map(surveysSnap.docs.map((doc) => [doc.id, doc.data() as SurveyDoc]))
  const rows: Array<Record<string, unknown>> = []

  for (const { id, data } of responses) {
    const participant = index.byUid.get(data.uid)
    if (!participant) continue
    const survey = surveyById.get(data.surveyId)
    for (const [questionId, answer] of Object.entries(data.answers ?? {})) {
      const question = survey?.questions?.find((item) => item.id === questionId)
      const numeric = typeof answer === 'number' ? answer : Number.parseFloat(String(answer))
      const isNumeric = Number.isFinite(numeric)
      const scaleMax = question?.type === 'likert7' ? 7 : 5
      rows.push({
        responseId: id,
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(data.ts),
        surveyId: data.surveyId,
        surveyType: data.surveyType ?? survey?.type ?? '',
        questionId,
        questionType: question?.type ?? '',
        questionText: question?.text ?? '',
        answerNumeric: isNumeric ? numeric : '',
        answerRecoded:
          isNumeric && question?.reverse ? scaleMax + 1 - numeric : isNumeric ? numeric : '',
        answerText: isNumeric ? '' : String(answer ?? ''),
        reverseCoded: question?.reverse ? 1 : 0,
      })
    }
  }

  rows.sort(
    (a, b) =>
      String(a.participantCode).localeCompare(String(b.participantCode)) ||
      String(a.surveyId).localeCompare(String(b.surveyId)) ||
      String(a.questionId).localeCompare(String(b.questionId))
  )

  return {
    name: 'survey_items',
    label: 'So‘rovnoma javoblari (savol darajasida)',
    description:
      'Motivatsiya, AI literacy va qoniqish so‘rovnomalarining har bir savoli alohida qator. Likert javoblari raqamli; teskari savollar `answerRecoded` da to‘g‘rilangan.',
    columns: [
      { name: 'responseId', label: 'Javob identifikatori', type: 'string', measure: 'nominal' },
      COL_PARTICIPANT,
      COL_GROUP,
      COL_TS,
      { name: 'surveyId', label: 'So‘rovnoma identifikatori', type: 'string', measure: 'nominal' },
      {
        name: 'surveyType',
        label: 'So‘rovnoma turi',
        type: 'string',
        measure: 'nominal',
        values: {
          motivation: 'motivation',
          ai_literacy: 'AI literacy',
          satisfaction: 'satisfaction',
          pre: 'pre',
          post: 'post',
          custom: 'custom',
        },
      },
      { name: 'questionId', label: 'Savol identifikatori', type: 'string', measure: 'nominal' },
      {
        name: 'questionType',
        label: 'Savol turi (likert5/likert7/mcq/open)',
        type: 'string',
        measure: 'nominal',
      },
      { name: 'questionText', label: 'Savol matni', type: 'string', measure: 'nominal' },
      {
        name: 'answerNumeric',
        label: 'Javob (raqamli)',
        type: 'number',
        measure: 'ordinal',
        values: { ...LIKERT5_VALUES, ...LIKERT7_VALUES },
      },
      {
        name: 'answerRecoded',
        label: 'Javob (teskari savollar to‘g‘rilangan)',
        type: 'number',
        measure: 'ordinal',
        values: LIKERT5_VALUES,
      },
      { name: 'answerText', label: 'Javob (ochiq matn)', type: 'string', measure: 'nominal' },
      {
        name: 'reverseCoded',
        label: 'Teskari savol (0/1)',
        type: 'number',
        measure: 'nominal',
        values: YES_NO_VALUES,
      },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* 7. events_long                                                      */
/* ------------------------------------------------------------------ */

/**
 * 5-dataset: to'liq event log (PLAN 9.2, 5-band — "katta, faqat so'rovda").
 * Har harakat bitta qator. `payload` JSON matn sifatida saqlanadi, chunki
 * uning tuzilishi event turiga bog'liq.
 */
export async function buildEventsLong(experimentId: string, limit = 200_000): Promise<Dataset> {
  const index = await loadParticipants(experimentId)
  const events = await loadEvents(index)

  const rows = events
    .slice(0, limit)
    .map((event) => {
      const participant = index.byUid.get(event.uid)
      if (!participant) return null
      return {
        participantCode: participant.participantCode,
        expGroup: groupCode(participant.group),
        ts: iso(event.ts),
        type: event.type,
        sessionId: event.sessionId ?? '',
        device: event.device ?? '',
        payload: event.payload ? JSON.stringify(event.payload) : '',
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.participantCode.localeCompare(b.participantCode) || a.ts.localeCompare(b.ts))

  return {
    name: 'events_long',
    label: 'Event log (to‘liq)',
    description:
      'Append-only harakatlar jurnali: kirish, dars ko‘rish, urinish, AI xabari, topshiriq va h.k. Vaqt sarfi va foydalanish namunalarini tahlil qilish uchun.',
    columns: [
      COL_PARTICIPANT,
      COL_GROUP,
      COL_TS,
      { name: 'type', label: 'Event turi', type: 'string', measure: 'nominal' },
      { name: 'sessionId', label: 'Sessiya identifikatori', type: 'string', measure: 'nominal' },
      { name: 'device', label: 'Qurilma', type: 'string', measure: 'nominal' },
      { name: 'payload', label: 'Qo‘shimcha ma‘lumot (JSON)', type: 'string', measure: 'nominal' },
    ],
    rows,
  }
}

/* ------------------------------------------------------------------ */
/* Hammasi birga                                                       */
/* ------------------------------------------------------------------ */

export type DatasetName =
  | 'participants'
  | 'attempts_long'
  | 'speaking_long'
  | 'writing_long'
  | 'ai_interactions'
  | 'survey_items'
  | 'events_long'

export const DEFAULT_DATASETS: DatasetName[] = [
  'participants',
  'attempts_long',
  'speaking_long',
  'writing_long',
  'ai_interactions',
  'survey_items',
]

/**
 * Tanlangan datasetlarni qurish. `events_long` standart to'plamga kirmaydi —
 * u juda katta va faqat alohida so'rovda yuklanadi (PLAN 9.2).
 */
export async function buildDatasets(
  experimentId: string,
  names: readonly DatasetName[] = DEFAULT_DATASETS
): Promise<Dataset[]> {
  const builders: Record<DatasetName, (id: string) => Promise<Dataset>> = {
    participants: buildParticipantsWide,
    attempts_long: buildAttemptsLong,
    speaking_long: buildSpeakingLong,
    writing_long: buildWritingLong,
    ai_interactions: buildAiInteractions,
    survey_items: buildSurveyItems,
    events_long: (id) => buildEventsLong(id),
  }
  const out: Dataset[] = []
  for (const name of names) {
    out.push(await builders[name](experimentId))
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Yordamchilar                                                        */
/* ------------------------------------------------------------------ */

/** Eksperiment davridagi oylik event kolleksiyalarini o'qish. */
async function loadEvents(
  index: ParticipantIndex,
  types?: readonly EventDoc['type'][]
): Promise<EventDoc[]> {
  if (!index.uids.length) return []
  const db = adminDb()
  const start = toDate(index.experiment.timeline?.start) ?? new Date(Date.now() - 365 * 86400000)
  const end = toDate(index.experiment.timeline?.end) ?? new Date()

  const collections = new Set<string>()
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  while (cursor <= end) {
    collections.add(eventsCollection(cursor))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  const out: EventDoc[] = []
  for (const collection of collections) {
    const snaps = await Promise.all(
      chunk(index.uids, 30).map((ids) => {
        let query: FirebaseFirestore.Query = db
          .collection(collection)
          .where('uid', 'in', ids)
          .where('ts', '>=', Timestamp.fromDate(start))
          .where('ts', '<=', Timestamp.fromDate(end))
        if (types?.length && types.length <= 10)
          query = query.where('type', 'in', types as string[])
        return query.get().catch(() => null)
      })
    )
    for (const snap of snaps) {
      if (!snap) continue
      for (const doc of snap.docs) out.push(doc.data() as EventDoc)
    }
  }
  return out
}

function orderRows(
  index: ParticipantIndex,
  rowByUid: Map<string, Record<string, unknown>>
): Array<Record<string, unknown>> {
  return index.participants
    .map((participant) => rowByUid.get(participant.uid))
    .filter((row): row is Record<string, unknown> => Boolean(row))
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Likert javoblarining o'rtachasi (so'rovnoma umumiy bali). */
function likertMean(answers: Record<string, number | string> | undefined): number | null {
  if (!answers) return null
  const values = Object.values(answers).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  )
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}
