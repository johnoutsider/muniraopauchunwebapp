import type { CefrLevel } from '@/config/constants'
import type { AzureAssessment, SpeakingAiFeedback, SpeakingSubmissionDoc } from '@/types'

export type SpeakingTaskType = SpeakingSubmissionDoc['type']

export interface SpeakingTask {
  id: string
  type: SpeakingTaskType
  title: string
  /** Talaba o'qishi kerak bo'lgan matn. Bo'sh bo'lsa — erkin nutq (unscripted). */
  referenceText: string
  instruction: string
  /** So'z topshirig'i uchun transkripsiya */
  ipa?: string
  /** Tavsiya etilgan minimal davomiylik (prezentatsiya uchun) */
  minSeconds?: number
  source: 'builtin' | 'lexicon' | 'case' | 'path'
  cefr?: CefrLevel
}

export interface ProblematicSound {
  phoneme: string
  words: string[]
  avgScore: number
}

/** `POST /api/speech/assess` javobi */
export interface AssessResponse {
  id: string
  assessment: AzureAssessment
  problematicSounds: ProblematicSound[]
  attemptNo: number
  aiFeedbackAvailable: boolean
}

export interface AttemptSummary {
  id: string
  taskId: string
  taskTitle: string
  type: SpeakingTaskType
  attemptNo: number
  pronScore: number
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
  prosodyScore: number | null
  durationSec: number
  hasAiFeedback: boolean
  ts: number
}

export interface SpeakingLabData {
  tasks: SpeakingTask[]
  recentAttempts: AttemptSummary[]
  cefr: CefrLevel
}

export interface SubmissionDetail {
  id: string
  taskId: string
  taskTitle: string
  type: SpeakingTaskType
  referenceText: string
  transcript: string
  durationSec: number
  attemptNo: number
  azure: AzureAssessment | null
  aiFeedback: SpeakingAiFeedback | null
  problematicSounds: ProblematicSound[]
  teacherFeedback: { text: string; score?: number } | null
  ts: number
}
