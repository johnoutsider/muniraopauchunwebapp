import type { CefrLevel } from '@/config/constants'
import type { WritingAiFeedback, WritingSubmissionDoc } from '@/types'

import type { WritingGenre, WritingTask } from './genres'

export interface DraftSummary {
  index: number
  text: string
  wordCount: number
  hasFeedback: boolean
  ts: number
}

export interface SubmissionSummary {
  id: string
  taskId: string
  taskTitle: string
  genre: WritingGenre
  status: WritingSubmissionDoc['status']
  wordCount: number
  draftCount: number
  hasTeacherFeedback: boolean
  createdAt: number
  submittedAt: number | null
}

export interface SubmissionDetail extends SubmissionSummary {
  drafts: DraftSummary[]
  /** Oxirgi qoralamaning matni — muharrirda ochiladi */
  currentText: string
  /** Oxirgi qoralamaga biriktirilgan AI feedback */
  currentFeedback: WritingAiFeedback | null
  teacherFeedback: { text: string; score?: number } | null
  rubricScores: Partial<Record<string, number>>
}

export interface WritingLabData {
  tasks: WritingTask[]
  submissions: SubmissionSummary[]
  cefr: CefrLevel
  knownWeaknesses: string[]
}
