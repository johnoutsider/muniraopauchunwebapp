/**
 * Prompt Practice Lab baholash sxemasi (PLAN 8.15, 7.2).
 * Simple → Guided → Independent skafolding.
 */

import { z } from 'zod'

import { BandScoreSchema, PromptLevelSchema, Text } from './common'

export const PromptScoresSchema = z.object({
  specificity: BandScoreSchema,
  context: BandScoreSchema,
  level: BandScoreSchema,
  format: BandScoreSchema,
  honesty: BandScoreSchema,
})
export type PromptScores = z.infer<typeof PromptScoresSchema>

export const PromptEvalSchema = z.object({
  scores: PromptScoresSchema,
  totalScore: z.number().int().min(0).max(25),
  feedback: Text(1500).describe('Three to five sentences in Uzbek'),
  improvedPrompt: Text(1500).describe(
    "The learner's own prompt rewritten in English to score 5 everywhere"
  ),
  nextLevel: PromptLevelSchema,
})
export type PromptEval = z.infer<typeof PromptEvalSchema>
