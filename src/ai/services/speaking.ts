import 'server-only'

/**
 * Speaking / Pronunciation Lab — Azure ballarini pedagogik maslahatga aylantirish
 * (PLAN 8.3, 7.2). Azure'ning o'zi baholaydi; AI faqat tushuntiradi va yo'naltiradi.
 */

import { MODEL_MAIN, mainModel } from '@/ai/client'
import { SPEAKING_ANALYSIS_PROMPT, SPEAKING_RUBRIC_PROMPT, buildSystemPrompt } from '@/ai/prompts'
import { SpeakingFeedbackSchema, type SpeakingFeedback } from '@/ai/schemas'
import { sanitizeLongText } from '@/ai/guard'
import type { CefrLevel } from '@/config/constants'
import type { ActionResult, AzureAssessment } from '@/types'

import { dataBlock, runObject, textBlock, type BaseAiArgs } from './common'

export interface AnalyseSpeakingArgs extends BaseAiArgs {
  /** Talaba o'qishi kerak bo'lgan matn (scripted rejim); erkin nutqda bo'sh */
  referenceText?: string
  transcript?: string
  azure?: AzureAssessment
  cefr: CefrLevel
  /** Topshiriq turi — maslahatni moslashtirish uchun */
  taskType?: 'word' | 'sentence' | 'dialogue' | 'presentation'
  attemptNo?: number
  /** Oldingi urinishning umumiy bali — taqqoslash uchun */
  previousPronScore?: number
}

/** Faqat kerakli maydonlarni promptga beramiz — token tejash va shovqinni kamaytirish. */
function compactAzure(azure: AzureAssessment | undefined) {
  if (!azure) return null
  const words = [...azure.words]
    .sort((a, b) => a.accuracyScore - b.accuracyScore)
    .slice(0, 25)
    .map((w) => ({
      word: w.word,
      score: Math.round(w.accuracyScore),
      errorType: w.errorType,
      lowPhonemes: (w.phonemes ?? [])
        .filter((p) => p.accuracyScore < 70)
        .slice(0, 6)
        .map((p) => `${p.phoneme}:${Math.round(p.accuracyScore)}`),
    }))
  return {
    accuracy: Math.round(azure.accuracyScore),
    fluency: Math.round(azure.fluencyScore),
    completeness: Math.round(azure.completenessScore),
    prosody: azure.prosodyScore != null ? Math.round(azure.prosodyScore) : null,
    pronScore: Math.round(azure.pronScore),
    recognizedText: azure.recognizedText,
    lowestScoringWords: words,
  }
}

export async function analyseSpeaking(
  args: AnalyseSpeakingArgs
): Promise<ActionResult<SpeakingFeedback>> {
  const azure = compactAzure(args.azure)
  const transcript = sanitizeLongText(args.transcript ?? '', 4000)
  const reference = sanitizeLongText(args.referenceText ?? '', 4000)

  if (!azure && !transcript) {
    return {
      ok: false,
      error:
        'Talaffuz tahlili uchun ma’lumot yetarli emas (Azure natijasi ham, transkript ham yo‘q).',
      code: 'missing_input',
    }
  }

  const prompt = `${SPEAKING_ANALYSIS_PROMPT}

${SPEAKING_RUBRIC_PROMPT}

--- CONTEXT ---
Task type: ${args.taskType ?? 'sentence'}
Learner CEFR: ${args.cefr}
Attempt number: ${args.attemptNo ?? 1}
${args.previousPronScore != null ? `Previous overall pronunciation score: ${Math.round(args.previousPronScore)}` : 'No previous attempt to compare with.'}

${reference ? textBlock('REFERENCE TEXT (what the learner had to say)', reference) : 'Unscripted task: there is no reference text.'}

${transcript ? textBlock('TRANSCRIPT (what Azure recognised)', transcript) : ''}

${azure ? dataBlock('AZURE PRONUNCIATION ASSESSMENT', azure) : 'No machine scores are available; base your feedback on the transcript only and say so.'}

Turn these numbers into coaching for a ${args.cefr} learner of professional English for economics.`

  return runObject({
    guard: {
      user: args.user,
      mode: 'explain',
      sessionId: args.sessionId,
      meta: {
        service: 'analyseSpeaking',
        taskType: args.taskType,
        pronScore: azure?.pronScore ?? null,
        attemptNo: args.attemptNo ?? 1,
      },
    },
    model: mainModel(),
    modelName: MODEL_MAIN,
    schema: SpeakingFeedbackSchema,
    system: buildSystemPrompt({
      cefr: args.cefr,
      extra: 'You are the pronunciation coach. Explain machine scores; never simply repeat them.',
    }),
    prompt,
    temperature: 0.35,
    maxTokens: 2200,
    signal: args.signal,
  })
}
