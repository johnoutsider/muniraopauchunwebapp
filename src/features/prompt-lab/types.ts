import type { CefrLevel, PromptLevel } from '@/config/constants'

import type { PromptExerciseItem } from './content'

/** Talabaning Prompt Lab bo'yicha holati (`users/{uid}.promptLab`). */
export interface PromptLabProgress {
  level: PromptLevel
  /** Bajarilgan mashqlar id lari */
  completed: string[]
  /** Mashq → eng yaxshi umumiy ball (0..25) */
  bestScores: Record<string, number>
  /** Tekshirish mashqlari id lari */
  verified: string[]
  /** «Oddiy» darajada to'g'ri bajarilgan mashqlar soni (daraja ochilishi uchun) */
  simpleCorrect: number
  attempts: number
  updatedAt: number
}

export const EMPTY_PROGRESS: PromptLabProgress = {
  level: 'simple',
  completed: [],
  bestScores: {},
  verified: [],
  simpleCorrect: 0,
  attempts: 0,
  updatedAt: 0,
}

export interface PromptLabData {
  exercises: PromptExerciseItem[]
  progress: PromptLabProgress
  cefr: CefrLevel
}

/** `POST /api/ai/prompt-eval` javobi (`PromptEvalSchema`). */
export interface PromptEvalResult {
  scores: {
    specificity: number
    context: number
    level: number
    format: number
    honesty: number
  }
  totalScore: number
  feedback: string
  improvedPrompt: string
  nextLevel: PromptLevel
}

export const CRITERION_LABELS: Record<
  keyof PromptEvalResult['scores'],
  { uz: string; hint: string }
> = {
  specificity: {
    uz: 'Aniqlik',
    hint: 'Nima so‘ralgani, nechta va qanday natija kutilayotgani aniqmi?',
  },
  context: {
    uz: 'Kontekst',
    hint: 'Kasbiy mavzu va vaziyat berilganmi (iqtisodiyot, hisobot, muzokara)?',
  },
  level: { uz: 'Daraja', hint: 'CEFR darajasi yoki til murakkabligi ko‘rsatilganmi?' },
  format: { uz: 'Format', hint: 'Natija ko‘rinishi so‘ralganmi (ro‘yxat, jadval, javob kaliti)?' },
  honesty: {
    uz: 'Halollik',
    hint: 'AI ishni siz uchun bajarib bermasligi shart qilib qo‘yilganmi?',
  },
}
