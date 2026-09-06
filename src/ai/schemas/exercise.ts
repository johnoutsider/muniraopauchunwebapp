/**
 * Mashq generatsiya sxemasi — `ItemDoc` ga mos (PLAN 4.2, 7.2, 8.2).
 * AI faqat kontent maydonlarini qaytaradi; `source`, `status`, `createdAt`
 * serverda qo'shiladi (`status: 'draft'` → o'qituvchi tasdiqlaydi).
 */

import { z } from 'zod'

import {
  CefrSchema,
  DifficultySchema,
  DomainSchema,
  ErrorTagSchema,
  ExplanationSchema,
  ItemTypeSchema,
  SkillSchema,
  Text,
} from './common'

export const ItemOptionSchema = z.object({
  id: z.string().min(1).max(8).describe('Stable short id: a, b, c, d'),
  text: Text(400),
})
export type AiItemOption = z.infer<typeof ItemOptionSchema>

export const ExerciseItemSchema = z.object({
  type: ItemTypeSchema,
  skill: SkillSchema,
  topic: Text(120).describe('Grammar topic id or lexical topic, e.g. present_perfect'),
  domain: DomainSchema,
  cefr: CefrSchema,
  difficulty: DifficultySchema,
  stem: Text(1200).describe('The text the learner sees; gaps are marked with ___'),
  instruction: Text(300).describe('One short imperative line'),
  options: z
    .array(ItemOptionSchema)
    .max(8)
    .optional()
    .describe('Only for mcq, matching pool and classification'),
  answerKey: z
    .array(Text(400))
    .min(1)
    .max(20)
    .describe(
      'mcq: option id; gap_fill/transformation: all acceptable answers; matching: left::right'
    ),
  pairs: z
    .array(z.object({ left: Text(200), right: Text(200) }))
    .max(10)
    .optional()
    .describe('Required for matching items'),
  categories: z.array(Text(120)).max(8).optional().describe('Required for classification items'),
  explanation: ExplanationSchema,
  errorTags: z.array(ErrorTagSchema).max(6).default([]),
  tags: z.array(Text(60)).max(10).default([]),
})
export type ExerciseItem = z.infer<typeof ExerciseItemSchema>

export const ExerciseSetSchema = z.object({
  items: z.array(ExerciseItemSchema).min(1).max(20),
})
export type ExerciseSet = z.infer<typeof ExerciseSetSchema>
