import 'server-only'

/**
 * AI role-play — Speaking Partner (PLAN 5 — 6-bosqich, 7.2, 8.6).
 * Persona rolda qoladi, darajaga moslashadi; `/end` da feedbackka o'tadi.
 */

import { streamText, type CoreMessage } from 'ai'

import { MODEL_MAIN, aiErrorMessage, mainModel, usageFrom } from '@/ai/client'
import {
  ROLE_PLAY_END_COMMAND,
  buildPersonaPrompt,
  buildSystemPrompt,
  personaOpening,
} from '@/ai/prompts'
import {
  appendAiMessage,
  logAiCall,
  prepareUserMessage,
  startAiSession,
  type AnalyticsUser,
} from '@/ai/guard'
import { AI_LIMITS, type AiPersona, type CefrLevel, type Domain } from '@/config/constants'
import type { ActionResult, ScenarioDoc } from '@/types'

import { asUser, ensureQuota, runText, textBlock, type BaseAiArgs } from './common'
import type { ChatMessageInput, TutorStream } from './tutor'

export type RolePlayScenario = Partial<
  Pick<ScenarioDoc, 'title' | 'context' | 'goals' | 'successCriteria' | 'openingLine' | 'domain'>
>

const MAX_HISTORY = 24

export interface StreamRolePlayArgs extends BaseAiArgs {
  user: AnalyticsUser | string
  persona: AiPersona
  scenario?: RolePlayScenario
  messages: ChatMessageInput[]
  cefr: CefrLevel
  scenarioId?: string
}

function toCoreMessages(messages: ChatMessageInput[]): {
  core: CoreMessage[]
  lastUserText: string
  ended: boolean
} {
  const core: CoreMessage[] = []
  let lastUserText = ''
  for (const m of messages.slice(-MAX_HISTORY)) {
    if (m.role === 'user') {
      const scan = prepareUserMessage(m.content, AI_LIMITS.MAX_INPUT_CHARS)
      if (!scan.text) continue
      lastUserText = scan.text
      core.push({ role: 'user', content: scan.text })
    } else {
      const content = String(m.content ?? '').slice(0, 6000)
      if (content) core.push({ role: 'assistant', content })
    }
  }
  const ended = lastUserText.trim().toLowerCase().startsWith(ROLE_PLAY_END_COMMAND)
  return { core, lastUserText, ended }
}

function rolePlaySystem(args: {
  persona: AiPersona
  scenario?: RolePlayScenario
  cefr: CefrLevel
}): string {
  return buildSystemPrompt({
    cefr: args.cefr,
    professionalTrack: args.scenario?.domain as Domain | undefined,
    stage: 6,
    extra: buildPersonaPrompt({
      persona: args.persona,
      cefr: args.cefr,
      scenario: args.scenario?.context,
      goals: args.scenario?.goals ? [...args.scenario.goals] : undefined,
      successCriteria: args.scenario?.successCriteria
        ? [...args.scenario.successCriteria]
        : undefined,
    }),
  })
}

/** Role-play sessiyasini ochadi va ochilish gapini qaytaradi. */
export async function createRolePlaySession(
  user: AnalyticsUser | string,
  args: { persona: AiPersona; scenario?: RolePlayScenario; scenarioId?: string; cefr: CefrLevel }
): Promise<ActionResult<{ sessionId: string; opening: string }>> {
  try {
    const opening = personaOpening(args.persona, args.scenario?.openingLine)
    const sessionId = await startAiSession(user, {
      mode: 'roleplay',
      title: args.scenario?.title || `Role-play: ${args.persona}`,
      model: MODEL_MAIN,
      persona: args.persona,
      scenarioId: args.scenarioId,
    })
    await appendAiMessage(sessionId, { role: 'assistant', content: opening })
    return { ok: true, data: { sessionId, opening } }
  } catch (err) {
    console.error('[ai/roleplay] createRolePlaySession failed', err)
    return { ok: false, error: aiErrorMessage(err), code: 'ai_error' }
  }
}

/** Personaning navbatdagi javobini oqim sifatida qaytaradi. */
export async function streamRolePlay(args: StreamRolePlayArgs): Promise<ActionResult<TutorStream>> {
  const gate = await ensureQuota(args.user)
  if (!gate.ok) return { ok: false, error: gate.error, code: gate.code }

  const u = asUser(args.user)
  const { core, lastUserText, ended } = toCoreMessages(args.messages ?? [])
  if (core.length === 0) return { ok: false, error: 'Xabar bo‘sh.', code: 'empty_input' }

  const startedAt = Date.now()

  try {
    if (args.sessionId && lastUserText) {
      await appendAiMessage(args.sessionId, { role: 'user', content: lastUserText })
    }

    const result = streamText({
      model: mainModel(),
      system: rolePlaySystem(args),
      messages: core,
      temperature: ended ? 0.35 : 0.8,
      maxTokens: ended ? 1600 : 700,
      abortSignal: args.signal,
      maxRetries: 2,
      onFinish: async ({ text, usage }) => {
        try {
          if (args.sessionId) {
            await appendAiMessage(args.sessionId, {
              role: 'assistant',
              content: text,
              feedbackTags: ended ? ['roleplay_feedback'] : [],
              tokensIn: usage?.promptTokens ?? 0,
              tokensOut: usage?.completionTokens ?? 0,
            })
          }
          if (u) {
            await logAiCall({
              uid: u,
              mode: 'roleplay',
              model: MODEL_MAIN,
              usage: usageFrom(usage, MODEL_MAIN, startedAt),
              sessionId: args.sessionId,
              meta: { persona: args.persona, ended, turns: core.length },
            })
          }
        } catch (err) {
          console.error('[ai/roleplay] onFinish logging failed', err)
        }
      },
    })

    return { ok: true, data: result }
  } catch (err) {
    console.error('[ai/roleplay] streamRolePlay failed', err)
    return { ok: false, error: aiErrorMessage(err), code: 'ai_error' }
  }
}

/* ------------------------------------------------------------------ */
/* Yakuniy feedback                                                     */
/* ------------------------------------------------------------------ */

export interface FinishRolePlayArgs extends BaseAiArgs {
  user: AnalyticsUser | string
  persona: AiPersona
  scenario?: RolePlayScenario
  messages: ChatMessageInput[]
  cefr: CefrLevel
}

/**
 * Suhbat tugagach, oqimsiz yakuniy feedback matnini qaytaradi
 * (talaba `/end` yozmasdan chiqib ketsa yoki UI tugmasi bosilsa).
 */
export async function finishRolePlay(args: FinishRolePlayArgs): Promise<ActionResult<string>> {
  const transcript = (args.messages ?? [])
    .slice(-MAX_HISTORY)
    .map((m) => {
      const who = m.role === 'user' ? 'LEARNER' : args.persona.toUpperCase()
      const text =
        m.role === 'user'
          ? prepareUserMessage(m.content, 2000).text
          : String(m.content ?? '').slice(0, 2000)
      return `${who}: ${text}`
    })
    .filter((l) => l.split(': ')[1])
    .join('\n')

  if (!transcript) {
    return {
      ok: false,
      error: 'Suhbat bo‘sh — feedback berish uchun matn yo‘q.',
      code: 'empty_input',
    }
  }

  const prompt = `The role-play is over. Step out of the character and write the learner's feedback now.

${textBlock('CONVERSATION TRANSCRIPT', transcript)}

Write the feedback in exactly the four parts described in your instructions: What worked, Language to fix, Professional phrases you could have used, One next step.`

  const res = await runText({
    guard: {
      user: args.user,
      mode: 'roleplay',
      sessionId: args.sessionId,
      meta: { service: 'finishRolePlay', persona: args.persona },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    system: rolePlaySystem(args),
    prompt,
    temperature: 0.35,
    maxTokens: 1600,
    signal: args.signal,
  })

  if (res.ok && args.sessionId) {
    await appendAiMessage(args.sessionId, {
      role: 'assistant',
      content: res.data,
      feedbackTags: ['roleplay_feedback'],
    })
  }

  return res
}
