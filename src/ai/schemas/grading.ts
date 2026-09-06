/**
 * Ochiq javoblarni baholash sxemasi (PLAN 6, 8.2).
 * Faqat satrli taqqoslash hal qila olmagan javoblar uchun ishlatiladi
 * (gap_fill, transformation, expansion).
 */

import { z } from 'zod'

import { ErrorTagSchema, Text } from './common'

export const OpenGradeSchema = z.object({
  isCorrect: z.boolean().describe('True only when score >= 0.75'),
  score: z.number().min(0).max(1),
  errorTags: z.array(ErrorTagSchema).max(4).default([]),
  why: Text(600).describe('The rule or lexical fact — written for the learner'),
  how: Text(600).describe('How to fix it, showing the change'),
  whereElse: Text(600).describe('Where else this rule applies'),
  modelAnswer: Text(400).describe('The best short correct answer'),
})
export type OpenGrade = z.infer<typeof OpenGradeSchema>
