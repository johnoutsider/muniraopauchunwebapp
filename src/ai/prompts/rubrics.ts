/**
 * Baholash rubrikalari (PLAN 8.5, 8.6, 8.10, 8.15).
 * Deskriptorlar ingliz tilida — o'qituvchi va AI bir xil mezondan foydalanadi.
 * Kalitlar `@/config/constants` dagi rubrika ro'yxatlariga mos.
 */

import {
  PROJECT_RUBRIC,
  SPEAKING_RUBRIC,
  WRITING_RUBRIC,
  type ProjectRubricKey,
  type SpeakingRubricKey,
  type WritingRubricKey,
} from '@/config/constants'

/** 0-5 shkalasidagi deskriptorlar (0 = eng past, 5 = eng yuqori) */
export type BandDescriptors = Record<0 | 1 | 2 | 3 | 4 | 5, string>

export interface RubricCriterion {
  key: string
  label: string
  question: string
  bands: BandDescriptors
}

/* ------------------------------------------------------------------ */
/* Writing rubric (PLAN 8.5)                                            */
/* ------------------------------------------------------------------ */

export const WRITING_RUBRIC_CRITERIA: Record<WritingRubricKey, RubricCriterion> = {
  task_achievement: {
    key: 'task_achievement',
    label: 'Task achievement',
    question: 'Does the text do what the task asked, for the stated reader and purpose?',
    bands: {
      0: 'No relevant response, or the text answers a different task.',
      1: 'Barely addresses the task; the purpose is unclear and most required content is missing.',
      2: 'Addresses the task only partly; key required points are missing or undeveloped; the reader would need to ask follow-up questions.',
      3: 'Covers the main required points but development is thin; some points are asserted without support or data.',
      4: 'Covers all required points with adequate development and relevant economic detail; purpose is clear throughout.',
      5: 'Fully achieves the task: all points covered, well developed with precise data and professional reasoning; the reader could act on the text immediately.',
    },
  },
  vocabulary_range: {
    key: 'vocabulary_range',
    label: 'Vocabulary range and accuracy',
    question:
      'Is the economic and business vocabulary wide enough, precise and correctly collocated?',
    bands: {
      0: 'No usable vocabulary in English.',
      1: 'Only the most basic words; economic terms are absent or wrong.',
      2: 'Narrow range with heavy repetition; frequent wrong words and broken collocations that obscure meaning.',
      3: 'Adequate everyday range with some economic terms; noticeable collocation errors ("do a profit") but meaning is clear.',
      4: 'Good range of professional vocabulary used accurately; collocations mostly natural; occasional imprecision.',
      5: 'Wide, precise professional lexis with natural collocation, appropriate terminology and effective word formation.',
    },
  },
  grammar_accuracy: {
    key: 'grammar_accuracy',
    label: 'Grammatical range and accuracy',
    question: 'Are the structures varied and accurate enough for a professional reader?',
    bands: {
      0: 'No controlled sentence structure.',
      1: 'Only isolated phrases; errors in almost every clause prevent understanding.',
      2: 'Simple structures only; frequent errors in tense, articles, prepositions and agreement that often obscure meaning.',
      3: 'A mix of simple and complex structures; errors are frequent but rarely block understanding.',
      4: 'Varied structures including passive, conditionals and relative clauses; errors are minor and do not affect meaning.',
      5: 'Wide range of structures used flexibly and accurately; errors are rare and slips only.',
    },
  },
  coherence: {
    key: 'coherence',
    label: 'Coherence and cohesion',
    question: 'Does the text hold together — logical progression, paragraphing, linking devices?',
    bands: {
      0: 'No organisation.',
      1: 'Ideas are listed with no connection; no paragraphing.',
      2: 'Some logic but frequent jumps; linking devices are missing, repeated or misused; paragraphs are arbitrary.',
      3: 'Generally logical order with basic linkers (and, but, because, also); paragraphing present but uneven.',
      4: 'Clear progression, appropriate paragraphs, varied linking devices used correctly; referencing is mostly clear.',
      5: 'Seamless progression; cohesion is achieved through varied linking, referencing and paragraph structure without drawing attention to itself.',
    },
  },
  register: {
    key: 'register',
    label: 'Register and format',
    question: 'Is the tone and format right for a business or academic economic text?',
    bands: {
      0: 'No recognisable register.',
      1: 'Wholly inappropriate register; no genre conventions at all.',
      2: 'Mostly informal or inconsistent; genre conventions (salutation, sections, closing) largely missing.',
      3: 'Broadly appropriate but with lapses into informality or over-formality; some genre conventions missing.',
      4: 'Consistently appropriate professional register with correct genre conventions for the chosen format.',
      5: 'Precisely judged register, including hedging and politeness; genre conventions fully and naturally observed.',
    },
  },
}

/* ------------------------------------------------------------------ */
/* Speaking rubric (PLAN 8.6)                                           */
/* ------------------------------------------------------------------ */

export const SPEAKING_RUBRIC_CRITERIA: Record<SpeakingRubricKey, RubricCriterion> = {
  pronunciation: {
    key: 'pronunciation',
    label: 'Pronunciation',
    question: 'Are sounds, word stress and intonation clear enough for a professional listener?',
    bands: {
      0: 'Unintelligible.',
      1: 'Individual words are unclear; word stress is largely wrong; the listener cannot follow.',
      2: 'Frequent mispronunciation of key terms and misplaced word stress; considerable listener effort required.',
      3: 'Generally intelligible; recurring problem sounds (for example /θ/, /v/ vs /w/, final -ed) and some stress errors.',
      4: 'Clear and easy to follow; occasional slips in less familiar terms; stress and intonation generally appropriate.',
      5: 'Consistently clear; accurate word and sentence stress; intonation carries meaning and emphasis effectively.',
    },
  },
  fluency: {
    key: 'fluency',
    label: 'Fluency and coherence',
    question: 'Does the speech flow at a usable pace with logical development?',
    bands: {
      0: 'No connected speech.',
      1: 'Isolated words with long pauses; no development.',
      2: 'Very hesitant; frequent long pauses, repetition and self-correction break the message.',
      3: 'Speech continues with noticeable hesitation when reaching for professional vocabulary; ideas connect simply.',
      4: 'Speaks at length with only occasional hesitation; ideas are ordered and linked clearly.',
      5: 'Speaks fluently and spontaneously; hesitation is content-related, not language-related; discourse is well organised.',
    },
  },
  vocabulary: {
    key: 'vocabulary',
    label: 'Lexical resource',
    question: 'Is the professional vocabulary sufficient and used naturally in speech?',
    bands: {
      0: 'No usable vocabulary.',
      1: 'Isolated basic words; no economic terminology.',
      2: 'Very limited; constant repetition; the learner cannot paraphrase when a word is missing.',
      3: 'Enough vocabulary to discuss familiar economic topics; paraphrases with some success; collocation errors are common.',
      4: 'Good range of professional terms used flexibly, with mostly natural collocation.',
      5: 'Wide and precise professional lexis including idiomatic business phrasing; paraphrases effortlessly.',
    },
  },
  grammar: {
    key: 'grammar',
    label: 'Grammatical range and accuracy',
    question: 'Are spoken structures varied and accurate?',
    bands: {
      0: 'No controlled structure.',
      1: 'Memorised fragments only.',
      2: 'Simple structures with frequent errors that often obscure meaning.',
      3: 'Mix of simple and complex forms; errors are frequent but meaning is usually clear.',
      4: 'Varied structures with good control; errors are minor and self-corrected.',
      5: 'Flexible and accurate range, including conditionals, passive and hedging used naturally in discussion.',
    },
  },
  interaction: {
    key: 'interaction',
    label: 'Interaction and task management',
    question:
      'Does the speaker manage the professional exchange — turn-taking, questions, purpose?',
    bands: {
      0: 'No interaction.',
      1: 'Cannot respond to the interlocutor; no initiative.',
      2: 'Responds minimally; does not ask questions or develop the exchange; the task is not managed.',
      3: 'Responds adequately and asks simple questions; sometimes leaves the purpose unresolved.',
      4: 'Sustains the exchange, asks relevant questions, checks understanding and moves the task towards its goal.',
      5: 'Fully manages the professional exchange: initiates, negotiates, handles objections, summarises and closes with a clear outcome.',
    },
  },
}

/* ------------------------------------------------------------------ */
/* Project rubric (PLAN 8.10 — case study / group project)              */
/* ------------------------------------------------------------------ */

export const PROJECT_RUBRIC_CRITERIA: Record<ProjectRubricKey, RubricCriterion> = {
  content_analysis: {
    key: 'content_analysis',
    label: 'Content and data analysis',
    question: 'Is the economic data read, interpreted and used correctly?',
    bands: {
      0: 'No analysis.',
      1: 'The data is restated without interpretation, and partly misread.',
      2: 'Describes the figures but draws no defensible conclusion; some misinterpretation.',
      3: 'Correct description with a basic interpretation; causes are asserted rather than argued.',
      4: 'Accurate interpretation of trends with plausible causes and consequences supported by the data.',
      5: 'Insightful analysis: trends, causes, consequences and limitations of the data are all addressed and evidenced.',
    },
  },
  professional_vocabulary: {
    key: 'professional_vocabulary',
    label: 'Professional vocabulary',
    question: 'Is the required domain terminology present and correctly used?',
    bands: {
      0: 'None of the required vocabulary is used.',
      1: 'One or two required terms, used incorrectly.',
      2: 'Some required terms appear but are frequently misused or miscollocated.',
      3: 'Most required terms appear and are broadly correct; collocations are sometimes unnatural.',
      4: 'All required terms are used correctly and naturally in context.',
      5: 'Required terminology is used precisely and extended with further appropriate professional lexis.',
    },
  },
  grammar_accuracy: {
    key: 'grammar_accuracy',
    label: 'Grammatical accuracy',
    question:
      'Are the target structures (passive, comparatives, linking devices) applied accurately?',
    bands: {
      0: 'No control.',
      1: 'The required structures are absent; errors dominate.',
      2: 'The required structures are attempted but usually incorrect.',
      3: 'The required structures appear with frequent but non-blocking errors.',
      4: 'The required structures are used accurately with only minor slips.',
      5: 'Structures are used accurately, variedly and appropriately for the genre.',
    },
  },
  communication: {
    key: 'communication',
    label: 'Communication and presentation',
    question: 'Is the solution communicated clearly to a professional audience?',
    bands: {
      0: 'Not communicated.',
      1: 'The audience cannot follow the message.',
      2: 'The message is disorganised; visuals or structure do not support understanding.',
      3: 'The message is understandable with a basic structure; delivery is uneven.',
      4: 'Clear structure, effective visuals or sections, confident delivery, audience questions handled.',
      5: 'Persuasive and precisely targeted communication; structure, data and delivery reinforce each other.',
    },
  },
  critical_thinking: {
    key: 'critical_thinking',
    label: 'Critical thinking and problem solving',
    question: 'Is the proposed solution reasoned, evaluated and realistic?',
    bands: {
      0: 'No solution offered.',
      1: 'A solution is named with no reasoning.',
      2: 'A generic solution with little connection to the case data.',
      3: 'A relevant solution with some reasoning; alternatives and risks are not considered.',
      4: 'A well-reasoned solution grounded in the data, with alternatives and main risks considered.',
      5: 'A well-argued, evaluated solution with alternatives weighed, risks quantified and implementation considered.',
    },
  },
  teamwork: {
    key: 'teamwork',
    label: 'Teamwork and contribution',
    question: 'Did the member contribute substantively and support the team in English?',
    bands: {
      0: 'No contribution recorded.',
      1: 'Minimal presence; no substantive contribution.',
      2: 'Contributed sporadically; relied on other members for language and content.',
      3: 'Made a fair share of contributions to the shared document and discussion.',
      4: 'Contributed consistently, took a clear role and supported other members.',
      5: 'Drove the team forward: coordinated, integrated others’ work and raised the quality of the whole artefact.',
    },
  },
}

/* ------------------------------------------------------------------ */
/* Prompt-quality rubric (PLAN 8.15 — Prompt Practice Lab)              */
/* ------------------------------------------------------------------ */

export const PROMPT_RUBRIC_KEYS = ['specificity', 'context', 'level', 'format', 'honesty'] as const
export type PromptRubricKey = (typeof PROMPT_RUBRIC_KEYS)[number]

export const PROMPT_RUBRIC_CRITERIA: Record<PromptRubricKey, RubricCriterion> = {
  specificity: {
    key: 'specificity',
    label: 'Specificity',
    question: 'Is the request precise enough that only one kind of answer would satisfy it?',
    bands: {
      0: 'No request at all.',
      1: 'A bare topic word ("inflation") with no task.',
      2: 'A vague request ("help me with English", "explain grammar") that could mean many different things.',
      3: 'A clear task but with unspecified scope ("explain the Passive Voice") — quantity and focus are missing.',
      4: 'A clear task with scope: what, how much, on which topic.',
      5: 'Precise task, quantity, focus and success criterion ("give me 5 gap-fill sentences on Present Perfect about company results, with answers hidden").',
    },
  },
  context: {
    key: 'context',
    label: 'Context',
    question:
      'Does the prompt say who is asking, for what professional purpose, with what background?',
    bands: {
      0: 'No context.',
      1: 'No context of any kind; the request could come from anyone.',
      2: 'A hint of context ("for university") that does not narrow the answer.',
      3: 'States either the role or the purpose, but not both.',
      4: 'States the role (economics student), the professional domain and the purpose of the task.',
      5: 'States role, domain, purpose, prior knowledge and the situation the answer will be used in.',
    },
  },
  level: {
    key: 'level',
    label: 'Level',
    question: 'Does the prompt state the required language level or difficulty?',
    bands: {
      0: 'Not applicable / no prompt.',
      1: 'No indication of level.',
      2: 'A vague indication ("simple", "not too hard").',
      3: 'Names a level or difficulty without tying it to the output ("I am B1").',
      4: 'Names a CEFR level or difficulty and applies it to the requested output.',
      5: 'Names the level, applies it, and asks for the language to be adjusted (glosses, simpler structures, defined terms).',
    },
  },
  format: {
    key: 'format',
    label: 'Format',
    question: 'Does the prompt state the shape of the answer it wants?',
    bands: {
      0: 'Not applicable / no prompt.',
      1: 'No format requested.',
      2: 'A vague format hint ("write it nicely").',
      3: 'Names a general shape ("a list", "short").',
      4: 'Names the format and the length or number of items.',
      5: 'Names format, length, structure and any required parts (table columns, sections, answer key placement).',
    },
  },
  honesty: {
    key: 'honesty',
    label: 'Academic honesty',
    question: 'Does the prompt ask for help and guidance rather than for work to submit?',
    bands: {
      0: 'Not applicable / no prompt.',
      1: 'Explicitly asks the AI to produce the assignment for submission.',
      2: 'Asks for a finished text the learner would clearly hand in as their own.',
      3: 'Ambiguous: could be read as either help or ghost-writing.',
      4: 'Clearly asks for guidance, feedback, examples or a model, not for the finished assignment.',
      5: 'Asks for guidance and explicitly keeps the learner in the loop (feedback on their own draft, an outline to fill in, a check of their reasoning).',
    },
  },
}

/* ------------------------------------------------------------------ */
/* Prompt matnini yig'ish                                               */
/* ------------------------------------------------------------------ */

function renderCriterion(c: RubricCriterion): string {
  const bands = ([0, 1, 2, 3, 4, 5] as const).map((b) => `  ${b} = ${c.bands[b]}`).join('\n')
  return `${c.label} (key: ${c.key}) — ${c.question}\n${bands}`
}

function renderRubric(
  title: string,
  criteria: Record<string, RubricCriterion>,
  keys: readonly string[]
): string {
  const body = keys.map((k) => renderCriterion(criteria[k])).join('\n\n')
  return `${title}\nScore each criterion 0-5 using these descriptors. Use whole numbers only. Do not inflate scores: a score of 5 means a professional reader would need no further work.\n\n${body}`
}

export const WRITING_RUBRIC_PROMPT = renderRubric(
  'WRITING RUBRIC (PLAN 8.5)',
  WRITING_RUBRIC_CRITERIA as unknown as Record<string, RubricCriterion>,
  WRITING_RUBRIC
)

export const SPEAKING_RUBRIC_PROMPT = renderRubric(
  'SPEAKING RUBRIC (PLAN 8.6)',
  SPEAKING_RUBRIC_CRITERIA as unknown as Record<string, RubricCriterion>,
  SPEAKING_RUBRIC
)

export const PROJECT_RUBRIC_PROMPT = renderRubric(
  'PROJECT / CASE STUDY RUBRIC (PLAN 8.10)',
  PROJECT_RUBRIC_CRITERIA as unknown as Record<string, RubricCriterion>,
  PROJECT_RUBRIC
)

export const PROMPT_RUBRIC_PROMPT = renderRubric(
  'PROMPT QUALITY RUBRIC (PLAN 8.15)',
  PROMPT_RUBRIC_CRITERIA as unknown as Record<string, RubricCriterion>,
  PROMPT_RUBRIC_KEYS
)

/** Rubrika kalitlari bo'yicha matn (o'qituvchi UI va AI uchun bir manba). */
export const RUBRIC_PROMPTS = {
  writing: WRITING_RUBRIC_PROMPT,
  speaking: SPEAKING_RUBRIC_PROMPT,
  project: PROJECT_RUBRIC_PROMPT,
  prompt: PROMPT_RUBRIC_PROMPT,
} as const

export type RubricKind = keyof typeof RUBRIC_PROMPTS
