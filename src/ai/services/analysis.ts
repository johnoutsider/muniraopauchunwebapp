import 'server-only'

/**
 * AI Error Analysis, 8-bosqich "AI Feedback Report" va o'qituvchi uchun
 * progress izohi (PLAN 5 — 8-bosqich, 6, 7.2).
 *
 * Bu yerdagi matnlar talabaga o'zbek tilida yetkaziladi (PLAN 7.3),
 * ingliz tili misollari va terminlar ingliz tilida qoladi.
 */

import { MODEL_FAST, MODEL_MAIN, fastModel, mainModel } from '@/ai/client'
import {
  ERROR_ANALYSIS_PROMPT,
  FEEDBACK_REPORT_PROMPT,
  PROGRESS_NARRATIVE_PROMPT,
  buildSystemPrompt,
} from '@/ai/prompts'
import {
  ErrorAnalysisSchema,
  FeedbackReportSchema,
  ProgressNoteSchema,
  type ErrorAnalysis,
  type FeedbackReport,
  type ProgressNote,
} from '@/ai/schemas'
import { ERROR_TAG_LABELS, type CefrLevel, type ErrorTag, type Skill } from '@/config/constants'
import type { ActionResult, LinguisticProfile, SessionUser, StatsDailyDoc } from '@/types'

import { dataBlock, runObject, type BaseAiArgs } from './common'

/* ------------------------------------------------------------------ */
/* 1. Xatolar tahlili                                                   */
/* ------------------------------------------------------------------ */

export interface AnalyseErrorsArgs extends BaseAiArgs {
  uid: string
  counts: Partial<Record<ErrorTag, number>>
  recentExamples?: Array<{ tag: ErrorTag; example: string }>
  cefr?: CefrLevel
}

export async function analyseErrors(args: AnalyseErrorsArgs): Promise<ActionResult<ErrorAnalysis>> {
  const entries = Object.entries(args.counts)
    .filter(([, n]) => typeof n === 'number' && n > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 15)

  if (entries.length === 0) {
    return { ok: false, error: 'Tahlil uchun yetarli xato ma’lumoti yo‘q.', code: 'no_data' }
  }

  const counts = entries.map(([tag, n]) => ({
    tag,
    count: n,
    label: ERROR_TAG_LABELS[tag as ErrorTag]?.en ?? tag,
  }))

  const examples = (args.recentExamples ?? []).slice(0, 20).map((e) => ({
    tag: e.tag,
    example: String(e.example).slice(0, 300),
  }))

  const prompt = `${ERROR_ANALYSIS_PROMPT}

--- LEARNER DATA ---
Learner CEFR: ${args.cefr ?? 'B1 (assumed)'}

${dataBlock('ERROR COUNTS (error tag -> number of occurrences)', counts)}

${examples.length ? dataBlock('RECENT ERROR EXAMPLES', examples) : 'No individual examples are available; work from the counts.'}

Diagnose the pattern behind these errors. Write "summary", "cause" and "recommendation" in Uzbek.`

  return runObject({
    guard: {
      user: args.user ?? args.uid,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'analyseErrors', uid: args.uid, tags: counts.length },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: ErrorAnalysisSchema,
    system: buildSystemPrompt({
      cefr: args.cefr,
      explanationLanguage: 'uz',
      extra: 'You are performing an error analysis for the learner analytics dashboard.',
    }),
    prompt,
    temperature: 0.3,
    maxTokens: 1800,
    signal: args.signal,
  })
}

/* ------------------------------------------------------------------ */
/* 2. AI Feedback Report (8-bosqich)                                    */
/* ------------------------------------------------------------------ */

export interface FeedbackReportStats {
  periodDays?: number
  attempts?: number
  correctRate?: number
  timeOnTaskMin?: number
  lessonsDone?: number
  wordsLearned?: number
  aiMessages?: number
  writingSubmissions?: number
  speakingSubmissions?: number
  skillScores?: Partial<Record<Skill, number>>
  /** Skill bo'yicha o'zgarish (masalan post − pre) */
  skillTrend?: Partial<Record<Skill, number>>
}

export interface BuildFeedbackReportArgs extends BaseAiArgs {
  user: Pick<SessionUser, 'uid' | 'displayName'> &
    Partial<Pick<SessionUser, 'participantCode' | 'expGroup' | 'groupId'>>
  profile?: LinguisticProfile
  stats: FeedbackReportStats
  recentErrors?: Partial<Record<ErrorTag, number>>
  cefr?: CefrLevel
}

export async function buildFeedbackReport(
  args: BuildFeedbackReportArgs
): Promise<ActionResult<FeedbackReport>> {
  const prompt = `${FEEDBACK_REPORT_PROMPT}

--- LEARNER ---
Name: ${args.user.displayName || 'the learner'}
CEFR: ${args.cefr ?? 'B1 (assumed)'}
Reporting period: last ${args.stats.periodDays ?? 30} days

${args.profile ? dataBlock('INDIVIDUAL LINGUISTIC PROFILE (skill -> score 0-100, label, cefr)', args.profile) : 'No diagnostic profile is available.'}

${dataBlock('ACTIVITY AND RESULTS', args.stats)}

${args.recentErrors && Object.keys(args.recentErrors).length ? dataBlock('ERROR COUNTS BY TAG', args.recentErrors) : 'No error data for this period.'}

Write the stage-8 AI Feedback Report. Base every claim on the data above.`

  return runObject({
    guard: {
      user: args.user as { uid: string },
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'buildFeedbackReport', uid: args.user.uid },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: FeedbackReportSchema,
    system: buildSystemPrompt({
      name: args.user.displayName,
      cefr: args.cefr,
      extra: 'You are writing the stage-8 feedback report shown on the learner dashboard.',
    }),
    prompt,
    temperature: 0.4,
    maxTokens: 2200,
    signal: args.signal,
  })
}

/* ------------------------------------------------------------------ */
/* 3. Progress narrative (o'qituvchi uchun)                             */
/* ------------------------------------------------------------------ */

export interface ProgressNarrativeArgs extends BaseAiArgs {
  /** Skill bo'yicha trend: musbat — o'sish, manfiy — pasayish */
  trend: Partial<Record<Skill, number>>
  activity: Pick<StatsDailyDoc, 'attempts' | 'correctRate' | 'timeOnTaskMin' | 'aiMessages'> & {
    activeDaysLast30?: number
    daysSinceLastActive?: number
    predictedPostScore?: number
  }
  /** Talaba nomi/kodi — o'qituvchi ko'radigan matnda ishlatilmaydi, faqat kontekst */
  participantCode?: string
}

export async function progressNarrative(
  args: ProgressNarrativeArgs
): Promise<ActionResult<ProgressNote>> {
  const prompt = `${PROGRESS_NARRATIVE_PROMPT}

${dataBlock('SKILL TREND (positive = improving, negative = declining)', args.trend)}

${dataBlock('ACTIVITY', args.activity)}

Write the teacher note in Uzbek and set riskLevel.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'progressNarrative', participantCode: args.participantCode ?? null },
    },
    model: fastModel(),
    modelName: MODEL_FAST,
    schema: ProgressNoteSchema,
    system:
      'You write short, factual progress notes in Uzbek for teachers on a professional-English-for-economics platform. Never address the learner. Never speculate beyond the data given.',
    prompt,
    temperature: 0.3,
    maxTokens: 600,
    signal: args.signal,
  })
}
