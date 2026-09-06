import 'server-only'

/**
 * Ochiq javoblarni baholash (PLAN 6, 8.2).
 * Faqat satrli taqqoslash hal qila olmagan javoblar uchun — arzon model.
 */

import { MODEL_FAST, fastModel } from '@/ai/client'
import { COMPACT_SYSTEM, OPEN_GRADING_PROMPT } from '@/ai/prompts'
import { OpenGradeSchema, type OpenGrade } from '@/ai/schemas'
import { sanitizeUserInput } from '@/ai/guard'
import type { CefrLevel } from '@/config/constants'
import type { ActionResult, ItemDoc } from '@/types'

import { runObject, textBlock, type BaseAiArgs } from './common'

/** Baholash uchun kerakli item maydonlari. */
export type GradableItem = Pick<
  ItemDoc,
  'type' | 'skill' | 'topic' | 'domain' | 'cefr' | 'difficulty' | 'stem' | 'answerKey'
> &
  Partial<Pick<ItemDoc, 'instruction' | 'explanation'>>

export interface GradeOpenAnswerArgs extends BaseAiArgs {
  item: GradableItem
  answer: string
  cefr?: CefrLevel
}

export async function gradeOpenAnswer(args: GradeOpenAnswerArgs): Promise<ActionResult<OpenGrade>> {
  const answer = sanitizeUserInput(args.answer, 1000)
  if (!answer) {
    return {
      ok: true,
      data: {
        isCorrect: false,
        score: 0,
        errorTags: ['task_achievement'],
        why: 'No answer was given, so the target structure could not be demonstrated.',
        how: 'Write the full sentence, keeping the structure the exercise practises.',
        whereElse: 'The same structure is needed whenever you report company results in writing.',
        modelAnswer: args.item.answerKey[0] ?? '',
      },
    }
  }

  const cefr = args.cefr ?? args.item.cefr

  const prompt = `${OPEN_GRADING_PROMPT}

--- EXERCISE ---
Type: ${args.item.type}
Skill: ${args.item.skill}
Topic (target structure): ${args.item.topic}
Domain: ${args.item.domain}
CEFR of the item: ${args.item.cefr} | learner CEFR: ${cefr}
Instruction: ${args.item.instruction ?? '(none)'}
Stem: ${args.item.stem}
Accepted answers listed by the author: ${JSON.stringify(args.item.answerKey)}

${textBlock("LEARNER'S ANSWER", answer)}

Grade this answer. Write "why", "how" and "whereElse" for a ${cefr} learner.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'gradeOpenAnswer', itemType: args.item.type, topic: args.item.topic },
    },
    model: fastModel(),
    modelName: MODEL_FAST,
    schema: OpenGradeSchema,
    system: COMPACT_SYSTEM,
    prompt,
    temperature: 0.1,
    maxTokens: 900,
    signal: args.signal,
    refine: (value) => ({
      ...value,
      score: Math.min(1, Math.max(0, value.score)),
      isCorrect: value.score >= 0.75,
    }),
  })
}
