/**
 * Firestore hujjat tiplari (PLAN.md 4-bo'lim).
 * Barcha `ts`/`createdAt` maydonlari serverda `Timestamp`, klientda ISO string
 * yoki millisekund bo'lishi mumkin — shuning uchun `TimeValue` ishlatiladi.
 */

import type {
  AiPersona,
  CefrLevel,
  Domain,
  ErrorTag,
  EventType,
  ExperimentGroup,
  GrammarTopicId,
  ItemType,
  ProficiencyLabel,
  PromptLevel,
  Role,
  Skill,
  Stage,
} from '@/config/constants'

/** Firestore Timestamp | Date | ISO string | ms */
export type TimeValue = number | string | Date | { seconds: number; nanoseconds: number }

export interface WithId {
  id: string
}

/* ================================================================== */
/* 1. Foydalanuvchi va tashkilot                                       */
/* ================================================================== */

export interface FeatureFlags {
  aiTutor: boolean
  aiFeedback: boolean
  adaptive: boolean
  pronunciationAI: boolean
  aiRolePlay: boolean
  promptLab: boolean
  corpusVerification: boolean
  semanticNetwork: boolean
  gamification: boolean
  peerAssessment: boolean
  forum: boolean
}

/** Nazorat guruhi uchun standart: AI bilan bog'liq hamma narsa o'chirilgan (PLAN 1.5) */
export const CONTROL_GROUP_FLAGS: FeatureFlags = {
  aiTutor: false,
  aiFeedback: false,
  adaptive: false,
  pronunciationAI: false,
  aiRolePlay: false,
  promptLab: false,
  corpusVerification: false,
  semanticNetwork: false,
  gamification: true,
  peerAssessment: true,
  forum: true,
}

export const EXPERIMENTAL_GROUP_FLAGS: FeatureFlags = {
  aiTutor: true,
  aiFeedback: true,
  adaptive: true,
  pronunciationAI: true,
  aiRolePlay: true,
  promptLab: true,
  corpusVerification: true,
  semanticNetwork: true,
  gamification: true,
  peerAssessment: true,
  forum: true,
}

export interface OnboardingData {
  goal: string
  professionalTrack: Domain
  targetSkills: Skill[]
  weeklyMinutes: number
  selfAssessedLevel: CefrLevel
  completedAt?: TimeValue
}

export interface UserDoc {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: Role
  locale: 'uz' | 'en' | 'ru'
  university?: string
  faculty?: string
  cohortId?: string
  groupId?: string
  groupIds?: string[] // teacher
  expGroup?: ExperimentGroup
  participantCode?: string
  consentAt?: TimeValue | null
  consentGiven?: boolean
  onboarding?: OnboardingData
  status: 'active' | 'pending' | 'disabled'
  mustChangePassword?: boolean
  totalXp?: number
  createdAt: TimeValue
  lastActiveAt?: TimeValue
}

export interface CohortDoc {
  name: string
  university: string
  faculty?: string
  startDate: TimeValue
  endDate?: TimeValue
  teacherIds: string[]
  studentCount?: number
  createdAt: TimeValue
}

export interface GroupDoc {
  cohortId: string
  name: string
  type: ExperimentGroup
  teacherId?: string
  studentCount: number
  featureFlags: FeatureFlags
  createdAt: TimeValue
}

export interface GlobalSettingsDoc {
  featureFlags: Partial<FeatureFlags>
  models: { main: string; fast: string }
  limits: { messagesPerDay: number; tokensPerDay: number }
  announcement?: { text: string; level: 'info' | 'warning'; until?: TimeValue }
  maintenanceMode?: boolean
}

export interface AuditLogDoc {
  actorUid: string
  actorRole: Role
  action: string
  target?: string
  meta?: Record<string, unknown>
  ts: TimeValue
}

/* ================================================================== */
/* 2. O'quv kontenti                                                   */
/* ================================================================== */

export interface CourseDoc {
  title: string
  description: string
  cefrRange: [CefrLevel, CefrLevel]
  order: number
  published: boolean
  coverUrl?: string
  createdAt: TimeValue
}

export interface ModuleDoc {
  courseId: string
  title: string
  description?: string
  stage: Stage
  skill: Skill
  domain: Domain
  topicId?: GrammarTopicId | string
  order: number
  estimatedMin?: number
  published: boolean
}

export type LessonBlock =
  | { kind: 'text'; html: string }
  | { kind: 'video'; provider: 'youtube' | 'vimeo' | 'storage'; src: string; caption?: string }
  | { kind: 'infographic'; imageUrl: string; caption?: string }
  | {
      kind: 'chart'
      chartType: 'line' | 'bar' | 'pie'
      data: Array<Record<string, unknown>>
      caption?: string
    }
  | { kind: 'vocab'; wordIds: string[] }
  | { kind: 'grammar'; topicId: string; explanationHtml: string; examples: string[] }
  | { kind: 'pronunciation'; words: Array<{ word: string; ipa?: string }> }
  | { kind: 'exercises'; itemIds: string[]; title?: string }
  | { kind: 'ai_explain'; prompt: string; label: string }

export interface LessonDoc {
  moduleId: string
  courseId: string
  title: string
  summary?: string
  type: 'video' | 'interactive' | 'explanation'
  blocks: LessonBlock[]
  cefr: CefrLevel
  estimatedMin: number
  order: number
  published: boolean
  createdBy: string
  approvedBy?: string
  createdAt: TimeValue
}

export interface ItemOption {
  id: string
  text: string
}

export interface ItemExplanation {
  why: string
  how: string
  whereElse: string
}

export interface ItemDoc {
  type: ItemType
  skill: Skill
  topic: string
  domain: Domain
  cefr: CefrLevel
  difficulty: number // 1..5
  stem: string
  instruction?: string
  options?: ItemOption[]
  /** mcq: option id; gap_fill/transformation: qabul qilinadigan javoblar; matching: juftliklar */
  answerKey: string[]
  pairs?: Array<{ left: string; right: string }>
  categories?: string[]
  explanation: ItemExplanation
  errorTags: ErrorTag[]
  tags: string[]
  audioUrl?: string
  source: 'human' | 'ai'
  status: 'draft' | 'approved' | 'rejected'
  generatedFromPrompt?: string
  createdBy?: string
  approvedBy?: string
  stats?: { attempts: number; correct: number }
  createdAt: TimeValue
}

export interface LexiconExample {
  sentence: string
  source?: string
  translationUz?: string
}

export interface LexiconDoc {
  word: string
  lemma: string
  pos: string
  ipa?: string
  definitions: Array<{ text: string; textUz?: string; domain?: Domain }>
  domains: Domain[]
  cefr: CefrLevel
  collocations: Array<{ text: string; corpusCount?: number; verified?: boolean }>
  synonyms: string[]
  antonyms: string[]
  wordFamily: string[]
  examples: LexiconExample[]
  professionalContext: string
  communicativeTask?: string
  audioUrl?: string
  semanticLinks: Array<{ word: string; relation: string }>
  status: 'draft' | 'approved'
  createdAt: TimeValue
}

export interface SemanticNetworkDoc {
  seedWord: string
  domain: Domain
  nodes: Array<{ id: string; label: string; group?: string; definition?: string }>
  edges: Array<{ source: string; target: string; relation: string }>
  generatedBy: 'ai' | 'human'
  approved: boolean
  createdAt: TimeValue
}

export interface CaseStudyTask {
  id: string
  order: number
  kind:
    | 'read'
    | 'analyze_chart'
    | 'select_vocab'
    | 'use_grammar'
    | 'explain_problem'
    | 'group_discuss'
    | 'propose_solution'
    | 'write_report'
    | 'presentation'
  title: string
  instruction: string
  minWords?: number
  minSeconds?: number
}

export interface CaseStudyDoc {
  title: string
  scenario: string
  chartData?: Array<Record<string, unknown>>
  chartType?: 'line' | 'bar'
  chartCaption?: string
  domain: Domain
  cefr: CefrLevel
  tasks: CaseStudyTask[]
  requiredVocab: string[]
  requiredGrammar: string[]
  rubric: string[]
  published: boolean
  createdAt: TimeValue
}

export interface ScenarioDoc {
  persona: AiPersona
  title: string
  context: string
  goals: string[]
  cefr: CefrLevel
  successCriteria: string[]
  scaffoldLevel: PromptLevel
  domain: Domain
  openingLine: string
  published: boolean
}

export interface PromptExerciseDoc {
  level: PromptLevel
  task: string
  badPromptExample: string
  goodPromptExample: string
  rubric: string[]
  hints?: string[]
  order: number
}

export interface SurveyQuestion {
  id: string
  text: string
  textUz?: string
  type: 'likert5' | 'likert7' | 'mcq' | 'open'
  options?: string[]
  reverse?: boolean
  scale?: string
}

export interface SurveyDoc {
  title: string
  titleUz?: string
  description?: string
  type: 'motivation' | 'ai_literacy' | 'satisfaction' | 'pre' | 'post' | 'custom'
  questions: SurveyQuestion[]
  active: boolean
  createdAt: TimeValue
}

export interface TestSection {
  id: string
  skill: Skill
  title: string
  itemIds: string[]
  timeLimitMin?: number
  /** speaking/writing bo'limlari uchun ochiq topshiriq */
  openTask?: { prompt: string; minWords?: number; referenceText?: string }
  maxScore: number
}

export interface TestDoc {
  title: string
  type: 'diagnostic' | 'pre' | 'progress' | 'post' | 'adaptive'
  variant?: string
  sections: TestSection[]
  totalMaxScore: number
  assignedTo?: { groupIds: string[]; from?: TimeValue; to?: TimeValue }
  published: boolean
  createdAt: TimeValue
}

export interface BadgeDoc {
  name: string
  nameUz: string
  description: string
  icon: string
  xp: number
  criteria: {
    kind:
      | 'streak_days'
      | 'items_correct'
      | 'words_learned'
      | 'lessons_done'
      | 'speaking_score'
      | 'writing_submitted'
      | 'project_done'
      | 'diagnostic_done'
      | 'reflections'
    value: number
  }
}

/* ================================================================== */
/* 3. Talaba faoliyati                                                 */
/* ================================================================== */

export interface SkillProfileEntry {
  score: number // 0..100
  label: ProficiencyLabel
  cefr: CefrLevel
  startDifficulty: number
}

export type LinguisticProfile = Partial<Record<Skill, SkillProfileEntry>>

export interface PathStep {
  id: string
  order: number
  kind: 'lesson' | 'practice' | 'speaking' | 'writing' | 'test' | 'project' | 'prompt_lab'
  refId: string
  title: string
  skill: Skill
  stage: Stage
  reason: string
  status: 'locked' | 'available' | 'in_progress' | 'done'
  completedAt?: TimeValue
}

export interface LearningPathDoc {
  uid: string
  linguisticProfile: LinguisticProfile
  goals: string[]
  professionalTrack: Domain
  steps: PathStep[]
  version: number
  generatedAt: TimeValue
  generatedBy: 'rules' | 'ai'
  note?: string
}

export interface MasteryDoc {
  uid: string
  skill: Skill
  topic: string
  pMastery: number
  currentDifficulty: number
  streakCorrect: number
  streakWrong: number
  attempts: number
  correct: number
  lastPracticedAt: TimeValue
}

export interface AttemptDoc {
  uid: string
  groupId?: string
  expGroup?: ExperimentGroup
  participantCode?: string
  itemId: string
  skill: Skill
  topic: string
  context: 'lesson' | 'practice' | 'test' | 'project'
  contextId?: string
  answer: string[]
  isCorrect: boolean
  score: number
  timeMs: number
  hintsUsed: number
  errorTags: ErrorTag[]
  difficultyAtTime: number
  ts: TimeValue
}

export interface TestAttemptDoc {
  uid: string
  testId: string
  type: TestDoc['type']
  participantCode?: string
  expGroup?: ExperimentGroup
  sectionScores: Partial<Record<Skill, { score: number; max: number; percent: number }>>
  totalScore: number
  totalMax: number
  percent: number
  status: 'in_progress' | 'submitted' | 'graded'
  rawAnswers: Array<{ itemId: string; answer: string[]; isCorrect?: boolean; score?: number }>
  openSubmissions?: Array<{ sectionId: string; text?: string; audioPath?: string; score?: number }>
  startedAt: TimeValue
  finishedAt?: TimeValue
}

export interface UserVocabDoc {
  uid: string
  wordId: string
  word: string
  status: 'new' | 'learning' | 'known'
  srs: { interval: number; ease: number; due: TimeValue; reps: number; lapses: number }
  lastError?: string
  addedAt: TimeValue
}

export interface AiSessionDoc {
  uid: string
  mode: 'tutor' | 'roleplay' | 'explain' | 'vocab_teach' | 'writing_review' | 'prompt_eval'
  scenarioId?: string
  persona?: AiPersona
  title: string
  scaffoldLevel?: PromptLevel
  model: string
  tokensIn: number
  tokensOut: number
  messageCount: number
  startedAt: TimeValue
  lastMessageAt: TimeValue
}

export interface AiMessageDoc {
  role: 'user' | 'assistant' | 'system'
  content: string
  feedbackTags?: string[]
  helpful?: boolean | null
  tokensIn?: number
  tokensOut?: number
  ts: TimeValue
}

export interface PronunciationWordResult {
  word: string
  accuracyScore: number
  errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' | string
  phonemes?: Array<{ phoneme: string; accuracyScore: number }>
  syllables?: Array<{ syllable: string; accuracyScore: number }>
}

export interface AzureAssessment {
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
  prosodyScore?: number
  pronScore: number
  words: PronunciationWordResult[]
  recognizedText: string
}

export interface SpeakingAiFeedback {
  strengths: string[]
  issues: string[]
  wordStress: string
  sentenceStress: string
  intonation: string
  fluency: string
  problematicSounds: Array<{ sound: string; words: string[]; tip: string }>
  nextSteps: string[]
  overallComment: string
}

export interface SpeakingSubmissionDoc {
  uid: string
  participantCode?: string
  expGroup?: ExperimentGroup
  taskId: string
  taskTitle: string
  type: 'word' | 'sentence' | 'dialogue' | 'presentation'
  audioPath: string
  audioUrl?: string
  durationSec: number
  referenceText?: string
  transcript?: string
  azure?: AzureAssessment
  aiFeedback?: SpeakingAiFeedback
  teacherFeedback?: { text: string; score?: number; byUid: string; at: TimeValue }
  rubricScores?: Partial<Record<string, number>>
  attemptNo: number
  ts: TimeValue
}

export interface WritingError {
  span: string
  start?: number
  end?: number
  type: ErrorTag
  why: string
  fix: string
  whereElse: string
}

export interface WritingAiFeedback {
  errors: WritingError[]
  rubricScores: Partial<Record<string, number>>
  strengths: string[]
  areasToImprove: string[]
  summary: string
}

export interface WritingDraft {
  text: string
  wordCount: number
  aiFeedback?: WritingAiFeedback
  ts: TimeValue
}

export interface WritingSubmissionDoc {
  uid: string
  participantCode?: string
  expGroup?: ExperimentGroup
  taskId: string
  taskTitle: string
  genre: 'email' | 'report' | 'summary' | 'memo' | 'case_solution' | 'essay'
  drafts: WritingDraft[]
  finalText?: string
  wordCount: number
  teacherFeedback?: { text: string; score?: number; byUid: string; at: TimeValue }
  rubricScores?: Partial<Record<string, number>>
  status: 'draft' | 'submitted' | 'reviewed'
  createdAt: TimeValue
  submittedAt?: TimeValue
}

export interface ProjectMemberRole {
  uid: string
  name: string
  role: 'analyst' | 'writer' | 'presenter' | 'researcher' | 'coordinator'
}

export interface ProjectDoc {
  groupId: string
  caseStudyId: string
  title: string
  memberUids: string[]
  members: ProjectMemberRole[]
  stage: number
  taskStatus: Record<string, 'todo' | 'doing' | 'done'>
  sharedDoc: string
  sharedDocVersion: number
  solution?: string
  report?: string
  presentationFiles: Array<{ name: string; path: string; uploadedBy: string; at: TimeValue }>
  deadline?: TimeValue
  status: 'active' | 'submitted' | 'graded'
  aiRubricScores?: Partial<Record<string, number>>
  teacherScores?: Partial<Record<string, number>>
  teacherComment?: string
  createdAt: TimeValue
}

export interface ContributionDoc {
  uid: string
  name: string
  wordsWritten: number
  messages: number
  tasksDone: number
  lastActiveAt: TimeValue
}

export interface PeerReviewDoc {
  reviewerUid: string
  reviewerName: string
  targetUid: string
  artifactType: 'writing' | 'speaking' | 'project'
  artifactId: string
  rubricScores: Record<string, number>
  comment: string
  ts: TimeValue
}

export interface ReflectionDoc {
  uid: string
  stage: Stage
  contextId?: string
  answers: { didWell: string; repeatedMistakes: string; improveNext: string }
  mood: 1 | 2 | 3 | 4 | 5
  aiComment?: string
  ts: TimeValue
}

export interface SurveyResponseDoc {
  uid: string
  participantCode?: string
  expGroup?: ExperimentGroup
  surveyId: string
  surveyType: SurveyDoc['type']
  answers: Record<string, number | string>
  scoreTotal?: number
  ts: TimeValue
}

export interface XpEventDoc {
  uid: string
  amount: number
  reason: string
  refId?: string
  ts: TimeValue
}

export interface UserBadgeDoc {
  badgeId: string
  name: string
  icon: string
  earnedAt: TimeValue
}

export interface StreakDoc {
  uid: string
  current: number
  longest: number
  lastDay: string // YYYY-MM-DD
}

export interface PortfolioItemDoc {
  uid: string
  type: 'writing' | 'speaking' | 'project' | 'achievement' | 'feedback'
  refId: string
  title: string
  preview?: string
  score?: number
  pinned: boolean
  note?: string
  createdAt: TimeValue
}

export interface ChatDoc {
  type: 'dm' | 'teacher' | 'group' | 'project'
  title?: string
  memberUids: string[]
  memberNames: Record<string, string>
  groupId?: string
  projectId?: string
  lastMessage?: { text: string; senderUid: string; ts: TimeValue }
  createdAt: TimeValue
}

export interface ChatMessageDoc {
  senderUid: string
  senderName: string
  text: string
  attachments?: Array<{ name: string; path: string; type: string }>
  deleted?: boolean
  ts: TimeValue
}

export interface PresenceDoc {
  online: boolean
  lastSeen: TimeValue
}

export interface ForumThreadDoc {
  title: string
  body: string
  authorUid: string
  authorName: string
  groupId?: string | null
  tags: string[]
  postCount: number
  likes: string[]
  pinned?: boolean
  createdAt: TimeValue
  lastPostAt: TimeValue
}

export interface ForumPostDoc {
  authorUid: string
  authorName: string
  text: string
  likes: string[]
  ts: TimeValue
}

export interface NotificationDoc {
  type: string
  text: string
  link?: string
  read: boolean
  ts: TimeValue
}

export interface AssignmentDoc {
  groupId: string
  teacherId: string
  title: string
  description: string
  kind: 'lesson' | 'practice' | 'writing' | 'speaking' | 'test' | 'project'
  refId?: string
  dueAt: TimeValue
  createdAt: TimeValue
}

/* ================================================================== */
/* 4. Ilmiy ma'lumotlar                                                */
/* ================================================================== */

export interface EventDoc {
  uid: string
  participantCode?: string
  expGroup?: ExperimentGroup
  groupId?: string
  type: EventType
  payload?: Record<string, unknown>
  sessionId?: string
  device?: string
  ts: TimeValue
}

export interface StatsDailyDoc {
  uid: string
  date: string // YYYY-MM-DD
  participantCode?: string
  expGroup?: ExperimentGroup
  groupId?: string
  timeOnTaskMin: number
  attempts: number
  correct: number
  correctRate: number
  aiMessages: number
  aiTokens: number
  wordsLearned: number
  lessonsDone: number
  speakingSubmissions: number
  writingSubmissions: number
  xp: number
  skillScores: Partial<Record<Skill, number>>
}

export interface StatsGroupDailyDoc {
  groupId: string
  date: string
  activeStudents: number
  avgCorrectRate: number
  totalAttempts: number
  totalAiMessages: number
  avgTimeOnTaskMin: number
}

export interface ExperimentDoc {
  title: string
  hypothesis: string
  design: string
  preTestId?: string
  postTestId?: string
  surveyIds: string[]
  groupIds: { experimental: string[]; control: string[] }
  timeline: { start: TimeValue; midpoint?: TimeValue; end: TimeValue }
  status: 'planned' | 'running' | 'finished'
  createdAt: TimeValue
}

export interface PredictionDoc {
  uid: string
  predictedPostScores: Partial<Record<Skill, number>>
  predictedTotal: number
  riskLevel: 'low' | 'medium' | 'high'
  note?: string
  method: 'linear_trend'
  generatedAt: TimeValue
}

export interface ErrorProfileDoc {
  uid: string
  counts: Partial<Record<ErrorTag, number>>
  recent: Array<{ tag: ErrorTag; example: string; ts: TimeValue }>
  topTags: ErrorTag[]
  aiAnalysis?: {
    summary: string
    patterns: Array<{ tag: string; cause: string; recommendation: string }>
    generatedAt: TimeValue
  }
  updatedAt: TimeValue
}

/* ================================================================== */
/* 5. Korpus                                                           */
/* ================================================================== */

export interface CorpusDocMeta {
  title: string
  source: string
  url?: string
  domain: Domain
  wordCount: number
  storagePath?: string
  addedAt: TimeValue
}

export interface CorpusNgramDoc {
  ngram: string
  n: number
  count: number
  docFreq: number
  examples: Array<{ sentence: string; docId: string }>
}

/* ================================================================== */
/* Yordamchi tiplar                                                    */
/* ================================================================== */

export interface SessionUser {
  uid: string
  email: string
  displayName: string
  role: Role
  groupId?: string
  groupIds?: string[]
  expGroup?: ExperimentGroup
  participantCode?: string
  locale: 'uz' | 'en' | 'ru'
  photoURL?: string
}

export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string; code?: string }
