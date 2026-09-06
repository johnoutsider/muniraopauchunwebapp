/**
 * Writing Lab feedback sxemasi (PLAN 8.5).
 * `WritingAiFeedback` tipiga mos: errors[{span, type, why, fix, whereElse}],
 * rubrikadagi ballar, strengths, areasToImprove, summary.
 *
 * AI matnni QAYTA YOZMAYDI — `summary` qayta ishlash rejasini beradi.
 */

import { z } from 'zod'

import { BandScoreSchema, ErrorTagSchema, Text } from './common'

export const WritingErrorSchema = z.object({
  span: Text(300).describe("The exact substring copied verbatim from the learner's text"),
  type: ErrorTagSchema,
  why: Text(600).describe('The rule or lexical fact behind the error'),
  fix: Text(300).describe('The corrected span only — not the whole sentence'),
  whereElse: Text(600).describe('One other professional context where the same rule applies'),
})
export type AiWritingError = z.infer<typeof WritingErrorSchema>

export const WritingRubricScoresSchema = z.object({
  task_achievement: BandScoreSchema,
  vocabulary_range: BandScoreSchema,
  grammar_accuracy: BandScoreSchema,
  coherence: BandScoreSchema,
  register: BandScoreSchema,
})
export type WritingRubricScores = z.infer<typeof WritingRubricScoresSchema>

export const WritingFeedbackSchema = z.object({
  errors: z.array(WritingErrorSchema).max(8).default([]),
  rubricScores: WritingRubricScoresSchema,
  strengths: z.array(Text(400)).min(1).max(4),
  areasToImprove: z.array(Text(400)).min(1).max(4),
  summary: Text(1800).describe('A revision plan for the learner — never a rewritten text'),
})
export type WritingFeedback = z.infer<typeof WritingFeedbackSchema>
