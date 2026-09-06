import 'server-only'

/**
 * Learning Analytics agregatsiyasi (PLAN.md 4.4, 8.18, 9.1).
 *
 * ILMIY MAQSAD:
 * Xom `attempts` va `events_{YYYY_MM}` yozuvlari — bu million qatorli log.
 * Dashboard va eksport uchun ularni har safar qayta o'qish qimmat va sekin.
 * Shuning uchun kunlik agregatlar (`statsDaily`, `statsGroupDaily`) tunda
 * (Vercel Cron) QAYTA HISOBLANADI. `bumpDailyStats` real vaqtda taxminiy
 * qiymat yozadi, bu modul esa uni xom ma'lumotdan ANIQ qayta tiklaydi —
 * shu tufayli eksportdagi raqamlar har doim log bilan mos keladi
 * (dissertatsiya ma'lumotlarining yaxlitligi uchun kritik).
 */

import { linearRegression } from 'simple-statistics'

import { COL, SKILLS, eventsCollection, type ExperimentGroup, type Skill } from '@/config/constants'
import { adminDb, Timestamp } from '@/lib/firebase/admin'
import { dayKey } from '@/lib/utils/format'
import type {
  AttemptDoc,
  EventDoc,
  ExperimentDoc,
  MasteryDoc,
  PredictionDoc,
  StatsDailyDoc,
  StatsGroupDailyDoc,
  TestAttemptDoc,
  UserDoc,
} from '@/types'

import { describe, gain, independentTTest, mean, type Describe, type TTestResult } from './stats'

/* ------------------------------------------------------------------ */
/* Sana yordamchilari                                                  */
/* ------------------------------------------------------------------ */

/** `YYYY-MM-DD` → [kun boshi, kun oxiri) UTC bo'yicha. */
function dayRange(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00.000Z`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

/** Oxirgi N kunning kalitlari (eng eskisi birinchi). */
export function lastDays(days: number, from: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(dayKey(new Date(from.getTime() - i * 24 * 60 * 60 * 1000)))
  }
  return out
}

/** Sana oralig'i qaysi oylik event kolleksiyalariga tegishli. */
function eventCollectionsFor(start: Date, end: Date): string[] {
  const names = new Set<string>([
    eventsCollection(start),
    eventsCollection(new Date(end.getTime() - 1)),
  ])
  return [...names]
}

/* ------------------------------------------------------------------ */
/* 1. Foydalanuvchi kuni                                               */
/* ------------------------------------------------------------------ */

/**
 * Bitta talabaning bitta kunidagi statistikasini XOM ma'lumotdan qayta hisoblash
 * va `statsDaily/{uid}_{date}` ga yozish.
 */
export async function aggregateUserDay(
  uid: string,
  date: string = dayKey()
): Promise<StatsDailyDoc> {
  const db = adminDb()
  const { start, end } = dayRange(date)
  const startTs = Timestamp.fromDate(start)
  const endTs = Timestamp.fromDate(end)

  const [userSnap, attemptsSnap, masterySnap] = await Promise.all([
    db.collection(COL.users).doc(uid).get(),
    db
      .collection(COL.attempts)
      .where('uid', '==', uid)
      .where('ts', '>=', startTs)
      .where('ts', '<', endTs)
      .get(),
    db.collection(COL.mastery).doc(uid).collection('skills').get(),
  ])

  const eventSnaps = await Promise.all(
    eventCollectionsFor(start, end).map((name) =>
      db
        .collection(name)
        .where('uid', '==', uid)
        .where('ts', '>=', startTs)
        .where('ts', '<', endTs)
        .get()
    )
  )

  const user = userSnap.data() as UserDoc | undefined
  const attempts = attemptsSnap.docs.map((doc) => doc.data() as AttemptDoc)
  const events = eventSnaps.flatMap((snap) => snap.docs.map((doc) => doc.data() as EventDoc))

  const correct = attempts.filter((attempt) => attempt.isCorrect).length
  const attemptMinutes = attempts.reduce(
    (sum, attempt) => sum + Math.min(10, (attempt.timeMs ?? 0) / 60000),
    0
  )

  const countEvents = (type: EventDoc['type']) =>
    events.filter((event) => event.type === type).length

  // AI tokenlari event payload'idan yig'iladi (xarajat nazorati, PLAN 7.4)
  const aiTokens = events
    .filter((event) => event.type === 'ai_message')
    .reduce((sum, event) => {
      const payload = event.payload ?? {}
      const inTokens = typeof payload.tokensIn === 'number' ? payload.tokensIn : 0
      const outTokens = typeof payload.tokensOut === 'number' ? payload.tokensOut : 0
      return sum + inTokens + outTokens
    }, 0)

  // Dars/AI/laboratoriya vaqtini taxminlash: har event uchun kichik og'irlik
  const eventMinutes =
    countEvents('lesson_view') * 4 +
    countEvents('ai_message') * 0.5 +
    countEvents('speaking_submit') * 2 +
    countEvents('writing_submit') * 8 +
    countEvents('vocab_review') * 0.3

  // Ko'nikma ballari — joriy pMastery (0..100), skill bo'yicha o'rtacha
  const masteryDocs = masterySnap.docs.map((doc) => doc.data() as MasteryDoc)
  const skillScores: Partial<Record<Skill, number>> = {}
  for (const skill of SKILLS) {
    const values = masteryDocs
      .filter((doc) => doc.skill === skill)
      .map((doc) => (doc.pMastery ?? 0) * 100)
    if (values.length) skillScores[skill] = Math.round(mean(values))
  }

  const stats: StatsDailyDoc = {
    uid,
    date,
    participantCode: user?.participantCode,
    expGroup: user?.expGroup,
    groupId: user?.groupId,
    timeOnTaskMin: Math.round(attemptMinutes + eventMinutes),
    attempts: attempts.length,
    correct,
    correctRate: attempts.length ? Math.round((correct / attempts.length) * 100) / 100 : 0,
    aiMessages: countEvents('ai_message'),
    aiTokens,
    wordsLearned: countEvents('vocab_review'),
    lessonsDone: countEvents('lesson_complete'),
    speakingSubmissions: countEvents('speaking_submit'),
    writingSubmissions: countEvents('writing_submit'),
    xp: 0,
    skillScores,
  }

  // XP ni xom `xpEvents` dan qayta hisoblaymiz
  const xpSnap = await db
    .collection(COL.xpEvents)
    .where('uid', '==', uid)
    .where('ts', '>=', startTs)
    .where('ts', '<', endTs)
    .get()
  stats.xp = xpSnap.docs.reduce((sum, doc) => sum + ((doc.data().amount as number) ?? 0), 0)

  await db.collection(COL.statsDaily).doc(`${uid}_${date}`).set(stats, { merge: true })
  return stats
}

/* ------------------------------------------------------------------ */
/* 2. Guruh kuni                                                       */
/* ------------------------------------------------------------------ */

/**
 * Guruh bo'yicha kunlik agregat (`statsGroupDaily/{groupId}_{date}`).
 * O'qituvchi dashboardi va tadqiqotchi grafiklari shundan o'qiydi.
 */
export async function aggregateGroupDay(
  groupId: string,
  date: string = dayKey()
): Promise<StatsGroupDailyDoc> {
  const db = adminDb()
  const snap = await db
    .collection(COL.statsDaily)
    .where('groupId', '==', groupId)
    .where('date', '==', date)
    .get()

  const rows = snap.docs.map((doc) => doc.data() as StatsDailyDoc)
  const active = rows.filter((row) => (row.attempts ?? 0) > 0 || (row.timeOnTaskMin ?? 0) > 0)

  const stats: StatsGroupDailyDoc = {
    groupId,
    date,
    activeStudents: active.length,
    avgCorrectRate: active.length
      ? Math.round(mean(active.map((row) => row.correctRate ?? 0)) * 1000) / 1000
      : 0,
    totalAttempts: rows.reduce((sum, row) => sum + (row.attempts ?? 0), 0),
    totalAiMessages: rows.reduce((sum, row) => sum + (row.aiMessages ?? 0), 0),
    avgTimeOnTaskMin: active.length
      ? Math.round(mean(active.map((row) => row.timeOnTaskMin ?? 0)))
      : 0,
  }

  await db.collection(COL.statsGroupDaily).doc(`${groupId}_${date}`).set(stats, { merge: true })
  return stats
}

/** Barcha guruhlar uchun kunlik agregat (cron). */
export async function aggregateAllGroupsDay(
  date: string = dayKey()
): Promise<StatsGroupDailyDoc[]> {
  const snap = await adminDb().collection(COL.groups).get()
  const out: StatsGroupDailyDoc[] = []
  for (const doc of snap.docs) {
    out.push(await aggregateGroupDay(doc.id, date))
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 3. Progress seriyasi                                                */
/* ------------------------------------------------------------------ */

export interface ProgressSeries {
  /** `YYYY-MM-DD` kalitlari, eng eskisi birinchi. */
  dates: string[]
  /** Har ko'nikma bo'yicha 0–100 ball qatori (`dates` bilan bir uzunlikda). */
  skills: Partial<Record<Skill, number[]>>
  correctRate: number[]
  timeOnTaskMin: number[]
  attempts: number[]
  aiMessages: number[]
  /** Faol kunlar soni (talaba biror ish qilgan kunlar). */
  activeDays: number
}

/**
 * Progress Dashboard uchun ko'nikma ballari dinamikasi (PLAN 5, 8-bosqich:
 * "Progress Dashboard (5 chiziq)").
 * Bo'sh kunlar oxirgi ma'lum qiymat bilan to'ldiriladi — chiziq uzilib qolmaydi.
 */
export async function getUserProgressSeries(uid: string, days = 30): Promise<ProgressSeries> {
  const dates = lastDays(days)
  const db = adminDb()
  const snap = await db
    .collection(COL.statsDaily)
    .where('uid', '==', uid)
    .where('date', '>=', dates[0])
    .where('date', '<=', dates[dates.length - 1])
    .get()

  const byDate = new Map<string, StatsDailyDoc>()
  for (const doc of snap.docs) {
    const row = doc.data() as StatsDailyDoc
    byDate.set(row.date, row)
  }

  const skills: Partial<Record<Skill, number[]>> = {}
  const lastKnown: Partial<Record<Skill, number>> = {}
  const correctRate: number[] = []
  const timeOnTaskMin: number[] = []
  const attempts: number[] = []
  const aiMessages: number[] = []
  let activeDays = 0

  for (const date of dates) {
    const row = byDate.get(date)
    if (row && ((row.attempts ?? 0) > 0 || (row.timeOnTaskMin ?? 0) > 0)) activeDays += 1

    for (const skill of SKILLS) {
      const value = row?.skillScores?.[skill]
      if (typeof value === 'number') lastKnown[skill] = value
      const series = skills[skill] ?? []
      series.push(lastKnown[skill] ?? 0)
      skills[skill] = series
    }

    correctRate.push(row?.correctRate ?? 0)
    timeOnTaskMin.push(row?.timeOnTaskMin ?? 0)
    attempts.push(row?.attempts ?? 0)
    aiMessages.push(row?.aiMessages ?? 0)
  }

  // Hech qachon o'lchanmagan ko'nikmalarni olib tashlaymiz (bo'sh chiziq chizmaymiz)
  for (const skill of SKILLS) {
    if (!skills[skill]?.some((value) => value > 0)) delete skills[skill]
  }

  return { dates, skills, correctRate, timeOnTaskMin, attempts, aiMessages, activeDays }
}

/* ------------------------------------------------------------------ */
/* 4. Guruhlararo taqqoslash (tadqiqotchi)                             */
/* ------------------------------------------------------------------ */

export interface GroupSkillComparison {
  skill: Skill | 'total'
  experimental: { pre: Describe; post: Describe; gain: Describe }
  control: { pre: Describe; post: Describe; gain: Describe }
  /** Gain bo'yicha guruhlararo Welch t-testi (asosiy gipoteza sinovi). */
  gainTest: TTestResult
}

export interface GroupComparison {
  experimentId: string
  title: string
  preTestId?: string
  postTestId?: string
  participants: { experimental: number; control: number }
  /** Pre VA post ikkalasini ham topshirganlar (tahlilga kiradiganlar). */
  completePairs: { experimental: number; control: number }
  skills: GroupSkillComparison[]
}

interface ParticipantScores {
  uid: string
  group: ExperimentGroup
  pre: Partial<Record<Skill, number>>
  post: Partial<Record<Skill, number>>
  preTotal?: number
  postTotal?: number
}

/**
 * Eksperimental vs nazorat guruhining pre/post o'rtachalari va o'sishi
 * (PLAN 8.18 grafiklar, 9.2 `participants` dataseti).
 *
 * Ballar 0–100 shkalasiga keltiriladi (`percent`), shuning uchun turli
 * bo'limlarni to'g'ridan to'g'ri taqqoslash mumkin.
 */
export async function getGroupComparison(experimentId: string): Promise<GroupComparison> {
  const db = adminDb()
  const expSnap = await db.collection(COL.experiments).doc(experimentId).get()
  const experiment = expSnap.data() as ExperimentDoc | undefined
  if (!experiment) {
    throw new Error(`Eksperiment topilmadi: ${experimentId}`)
  }

  const groupOf = new Map<string, ExperimentGroup>()
  for (const groupId of experiment.groupIds?.experimental ?? [])
    groupOf.set(groupId, 'experimental')
  for (const groupId of experiment.groupIds?.control ?? []) groupOf.set(groupId, 'control')

  const groupIds = [...groupOf.keys()]
  if (!groupIds.length) {
    return {
      experimentId,
      title: experiment.title,
      preTestId: experiment.preTestId,
      postTestId: experiment.postTestId,
      participants: { experimental: 0, control: 0 },
      completePairs: { experimental: 0, control: 0 },
      skills: [],
    }
  }

  // Firestore `in` operatori 30 tagacha qiymat qabul qiladi
  const userChunks = chunk(groupIds, 30)
  const userSnaps = await Promise.all(
    userChunks.map((ids) =>
      db.collection(COL.users).where('groupId', 'in', ids).where('role', '==', 'student').get()
    )
  )

  const byUid = new Map<string, ParticipantScores>()
  for (const snap of userSnaps) {
    for (const doc of snap.docs) {
      const user = doc.data() as UserDoc
      const group = user.groupId ? groupOf.get(user.groupId) : undefined
      if (!group) continue
      byUid.set(doc.id, { uid: doc.id, group, pre: {}, post: {} })
    }
  }

  const uids = [...byUid.keys()]
  const testIds = [experiment.preTestId, experiment.postTestId].filter(Boolean) as string[]

  if (testIds.length && uids.length) {
    const attemptSnaps = await Promise.all(
      chunk(uids, 30).map((ids) =>
        db.collection(COL.testAttempts).where('uid', 'in', ids).where('testId', 'in', testIds).get()
      )
    )

    for (const snap of attemptSnaps) {
      for (const doc of snap.docs) {
        const attempt = doc.data() as TestAttemptDoc
        const participant = byUid.get(attempt.uid)
        if (!participant) continue
        const slot =
          attempt.testId === experiment.preTestId
            ? 'pre'
            : attempt.testId === experiment.postTestId
              ? 'post'
              : null
        if (!slot) continue
        for (const [skill, section] of Object.entries(attempt.sectionScores ?? {}) as Array<
          [Skill, { score: number; max: number; percent: number }]
        >) {
          participant[slot][skill] =
            section.percent ?? (section.max ? (section.score / section.max) * 100 : 0)
        }
        if (slot === 'pre') participant.preTotal = attempt.percent
        else participant.postTotal = attempt.percent
      }
    }
  }

  const all = [...byUid.values()]
  const experimental = all.filter((p) => p.group === 'experimental')
  const control = all.filter((p) => p.group === 'control')

  const measured: Array<Skill | 'total'> = [...SKILLS, 'total']
  const skills: GroupSkillComparison[] = []

  for (const skill of measured) {
    const pick = (p: ParticipantScores, slot: 'pre' | 'post'): number | undefined =>
      skill === 'total' ? (slot === 'pre' ? p.preTotal : p.postTotal) : p[slot][skill]

    const side = (list: ParticipantScores[]) => {
      const pre: number[] = []
      const post: number[] = []
      const gains: number[] = []
      for (const participant of list) {
        const preValue = pick(participant, 'pre')
        const postValue = pick(participant, 'post')
        if (typeof preValue === 'number') pre.push(preValue)
        if (typeof postValue === 'number') post.push(postValue)
        if (typeof preValue === 'number' && typeof postValue === 'number') {
          gains.push(gain(preValue, postValue))
        }
      }
      return { pre: describe(pre), post: describe(post), gain: describe(gains), gains }
    }

    const expSide = side(experimental)
    const ctrlSide = side(control)

    // Ma'lumot umuman bo'lmasa — bu ko'nikmani hisobotga kiritmaymiz
    if (!expSide.pre.n && !ctrlSide.pre.n && !expSide.post.n && !ctrlSide.post.n) continue

    skills.push({
      skill,
      experimental: { pre: expSide.pre, post: expSide.post, gain: expSide.gain },
      control: { pre: ctrlSide.pre, post: ctrlSide.post, gain: ctrlSide.gain },
      gainTest: independentTTest(ctrlSide.gains, expSide.gains),
    })
  }

  const complete = (list: ParticipantScores[]) =>
    list.filter((p) => p.preTotal !== undefined && p.postTotal !== undefined).length

  return {
    experimentId,
    title: experiment.title,
    preTestId: experiment.preTestId,
    postTestId: experiment.postTestId,
    participants: { experimental: experimental.length, control: control.length },
    completePairs: { experimental: complete(experimental), control: complete(control) },
    skills,
  }
}

/* ------------------------------------------------------------------ */
/* 5. Progress prediction (haftalik cron)                              */
/* ------------------------------------------------------------------ */

/**
 * Oddiy chiziqli trend bo'yicha post-test prognozi va risk darajasi
 * (PLAN 6-bo'lim oxiri: "AI Progress Prediction").
 *
 * METOD (`method: 'linear_trend'`):
 *   • Oxirgi 28 kunning kunlik ko'nikma ballari (`statsDaily.skillScores`)
 *     bo'yicha eng kichik kvadratlar to'g'ri chizig'i quriladi: y = m·x + b;
 *   • 30 kun oldinga ekstrapolyatsiya qilinadi va 0–100 ga qisiladi;
 *   • Risk darajasi PEDAGOGIK qoidalar bilan aniqlanadi (model emas):
 *       high   — 7 kundan ortiq faoliyatsizlik YOKI trend sezilarli pasaygan
 *                YOKI prognoz < 50;
 *       medium — faollik past (< 30% kun) yoki trend deyarli nol va ball past;
 *       low    — qolgan hollarda.
 *
 * Bu prognoz — o'qituvchi uchun OGOHLANTIRISH, baho emas. Claude keyinchalik
 * shu raqamlar asosida qisqa izoh yozadi (`progressNarrative`).
 */
export async function predictProgress(uid: string, days = 28): Promise<PredictionDoc> {
  const series = await getUserProgressSeries(uid, days)

  const predictedPostScores: Partial<Record<Skill, number>> = {}
  const slopes: number[] = []

  for (const [skill, values] of Object.entries(series.skills) as Array<[Skill, number[]]>) {
    const points: Array<[number, number]> = values
      .map((value, index) => [index, value] as [number, number])
      .filter(([, value]) => value > 0)

    if (points.length < 3) {
      const last = values[values.length - 1] ?? 0
      if (last > 0) predictedPostScores[skill] = Math.round(last)
      continue
    }

    const { m, b } = linearRegression(points)
    slopes.push(m)
    const horizon = values.length - 1 + 30
    predictedPostScores[skill] = Math.round(Math.min(100, Math.max(0, m * horizon + b)))
  }

  const predictedValues = Object.values(predictedPostScores).filter(
    (value): value is number => typeof value === 'number'
  )
  const predictedTotal = predictedValues.length ? Math.round(mean(predictedValues)) : 0

  // Faoliyatsizlik: oxirgi necha kun ketma-ket bo'sh
  let inactiveDays = 0
  for (let i = series.attempts.length - 1; i >= 0; i -= 1) {
    if ((series.attempts[i] ?? 0) === 0 && (series.timeOnTaskMin[i] ?? 0) === 0) inactiveDays += 1
    else break
  }

  const avgSlope = slopes.length ? mean(slopes) : 0
  const activeRatio = series.dates.length ? series.activeDays / series.dates.length : 0

  let riskLevel: PredictionDoc['riskLevel'] = 'low'
  const notes: string[] = []

  if (inactiveDays >= 7) {
    riskLevel = 'high'
    notes.push(`${inactiveDays} kundan beri faol emas`)
  } else if (avgSlope < -0.2) {
    riskLevel = 'high'
    notes.push('ko‘nikma ballari pasayish trendida')
  } else if (predictedTotal > 0 && predictedTotal < 50) {
    riskLevel = 'high'
    notes.push(`prognoz post-test bali past (${predictedTotal})`)
  } else if (activeRatio < 0.3) {
    riskLevel = 'medium'
    notes.push(`faollik past (${Math.round(activeRatio * 100)}% kun)`)
  } else if (Math.abs(avgSlope) < 0.05 && predictedTotal < 65) {
    riskLevel = 'medium'
    notes.push('o‘sish deyarli to‘xtagan')
  } else {
    notes.push('barqaror o‘sish')
  }

  const prediction: PredictionDoc = {
    uid,
    predictedPostScores,
    predictedTotal,
    riskLevel,
    note: notes.join('; '),
    method: 'linear_trend',
    generatedAt: Date.now(),
  }

  await adminDb().collection(COL.predictions).doc(uid).set(prediction, { merge: true })
  return prediction
}

/* ------------------------------------------------------------------ */
/* Yordamchi                                                           */
/* ------------------------------------------------------------------ */

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
