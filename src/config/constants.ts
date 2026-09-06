/**
 * Platformaning markaziy konstantalari.
 * PLAN.md 4, 5, 6, 8-bo'limlariga mos.
 */

export const APP_NAME = 'LinguaEcon AI'
export const APP_TAGLINE = 'AI-based Professional English for Economics Students'

/* ------------------------------------------------------------------ */
/* CEFR va ko'nikmalar                                                  */
/* ------------------------------------------------------------------ */

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

export const SKILLS = [
  'vocabulary',
  'grammar',
  'pronunciation',
  'listening',
  'reading',
  'writing',
  'speaking',
  'professional',
] as const
export type Skill = (typeof SKILLS)[number]

export const SKILL_LABELS: Record<Skill, { uz: string; en: string; icon: string }> = {
  vocabulary: { uz: 'Lug‘at', en: 'Vocabulary', icon: 'BookA' },
  grammar: { uz: 'Grammatika', en: 'Grammar', icon: 'Braces' },
  pronunciation: { uz: 'Talaffuz', en: 'Pronunciation', icon: 'AudioLines' },
  listening: { uz: 'Tinglash', en: 'Listening', icon: 'Headphones' },
  reading: { uz: 'O‘qish', en: 'Reading', icon: 'BookOpen' },
  writing: { uz: 'Yozish', en: 'Writing', icon: 'PenLine' },
  speaking: { uz: 'Gapirish', en: 'Speaking', icon: 'Mic' },
  professional: { uz: 'Kasbiy ingliz tili', en: 'Professional English', icon: 'Briefcase' },
}

/** Diagnostikada ishlatiladigan daraja yorlig'i (PLAN 5, 2-bosqich) */
export const PROFICIENCY_LABELS = ['weak', 'needs_improvement', 'intermediate', 'strong'] as const
export type ProficiencyLabel = (typeof PROFICIENCY_LABELS)[number]

export function scoreToLabel(score: number): ProficiencyLabel {
  if (score < 40) return 'weak'
  if (score < 60) return 'needs_improvement'
  if (score < 80) return 'intermediate'
  return 'strong'
}

export const PROFICIENCY_LABEL_TEXT: Record<ProficiencyLabel, { uz: string; en: string }> = {
  weak: { uz: 'Zaif', en: 'Weak' },
  needs_improvement: { uz: 'Yaxshilash kerak', en: 'Needs improvement' },
  intermediate: { uz: 'O‘rta', en: 'Intermediate' },
  strong: { uz: 'Kuchli', en: 'Strong' },
}

/* ------------------------------------------------------------------ */
/* Kasbiy sohalar (professional domains)                                */
/* ------------------------------------------------------------------ */

export const DOMAINS = [
  'general',
  'academic',
  'economics',
  'finance',
  'banking',
  'marketing',
  'management',
  'business_communication',
] as const
export type Domain = (typeof DOMAINS)[number]

export const DOMAIN_LABELS: Record<Domain, { uz: string; en: string }> = {
  general: { uz: 'Umumiy', en: 'General' },
  academic: { uz: 'Akademik', en: 'Academic' },
  economics: { uz: 'Iqtisodiyot', en: 'Economics' },
  finance: { uz: 'Moliya', en: 'Finance' },
  banking: { uz: 'Bank ishi', en: 'Banking' },
  marketing: { uz: 'Marketing', en: 'Marketing' },
  management: { uz: 'Menejment', en: 'Management' },
  business_communication: { uz: 'Biznes muloqot', en: 'Business Communication' },
}

/* ------------------------------------------------------------------ */
/* 8 bosqichli o'quv algoritmi (PLAN 5-bo'lim)                          */
/* ------------------------------------------------------------------ */

export const STAGES = [1, 2, 3, 4, 5, 6, 7, 8] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_META: Record<
  Stage,
  { phase: 'organizational' | 'practical' | 'reflective'; uz: string; en: string; href: string }
> = {
  1: {
    phase: 'organizational',
    uz: 'Maqsadni belgilash va o‘quv faoliyatini tashkil etish',
    en: 'Goal setting and organisation',
    href: '/student/path',
  },
  2: {
    phase: 'organizational',
    uz: 'Diagnostika va differensiallashtirish',
    en: 'Diagnostics and differentiation',
    href: '/student/assessment/diagnostic',
  },
  3: {
    phase: 'organizational',
    uz: 'AI bilan ishlashga metodik tayyorgarlik',
    en: 'Methodical preparation for AI',
    href: '/student/prompt-lab',
  },
  4: {
    phase: 'practical',
    uz: 'O‘rgatuvchi bosqich',
    en: 'Instructional stage',
    href: '/student/learn',
  },
  5: {
    phase: 'practical',
    uz: 'Mashq qilish va avtomatlashtirish',
    en: 'Practice and automatisation',
    href: '/student/practice',
  },
  6: {
    phase: 'practical',
    uz: 'Produktiv-kommunikativ bosqich',
    en: 'Productive-communicative stage',
    href: '/student/ai-teacher',
  },
  7: {
    phase: 'practical',
    uz: 'Integrativ-kasbiy faoliyat',
    en: 'Integrative professional activity',
    href: '/student/projects',
  },
  8: {
    phase: 'reflective',
    uz: 'Baholash, feedback va refleksiya',
    en: 'Assessment, feedback and reflection',
    href: '/student/reflection',
  },
}

/* ------------------------------------------------------------------ */
/* Mashq turlari (PLAN 8.2)                                             */
/* ------------------------------------------------------------------ */

export const ITEM_TYPES = [
  'mcq',
  'gap_fill',
  'matching',
  'classification',
  'transformation',
  'error_correction',
  'expansion',
  'word_order',
  'imitation',
  'substitution',
  'open_writing',
  'speaking_prompt',
] as const
export type ItemType = (typeof ITEM_TYPES)[number]

export const ITEM_TYPE_LABELS: Record<ItemType, { uz: string; en: string; stage: Stage }> = {
  matching: { uz: 'Moslashtirish', en: 'Matching', stage: 4 },
  classification: { uz: 'Tasniflash', en: 'Classification', stage: 4 },
  mcq: { uz: 'Variant tanlash', en: 'Multiple choice', stage: 4 },
  imitation: { uz: 'Namuna asosida', en: 'Imitation', stage: 4 },
  substitution: { uz: 'O‘rin almashtirish', en: 'Substitution', stage: 4 },
  transformation: { uz: 'Transformatsiya', en: 'Transformation', stage: 5 },
  gap_fill: { uz: 'Bo‘shliqni to‘ldirish', en: 'Fill in the gaps', stage: 5 },
  error_correction: { uz: 'Xatoni tuzatish', en: 'Error correction', stage: 5 },
  expansion: { uz: 'Gapni kengaytirish', en: 'Sentence expansion', stage: 5 },
  word_order: { uz: 'So‘z tartibi', en: 'Word order', stage: 5 },
  open_writing: { uz: 'Erkin yozish', en: 'Open writing', stage: 6 },
  speaking_prompt: { uz: 'Gapirish topshirig‘i', en: 'Speaking task', stage: 6 },
}

/* ------------------------------------------------------------------ */
/* Xatolar taksonomiyasi (errorTags) — PLAN 6.5, 8.5, 9.1              */
/* ------------------------------------------------------------------ */

export const ERROR_TAGS = [
  'tense',
  'aspect',
  'passive_voice',
  'modal_verbs',
  'conditionals',
  'reported_speech',
  'articles',
  'prepositions',
  'word_order',
  'agreement',
  'comparatives',
  'linking_devices',
  'wrong_word',
  'collocation',
  'word_formation',
  'register',
  'terminology',
  'false_friend',
  'coherence',
  'task_achievement',
  'spelling',
  'punctuation',
  'phoneme',
  'word_stress',
  'sentence_stress',
  'intonation',
  'fluency',
] as const
export type ErrorTag = (typeof ERROR_TAGS)[number]

export const ERROR_TAG_LABELS: Partial<Record<ErrorTag, { uz: string; en: string }>> = {
  tense: { uz: 'Zamon', en: 'Verb tense' },
  articles: { uz: 'Artikllar', en: 'Articles' },
  prepositions: { uz: 'Predloglar', en: 'Prepositions' },
  collocation: { uz: 'Kollokatsiya', en: 'Collocation' },
  word_order: { uz: 'So‘z tartibi', en: 'Word order' },
  word_stress: { uz: 'So‘z urg‘usi', en: 'Word stress' },
  sentence_stress: { uz: 'Gap urg‘usi', en: 'Sentence stress' },
  intonation: { uz: 'Intonatsiya', en: 'Intonation' },
  fluency: { uz: 'Ravonlik', en: 'Fluency' },
  phoneme: { uz: 'Tovush', en: 'Sound' },
  terminology: { uz: 'Terminologiya', en: 'Terminology' },
  register: { uz: 'Uslub', en: 'Register' },
  agreement: { uz: 'Moslashuv', en: 'Agreement' },
  spelling: { uz: 'Imlo', en: 'Spelling' },
  coherence: { uz: 'Izchillik', en: 'Coherence' },
}

/* ------------------------------------------------------------------ */
/* Grammatik mavzular — iqtisodiy kontekstda (PLAN 8.2)                */
/* ------------------------------------------------------------------ */

export const GRAMMAR_TOPICS = [
  {
    id: 'present_perfect',
    en: 'Present Perfect',
    context: 'company performance',
    cefr: 'B1' as CefrLevel,
  },
  { id: 'past_simple', en: 'Past Simple', context: 'business history', cefr: 'A2' as CefrLevel },
  {
    id: 'passive_voice',
    en: 'Passive Voice',
    context: 'economic reports',
    cefr: 'B1' as CefrLevel,
  },
  {
    id: 'conditionals',
    en: 'Conditionals',
    context: 'business decisions',
    cefr: 'B2' as CefrLevel,
  },
  { id: 'modal_verbs', en: 'Modal Verbs', context: 'recommendations', cefr: 'B1' as CefrLevel },
  {
    id: 'reported_speech',
    en: 'Reported Speech',
    context: 'meetings and negotiations',
    cefr: 'B2' as CefrLevel,
  },
  { id: 'comparatives', en: 'Comparatives', context: 'market comparison', cefr: 'A2' as CefrLevel },
  {
    id: 'linking_devices',
    en: 'Linking Devices',
    context: 'reports and presentations',
    cefr: 'B2' as CefrLevel,
  },
] as const
export type GrammarTopicId = (typeof GRAMMAR_TOPICS)[number]['id']

/* ------------------------------------------------------------------ */
/* Rollar                                                               */
/* ------------------------------------------------------------------ */

export const ROLES = ['student', 'teacher', 'researcher', 'admin'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_HOME: Record<Role, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  researcher: '/researcher/dashboard',
  admin: '/admin/users',
}

export const EXPERIMENT_GROUPS = ['experimental', 'control'] as const
export type ExperimentGroup = (typeof EXPERIMENT_GROUPS)[number]

/* ------------------------------------------------------------------ */
/* Adaptiv dvigatel parametrlari (PLAN 6-bo'lim)                        */
/* ------------------------------------------------------------------ */

export const ADAPTIVE = {
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 5,
  LEVEL_UP_STREAK: 3,
  LEVEL_DOWN_STREAK: 2,
  MASTERY_THRESHOLD: 0.85,
  BKT: { pInit: 0.25, pLearn: 0.2, pGuess: 0.25, pSlip: 0.1 },
} as const

/** Difficulty (1..5) ↔ CEFR taxminiy mosligi */
export const DIFFICULTY_CEFR: Record<number, CefrLevel> = {
  1: 'A2',
  2: 'B1',
  3: 'B1',
  4: 'B2',
  5: 'C1',
}

/* ------------------------------------------------------------------ */
/* SRS (SM-2) — lug'at takrorlash                                       */
/* ------------------------------------------------------------------ */

export const SRS = {
  INITIAL_EASE: 2.5,
  MIN_EASE: 1.3,
  FIRST_INTERVAL_DAYS: 1,
  SECOND_INTERVAL_DAYS: 6,
} as const

/* ------------------------------------------------------------------ */
/* AI limitlari (PLAN 7.4)                                              */
/* ------------------------------------------------------------------ */

export const AI_LIMITS = {
  MESSAGES_PER_DAY: 60,
  TOKENS_PER_DAY: 120_000,
  MAX_INPUT_CHARS: 4000,
  GENERATION_MAX_ITEMS: 12,
} as const

/* ------------------------------------------------------------------ */
/* Audio (PLAN 8.3)                                                     */
/* ------------------------------------------------------------------ */

export const AUDIO = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  MAX_DURATION_SEC: 120,
  MAX_BYTES: 8 * 1024 * 1024,
} as const

/* ------------------------------------------------------------------ */
/* Gamifikatsiya (PLAN 8.12)                                            */
/* ------------------------------------------------------------------ */

export const XP = {
  ITEM_CORRECT: 10,
  ITEM_WRONG: 2,
  LESSON_COMPLETE: 50,
  SPEAKING_SUBMIT: 40,
  WRITING_SUBMIT: 60,
  REFLECTION: 25,
  TEST_COMPLETE: 100,
  DAILY_GOAL: 120,
} as const

export const LEVEL_THRESHOLDS = [0, 300, 800, 1600, 2800, 4500, 7000, 10000, 14000, 20000]

export function xpToLevel(xp: number): { level: number; next: number; progress: number } {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0
  const next = LEVEL_THRESHOLDS[level] ?? current + 6000
  return { level, next, progress: Math.min(100, ((xp - current) / (next - current)) * 100) }
}

/* ------------------------------------------------------------------ */
/* Rubrikalar (writing / speaking / project)                            */
/* ------------------------------------------------------------------ */

export const WRITING_RUBRIC = [
  'task_achievement',
  'vocabulary_range',
  'grammar_accuracy',
  'coherence',
  'register',
] as const
export type WritingRubricKey = (typeof WRITING_RUBRIC)[number]

export const SPEAKING_RUBRIC = [
  'pronunciation',
  'fluency',
  'vocabulary',
  'grammar',
  'interaction',
] as const
export type SpeakingRubricKey = (typeof SPEAKING_RUBRIC)[number]

export const PROJECT_RUBRIC = [
  'content_analysis',
  'professional_vocabulary',
  'grammar_accuracy',
  'communication',
  'critical_thinking',
  'teamwork',
] as const
export type ProjectRubricKey = (typeof PROJECT_RUBRIC)[number]

export const RUBRIC_LABELS: Record<string, { uz: string; en: string }> = {
  task_achievement: { uz: 'Topshiriqni bajarish', en: 'Task achievement' },
  vocabulary_range: { uz: 'Lug‘at boyligi', en: 'Vocabulary range' },
  grammar_accuracy: { uz: 'Grammatik aniqlik', en: 'Grammar accuracy' },
  coherence: { uz: 'Izchillik', en: 'Coherence' },
  register: { uz: 'Uslub', en: 'Register' },
  pronunciation: { uz: 'Talaffuz', en: 'Pronunciation' },
  fluency: { uz: 'Ravonlik', en: 'Fluency' },
  vocabulary: { uz: 'Lug‘at', en: 'Vocabulary' },
  grammar: { uz: 'Grammatika', en: 'Grammar' },
  interaction: { uz: 'Muloqot', en: 'Interaction' },
  content_analysis: { uz: 'Mazmun tahlili', en: 'Content analysis' },
  professional_vocabulary: { uz: 'Kasbiy lug‘at', en: 'Professional vocabulary' },
  communication: { uz: 'Kommunikatsiya', en: 'Communication' },
  critical_thinking: { uz: 'Tanqidiy fikrlash', en: 'Critical thinking' },
  teamwork: { uz: 'Jamoa ishi', en: 'Teamwork' },
}

/* ------------------------------------------------------------------ */
/* AI role-play personalari (PLAN 8.6)                                  */
/* ------------------------------------------------------------------ */

export const AI_PERSONAS = [
  'client',
  'manager',
  'interviewer',
  'business_partner',
  'economist',
  'investor',
] as const
export type AiPersona = (typeof AI_PERSONAS)[number]

export const PERSONA_LABELS: Record<AiPersona, { uz: string; en: string; emoji: string }> = {
  client: { uz: 'Mijoz', en: 'Client', emoji: '🧑‍💼' },
  manager: { uz: 'Menejer', en: 'Manager', emoji: '👔' },
  interviewer: { uz: 'Intervyu oluvchi', en: 'Interviewer', emoji: '🎙️' },
  business_partner: { uz: 'Biznes hamkor', en: 'Business partner', emoji: '🤝' },
  economist: { uz: 'Iqtisodchi', en: 'Economist', emoji: '📊' },
  investor: { uz: 'Investor', en: 'Investor', emoji: '💰' },
}

/* ------------------------------------------------------------------ */
/* Prompt scaffolding darajalari (PLAN 8.15)                            */
/* ------------------------------------------------------------------ */

export const PROMPT_LEVELS = ['simple', 'guided', 'independent'] as const
export type PromptLevel = (typeof PROMPT_LEVELS)[number]

/* ------------------------------------------------------------------ */
/* Event turlari (PLAN 4.4)                                             */
/* ------------------------------------------------------------------ */

export const EVENT_TYPES = [
  'login',
  'logout',
  'onboarding_complete',
  'consent_given',
  'lesson_view',
  'lesson_complete',
  'item_attempt',
  'practice_session',
  'ai_message',
  'ai_session_start',
  'speaking_submit',
  'writing_submit',
  'writing_revise',
  'chat_message',
  'forum_post',
  'peer_review',
  'reflection',
  'survey_submit',
  'test_start',
  'test_submit',
  'badge_earned',
  'path_generated',
  'prompt_practice',
  'corpus_check',
  'project_contribution',
  'vocab_review',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

/* ------------------------------------------------------------------ */
/* Firestore kolleksiya nomlari                                         */
/* ------------------------------------------------------------------ */

export const COL = {
  users: 'users',
  cohorts: 'cohorts',
  groups: 'groups',
  settings: 'settings',
  auditLogs: 'auditLogs',
  courses: 'courses',
  modules: 'modules',
  lessons: 'lessons',
  grammarLessons: 'grammarLessons',
  items: 'items',
  lexicon: 'lexicon',
  semanticNetworks: 'semanticNetworks',
  caseStudies: 'caseStudies',
  scenarios: 'scenarios',
  promptExercises: 'promptExercises',
  surveys: 'surveys',
  tests: 'tests',
  badges: 'badges',
  learningPaths: 'learningPaths',
  mastery: 'mastery',
  attempts: 'attempts',
  testAttempts: 'testAttempts',
  userVocab: 'userVocab',
  aiSessions: 'aiSessions',
  speakingSubmissions: 'speakingSubmissions',
  writingSubmissions: 'writingSubmissions',
  projects: 'projects',
  peerReviews: 'peerReviews',
  reflections: 'reflections',
  surveyResponses: 'surveyResponses',
  xpEvents: 'xpEvents',
  userBadges: 'userBadges',
  streaks: 'streaks',
  portfolioItems: 'portfolioItems',
  chats: 'chats',
  presence: 'presence',
  forumThreads: 'forumThreads',
  notifications: 'notifications',
  statsDaily: 'statsDaily',
  statsGroupDaily: 'statsGroupDaily',
  experiments: 'experiments',
  predictions: 'predictions',
  errorProfiles: 'errorProfiles',
  corpusDocs: 'corpusDocs',
  corpusNgrams: 'corpusNgrams',
  assignments: 'assignments',
} as const

/** Oylik event kolleksiyasi nomi: events_2027_01 */
export function eventsCollection(date: Date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `events_${y}_${m}`
}
