import 'server-only'

/**
 * AI mashq generatsiyasi (PLAN 7.2, 8.2, 14).
 * Natija DOIM `source: 'ai'`, `status: 'draft'` — o'qituvchi tasdiqlagandan keyin
 * item bankka tushadi (human-in-the-loop, PLAN 1.5).
 */

import { MODEL_MAIN, mainModel } from '@/ai/client'
import { COMPACT_SYSTEM, EXERCISE_GENERATION_PROMPT } from '@/ai/prompts'
import { ExerciseSetSchema, type ExerciseItem } from '@/ai/schemas'
import {
  AI_LIMITS,
  GRAMMAR_TOPICS,
  type CefrLevel,
  type Domain,
  type ItemType,
  type Skill,
} from '@/config/constants'
import type { ActionResult, ItemDoc } from '@/types'

import { runObject, type BaseAiArgs } from './common'

/** AI qaytargan item + server qo'shadigan maydonlar. */
export type GeneratedItem = ExerciseItem &
  Pick<ItemDoc, 'source' | 'status'> & { generatedFromPrompt: string }

export interface GenerateExercisesArgs extends BaseAiArgs {
  skill: Skill
  topic: string
  domain: Domain
  cefr: CefrLevel
  difficulty: number
  count: number
  types?: ItemType[]
  /** Qo'shimcha ko'rsatma (o'qituvchi CMS'dan) */
  extraInstruction?: string
}

function topicContext(topic: string): string {
  const found = GRAMMAR_TOPICS.find(
    (t) => t.id === topic || t.en.toLowerCase() === topic.toLowerCase()
  )
  return found ? `${found.en} — teach it through ${found.context}.` : topic
}

function buildPrompt(args: GenerateExercisesArgs, count: number): string {
  const types = args.types?.length ? args.types.join(', ') : 'choose the most suitable types'
  return `${EXERCISE_GENERATION_PROMPT}

--- REQUEST ---
Skill: ${args.skill}
Topic: ${args.topic} (${topicContext(args.topic)})
Professional domain: ${args.domain}
CEFR level: ${args.cefr}
Difficulty: ${args.difficulty} (1-5)
Number of items: exactly ${count}
Item types to use: ${types}
${args.extraInstruction ? `Additional requirement from the teacher: ${args.extraInstruction.slice(0, 500)}` : ''}

Produce exactly ${count} items. Every item must use skill "${args.skill}", topic "${args.topic}", domain "${args.domain}", cefr "${args.cefr}" and difficulty ${args.difficulty}.`
}

/**
 * Mashqlar to'plamini generatsiya qiladi.
 * `count` `AI_LIMITS.GENERATION_MAX_ITEMS` bilan cheklanadi.
 */
export async function generateExercises(
  args: GenerateExercisesArgs
): Promise<ActionResult<GeneratedItem[]>> {
  const count = Math.max(1, Math.min(Math.floor(args.count) || 1, AI_LIMITS.GENERATION_MAX_ITEMS))
  const prompt = buildPrompt(args, count)

  const res = await runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'generateExercises', skill: args.skill, topic: args.topic, count },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: ExerciseSetSchema,
    system: COMPACT_SYSTEM,
    prompt,
    temperature: 0.7,
    maxTokens: 6000,
    signal: args.signal,
  })

  if (!res.ok) return res

  const items: GeneratedItem[] = res.data.items.slice(0, count).map((item) => ({
    ...item,
    // So'ralgan parametrlar model xatosidan ustun
    skill: args.skill,
    topic: args.topic,
    domain: args.domain,
    cefr: args.cefr,
    difficulty: Math.max(1, Math.min(5, args.difficulty)),
    source: 'ai' as const,
    status: 'draft' as const,
    generatedFromPrompt: prompt,
  }))

  if (items.length === 0) {
    return {
      ok: false,
      error: 'AI birorta ham mashq qaytarmadi. Qaytadan urinib ko‘ring.',
      code: 'empty_result',
    }
  }

  return { ok: true, data: items }
}
