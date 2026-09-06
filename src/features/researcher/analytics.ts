import 'server-only'

import {
  ERROR_TAGS,
  SKILLS,
  type ErrorTag,
  type ExperimentGroup,
  type Skill,
} from '@/config/constants'
import {
  cohensD,
  describe,
  gain,
  independentTTest,
  mannWhitneyU,
  mean,
  pairedTTest,
  pearson,
  sd,
  type CorrelationResult,
  type Describe,
  type MannWhitneyResult,
  type TTestResult,
} from '@/lib/analytics/stats'
import { toMillis } from '@/lib/utils/format'
import type { ExperimentDoc, StatsDailyDoc, SurveyResponseDoc, TestAttemptDoc } from '@/types'

import {
  MIN_ACTIVITY,
  getExperiment,
  isIncluded,
  listAllSurveyResponses,
  listAllGroups,
  listErrorProfiles,
  listStatsDaily,
  listStatsGroupDaily,
  listStudentsRaw,
  listTestAttempts,
  type Doc,
} from './queries'

/**
 * Eksperiment tahlili (PLAN.md 8.18, 9.2).
 *
 * Bu modul ishtirokchi darajasidagi YAGONA jadval quradi (`ParticipantRecord`)
 * va barcha grafik/statistika shundan hisoblanadi — shu tufayli ekrandagi
 * raqamlar bilan eksport fayllardagi raqamlar bir xil manbadan keladi.
 *
 * MUHIM: `uid` faqat `InternalRecord` ichida, server xotirasida bo'ladi.
 * Klientga uzatiladigan har qanday tuzilma `participantCode` bilan ishlaydi.
 */

/* ------------------------------------------------------------------ */
/* Filtrlar                                                            */
/* ------------------------------------------------------------------ */

export interface AnalyticsFilters {
  cohortId?: string
  groupId?: string
  /** `YYYY-MM-DD` — faollik statistikasi shu oraliqdan olinadi */
  from?: string
  to?: string
  /** Kam faol ishtirokchilarni tahlildan chiqarish */
  excludeLowActivity?: boolean
}

export interface SurveyScores {
  motivationPre?: number
  motivationPost?: number
  aiLiteracyPre?: number
  aiLiteracyPost?: number
  satisfaction?: number
}

export interface ParticipantRecord {
  participantCode: string
  expGroup: ExperimentGroup
  groupId: string | null
  groupName: string
  cohortId: string | null
  pre: Partial<Record<Skill, number>>
  post: Partial<Record<Skill, number>>
  preTotal: number | null
  postTotal: number | null
  gainTotal: number | null
  timeOnTaskMin: number
  attempts: number
  correct: number
  correctRate: number
  aiMessages: number
  aiTokens: number
  wordsLearned: number
  lessonsDone: number
  speakingSubmissions: number
  writingSubmissions: number
  activeDays: number
  xp: number
  lowActivity: boolean
  errorCounts: Partial<Record<ErrorTag, number>>
  surveys: SurveyScores
}

/** Server ichidagi ko'rinish — `uid` bilan (eksportda join uchun). */
export interface InternalRecord extends ParticipantRecord {
  uid: string
}

export interface AnalyticsSource {
  experiment: Doc<ExperimentDoc> | null
  records: InternalRecord[]
  /** Filtrlashdan oldingi umumiy ishtirokchi soni */
  totalParticipants: number
  excludedLowActivity: number
  excludedNoConsent: number
  from: string | null
  to: string | null
}

/* ------------------------------------------------------------------ */
/* Manba yig'ish                                                       */
/* ------------------------------------------------------------------ */

function sectionPercent(section: { score: number; max: number; percent: number }): number {
  if (typeof section.percent === 'number' && Number.isFinite(section.percent)) return section.percent
  return section.max ? (section.score / section.max) * 100 : 0
}

/** So'rovnoma javobi eksperiment o'rtasidan oldin bo'lsa — "pre", keyin — "post". */
function surveyPhase(response: SurveyResponseDoc, midpoint: number | null): 'pre' | 'post' {
  if (!midpoint) return 'pre'
  return toMillis(response.ts) <= midpoint ? 'pre' : 'post'
}

/**
 * Likert javoblaridan umumiy ball. `scoreTotal` bo'lsa o'shani oladi,
 * aks holda raqamli javoblarning o'rtachasini hisoblaydi (1–5 shkala).
 */
function surveyScore(response: SurveyResponseDoc): number | null {
  if (typeof response.scoreTotal === 'number' && Number.isFinite(response.scoreTotal)) {
    return response.scoreTotal
  }
  const values = Object.values(response.answers ?? {}).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  )
  if (!values.length) return null
  return Math.round(mean(values) * 100) / 100
}

/**
 * Barcha manbalarni birlashtirib ishtirokchi jadvalini quradi.
 * Rozilik bermagan yoki tadqiqotdan chiqqan talabalar HECH QACHON kirmaydi.
 */
export async function collectParticipantData(
  filters: AnalyticsFilters = {}
): Promise<AnalyticsSource> {
  const [experiment, students, groups, statsDaily, surveyResponses, errorProfiles] =
    await Promise.all([
      getExperiment(),
      listStudentsRaw(),
      listAllGroups(),
      listStatsDaily(filters.from, filters.to),
      listAllSurveyResponses(),
      listErrorProfiles(),
    ])

  const groupById = new Map(groups.map((g) => [g.id, g]))
  const excludedNoConsent = students.filter((s) => !isIncluded(s)).length

  let eligible = students.filter(isIncluded)
  if (filters.cohortId) eligible = eligible.filter((s) => s.cohortId === filters.cohortId)
  if (filters.groupId) eligible = eligible.filter((s) => s.groupId === filters.groupId)

  // Guruh turi: users.expGroup, bo'lmasa guruh hujjatidan
  const groupTypeOf = (groupId?: string | null): ExperimentGroup | null => {
    if (!groupId) return null
    return groupById.get(groupId)?.type ?? null
  }

  const preTestId = experiment?.preTestId
  const postTestId = experiment?.postTestId

  const [preAttempts, postAttempts] = await Promise.all([
    preTestId ? listTestAttempts(preTestId) : Promise.resolve([] as Doc<TestAttemptDoc>[]),
    postTestId ? listTestAttempts(postTestId) : Promise.resolve([] as Doc<TestAttemptDoc>[]),
  ])

  const bestAttempt = (attempts: Doc<TestAttemptDoc>[]) => {
    const byUid = new Map<string, Doc<TestAttemptDoc>>()
    for (const attempt of attempts) {
      if (attempt.status === 'in_progress') continue
      const existing = byUid.get(attempt.uid)
      if (!existing || toMillis(attempt.finishedAt) > toMillis(existing.finishedAt)) {
        byUid.set(attempt.uid, attempt)
      }
    }
    return byUid
  }

  const preByUid = bestAttempt(preAttempts)
  const postByUid = bestAttempt(postAttempts)

  // Kunlik statistika — uid bo'yicha jamlanma
  const statsByUid = new Map<string, Doc<StatsDailyDoc>[]>()
  for (const row of statsDaily) {
    const list = statsByUid.get(row.uid) ?? []
    list.push(row)
    statsByUid.set(row.uid, list)
  }

  // So'rovnomalar
  const midpoint = experiment?.timeline?.midpoint ? toMillis(experiment.timeline.midpoint) : null
  const surveysByUid = new Map<string, Doc<SurveyResponseDoc>[]>()
  for (const response of surveyResponses) {
    const list = surveysByUid.get(response.uid) ?? []
    list.push(response)
    surveysByUid.set(response.uid, list)
  }

  const errorsByUid = new Map(errorProfiles.map((p) => [p.uid ?? p.id, p]))

  const records: InternalRecord[] = []
  let excludedLowActivity = 0

  for (const student of eligible) {
    const expGroup = student.expGroup ?? groupTypeOf(student.groupId)
    if (!expGroup) continue

    const days = statsByUid.get(student.id) ?? []
    const sum = (key: keyof StatsDailyDoc): number =>
      days.reduce((total, day) => total + (Number(day[key]) || 0), 0)

    const attempts = sum('attempts')
    const correct = sum('correct')
    const timeOnTaskMin = Math.round(sum('timeOnTaskMin'))
    const activeDays = days.filter((d) => (d.attempts ?? 0) > 0 || (d.timeOnTaskMin ?? 0) > 0).length

    const lowActivity =
      timeOnTaskMin < MIN_ACTIVITY.minutes ||
      attempts < MIN_ACTIVITY.attempts ||
      activeDays < MIN_ACTIVITY.activeDays

    if (lowActivity && filters.excludeLowActivity) {
      excludedLowActivity += 1
      continue
    }

    const preAttempt = preByUid.get(student.id)
    const postAttempt = postByUid.get(student.id)

    const pre: Partial<Record<Skill, number>> = {}
    const post: Partial<Record<Skill, number>> = {}
    for (const [skill, section] of Object.entries(preAttempt?.sectionScores ?? {}) as Array<
      [Skill, { score: number; max: number; percent: number }]
    >) {
      pre[skill] = Math.round(sectionPercent(section) * 100) / 100
    }
    for (const [skill, section] of Object.entries(postAttempt?.sectionScores ?? {}) as Array<
      [Skill, { score: number; max: number; percent: number }]
    >) {
      post[skill] = Math.round(sectionPercent(section) * 100) / 100
    }

    const preTotal = preAttempt ? Math.round(preAttempt.percent * 100) / 100 : null
    const postTotal = postAttempt ? Math.round(postAttempt.percent * 100) / 100 : null

    // So'rovnoma ballari
    const surveys: SurveyScores = {}
    for (const response of surveysByUid.get(student.id) ?? []) {
      const score = surveyScore(response)
      if (score === null) continue
      const phase = surveyPhase(response, midpoint)
      if (response.surveyType === 'motivation') {
        if (phase === 'pre') surveys.motivationPre = score
        else surveys.motivationPost = score
      } else if (response.surveyType === 'ai_literacy') {
        if (phase === 'pre') surveys.aiLiteracyPre = score
        else surveys.aiLiteracyPost = score
      } else if (response.surveyType === 'satisfaction') {
        surveys.satisfaction = score
      }
    }

    const errorProfile = errorsByUid.get(student.id)

    records.push({
      uid: student.id,
      participantCode: student.participantCode ?? `NOCODE-${student.id.slice(0, 6)}`,
      expGroup,
      groupId: student.groupId ?? null,
      groupName: student.groupId ? (groupById.get(student.groupId)?.name ?? '—') : '—',
      cohortId: student.cohortId ?? null,
      pre,
      post,
      preTotal,
      postTotal,
      gainTotal: preTotal !== null && postTotal !== null ? gain(preTotal, postTotal) : null,
      timeOnTaskMin,
      attempts,
      correct,
      correctRate: attempts ? Math.round((correct / attempts) * 1000) / 1000 : 0,
      aiMessages: sum('aiMessages'),
      aiTokens: sum('aiTokens'),
      wordsLearned: sum('wordsLearned'),
      lessonsDone: sum('lessonsDone'),
      speakingSubmissions: sum('speakingSubmissions'),
      writingSubmissions: sum('writingSubmissions'),
      activeDays,
      xp: sum('xp'),
      lowActivity,
      errorCounts: errorProfile?.counts ?? {},
      surveys,
    })
  }

  records.sort((a, b) => a.participantCode.localeCompare(b.participantCode))

  return {
    experiment,
    records,
    totalParticipants: students.length,
    excludedLowActivity,
    excludedNoConsent,
    from: filters.from ?? null,
    to: filters.to ?? null,
  }
}

/** Klientga uzatish uchun — `uid` olib tashlanadi (anonimlik qoidasi). */
export function anonymise(records: InternalRecord[]): ParticipantRecord[] {
  return records.map(({ uid: _uid, ...rest }) => rest)
}

/* ------------------------------------------------------------------ */
/* Statistik hisob                                                     */
/* ------------------------------------------------------------------ */

export interface GroupSide {
  n: number
  pre: Describe
  post: Describe
  gain: Describe
  /** Pre → post bog'liq (paired) t-test — guruh ichidagi o'sish */
  paired: TTestResult
}

export interface SkillAnalysis {
  skill: Skill | 'total'
  label: string
  experimental: GroupSide
  control: GroupSide
  /** Gain bo'yicha guruhlararo Welch t-testi — asosiy gipoteza sinovi */
  welch: TTestResult
  /** Noparametrik tekshiruv */
  mwu: MannWhitneyResult
  /** Gain bo'yicha effekt hajmi */
  d: number
}

export interface CorrelationRow {
  label: string
  xLabel: string
  yLabel: string
  overall: CorrelationResult
  experimental: CorrelationResult
  control: CorrelationResult
}

export interface HistogramBin {
  bin: string
  experimental: number
  control: number
}

export interface ErrorTagRow {
  tag: ErrorTag
  label: string
  experimental: number
  control: number
  /** Ishtirokchi boshiga o'rtacha xato soni */
  experimentalPer: number
  controlPer: number
}

export interface SurveyAnalysis {
  key: 'motivation' | 'aiLiteracy'
  label: string
  experimental: { pre: Describe; post: Describe; paired: TTestResult }
  control: { pre: Describe; post: Describe; paired: TTestResult }
  welch: TTestResult
}

export interface TimelinePoint {
  date: string
  experimental: number | null
  control: number | null
}

export interface AnalyticsResult {
  n: { experimental: number; control: number; total: number }
  completePairs: { experimental: number; control: number }
  skills: SkillAnalysis[]
  gainHistogram: HistogramBin[]
  correlations: CorrelationRow[]
  errorTags: ErrorTagRow[]
  surveys: SurveyAnalysis[]
  timelineCorrectRate: TimelinePoint[]
  timelineTime: TimelinePoint[]
  lowActivityCount: number
}

const SKILL_LABELS_UZ: Record<Skill | 'total', string> = {
  vocabulary: 'Lug‘at',
  grammar: 'Grammatika',
  pronunciation: 'Talaffuz',
  listening: 'Tinglash',
  reading: 'O‘qish',
  writing: 'Yozish',
  speaking: 'Gapirish',
  professional: 'Kasbiy ingliz tili',
  total: 'UMUMIY BALL',
}

const ERROR_TAG_UZ: Partial<Record<ErrorTag, string>> = {
  tense: 'Zamon',
  aspect: 'Aspekt',
  passive_voice: 'Majhul nisbat',
  modal_verbs: 'Modal fe’llar',
  conditionals: 'Shart gaplar',
  reported_speech: 'O‘zlashtirma gap',
  articles: 'Artikllar',
  prepositions: 'Predloglar',
  word_order: 'So‘z tartibi',
  agreement: 'Moslashuv',
  comparatives: 'Qiyoslash',
  linking_devices: 'Bog‘lovchilar',
  wrong_word: 'Noto‘g‘ri so‘z',
  collocation: 'Kollokatsiya',
  word_formation: 'So‘z yasalishi',
  register: 'Uslub',
  terminology: 'Terminologiya',
  false_friend: 'Soxta do‘st',
  coherence: 'Izchillik',
  task_achievement: 'Topshiriqni bajarish',
  spelling: 'Imlo',
  punctuation: 'Tinish belgilari',
  phoneme: 'Tovush',
  word_stress: 'So‘z urg‘usi',
  sentence_stress: 'Gap urg‘usi',
  intonation: 'Intonatsiya',
  fluency: 'Ravonlik',
}

export function errorTagLabel(tag: ErrorTag): string {
  return ERROR_TAG_UZ[tag] ?? tag
}

export function skillLabel(skill: Skill | 'total'): string {
  return SKILL_LABELS_UZ[skill]
}

function pick(record: ParticipantRecord, skill: Skill | 'total', slot: 'pre' | 'post') {
  if (skill === 'total') return slot === 'pre' ? record.preTotal : record.postTotal
  const value = slot === 'pre' ? record.pre[skill] : record.post[skill]
  return typeof value === 'number' ? value : null
}

function sideOf(records: ParticipantRecord[], skill: Skill | 'total'): GroupSide & {
  pairedPre: number[]
  pairedPost: number[]
  gains: number[]
} {
  const pre: number[] = []
  const post: number[] = []
  const pairedPre: number[] = []
  const pairedPost: number[] = []
  const gains: number[] = []

  for (const record of records) {
    const preValue = pick(record, skill, 'pre')
    const postValue = pick(record, skill, 'post')
    if (preValue !== null) pre.push(preValue)
    if (postValue !== null) post.push(postValue)
    if (preValue !== null && postValue !== null) {
      pairedPre.push(preValue)
      pairedPost.push(postValue)
      gains.push(gain(preValue, postValue))
    }
  }

  return {
    n: records.length,
    pre: describe(pre),
    post: describe(post),
    gain: describe(gains),
    paired: pairedTTest(pairedPre, pairedPost),
    pairedPre,
    pairedPost,
    gains,
  }
}

/** Gain taqsimoti uchun gistogramma bo'linmalari. */
function histogram(experimental: number[], control: number[]): HistogramBin[] {
  const all = [...experimental, ...control]
  if (!all.length) return []
  const min = Math.floor(Math.min(...all) / 5) * 5
  const max = Math.ceil(Math.max(...all) / 5) * 5
  const step = Math.max(5, Math.ceil((max - min) / 8 / 5) * 5)
  const bins: HistogramBin[] = []
  for (let start = min; start < max || start === min; start += step) {
    const end = start + step
    bins.push({
      bin: `${start}…${end}`,
      experimental: experimental.filter((v) => v >= start && v < end).length,
      control: control.filter((v) => v >= start && v < end).length,
    })
    if (bins.length > 20) break
  }
  return bins
}

export function computeAnalytics(
  records: ParticipantRecord[],
  groupDaily: Array<{ date: string; groupId: string; avgCorrectRate: number; avgTimeOnTaskMin: number }>,
  groupTypeById: Record<string, ExperimentGroup>
): AnalyticsResult {
  const experimental = records.filter((r) => r.expGroup === 'experimental')
  const control = records.filter((r) => r.expGroup === 'control')

  const skills: SkillAnalysis[] = []
  for (const skill of [...SKILLS, 'total'] as Array<Skill | 'total'>) {
    const expSide = sideOf(experimental, skill)
    const ctrlSide = sideOf(control, skill)
    if (!expSide.pre.n && !ctrlSide.pre.n && !expSide.post.n && !ctrlSide.post.n) continue

    skills.push({
      skill,
      label: skillLabel(skill),
      experimental: {
        n: expSide.n,
        pre: expSide.pre,
        post: expSide.post,
        gain: expSide.gain,
        paired: expSide.paired,
      },
      control: {
        n: ctrlSide.n,
        pre: ctrlSide.pre,
        post: ctrlSide.post,
        gain: ctrlSide.gain,
        paired: ctrlSide.paired,
      },
      welch: independentTTest(ctrlSide.gains, expSide.gains),
      mwu: mannWhitneyU(ctrlSide.gains, expSide.gains),
      d: cohensD(ctrlSide.gains, expSide.gains),
    })
  }

  const expGains = experimental
    .map((r) => r.gainTotal)
    .filter((v): v is number => typeof v === 'number')
  const ctrlGains = control.map((r) => r.gainTotal).filter((v): v is number => typeof v === 'number')

  // Korrelyatsiyalar — faqat pre VA post ikkalasi bor ishtirokchilar bo'yicha
  const withGain = (list: ParticipantRecord[]) =>
    list.filter((r) => typeof r.gainTotal === 'number')

  const correlationOf = (
    list: ParticipantRecord[],
    xOf: (r: ParticipantRecord) => number
  ): CorrelationResult => {
    const usable = withGain(list)
    return pearson(usable.map(xOf), usable.map((r) => r.gainTotal as number))
  }

  const correlations: CorrelationRow[] = [
    {
      label: 'AI bilan muloqot hajmi ↔ o‘sish',
      xLabel: 'AI xabarlari soni',
      yLabel: 'Gain (post − pre)',
      overall: correlationOf(records, (r) => r.aiMessages),
      experimental: correlationOf(experimental, (r) => r.aiMessages),
      control: correlationOf(control, (r) => r.aiMessages),
    },
    {
      label: 'Platformada sarflangan vaqt ↔ o‘sish',
      xLabel: 'Vaqt (daqiqa)',
      yLabel: 'Gain (post − pre)',
      overall: correlationOf(records, (r) => r.timeOnTaskMin),
      experimental: correlationOf(experimental, (r) => r.timeOnTaskMin),
      control: correlationOf(control, (r) => r.timeOnTaskMin),
    },
    {
      label: 'Bajarilgan mashqlar soni ↔ o‘sish',
      xLabel: 'Mashqlar soni',
      yLabel: 'Gain (post − pre)',
      overall: correlationOf(records, (r) => r.attempts),
      experimental: correlationOf(experimental, (r) => r.attempts),
      control: correlationOf(control, (r) => r.attempts),
    },
  ]

  // Xatolar taksonomiyasi
  const errorTags: ErrorTagRow[] = ERROR_TAGS.map((tag) => {
    const expCount = experimental.reduce((sum, r) => sum + (r.errorCounts[tag] ?? 0), 0)
    const ctrlCount = control.reduce((sum, r) => sum + (r.errorCounts[tag] ?? 0), 0)
    return {
      tag,
      label: errorTagLabel(tag),
      experimental: expCount,
      control: ctrlCount,
      experimentalPer: experimental.length
        ? Math.round((expCount / experimental.length) * 100) / 100
        : 0,
      controlPer: control.length ? Math.round((ctrlCount / control.length) * 100) / 100 : 0,
    }
  })
    .filter((row) => row.experimental > 0 || row.control > 0)
    .sort((a, b) => b.experimental + b.control - (a.experimental + a.control))
    .slice(0, 12)

  // So'rovnomalar
  const surveyAnalysis = (
    key: 'motivation' | 'aiLiteracy',
    label: string,
    preKey: keyof SurveyScores,
    postKey: keyof SurveyScores
  ): SurveyAnalysis => {
    const side = (list: ParticipantRecord[]) => {
      const pre: number[] = []
      const post: number[] = []
      const pairedPre: number[] = []
      const pairedPost: number[] = []
      for (const record of list) {
        const preValue = record.surveys[preKey]
        const postValue = record.surveys[postKey]
        if (typeof preValue === 'number') pre.push(preValue)
        if (typeof postValue === 'number') post.push(postValue)
        if (typeof preValue === 'number' && typeof postValue === 'number') {
          pairedPre.push(preValue)
          pairedPost.push(postValue)
        }
      }
      return {
        pre: describe(pre),
        post: describe(post),
        paired: pairedTTest(pairedPre, pairedPost),
        gains: pairedPre.map((value, index) => pairedPost[index] - value),
      }
    }
    const expSide = side(experimental)
    const ctrlSide = side(control)
    return {
      key,
      label,
      experimental: { pre: expSide.pre, post: expSide.post, paired: expSide.paired },
      control: { pre: ctrlSide.pre, post: ctrlSide.post, paired: ctrlSide.paired },
      welch: independentTTest(ctrlSide.gains, expSide.gains),
    }
  }

  const surveys: SurveyAnalysis[] = [
    surveyAnalysis('motivation', 'Motivatsiya', 'motivationPre', 'motivationPost'),
    surveyAnalysis('aiLiteracy', 'AI savodxonligi', 'aiLiteracyPre', 'aiLiteracyPost'),
  ].filter((row) => row.experimental.pre.n || row.control.pre.n || row.experimental.post.n)

  // Vaqt bo'yicha dinamika (statsGroupDaily)
  const dates = [...new Set(groupDaily.map((row) => row.date))].sort()
  const timelineFor = (field: 'avgCorrectRate' | 'avgTimeOnTaskMin'): TimelinePoint[] =>
    dates.map((date) => {
      const rows = groupDaily.filter((row) => row.date === date)
      const forType = (type: ExperimentGroup) => {
        const values = rows
          .filter((row) => groupTypeById[row.groupId] === type)
          .map((row) => Number(row[field]) || 0)
        if (!values.length) return null
        const value = mean(values)
        return Math.round((field === 'avgCorrectRate' ? value * 100 : value) * 10) / 10
      }
      return { date: date.slice(5), experimental: forType('experimental'), control: forType('control') }
    })

  return {
    n: { experimental: experimental.length, control: control.length, total: records.length },
    completePairs: { experimental: expGains.length, control: ctrlGains.length },
    skills,
    gainHistogram: histogram(expGains, ctrlGains),
    correlations,
    errorTags,
    surveys,
    timelineCorrectRate: timelineFor('avgCorrectRate'),
    timelineTime: timelineFor('avgTimeOnTaskMin'),
    lowActivityCount: records.filter((r) => r.lowActivity).length,
  }
}

/** Analitika sahifasi uchun to'liq to'plam. */
export async function getAnalytics(filters: AnalyticsFilters = {}): Promise<{
  source: Omit<AnalyticsSource, 'records'>
  records: ParticipantRecord[]
  result: AnalyticsResult
}> {
  const source = await collectParticipantData(filters)
  const [groups, groupDaily] = await Promise.all([
    listAllGroups(),
    listStatsGroupDaily(filters.from, filters.to),
  ])

  const groupTypeById: Record<string, ExperimentGroup> = {}
  for (const group of groups) groupTypeById[group.id] = group.type

  const records = anonymise(source.records)
  const result = computeAnalytics(
    records,
    groupDaily.map((row) => ({
      date: row.date,
      groupId: row.groupId,
      avgCorrectRate: row.avgCorrectRate ?? 0,
      avgTimeOnTaskMin: row.avgTimeOnTaskMin ?? 0,
    })),
    groupTypeById
  )

  const { records: _records, ...rest } = source
  return { source: rest, records, result }
}

export { describe, mean, sd }
