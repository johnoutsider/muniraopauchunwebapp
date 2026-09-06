import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { checkAiQuota } from '@/ai/guard'
import { getSessionMessages } from '@/ai/guard/logger'
import { getLearningPath, getUserDoc, listScenarios } from '@/features/shared/queries'
import { getErrorProfile } from '@/features/student/queries'
import {
  AI_LIMITS,
  COL,
  ERROR_TAG_LABELS,
  SKILL_LABELS,
  scoreToLabel,
  type CefrLevel,
  type ErrorTag,
  type Skill,
} from '@/config/constants'
import { toMillis } from '@/lib/utils/format'
import type { AiSessionDoc, SessionUser } from '@/types'

import type {
  AiTeacherData,
  ChatMessage,
  QuotaInfo,
  ScenarioSummary,
  SessionSummary,
  StarterPrompt,
} from './types'

/* ------------------------------------------------------------------ */
/* Sessiyalar                                                          */
/* ------------------------------------------------------------------ */

/** Talabaning chat sessiyalari (yon panel ro'yxati). */
export const listAiSessions = cache(async (uid: string, limit = 40): Promise<SessionSummary[]> => {
  try {
    const snap = await adminDb()
      .collection(COL.aiSessions)
      .where('uid', '==', uid)
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get()

    return snap.docs
      .filter((doc) => (doc.data() as { hidden?: boolean }).hidden !== true)
      .map((doc) => {
        const data = doc.data() as AiSessionDoc
        return {
          id: doc.id,
          title: data.title || 'Suhbat',
          mode: data.mode,
          persona: data.persona,
          scenarioId: data.scenarioId,
          messageCount: data.messageCount ?? 0,
          lastMessageAt: toMillis(data.lastMessageAt ?? data.startedAt),
        } satisfies SessionSummary
      })
      .filter((session) => session.mode === 'tutor' || session.mode === 'roleplay')
  } catch (err) {
    console.error('[ai-teacher] listAiSessions failed', err)
    return []
  }
})

/** Bitta sessiyaning xabarlari — faqat egasiga. */
export async function loadSessionMessages(
  uid: string,
  sessionId: string
): Promise<{ ok: boolean; messages: ChatMessage[]; title?: string }> {
  try {
    const snap = await adminDb().collection(COL.aiSessions).doc(sessionId).get()
    const data = snap.data() as AiSessionDoc | undefined
    if (!snap.exists || !data || data.uid !== uid) return { ok: false, messages: [] }

    const docs = await getSessionMessages(sessionId, 60)
    const messages: ChatMessage[] = docs
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        key: message.id,
        role: message.role as 'user' | 'assistant',
        content: message.content,
        helpful: message.helpful ?? null,
        isFeedback: (message.feedbackTags ?? []).includes('roleplay_feedback'),
      }))

    return { ok: true, messages, title: data.title }
  } catch (err) {
    console.error('[ai-teacher] loadSessionMessages failed', err)
    return { ok: false, messages: [] }
  }
}

/* ------------------------------------------------------------------ */
/* Kunlik limit                                                        */
/* ------------------------------------------------------------------ */

export async function getQuotaInfo(uid: string): Promise<QuotaInfo> {
  const quota = await checkAiQuota(uid)
  const limit = quota.limitMessages ?? AI_LIMITS.MESSAGES_PER_DAY
  return {
    used: quota.messages ?? Math.max(0, limit - quota.remaining),
    limit,
    remaining: quota.remaining,
    blocked: !quota.allowed,
    reason: quota.reason,
  }
}

/* ------------------------------------------------------------------ */
/* Boshlang'ich takliflar (zaif tomonlarga bog'langan)                 */
/* ------------------------------------------------------------------ */

const GENERIC_STARTERS: StarterPrompt[] = [
  {
    label: 'Present Perfect — kompaniya natijalari',
    prompt:
      'Explain how to use the Present Perfect when I describe my company’s results this year. Give me three example sentences with revenue, market share and costs, then ask me to write one myself.',
  },
  {
    label: 'Kollokatsiyalar: profit',
    prompt:
      'Which verbs collocate with "profit" in business English? Show the five most common combinations with an example sentence each, and tell me two combinations that English does NOT use.',
  },
  {
    label: 'Grafikni izohlash',
    prompt:
      'Teach me the language for describing a line chart of inflation over five years: verbs of change, adverbs of degree and prepositions. Then give me a short chart description task.',
  },
  {
    label: 'Rasmiy e-mail uslubi',
    prompt:
      'What is the difference between a formal and a neutral register in a business e-mail? Show me one sentence rewritten at three levels of formality, then give me a sentence to rewrite.',
  },
]

const SKILL_STARTERS: Partial<Record<Skill, StarterPrompt>> = {
  vocabulary: {
    label: 'Lug‘atni mustahkamlash',
    prompt:
      'My vocabulary is my weakest skill. Teach me five high-frequency economics terms I probably do not know yet at my level, each with a collocation, an example sentence from a report, and a short task for me.',
  },
  grammar: {
    label: 'Grammatikani mustahkamlash',
    prompt:
      'Grammar is my weakest skill. Diagnose me: ask me five short questions about tenses in an economic context, wait for my answers, then explain every mistake with why → how to fix → where else it applies.',
  },
  pronunciation: {
    label: 'Talaffuzni yaxshilash',
    prompt:
      'Help me with the pronunciation of economics terms. Give me ten key terms with IPA and stress marks, group them by the stress pattern, and tell me which ones Uzbek speakers usually get wrong.',
  },
  writing: {
    label: 'Yozma nutqni yaxshilash',
    prompt:
      'Writing is my weakest skill. Give me a short business e-mail task at my level, then wait for my draft and give me feedback on register, structure and grammar.',
  },
  speaking: {
    label: 'Og‘zaki nutqni yaxshilash',
    prompt:
      'Speaking is my weakest skill. Give me five useful phrases for taking part in a business meeting, then start a short practice dialogue where you play my manager.',
  },
  listening: {
    label: 'Tinglashni yaxshilash',
    prompt:
      'Give me a short news-style paragraph about inflation, then ask me three comprehension questions about it and check my answers.',
  },
  reading: {
    label: 'O‘qishni yaxshilash',
    prompt:
      'Give me a short economic text at my level with three difficult terms, ask me to guess their meaning from context, and then explain them.',
  },
  professional: {
    label: 'Kasbiy ingliz tili',
    prompt:
      'Prepare me for a meeting with an international partner about our quarterly results: the phrases I need, the questions they may ask, and one practice question for me.',
  },
}

function errorTagStarter(tag: ErrorTag): StarterPrompt {
  const label = ERROR_TAG_LABELS[tag]
  return {
    label: `Takroriy xato: ${label?.uz ?? tag}`,
    prompt: `I keep making mistakes with ${label?.en ?? tag} in economics contexts. Explain the rule with why → how to fix → where else it applies, show three examples with economic vocabulary, and then give me four short exercises to check I understood.`,
  }
}

/* ------------------------------------------------------------------ */
/* Sahifa ma'lumoti                                                    */
/* ------------------------------------------------------------------ */

export const getAiTeacherData = cache(async (user: SessionUser): Promise<AiTeacherData> => {
  const [sessions, quota, userDoc, path, errorProfile, scenarioDocs] = await Promise.all([
    listAiSessions(user.uid),
    getQuotaInfo(user.uid),
    getUserDoc(user.uid),
    getLearningPath(user.uid),
    getErrorProfile(user.uid),
    listScenarios(),
  ])

  const profile = path?.linguisticProfile ?? {}
  const weakSkills: Skill[] = []
  for (const [skill, entry] of Object.entries(profile) as Array<[Skill, { score: number }]>) {
    if (!entry || typeof entry.score !== 'number') continue
    const label = scoreToLabel(entry.score)
    if (label === 'weak' || label === 'needs_improvement') weakSkills.push(skill)
  }

  const topTags = (errorProfile?.topTags ?? []).slice(0, 2)

  const starters: StarterPrompt[] = []
  for (const skill of weakSkills.slice(0, 2)) {
    const starter = SKILL_STARTERS[skill]
    if (starter) starters.push(starter)
  }
  for (const tag of topTags) starters.push(errorTagStarter(tag))
  for (const starter of GENERIC_STARTERS) {
    if (starters.length >= 4) break
    starters.push(starter)
  }

  const scenarios: ScenarioSummary[] = scenarioDocs.map((doc) => ({
    id: doc.id,
    persona: doc.persona,
    title: doc.title,
    context: doc.context,
    goals: doc.goals ?? [],
    successCriteria: doc.successCriteria ?? [],
    openingLine: doc.openingLine,
    cefr: doc.cefr,
    domain: doc.domain,
    scaffoldLevel: doc.scaffoldLevel,
  }))

  const cefr: CefrLevel = userDoc?.onboarding?.selfAssessedLevel ?? 'B1'

  return {
    sessions,
    starters: starters.slice(0, 4),
    scenarios,
    quota,
    cefr,
    weaknesses: [
      ...weakSkills.map((skill) => SKILL_LABELS[skill].uz),
      ...topTags.map((tag) => ERROR_TAG_LABELS[tag]?.uz ?? tag),
    ],
  }
})
