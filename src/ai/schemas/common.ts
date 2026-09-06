/**
 * Umumiy zod primitivlari — barcha AI sxemalari shulardan quriladi (PLAN 7.1).
 * Konstantalardagi ro'yxatlar bilan bitta manba: model faqat ruxsat etilgan
 * qiymatlarni qaytara oladi.
 */

import { z } from 'zod'

import {
  AI_PERSONAS,
  CEFR_LEVELS,
  DOMAINS,
  ERROR_TAGS,
  ITEM_TYPES,
  PROMPT_LEVELS,
  SKILLS,
} from '@/config/constants'

export const CefrSchema = z.enum(CEFR_LEVELS)
export const SkillSchema = z.enum(SKILLS)
export const DomainSchema = z.enum(DOMAINS)
export const ErrorTagSchema = z.enum(ERROR_TAGS)
export const ItemTypeSchema = z.enum(ITEM_TYPES)
export const PersonaSchema = z.enum(AI_PERSONAS)
export const PromptLevelSchema = z.enum(PROMPT_LEVELS)

/** Mashq murakkabligi 1..5 (PLAN 6) */
export const DifficultySchema = z.number().int().min(1).max(5)

/** Rubrika bandi 0..5 (PLAN 8.5) */
export const BandScoreSchema = z.number().int().min(0).max(5)

/** Metodikaning majburiy uch qismli izohi (PLAN 7.3) */
export const ExplanationSchema = z.object({
  why: z.string().min(1).describe('Why the answer is wrong or right — the rule or lexical fact'),
  how: z.string().min(1).describe('How to fix it, showing the change'),
  whereElse: z.string().min(1).describe('Where else this rule applies — one or two other contexts'),
})
export type Explanation = z.infer<typeof ExplanationSchema>

/** Bo'sh bo'lmagan qisqa matn */
export const Text = (max = 2000) => z.string().min(1).max(max)

/** Nomanfiy butun son */
export const Count = z.number().int().min(0)
