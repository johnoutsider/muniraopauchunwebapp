import 'server-only'

/**
 * Writing Lab — AI feedback (PLAN 8.5).
 * MUHIM: AI matnni qayta yozmaydi. `summary` — qayta ishlash rejasi
 * (akademik halollik, PLAN 7.3).
 */

import { MODEL_MAIN, mainModel } from '@/ai/client'
import { WRITING_REVIEW_PROMPT, WRITING_RUBRIC_PROMPT, buildSystemPrompt } from '@/ai/prompts'
import { WritingFeedbackSchema, type WritingFeedback } from '@/ai/schemas'
import { sanitizeLongText } from '@/ai/guard'
import type { CefrLevel } from '@/config/constants'
import type { ActionResult, WritingSubmissionDoc } from '@/types'

import { runObject, textBlock, type BaseAiArgs } from './common'

export type WritingGenre = WritingSubmissionDoc['genre']

export interface ReviewWritingArgs extends BaseAiArgs {
  text: string
  genre: WritingGenre
  cefr: CefrLevel
  taskPrompt: string
  /** Rubrika matni; berilmasa standart writing rubrikasi ishlatiladi. */
  rubric?: string
  /** Talabaning takrorlanuvchi xatolari (aniqroq feedback uchun) */
  knownWeaknesses?: string[]
  /** Nechinchi qoralama */
  draftNo?: number
}

const GENRE_NOTES: Record<WritingGenre, string> = {
  email:
    'Business e-mail: subject line, appropriate salutation and sign-off, one clear purpose, polite requests, concise paragraphs.',
  report:
    'Business or economic report: headings or clear sections, factual impersonal style, data described precisely, findings before recommendations.',
  summary:
    'Summary of a chart or text: overview sentence first, key trends and comparisons selected, no personal opinion, no invented data.',
  memo: 'Internal memo: To / From / Date / Subject header, direct opening, action points, neutral internal register.',
  case_solution:
    'Case solution: problem statement, analysis grounded in the data, proposed solution, risks, next steps.',
  essay:
    'Academic essay: thesis, structured argument with linking devices, evidence, hedged conclusions.',
}

export async function reviewWriting(
  args: ReviewWritingArgs
): Promise<ActionResult<WritingFeedback>> {
  const text = sanitizeLongText(args.text, 12_000)
  if (text.length < 20) {
    return { ok: false, error: 'Matn juda qisqa — kamida bir necha gap yozing.', code: 'too_short' }
  }

  const prompt = `${WRITING_REVIEW_PROMPT}

${args.rubric?.trim() || WRITING_RUBRIC_PROMPT}

--- TASK THE LEARNER WAS GIVEN ---
Genre: ${args.genre} — ${GENRE_NOTES[args.genre]}
Learner CEFR: ${args.cefr}
Draft number: ${args.draftNo ?? 1}
Task prompt: ${sanitizeLongText(args.taskPrompt, 1500) || '(not provided)'}
${args.knownWeaknesses?.length ? `Recurring errors from this learner's profile: ${args.knownWeaknesses.slice(0, 8).join(', ')}` : ''}

${textBlock("LEARNER'S DRAFT", text)}

Give feedback on this draft. Copy every "span" character for character from the draft above. Do NOT return a corrected version of the text.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'writing_review',
      sessionId: args.sessionId,
      meta: { service: 'reviewWriting', genre: args.genre, cefr: args.cefr, chars: text.length },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: WritingFeedbackSchema,
    system: buildSystemPrompt({
      cefr: args.cefr,
      weaknesses: args.knownWeaknesses,
      extra:
        'You are reviewing a draft. You never rewrite the text; you explain and the learner revises.',
    }),
    prompt,
    temperature: 0.3,
    maxTokens: 3000,
    signal: args.signal,
    refine: (value) => ({
      ...value,
      // Model matnni "yaxshilangan variant" sifatida qaytarib qo'ymasligi uchun
      // span'lar haqiqatan ham asl matndan olinganini tekshiramiz.
      errors: value.errors.filter((e) => e.span.length > 0 && text.includes(e.span)),
    }),
  })
}
