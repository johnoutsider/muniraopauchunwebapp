import 'server-only'

import { createAnthropic } from '@ai-sdk/anthropic'

/**
 * Claude provayderi (PLAN 1.3, 7.1).
 * Kalit faqat serverda; brauzer hech qachon ko'rmaydi.
 */
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/** Asosiy model — tutor, feedback, mashq generatsiya, role-play */
export const MODEL_MAIN = process.env.AI_MODEL_MAIN ?? 'claude-sonnet-5'
/** Tez/arzon model — klassifikatsiya, qisqa tekshiruv, teg qo'yish */
export const MODEL_FAST = process.env.AI_MODEL_FAST ?? 'claude-haiku-4-5-20251001'

export const mainModel = () => anthropic(MODEL_MAIN)
export const fastModel = () => anthropic(MODEL_FAST)

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export interface AiUsage {
  promptTokens: number
  completionTokens: number
  model: string
  latencyMs: number
}

export function usageFrom(
  usage: { promptTokens?: number; completionTokens?: number } | undefined,
  model: string,
  startedAt: number
): AiUsage {
  return {
    promptTokens: usage?.promptTokens ?? 0,
    completionTokens: usage?.completionTokens ?? 0,
    model,
    latencyMs: Date.now() - startedAt,
  }
}

/** Xatolikni foydalanuvchiga tushunarli o'zbekcha matnga aylantirish. */
export function aiErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/api key/i.test(msg)) return 'AI xizmati sozlanmagan. Administratorga murojaat qiling.'
  if (/rate limit|429/i.test(msg)) return 'AI hozir band. Bir necha soniyadan keyin urinib ko‘ring.'
  if (/timeout|ETIMEDOUT|aborted/i.test(msg)) return 'AI javobi kechikdi. Qaytadan urinib ko‘ring.'
  if (/overloaded|529/i.test(msg))
    return 'AI xizmati vaqtincha yuklangan. Birozdan so‘ng urinib ko‘ring.'
  return 'AI javob bera olmadi. Qaytadan urinib ko‘ring.'
}
