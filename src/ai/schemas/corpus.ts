/**
 * Corpus Verification sxemasi (PLAN 8.16, 7.2).
 * n-gramm hisoblarini chaqiruvchi topadi; AI faqat verdikt va izoh yozadi.
 */

import { z } from 'zod'

import { Text } from './common'

export const CORPUS_VERDICTS = ['attested', 'rare', 'not_attested'] as const
export type CorpusVerdictValue = (typeof CORPUS_VERDICTS)[number]

export const CorpusAlternativeSchema = z.object({
  phrase: Text(120),
  note: Text(400).describe('When this alternative is used'),
})

export const CorpusVerdictSchema = z.object({
  verdict: z.enum(CORPUS_VERDICTS),
  explanation: Text(1200).describe(
    'Three to five sentences for the learner: verdict, evidence, reason'
  ),
  betterAlternatives: z.array(CorpusAlternativeSchema).max(4).default([]),
  exampleSentences: z.array(Text(400)).min(1).max(3),
})
export type CorpusVerdict = z.infer<typeof CorpusVerdictSchema>
