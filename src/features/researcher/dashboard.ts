import 'server-only'

import type { ExperimentGroup } from '@/config/constants'
import { mean } from '@/lib/analytics/stats'
import { toMillis } from '@/lib/utils/format'
import type { ExperimentDoc } from '@/types'

import { collectParticipantData, type ParticipantRecord } from './analytics'
import { MIN_ACTIVITY, listAllGroups, listStudentsRaw } from './queries'

/**
 * Tadqiqotchi bosh sahifasi uchun jamlanma (PLAN.md 8.18: monitoring).
 * "Ma'lumot sifati" paneli — dissertatsiya uchun kritik: qaysi ishtirokchi
 * tahlilga kiritish mezonlaridan o'tmayotganini oldindan ko'rsatadi.
 */

export interface QualityIssue {
  participantCode: string
  expGroup: ExperimentGroup
  groupName: string
  timeOnTaskMin: number
  attempts: number
  activeDays: number
  hasPre: boolean
  hasPost: boolean
  reasons: string[]
}

export interface ChecklistItem {
  key: string
  label: string
  done: boolean
  hint: string
}

export interface DashboardSummary {
  experiment: {
    id: string
    title: string
    status: ExperimentDoc['status']
    start: string | null
    end: string | null
    daysTotal: number
    daysElapsed: number
    daysRemaining: number
    progressPercent: number
  } | null
  participants: {
    total: number
    experimental: number
    control: number
    consented: number
    consentRate: number
    withdrawn: number
    withoutCode: number
    withoutGroup: number
  }
  preTest: { done: number; total: number; percent: number; configured: boolean }
  postTest: { done: number; total: number; percent: number; configured: boolean }
  activity: {
    avgMinutes: number
    avgAttempts: number
    avgActiveDays: number
    avgAiMessages: number
  }
  quality: {
    issues: QualityIssue[]
    missingPre: number
    missingPost: number
    lowActivity: number
    analysable: number
  }
  checklist: ChecklistItem[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [source, students] = await Promise.all([collectParticipantData({}), listStudentsRaw()])
  await listAllGroups()

  const records = source.records
  const experiment = source.experiment

  const consented = students.filter((s) => s.consentGiven === true).length
  const withdrawn = students.filter((s) => s.researchWithdrawn === true).length
  const withoutCode = students.filter((s) => !s.participantCode).length
  const withoutGroup = students.filter((s) => !s.groupId).length

  const now = Date.now()
  const start = experiment?.timeline?.start ? toMillis(experiment.timeline.start) : null
  const end = experiment?.timeline?.end ? toMillis(experiment.timeline.end) : null
  const day = 24 * 60 * 60 * 1000
  const daysTotal = start && end ? Math.max(1, Math.round((end - start) / day)) : 0
  const daysElapsed = start ? Math.max(0, Math.round((now - start) / day)) : 0
  const daysRemaining = end ? Math.max(0, Math.round((end - now) / day)) : 0

  const hasPre = records.filter((record) => record.preTotal !== null).length
  const hasPost = records.filter((record) => record.postTotal !== null).length
  const total = records.length

  const avg = (pick: (record: ParticipantRecord) => number) =>
    total ? Math.round(mean(records.map(pick))) : 0

  const issues: QualityIssue[] = records
    .map((record) => {
      const reasons: string[] = []
      if (record.timeOnTaskMin < MIN_ACTIVITY.minutes) {
        reasons.push(`vaqt ${record.timeOnTaskMin} < ${MIN_ACTIVITY.minutes} daq`)
      }
      if (record.attempts < MIN_ACTIVITY.attempts) {
        reasons.push(`mashqlar ${record.attempts} < ${MIN_ACTIVITY.attempts}`)
      }
      if (record.activeDays < MIN_ACTIVITY.activeDays) {
        reasons.push(`faol kunlar ${record.activeDays} < ${MIN_ACTIVITY.activeDays}`)
      }
      if (record.preTotal === null) reasons.push('pre-test topshirmagan')
      if (record.postTotal === null && experiment?.status === 'finished') {
        reasons.push('post-test topshirmagan')
      }
      return {
        participantCode: record.participantCode,
        expGroup: record.expGroup,
        groupName: record.groupName,
        timeOnTaskMin: record.timeOnTaskMin,
        attempts: record.attempts,
        activeDays: record.activeDays,
        hasPre: record.preTotal !== null,
        hasPost: record.postTotal !== null,
        reasons,
      }
    })
    .filter((issue) => issue.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length)

  const checklist: ChecklistItem[] = [
    {
      key: 'experiment',
      label: 'Eksperiment yaratilgan',
      done: Boolean(experiment),
      hint: 'Nom, gipoteza va dizaynni kiriting.',
    },
    {
      key: 'hypothesis',
      label: 'Gipoteza va dizayn yozilgan',
      done: Boolean(experiment?.hypothesis && experiment?.design),
      hint: 'Dissertatsiya metodologiyasi uchun majburiy.',
    },
    {
      key: 'groups',
      label: 'Eksperimental va nazorat guruhlari belgilangan',
      done: Boolean(
        experiment?.groupIds?.experimental?.length && experiment?.groupIds?.control?.length
      ),
      hint: 'Kamida bittadan guruh tanlanishi kerak.',
    },
    {
      key: 'pre',
      label: 'Pre-test biriktirilgan',
      done: Boolean(experiment?.preTestId),
      hint: 'Boshlang‘ich kesim testini tanlang.',
    },
    {
      key: 'post',
      label: 'Post-test biriktirilgan',
      done: Boolean(experiment?.postTestId),
      hint: 'Yakuniy kesim testini tanlang.',
    },
    {
      key: 'surveys',
      label: 'So‘rovnomalar biriktirilgan',
      done: Boolean(experiment?.surveyIds?.length),
      hint: 'Motivatsiya va AI savodxonligi so‘rovnomalari.',
    },
    {
      key: 'timeline',
      label: 'Muddatlar belgilangan',
      done: Boolean(start && end),
      hint: 'Boshlanish, oraliq kesim va tugash sanalari.',
    },
    {
      key: 'codes',
      label: 'Barcha talabalarda ishtirokchi kodi bor',
      done: withoutCode === 0 && students.length > 0,
      hint: 'Anonimlik sharti — kodsiz talaba eksportga kirmaydi.',
    },
    {
      key: 'consent',
      label: 'Rozilik darajasi 80% dan yuqori',
      done: students.length > 0 && consented / students.length >= 0.8,
      hint: 'Rozilik bermagan talabaning ma’lumoti tahlilga kirmaydi.',
    },
  ]

  return {
    experiment: experiment
      ? {
          id: experiment.id,
          title: experiment.title,
          status: experiment.status,
          start: start ? new Date(start).toISOString() : null,
          end: end ? new Date(end).toISOString() : null,
          daysTotal,
          daysElapsed: daysTotal ? Math.min(daysElapsed, daysTotal) : daysElapsed,
          daysRemaining,
          progressPercent: daysTotal
            ? Math.min(100, Math.round((daysElapsed / daysTotal) * 100))
            : 0,
        }
      : null,
    participants: {
      total: students.length,
      experimental: records.filter((record) => record.expGroup === 'experimental').length,
      control: records.filter((record) => record.expGroup === 'control').length,
      consented,
      consentRate: students.length ? Math.round((consented / students.length) * 100) : 0,
      withdrawn,
      withoutCode,
      withoutGroup,
    },
    preTest: {
      done: hasPre,
      total,
      percent: total ? Math.round((hasPre / total) * 100) : 0,
      configured: Boolean(experiment?.preTestId),
    },
    postTest: {
      done: hasPost,
      total,
      percent: total ? Math.round((hasPost / total) * 100) : 0,
      configured: Boolean(experiment?.postTestId),
    },
    activity: {
      avgMinutes: avg((record) => record.timeOnTaskMin),
      avgAttempts: avg((record) => record.attempts),
      avgActiveDays: avg((record) => record.activeDays),
      avgAiMessages: avg((record) => record.aiMessages),
    },
    quality: {
      issues,
      missingPre: total - hasPre,
      missingPost: total - hasPost,
      lowActivity: records.filter((record) => record.lowActivity).length,
      analysable: records.filter(
        (record) => !record.lowActivity && record.preTotal !== null && record.postTotal !== null
      ).length,
    },
    checklist,
  }
}
