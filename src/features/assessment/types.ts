/**
 * Assessment Center tiplari (PLAN.md 8.11, 2- va 8-bosqichlar).
 *
 * MUHIM: bu yerdagi `Runner*` tiplari — KLIENTGA uzatiladigan XAVFSIZ ko'rinish.
 * `ItemDoc.answerKey`, `pairs` va `explanation` hech qachon test topshirilayotgan
 * paytda brauzerga yuborilmaydi (eksperiment yaxlitligi: talaba tarmoq
 * so'rovidan javoblarni o'qiy olmasligi kerak).
 */

import type { CefrLevel, ErrorTag, ItemType, Skill } from '@/config/constants'
import type { ItemOption, TestAttemptDoc, TestDoc, TimeValue } from '@/types'

/* ------------------------------------------------------------------ */
/* Klientga uzatiladigan test tuzilmasi                                */
/* ------------------------------------------------------------------ */

export interface RunnerItem {
  id: string
  type: ItemType
  skill: Skill
  topic: string
  cefr: CefrLevel
  difficulty: number
  stem: string
  instruction?: string
  options?: ItemOption[]
  /** mcq: bir nechta to'g'ri variant bormi (checkbox rejimi) */
  multi?: boolean
  /** Item darajasidagi audio (listening) */
  audioUrl?: string
  /** matching: chap ustun (tartib saqlanadi) */
  lefts?: string[]
  /** matching: aralashtirilgan o'ng ustun */
  rights?: string[]
  /** classification: aralashtirilgan elementlar */
  elements?: string[]
  /** classification: kategoriyalar */
  categories?: string[]
  /** word_order: aralashtirilgan so'zlar */
  scrambled?: string[]
  /** gap_fill: bo'shliqlar soni (stem ichidagi `___` bo'yicha) */
  blanks?: number
  /** Ochiq (AI/o'qituvchi baholaydigan) turmi */
  open?: boolean
}

export type OpenAnswerKind = 'text' | 'audio'

export interface RunnerOpenTask {
  prompt: string
  minWords?: number
  referenceText?: string
  kind: OpenAnswerKind
}

export interface RunnerSection {
  id: string
  skill: Skill
  title: string
  timeLimitMin?: number
  maxScore: number
  items: RunnerItem[]
  /** reading: savollar ustida ko'rsatiladigan matn */
  passage?: string
  /** listening: TTS uchun matn (audio fayl bo'lmasa) */
  script?: string
  openTask?: RunnerOpenTask
}

export interface RunnerTest {
  id: string
  title: string
  type: TestDoc['type']
  variant?: string
  sections: RunnerSection[]
  totalMaxScore: number
}

/* ------------------------------------------------------------------ */
/* Urinish holati (autosave)                                           */
/* ------------------------------------------------------------------ */

/** itemId → javob (har doim `string[]`, `AttemptDoc.answer` bilan bir xil). */
export type AnswerMap = Record<string, string[]>

export interface OpenAnswerState {
  text?: string
  audioPath?: string
  durationSec?: number
  wordCount?: number
}

/** sectionId → ochiq topshiriq javobi. */
export type OpenAnswerMap = Record<string, OpenAnswerState>

export interface AttemptProgress {
  sectionIndex: number
  itemIndex: number
  /** sectionId → bo'lim boshlangan vaqt (ms). Sahifa yangilansa taymer tiklanmaydi. */
  sectionStartedAt: Record<string, number>
  /** Vaqti tugagan bo'limlar — qaytib kirib bo'lmaydi. */
  lockedSections: string[]
  updatedAt?: number
}

export interface OpenSubmissionRecord {
  sectionId: string
  skill: Skill
  text?: string
  audioPath?: string
  durationSec?: number
  wordCount?: number
  score?: number
  /** `writingSubmissions` / `speakingSubmissions` hujjati (o'qituvchi navbati) */
  submissionId?: string
  submissionKind?: 'writing' | 'speaking'
  status: 'pending' | 'graded'
}

/**
 * Firestore `testAttempts/{id}` hujjatining kengaytirilgan ko'rinishi.
 * `TestAttemptDoc` ustiga autosave va deterministik baholash uchun zarur
 * qo'shimcha maydonlar qo'shiladi (sxema o'zgartirilmaydi — faqat kengaytiriladi).
 */
export interface AttemptRecord extends Omit<TestAttemptDoc, 'openSubmissions'> {
  openSubmissions?: OpenSubmissionRecord[]
  progress?: AttemptProgress
  /** Shu urinishdagi xato teglari (natijalar sahifasidagi "asosiy xatolar") */
  errorTagCounts?: Partial<Record<ErrorTag, number>>
  /** Hali baholanmagan (ochiq) bo'limlar */
  pendingSections?: string[]
  teacherComment?: { text: string; byUid: string; at: TimeValue }
  testTitle?: string
  /** Keshlangan AI Feedback Report — faqat `aiFeedback` bayrog'i yoqilgan guruhda */
  aiFeedbackReport?: FeedbackReportView
  aiFeedbackAt?: TimeValue
}

export interface AttemptSummary {
  id: string
  testId: string
  testTitle: string
  type: TestDoc['type']
  status: AttemptRecord['status']
  percent: number
  totalScore: number
  totalMax: number
  startedAt: number
  finishedAt: number
}

/* ------------------------------------------------------------------ */
/* Assessment Center hub                                               */
/* ------------------------------------------------------------------ */

export type TestAvailability =
  | { state: 'available' }
  | { state: 'not_assigned' }
  | { state: 'not_open'; from: number }
  | { state: 'closed'; to: number }

export interface AssessmentTestCard {
  test: { id: string; title: string; type: TestDoc['type']; sectionCount: number; itemCount: number }
  availability: TestAvailability
  /** Tugallangan oxirgi urinish */
  lastAttempt: AttemptSummary | null
  /** Davom etayotgan urinish (autosave) */
  inProgressAttemptId: string | null
}

/* ------------------------------------------------------------------ */
/* Server action yuklamalari                                           */
/* ------------------------------------------------------------------ */

export interface AutosavePayload {
  answers: AnswerMap
  open: OpenAnswerMap
  progress: AttemptProgress
}

export interface StartAttemptResult {
  attemptId: string
  resumed: boolean
  answers: AnswerMap
  open: OpenAnswerMap
  progress: AttemptProgress
}

export interface SubmitAttemptResult {
  attemptId: string
  percent: number
  pathGenerated: boolean
}

/* ------------------------------------------------------------------ */
/* AI Feedback Report (8-bosqich) — klient tomonda ishlatiladigan shakl */
/* ------------------------------------------------------------------ */

export interface FeedbackReportView {
  strengths: string[]
  areasToImprove: string[]
  nextSteps: string[]
  skillNotes: Array<{ skill: string; note: string }>
  encouragement?: string
}
