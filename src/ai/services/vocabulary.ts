import 'server-only'

/**
 * Lug'at moduli (PLAN 8.1, 7.2):
 *  - `generateVocabCard` — 6 bosqichli so'z kartasi,
 *  - `generateSemanticNetwork` — semantik tarmoq grafi (inflation → prices → …).
 * Ikkalasi ham `draft` sifatida saqlanadi va o'qituvchi tasdiqlaydi.
 */

import { MODEL_MAIN, mainModel } from '@/ai/client'
import { SEMANTIC_NETWORK_PROMPT, VOCAB_CARD_PROMPT, buildSystemPrompt } from '@/ai/prompts'
import {
  SemanticNetworkSchema,
  VocabCardSchema,
  type SemanticNetwork,
  type VocabCard,
} from '@/ai/schemas'
import { sanitizeUserInput } from '@/ai/guard'
import type { CefrLevel, Domain } from '@/config/constants'
import type { ActionResult } from '@/types'

import { runObject, type BaseAiArgs } from './common'

/* ------------------------------------------------------------------ */
/* So'z kartasi                                                         */
/* ------------------------------------------------------------------ */

export interface GenerateVocabCardArgs extends BaseAiArgs {
  word: string
  domain: Domain
  cefr: CefrLevel
}

export async function generateVocabCard(
  args: GenerateVocabCardArgs
): Promise<ActionResult<VocabCard>> {
  const word = sanitizeUserInput(args.word, 80)
    .replace(/[\n\r]/g, ' ')
    .trim()
  if (!word) return { ok: false, error: 'So‘z kiritilmadi.', code: 'empty_input' }

  const prompt = `${VOCAB_CARD_PROMPT}

--- REQUEST ---
Word or term: "${word}"
Professional domain: ${args.domain}
Learner CEFR: ${args.cefr}

Build the six-step card for this term as it is used in ${args.domain}. If the term has a general meaning and a specialised economic meaning, put the economic sense first.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'vocab_teach',
      sessionId: args.sessionId,
      meta: { service: 'generateVocabCard', word, domain: args.domain },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: VocabCardSchema,
    system: buildSystemPrompt({
      cefr: args.cefr,
      professionalTrack: args.domain,
      extra: 'You are producing a lexicon card. Follow the vocabulary teaching sequence exactly.',
    }),
    prompt,
    temperature: 0.4,
    maxTokens: 2500,
    signal: args.signal,
    refine: (value) => ({ ...value, word, cefr: args.cefr }),
  })
}

/* ------------------------------------------------------------------ */
/* Semantik tarmoq                                                      */
/* ------------------------------------------------------------------ */

export interface GenerateSemanticNetworkArgs extends BaseAiArgs {
  seedWord: string
  domain: Domain
  /** Tugunlar soni (seed bilan birga), 4..20 */
  size?: number
  cefr?: CefrLevel
}

export async function generateSemanticNetwork(
  args: GenerateSemanticNetworkArgs
): Promise<ActionResult<SemanticNetwork>> {
  const seed = sanitizeUserInput(args.seedWord, 80)
    .replace(/[\n\r]/g, ' ')
    .trim()
  if (!seed) return { ok: false, error: 'Markaziy so‘z kiritilmadi.', code: 'empty_input' }

  const size = Math.max(4, Math.min(Math.floor(args.size ?? 10), 20))
  const cefr = args.cefr ?? 'B1'

  const prompt = `${SEMANTIC_NETWORK_PROMPT}

--- REQUEST ---
Seed term: "${seed}"
Professional domain: ${args.domain}
Total nodes including the seed: ${size}
Learner CEFR: ${cefr}

Build the network around "${seed}" as it is used in ${args.domain}.`

  const res = await runObject({
    guard: {
      user: args.user,
      mode: 'vocab_teach',
      sessionId: args.sessionId,
      meta: { service: 'generateSemanticNetwork', seedWord: seed, domain: args.domain, size },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: SemanticNetworkSchema,
    system: buildSystemPrompt({
      cefr,
      professionalTrack: args.domain,
      extra: 'You are producing a semantic network for an interactive graph.',
    }),
    prompt,
    temperature: 0.5,
    maxTokens: 2500,
    signal: args.signal,
  })

  if (!res.ok) return res

  // Ma'lumotlar butunligi: faqat mavjud tugunlarga bog'lanadigan qirralar qoladi.
  const ids = new Set(res.data.nodes.map((n) => n.id))
  const edges = res.data.edges.filter(
    (e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target
  )

  if (edges.length === 0) {
    return {
      ok: false,
      error: 'AI to‘g‘ri semantik tarmoq qura olmadi. Qaytadan urinib ko‘ring.',
      code: 'invalid_graph',
    }
  }

  return { ok: true, data: { nodes: res.data.nodes, edges } }
}
