import type { AiPersona, CefrLevel, Domain, PromptLevel } from '@/config/constants'

/** Klientdagi chat xabari (Firestore hujjatiga to'liq mos emas — UI holati bor). */
export interface ChatMessage {
  /** Klient tomonda generatsiya qilinadigan barqaror kalit */
  key: string
  role: 'user' | 'assistant'
  content: string
  /** "Foydali bo'ldimi?" — tadqiqot ma'lumoti */
  helpful?: boolean | null
  /** Oqim davom etayotgan xabar */
  streaming?: boolean
  /** Role-play yakuniy feedbacki */
  isFeedback?: boolean
}

export interface SessionSummary {
  id: string
  title: string
  mode: 'tutor' | 'roleplay' | 'explain' | 'vocab_teach' | 'writing_review' | 'prompt_eval'
  persona?: AiPersona
  scenarioId?: string
  messageCount: number
  lastMessageAt: number
}

export interface StarterPrompt {
  label: string
  prompt: string
}

export interface QuotaInfo {
  used: number
  limit: number
  remaining: number
  blocked: boolean
  reason?: string
}

export interface ScenarioSummary {
  id: string
  persona: AiPersona
  title: string
  context: string
  goals: string[]
  successCriteria: string[]
  openingLine: string
  cefr: CefrLevel
  domain: Domain
  scaffoldLevel: PromptLevel
}

export interface AiTeacherData {
  sessions: SessionSummary[]
  starters: StarterPrompt[]
  scenarios: ScenarioSummary[]
  quota: QuotaInfo
  cefr: CefrLevel
  weaknesses: string[]
}
