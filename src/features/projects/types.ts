import type { CaseStudyTask, ContributionDoc, ProjectDoc, TimeValue, UserDoc } from '@/types'

/** Loyiha ish zonasi tiplari (PLAN 8.10, 7-bosqich). */

export type ProjectRow = ProjectDoc & { id: string }

export type TaskKind = CaseStudyTask['kind']

export const TASK_KIND_META: Record<TaskKind, { uz: string; hint: string }> = {
  read: { uz: 'Matnni o‘qish', hint: 'Keys matnini o‘qing va asosiy faktlarni belgilang.' },
  analyze_chart: {
    uz: 'Grafik tahlili',
    hint: 'Grafikni o‘qing va trendni ingliz tilida tasvirlang.',
  },
  select_vocab: {
    uz: 'Lug‘at tanlash',
    hint: 'Kerakli terminlarni tanlab, tanlovingizni asoslang.',
  },
  use_grammar: { uz: 'Grammatika', hint: 'Talab qilingan strukturalar bo‘yicha misol yozing.' },
  explain_problem: {
    uz: 'Muammoni tushuntirish',
    hint: 'Speaking Lab’da og‘zaki izoh yozib oling.',
  },
  group_discuss: {
    uz: 'Guruh muhokamasi',
    hint: 'Jamoa kanalida muhokama qiling va qaror qabul qiling.',
  },
  propose_solution: { uz: 'Yechim taklifi', hint: 'Umumiy hujjatda yechimni yozing.' },
  write_report: { uz: 'Hisobot yozish', hint: 'Rasmiy hisobotni umumiy hujjatda tayyorlang.' },
  presentation: { uz: 'Prezentatsiya', hint: 'Slaydlarni yuklang va taqdimotni yozib oling.' },
}

export const PROJECT_ROLE_LABELS: Record<string, string> = {
  analyst: 'Tahlilchi',
  writer: 'Matn muallifi',
  presenter: 'Taqdimotchi',
  researcher: 'Tadqiqotchi',
  coordinator: 'Koordinator',
}

export const PROJECT_STATUS_LABELS: Record<ProjectDoc['status'], string> = {
  active: 'Faol',
  submitted: 'Topshirilgan',
  graded: 'Baholangan',
}

/** Prezentatsiya fayli: PDF yoki PPTX, 25 MB gacha (storage.rules bilan mos). */
export const PRESENTATION_MAX_BYTES = 25 * 1024 * 1024
export const PRESENTATION_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
] as const

export function isPresentationFile(file: { name: string; type: string }): boolean {
  if ((PRESENTATION_TYPES as readonly string[]).includes(file.type)) return true
  return /\.(pdf|pptx|ppt)$/i.test(file.name)
}

/** Umumiy hujjat saqlanishi ~2 soniyaga kechiktiriladi. */
export const SHARED_DOC_DEBOUNCE_MS = 2000

/* ------------------------------------------------------------------ */
/* Topshiriq bo'yicha saqlanadigan ish (projects/{id}/taskWork/{taskId}) */
/* ------------------------------------------------------------------ */

export interface VocabChoice {
  word: string
  selected: boolean
  justification: string
}

export interface GrammarExample {
  structure: string
  example: string
}

export interface TaskWorkDoc {
  taskId: string
  kind: TaskKind
  /** analyze_chart / read uchun erkin matn */
  text?: string
  vocab?: VocabChoice[]
  grammar?: GrammarExample[]
  updatedByUid?: string
  updatedByName?: string
  updatedAt?: TimeValue
}

export type TaskWorkRow = TaskWorkDoc & { id: string }

/* ------------------------------------------------------------------ */
/* Ish zonasi uchun yig'ma ma'lumot                                     */
/* ------------------------------------------------------------------ */

export interface SharedDocState {
  solution: string
  report: string
  version: number
  lastEditedByName?: string
  lastEditedAt?: TimeValue
}

export interface ProjectWorkspaceData {
  project: ProjectRow
  caseStudy: {
    id: string
    title: string
    scenario: string
    domain: string
    cefr: string
    chartData?: Array<Record<string, unknown>>
    chartType?: 'line' | 'bar'
    chartCaption?: string
    tasks: CaseStudyTask[]
    requiredVocab: string[]
    requiredGrammar: string[]
    rubric: string[]
  } | null
  contributions: Array<ContributionDoc & { id: string }>
  taskWork: TaskWorkRow[]
  shared: SharedDocState
  chatId: string | null
  members: Array<UserDoc & { id: string }>
}

/** Keys-stadi kartasi uchun taxminiy mehnat hajmi. */
export function estimateEffortMinutes(tasks: CaseStudyTask[]): number {
  return tasks.reduce((total, task) => {
    const writing = task.minWords ? Math.ceil(task.minWords / 8) : 0
    const speaking = task.minSeconds ? Math.ceil(task.minSeconds / 60) : 0
    return total + 15 + writing + speaking
  }, 0)
}

/** Umumiy hujjatni saqlash natijasi (optimistik versiya nazorati). */
export type SharedDocSaveResult =
  | { status: 'saved'; version: number; wordsAdded: number }
  | { status: 'conflict'; version: number; text: string; byName?: string }
