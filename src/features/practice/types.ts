import type {
  CefrLevel,
  Domain,
  ErrorTag,
  ItemType,
  Skill,
} from '@/config/constants'
import type { ItemExplanation, ItemOption } from '@/types'

/**
 * Mashq itemining KLIENTGA yuboriladigan proyeksiyasi.
 *
 * MUHIM: `answerKey`, `pairs` va `explanation` bu yerda YO'Q — javob kaliti
 * hech qachon brauzerga yuborilmaydi. Talaba javob bergandan keyingina
 * server action to'g'ri javobni va izohni qaytaradi (PLAN 10 — xavfsizlik).
 */
export interface RunnerItem {
  id: string
  type: ItemType
  skill: Skill
  topic: string
  domain: Domain
  cefr: CefrLevel
  difficulty: number
  stem: string
  instruction?: string
  /** mcq — aralashtirilgan variantlar */
  options?: ItemOption[]
  /** matching — chap ustun (asl tartibda) */
  left?: string[]
  /** matching — o'ng ustun (aralashtirilgan) */
  right?: string[]
  /** classification — tasniflanadigan elementlar (aralashtirilgan) */
  elements?: string[]
  /** classification — savatchalar */
  categories?: string[]
  /** word_order — aralashtirilgan so'z chiplari */
  chips?: string[]
  /** gap_fill va matnli turlar uchun bo'shliqlar soni */
  blanks: number
  audioUrl?: string
  tags: string[]
}

/** Javobdan keyin serverdan qaytadigan to'liq feedback. */
export interface AnswerFeedback {
  itemId: string
  isCorrect: boolean
  /** 0..1 — qisman ball (matching/classification/word_order) */
  score: number
  /** Har bo'lak bo'yicha natija (inline belgilash uchun) */
  parts?: boolean[]
  /** «Nima uchun → qanday tuzatish → yana qayerda» — HAR DOIM to'ldiriladi */
  explanation: ItemExplanation
  /** To'g'ri javob (faqat javob berilgandan keyin) */
  correctAnswer: string
  errorTags: ErrorTag[]
  xpAwarded: number
  leveledUp: boolean
  leveledDown: boolean
  needsReteach: boolean
  mastered: boolean
  /** Yangi difficulty (1..5) */
  difficulty: number
  streakCorrect: number
  streakWrong: number
  /** Javobni AI baholadimi (eksperimental guruh, ochiq javoblar) */
  aiGraded: boolean
  /** Ochiq javob uchun namunaviy javob */
  modelAnswer?: string
}

/** Sessiya yakuni — klientda hisoblanadi, serverga log uchun yuboriladi. */
export interface SessionSummary {
  total: number
  correct: number
  accuracy: number
  xp: number
  totalTimeMs: number
  hintsUsed: number
  bestStreak: number
  errorTags: Array<{ tag: ErrorTag; count: number }>
  weakestTopic: string | null
}

/** Mashq maydoni (hub) uchun bitta ko'nikma kartasi. */
export interface SkillPracticeCard {
  skill: Skill
  /** 0..100 */
  mastery: number
  difficulty: number
  attempts: number
  correct: number
  itemCount: number
  dueCount: number
  topics: Array<{ topic: string; mastery: number; attempts: number }>
}
