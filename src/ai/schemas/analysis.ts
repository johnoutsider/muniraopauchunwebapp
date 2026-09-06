/**
 * Xatolar tahlili va 8-bosqich "AI Feedback Report" sxemalari
 * (PLAN 5 — 8-bosqich, 6.5, 7.2).
 * `ErrorProfileDoc.aiAnalysis` bilan mos.
 */

import { z } from 'zod'

import { ErrorTagSchema, SkillSchema, Text } from './common'

export const ErrorPatternSchema = z.object({
  tag: ErrorTagSchema,
  cause: Text(600).describe(
    'Likely underlying reason (L1 interference, overgeneralised rule, lexical gap) — in Uzbek'
  ),
  recommendation: Text(600).describe(
    'One concrete practice action naming a topic or exercise type — in Uzbek'
  ),
})
export type ErrorPattern = z.infer<typeof ErrorPatternSchema>

export const ErrorAnalysisSchema = z.object({
  summary: Text(1500).describe('Three to five sentences in Uzbek, addressed to the learner'),
  patterns: z.array(ErrorPatternSchema).min(1).max(5),
  priorityTopics: z.array(Text(120)).min(1).max(4),
})
export type ErrorAnalysis = z.infer<typeof ErrorAnalysisSchema>

/* ------------------------------------------------------------------ */
/* AI Feedback Report (8-bosqich)                                       */
/* ------------------------------------------------------------------ */

export const SkillNoteSchema = z.object({
  skill: SkillSchema,
  note: Text(600).describe('Score, trend and the most common error in this skill'),
})
export type SkillNote = z.infer<typeof SkillNoteSchema>

export const FeedbackReportSchema = z.object({
  strengths: z.array(Text(400)).min(2).max(4),
  areasToImprove: z.array(Text(400)).min(2).max(4),
  skillNotes: z.array(SkillNoteSchema).max(8).default([]),
  nextSteps: z.array(Text(400)).min(2).max(4),
  encouragement: Text(800).describe('Two or three honest, specific sentences in Uzbek'),
})
export type FeedbackReport = z.infer<typeof FeedbackReportSchema>

/* ------------------------------------------------------------------ */
/* Progress prediction izohi (PLAN 6 — o'qituvchi uchun)                */
/* ------------------------------------------------------------------ */

export const ProgressNoteSchema = z.object({
  note: Text(600).describe('Three to four factual sentences in Uzbek, addressed to the teacher'),
  riskLevel: z.enum(['low', 'medium', 'high']),
})
export type ProgressNote = z.infer<typeof ProgressNoteSchema>
