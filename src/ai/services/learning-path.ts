import 'server-only'

/**
 * Learning Path qadamlariga izoh (PLAN 6.7, 5 — 1/2-bosqich).
 * Qadamlarni QOIDALAR DVIGATELI tanlaydi; AI faqat har qadam uchun
 * qisqa o'zbekcha sabab yozadi ("Artikllar bo'yicha 12 ta xato — ...").
 */

import { MODEL_FAST, fastModel } from '@/ai/client'
import { PATH_REASONS_PROMPT } from '@/ai/prompts'
import { PathReasonsSchema } from '@/ai/schemas'
import type { CefrLevel, Domain, ErrorTag } from '@/config/constants'
import type { ActionResult, LinguisticProfile, PathStep } from '@/types'

import { dataBlock, runObject, type BaseAiArgs } from './common'

export interface PathProfileInput {
  displayName?: string
  cefr?: CefrLevel
  professionalTrack?: Domain
  goals?: string[]
  linguisticProfile?: LinguisticProfile
  errorCounts?: Partial<Record<ErrorTag, number>>
}

/** Qoidalar dvigateli bergan qadam (sabab hali yozilmagan). */
export type PathStepInput = Pick<PathStep, 'id' | 'kind' | 'title' | 'skill' | 'stage'> &
  Partial<Pick<PathStep, 'order' | 'refId' | 'reason'>>

export interface ExplainPathStepsArgs extends BaseAiArgs {
  profile: PathProfileInput
  steps: PathStepInput[]
}

export interface ExplainedPathStep {
  id: string
  reason: string
}

export interface ExplainPathStepsResult {
  steps: ExplainedPathStep[]
  /** Yo'l haqida umumiy bir gap (ixtiyoriy) */
  note?: string
}

const MAX_STEPS = 30

export async function explainPathSteps(
  args: ExplainPathStepsArgs
): Promise<ActionResult<ExplainPathStepsResult>> {
  const steps = (args.steps ?? []).slice(0, MAX_STEPS)
  if (steps.length === 0) {
    return { ok: false, error: 'Izohlash uchun qadamlar yo‘q.', code: 'no_data' }
  }

  const compactSteps = steps.map((s, i) => ({
    stepId: s.id,
    order: s.order ?? i + 1,
    kind: s.kind,
    title: s.title,
    skill: s.skill,
    stage: s.stage,
  }))

  const prompt = `${PATH_REASONS_PROMPT}

--- LEARNER PROFILE ---
Name: ${args.profile.displayName ?? '—'}
CEFR: ${args.profile.cefr ?? 'B1 (assumed)'}
Professional track: ${args.profile.professionalTrack ?? 'economics (general)'}
Goals: ${args.profile.goals?.slice(0, 5).join('; ') || '—'}

${args.profile.linguisticProfile ? dataBlock('INDIVIDUAL LINGUISTIC PROFILE', args.profile.linguisticProfile) : 'No diagnostic profile available.'}

${args.profile.errorCounts && Object.keys(args.profile.errorCounts).length ? dataBlock('ERROR COUNTS BY TAG', args.profile.errorCounts) : 'No error data available.'}

${dataBlock('STEPS CHOSEN BY THE RULES ENGINE (do not change them)', compactSteps)}

Write one Uzbek reason for each of the ${steps.length} steps, using the same stepId values.`

  const res = await runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: { service: 'explainPathSteps', steps: steps.length },
    },
    model: fastModel(),
    modelName: MODEL_FAST,
    schema: PathReasonsSchema,
    system:
      'You write short, specific Uzbek (Latin script) justifications for the steps of an individual learning path on a professional-English-for-economics platform. You never change the steps themselves. English grammar-topic names and terms stay in English.',
    prompt,
    temperature: 0.4,
    maxTokens: 1600,
    signal: args.signal,
  })

  if (!res.ok) return res

  const byId = new Map(res.data.reasons.map((r) => [r.stepId, r.reason]))
  return {
    ok: true,
    data: {
      steps: steps.map((s) => ({
        id: s.id,
        reason: byId.get(s.id)?.trim() || s.reason || 'Individual rejangizdagi navbatdagi qadam.',
      })),
      note: res.data.note,
    },
  }
}
