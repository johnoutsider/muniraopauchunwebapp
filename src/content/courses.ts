/**
 * src/content/courses.ts — kurs, modullar va darslar (PLAN 4.2, 5-bo'lim).
 *
 * Bitta kurs: "Professional English for Economics".
 * 13 ta modul 8 bosqichga va 8 ko'nikmaga xaritalangan;
 * 16 ta dars `LessonBlock` birlashmasidan (text, video, infographic, chart,
 * vocab, grammar, pronunciation, exercises, ai_explain) tuzilgan.
 *
 * Dars ichidagi mashq va lug'at havolalari qattiq yozilmagan — ular
 * `items.ts` va `lexicon.ts` dan filtr orqali olinadi, shuning uchun kontent
 * kengaytirilganda darslar avtomatik yangilanadi.
 *
 * Video bloklarning `src` maydoni hozircha PLACEHOLDER_* identifikatori bilan
 * yozilgan (PLAN 14: videolarni tadqiqotchi yozadi va YouTube'ga unlisted
 * sifatida qo'yadi) — faqat `src` qiymatini almashtirish kifoya.
 */

import type { CefrLevel, Domain, GrammarTopicId, Skill, Stage } from '@/config/constants'
import type { CourseDoc, LessonBlock, LessonDoc, ModuleDoc } from '@/types'

import { SEED_GRAMMAR_LESSONS } from './grammar'
import { itemIds } from './items'
import { SEED_LEXICON } from './lexicon'

export type SeedCourse = Omit<CourseDoc, 'createdAt'> & { id: string }
export type SeedModule = ModuleDoc & { id: string }
export type SeedLesson = Omit<LessonDoc, 'createdAt'> & { id: string }

export const COURSE_ID = 'course-professional-english-economics'

/* ================================================================== */
/* 1. Kurs                                                             */
/* ================================================================== */

export const SEED_COURSES: SeedCourse[] = [
  {
    id: COURSE_ID,
    title: 'Professional English for Economics',
    description:
      'A twelve-week course that develops the professional English of economics students: ' +
      'the lexis of economics, finance, banking, marketing and management; the grammar of ' +
      'reports and negotiations; the pronunciation of economic terminology; and the ' +
      'communicative skills needed to explain a chart, argue a position and write a business ' +
      'report. The course follows the eight-stage methodology: goal setting, diagnostics, ' +
      'preparation for working with AI, instruction, practice, productive communication, ' +
      'integrative professional activity, and assessment with reflection.',
    cefrRange: ['A2', 'C1'],
    order: 1,
    published: true,
  },
]

/* ================================================================== */
/* 2. Modullar — 8 bosqich x 8 ko'nikma                                */
/* ================================================================== */

interface ModuleSeedInput {
  id: string
  title: string
  description: string
  stage: Stage
  skill: Skill
  domain: Domain
  estimatedMin: number
  topicId?: string
}

const MODULE_INPUTS: ModuleSeedInput[] = [
  {
    id: 'mod-01-orientation',
    title: 'Getting Started: Goals and Your Learning Path',
    description:
      'Set a professional goal, choose your track (finance, banking, marketing or management) ' +
      'and learn how the platform builds an individual learning path for you.',
    stage: 1,
    skill: 'professional',
    domain: 'general',
    estimatedMin: 45,
  },
  {
    id: 'mod-02-diagnostics',
    title: 'Diagnostics: Where Are You Now?',
    description:
      'An eight-section diagnostic test and your Individual Linguistic Profile: which skills ' +
      'are strong, which need improvement, and what your starting difficulty will be.',
    stage: 2,
    skill: 'professional',
    domain: 'academic',
    estimatedMin: 90,
  },
  {
    id: 'mod-03-ai-literacy',
    title: 'Working with AI: Prompts and Academic Honesty',
    description:
      'What an AI tutor can and cannot do, how to write a prompt that produces useful practice, ' +
      'how to check an answer that may be invented, and where the line of academic honesty lies.',
    stage: 3,
    skill: 'professional',
    domain: 'academic',
    estimatedMin: 60,
  },
  {
    id: 'mod-04-vocabulary',
    title: 'Core Economic Vocabulary',
    description:
      'The six-step word card: word and IPA, meaning, collocations, context sentence, ' +
      'professional situation, communicative task. Semantic networks around inflation, prices ' +
      'and monetary policy.',
    stage: 4,
    skill: 'vocabulary',
    domain: 'economics',
    estimatedMin: 180,
  },
  {
    id: 'mod-05-grammar',
    title: 'Grammar for Economic Reports',
    description:
      'Eight grammar topics taught in an economic context: from the Present Perfect for company ' +
      'performance to linking devices for reports and presentations.',
    stage: 4,
    skill: 'grammar',
    domain: 'economics',
    estimatedMin: 240,
  },
  {
    id: 'mod-06-pronunciation',
    title: 'Pronouncing Economic English',
    description:
      'Word stress in terminology, the noun/verb stress shift, final -ed and plural -s, and the ' +
      'sounds Uzbek speakers most often need to work on when presenting figures.',
    stage: 4,
    skill: 'pronunciation',
    domain: 'general',
    estimatedMin: 90,
  },
  {
    id: 'mod-07-reading',
    title: 'Reading Economic Texts',
    description:
      'Reading strategies for annual reports, IMF and World Bank summaries and internal memos: ' +
      'main idea, detail, inference, vocabulary in context and chart commentary.',
    stage: 4,
    skill: 'reading',
    domain: 'economics',
    estimatedMin: 90,
  },
  {
    id: 'mod-08-listening',
    title: 'Listening: Business News and Meetings',
    description:
      'Understanding short business-news extracts and meeting exchanges: figures, dates, ' +
      'signposting language and the speaker’s attitude.',
    stage: 4,
    skill: 'listening',
    domain: 'business_communication',
    estimatedMin: 75,
  },
  {
    id: 'mod-09-practice',
    title: 'Adaptive Practice and Automatisation',
    description:
      'The Practice Zone: adaptive exercises that change difficulty as you improve, spaced ' +
      'repetition for vocabulary, and micro-explanations after every mistake.',
    stage: 5,
    skill: 'grammar',
    domain: 'economics',
    estimatedMin: 240,
  },
  {
    id: 'mod-10-speaking',
    title: 'Speaking: Role-play, Charts and Presentations',
    description:
      'Speak with an AI client, manager, interviewer, partner, economist or investor; explain ' +
      'a chart in sixty seconds; deliver a short professional presentation.',
    stage: 6,
    skill: 'speaking',
    domain: 'business_communication',
    estimatedMin: 180,
  },
  {
    id: 'mod-11-writing',
    title: 'Writing Lab: Emails, Memos and Reports',
    description:
      'Write, get feedback, revise, submit. Business emails, a summary of a chart, a memo and a ' +
      'case solution, all assessed against a five-criterion rubric.',
    stage: 6,
    skill: 'writing',
    domain: 'business_communication',
    estimatedMin: 180,
  },
  {
    id: 'mod-12-cases',
    title: 'Professional English in Practice: Case Studies',
    description:
      'Four integrative case studies (finance, banking, marketing, management) worked through in ' +
      'a team across nine stages, from reading the brief to presenting the solution.',
    stage: 7,
    skill: 'professional',
    domain: 'finance',
    estimatedMin: 300,
  },
  {
    id: 'mod-13-reflection',
    title: 'Assessment, Feedback and Reflection',
    description:
      'Read your AI feedback report, compare your pre-test and post-test profiles, answer the ' +
      'three reflection questions and receive your next learning path.',
    stage: 8,
    skill: 'professional',
    domain: 'academic',
    estimatedMin: 60,
  },
]

export const SEED_MODULES: SeedModule[] = MODULE_INPUTS.map((input, index) => ({
  id: input.id,
  courseId: COURSE_ID,
  title: input.title,
  description: input.description,
  stage: input.stage,
  skill: input.skill,
  domain: input.domain,
  topicId: input.topicId,
  order: index + 1,
  estimatedMin: input.estimatedMin,
  published: true,
}))

/* ================================================================== */
/* 3. Darslar                                                          */
/* ================================================================== */

/** Domain bo'yicha lug'at kartalari (dars `vocab` bloki uchun). */
function vocabIds(domain: Domain, limit: number): string[] {
  return SEED_LEXICON.filter((entry) => entry.domains.includes(domain))
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((entry) => entry.id)
}

/** Nomi bo'yicha lug'at kartalari (semantik tarmoq urug'lari uchun). */
function vocabByWords(words: string[]): string[] {
  const wanted = new Set(words.map((w) => w.toLowerCase()))
  return SEED_LEXICON.filter((entry) => wanted.has(entry.word.toLowerCase())).map((e) => e.id)
}

/** Grammatik mavzu darsi uchun tayyor `grammar` bloki. */
function grammarBlock(topicId: GrammarTopicId): LessonBlock {
  const lesson = SEED_GRAMMAR_LESSONS.find((l) => l.topicId === topicId)
  if (!lesson) {
    throw new Error(`SEED_GRAMMAR_LESSONS ichida "${topicId}" mavzusi topilmadi.`)
  }
  return {
    kind: 'grammar',
    topicId: lesson.topicId,
    explanationHtml: lesson.explanationHtml,
    examples: [...lesson.examples],
  }
}

function grammarErrorsBlock(topicId: GrammarTopicId): LessonBlock {
  const lesson = SEED_GRAMMAR_LESSONS.find((l) => l.topicId === topicId)
  if (!lesson) throw new Error(`SEED_GRAMMAR_LESSONS ichida "${topicId}" topilmadi.`)
  const rows = lesson.commonErrors
    .map(
      (e) =>
        `<li><s>${e.wrong}</s> &rarr; <strong>${e.right}</strong><br><em>${e.why}</em></li>`
    )
    .join('')
  return {
    kind: 'text',
    html:
      `<h3>Common mistakes</h3><ul>${rows}</ul>` +
      `<p><strong>Why it matters:</strong> ${lesson.whyItMatters}</p>`,
  }
}

/** Grammatik mavzu uchun standart dars (tushuntirish + xatolar + mashqlar). */
function grammarLesson(
  topicId: GrammarTopicId,
  order: number,
  cefr: CefrLevel,
  estimatedMin: number
): SeedLesson {
  const seed = SEED_GRAMMAR_LESSONS.find((l) => l.topicId === topicId)
  if (!seed) throw new Error(`SEED_GRAMMAR_LESSONS ichida "${topicId}" topilmadi.`)

  return {
    id: `lesson-${topicId}`,
    moduleId: 'mod-05-grammar',
    courseId: COURSE_ID,
    title: seed.title,
    summary: seed.objective,
    type: 'interactive',
    cefr,
    estimatedMin,
    order,
    published: true,
    createdBy: 'seed',
    approvedBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          `<p><strong>Context:</strong> ${seed.context}.</p>` +
          `<p>${seed.objective}</p>` +
          `<p><strong>Key forms</strong></p><ul>${seed.keyForms
            .map((f) => `<li><code>${f}</code></li>`)
            .join('')}</ul>`,
      },
      grammarBlock(topicId),
      grammarErrorsBlock(topicId),
      {
        kind: 'exercises',
        title: 'Guided practice (difficulty 1-3)',
        itemIds: itemIds({ topic: topicId, difficulties: [1, 2, 3] }, 8),
      },
      {
        kind: 'exercises',
        title: 'Extension (difficulty 4-5)',
        itemIds: itemIds({ topic: topicId, difficulties: [4, 5] }, 6),
      },
      {
        kind: 'ai_explain',
        label: 'Ask the AI tutor to explain this with my own example',
        prompt:
          `Explain ${seed.title} to a B1-B2 economics student. Use my own sentence about my ` +
          `chosen company, show why my version is wrong if it is, how to correct it, and where ` +
          `else in professional writing the same structure appears.`,
      },
      {
        kind: 'text',
        html: `<h3>Communicative task</h3><p>${seed.communicativeTask}</p>`,
      },
    ],
  }
}

const INFLATION_CHART: Array<Record<string, unknown>> = [
  { year: '2019', inflation: 14.5, realWageGrowth: 6.1 },
  { year: '2020', inflation: 11.1, realWageGrowth: 1.8 },
  { year: '2021', inflation: 10.0, realWageGrowth: 4.2 },
  { year: '2022', inflation: 12.3, realWageGrowth: -0.7 },
  { year: '2023', inflation: 8.8, realWageGrowth: 2.4 },
  { year: '2024', inflation: 9.6, realWageGrowth: 1.1 },
  { year: '2025', inflation: 7.4, realWageGrowth: 3.0 },
]

const TRADE_CHART: Array<Record<string, unknown>> = [
  { quarter: 'Q1', exports: 5.9, imports: 7.4 },
  { quarter: 'Q2', exports: 6.4, imports: 7.9 },
  { quarter: 'Q3', exports: 7.1, imports: 8.2 },
  { quarter: 'Q4', exports: 7.8, imports: 9.1 },
]

export const SEED_LESSONS: SeedLesson[] = [
  /* ---------------- Stage 1 — orientation ---------------- */
  {
    id: 'lesson-welcome',
    moduleId: 'mod-01-orientation',
    courseId: COURSE_ID,
    title: 'Welcome: What Professional English Means for an Economist',
    summary:
      'Why an economist needs English beyond general conversation, and what the eight stages of ' +
      'this course will give you.',
    type: 'video',
    cefr: 'B1',
    estimatedMin: 20,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>An economist does not only <em>speak</em> English. An economist reads a quarterly ' +
          'report, explains a chart to a client, argues for a budget in a meeting, and writes a ' +
          'recommendation that someone will act on. Those are four different kinds of English, ' +
          'and this course develops all of them.</p>' +
          '<p>Over the next twelve weeks you will move through eight stages, from setting a goal ' +
          'to reflecting on what changed. At every stage you will get feedback that tells you ' +
          '<strong>why</strong> something was wrong, <strong>how</strong> to fix it, and ' +
          '<strong>where else</strong> the same point matters.</p>',
      },
      {
        kind: 'video',
        provider: 'youtube',
        src: 'PLACEHOLDER_WELCOME_VIDEO_ID',
        caption: 'Course introduction (4 min). Replace with the unlisted YouTube id.',
      },
      {
        kind: 'infographic',
        imageUrl: '/content/infographics/eight-stages.svg',
        caption: 'The eight stages of the methodology, from goal setting to reflection.',
      },
      {
        kind: 'ai_explain',
        label: 'What will this course change for me?',
        prompt:
          'I am an economics student in Uzbekistan. Based on my professional track and my ' +
          'self-assessed level, explain in simple English what I should realistically be able ' +
          'to do in professional English after twelve weeks of this course.',
      },
    ],
  },
  {
    id: 'lesson-goal-setting',
    moduleId: 'mod-01-orientation',
    courseId: COURSE_ID,
    title: 'Setting a Professional Goal',
    summary:
      'Turn "I want to improve my English" into a goal you can measure: a track, a genre and a ' +
      'weekly commitment.',
    type: 'interactive',
    cefr: 'B1',
    estimatedMin: 25,
    order: 2,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>A vague goal produces vague progress. Compare these two:</p>' +
          '<ul><li><s>I want to improve my English.</s></li>' +
          '<li><strong>By April I want to explain a revenue chart to a client for two minutes ' +
          'without notes, using at least ten finance collocations correctly.</strong></li></ul>' +
          '<p>The second goal names a task, a context, a length and a measure. Write yours the ' +
          'same way. Your learning path will be built around it, and you will see it again in ' +
          'the reflection stage.</p>',
      },
      {
        kind: 'infographic',
        imageUrl: '/content/infographics/professional-tracks.svg',
        caption:
          'Four professional tracks: finance, banking, marketing, management — and the ' +
          'genres each one uses most.',
      },
      {
        kind: 'exercises',
        title: 'Register and professional context',
        itemIds: itemIds({ skill: 'professional' }, 4),
      },
    ],
  },

  /* ---------------- Stage 2 — diagnostics ---------------- */
  {
    id: 'lesson-diagnostic-brief',
    moduleId: 'mod-02-diagnostics',
    courseId: COURSE_ID,
    title: 'Before the Diagnostic Test',
    summary:
      'What the eight sections measure, how the speaking and writing parts are assessed, and how ' +
      'to read your Individual Linguistic Profile.',
    type: 'explanation',
    cefr: 'B1',
    estimatedMin: 15,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>The diagnostic test has eight sections — vocabulary, grammar, listening, ' +
          'reading, pronunciation, professional English, writing and speaking. The first six are ' +
          'marked automatically. Your writing is assessed against a five-criterion rubric, and ' +
          'your speaking is analysed for accuracy, fluency, completeness and prosody.</p>' +
          '<p>The result is not a single mark. It is a profile: each skill is labelled ' +
          '<strong>strong</strong>, <strong>intermediate</strong>, <strong>needs improvement</strong> ' +
          'or <strong>weak</strong>, and each one gets its own starting difficulty. A weak label ' +
          'is not a verdict; it is where your practice will begin.</p>' +
          '<p>Answer honestly and do not use a dictionary. An inflated diagnostic gives you ' +
          'exercises that are too hard, and you will simply lose time.</p>',
      },
      {
        kind: 'chart',
        chartType: 'line',
        data: INFLATION_CHART,
        caption:
          'Sample chart of the type used in the reading and speaking sections: annual inflation ' +
          'and real wage growth, per cent.',
      },
    ],
  },

  /* ---------------- Stage 3 — AI literacy ---------------- */
  {
    id: 'lesson-ai-literacy',
    moduleId: 'mod-03-ai-literacy',
    courseId: COURSE_ID,
    title: 'What an AI Tutor Can and Cannot Do',
    summary:
      'Where an AI tutor is genuinely useful, where it invents things, and the rule of academic ' +
      'honesty this course applies.',
    type: 'video',
    cefr: 'B2',
    estimatedMin: 25,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>An AI tutor is very good at explaining a rule in three different ways, generating ' +
          'practice at the level you ask for, and giving fast feedback on a draft. It is much ' +
          'less reliable when you ask it for a fact: a figure, a citation, a date, a statistic. ' +
          'It can produce a confident sentence that is simply not true. This is called a ' +
          '<strong>hallucination</strong>.</p>' +
          '<p>The rule in this course is simple. Ask the AI to <strong>teach, explain, correct ' +
          'and question</strong> you. Do not ask it to <strong>write your assignment</strong>. ' +
          'Work you submit must be yours; AI-assisted drafts must be marked as such.</p>' +
          '<p>Every AI answer here ends with an invitation to check it. Take the invitation ' +
          'seriously — verification is a professional skill, not an extra task.</p>',
      },
      {
        kind: 'video',
        provider: 'youtube',
        src: 'PLACEHOLDER_AI_LITERACY_VIDEO_ID',
        caption: 'AI literacy for language learning (6 min).',
      },
      {
        kind: 'ai_explain',
        label: 'Show me a hallucination on purpose',
        prompt:
          'Give me three statements about the Uzbek economy: two accurate and one invented but ' +
          'plausible. Do not tell me which is which. Then, after I guess, explain how I could ' +
          'have checked each one against an official source.',
      },
    ],
  },
  {
    id: 'lesson-prompt-scaffolding',
    moduleId: 'mod-03-ai-literacy',
    courseId: COURSE_ID,
    title: 'From a Weak Prompt to a Good One',
    summary:
      'The five things a useful prompt contains: task, context, level, format and quantity.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 30,
    order: 2,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>Compare:</p>' +
          '<blockquote><s>Give me English exercises.</s></blockquote>' +
          '<blockquote><strong>Create five B1-B2 grammar exercises about inflation for economics ' +
          'students, using the Present Perfect, with an answer key and a short explanation for ' +
          'each answer.</strong></blockquote>' +
          '<p>The second prompt names the <strong>quantity</strong> (five), the ' +
          '<strong>level</strong> (B1-B2), the <strong>topic</strong> (inflation), the ' +
          '<strong>learner</strong> (economics students), the <strong>language point</strong> ' +
          '(Present Perfect) and the <strong>format</strong> (answer key plus explanations). ' +
          'Every one of those turns a generic answer into a usable one.</p>' +
          '<p>You will practise this in three steps: choose a ready prompt, fill in a template, ' +
          'then write your own from nothing.</p>',
      },
      {
        kind: 'infographic',
        imageUrl: '/content/infographics/prompt-anatomy.svg',
        caption: 'The anatomy of a good prompt: task, context, level, format, quantity.',
      },
      {
        kind: 'ai_explain',
        label: 'Score my prompt',
        prompt:
          'Here is my prompt. Score it from 1 to 5 on specificity, context, level, format and ' +
          'academic honesty. Then rewrite it as a stronger version and explain each change.',
      },
    ],
  },

  /* ---------------- Stage 4 — vocabulary ---------------- */
  {
    id: 'lesson-inflation-network',
    moduleId: 'mod-04-vocabulary',
    courseId: COURSE_ID,
    title: 'Inflation and Its Semantic Network',
    summary:
      'The core macroeconomic cluster: inflation, prices, purchasing power, consumer spending, ' +
      'monetary policy — and how they connect.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 40,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>Economic vocabulary is not a list; it is a network. When inflation rises, prices ' +
          'rise, purchasing power falls, consumer spending weakens, and the central bank tightens ' +
          'monetary policy. If you learn those five words as five separate cards, you will not be ' +
          'able to explain a chart. Learn them as one chain and you can.</p>' +
          '<p>Work through each card in six steps: the word and its pronunciation, the meaning, ' +
          'the collocations, a context sentence, the professional situation, and finally your own ' +
          'sentence.</p>',
      },
      {
        kind: 'vocab',
        wordIds: vocabByWords([
          'inflation',
          'prices',
          'purchasing power',
          'consumer spending',
          'monetary policy',
        ]),
      },
      {
        kind: 'chart',
        chartType: 'line',
        data: INFLATION_CHART,
        caption:
          'Annual inflation and real wage growth, per cent. Use the vocabulary above to describe ' +
          'what happened in 2022.',
      },
      {
        kind: 'exercises',
        title: 'Economics vocabulary practice',
        itemIds: itemIds({ skill: 'vocabulary', domain: 'economics' }, 6),
      },
      {
        kind: 'ai_explain',
        label: 'Build a semantic network from my own word',
        prompt:
          'Take the economic term I give you and build a semantic network of eight related terms. ' +
          'For each link, say what the relation is (causes, is measured by, is the opposite of) ' +
          'and give one sentence showing the two words used together.',
      },
    ],
  },
  {
    id: 'lesson-finance-vocab',
    moduleId: 'mod-04-vocabulary',
    courseId: COURSE_ID,
    title: 'The Language of Company Finance',
    summary:
      'Revenue, costs, margin, cash flow and the collocations that hold them together.',
    type: 'interactive',
    cefr: 'B1',
    estimatedMin: 35,
    order: 2,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>In finance, the wrong verb is as bad as the wrong noun. You <strong>make</strong> ' +
          'a profit, you do not <s>do</s> a profit. You <strong>incur</strong> costs, you ' +
          '<strong>generate</strong> revenue and you <strong>improve</strong> a margin. These are ' +
          'not rules you can reason out; they are the fixed partnerships of the language, and ' +
          'this is what a corpus check is for.</p>',
      },
      { kind: 'vocab', wordIds: vocabIds('finance', 12) },
      {
        kind: 'exercises',
        title: 'Finance collocations',
        itemIds: itemIds({ skill: 'vocabulary', domain: 'finance' }, 6),
      },
    ],
  },
  {
    id: 'lesson-banking-vocab',
    moduleId: 'mod-04-vocabulary',
    courseId: COURSE_ID,
    title: 'Talking to a Bank: Loans, Rates and Risk',
    summary:
      'The vocabulary a credit officer and a customer both need: issue a loan, apply for credit, ' +
      'default, collateral, interest rate.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 35,
    order: 3,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>Banking English is precise because money depends on it. A bank ' +
          '<strong>issues</strong> or <strong>grants</strong> a loan; a customer ' +
          '<strong>applies for</strong>, <strong>takes out</strong> and later ' +
          '<strong>repays</strong> it. If the customer stops paying, they ' +
          '<strong>default</strong> on the loan and the bank may realise the ' +
          '<strong>collateral</strong>. Getting these verbs right is the difference between ' +
          'sounding like a professional and sounding like a translation.</p>',
      },
      { kind: 'vocab', wordIds: vocabIds('banking', 12) },
      {
        kind: 'exercises',
        title: 'Banking terminology',
        itemIds: itemIds({ skill: 'vocabulary', domain: 'banking' }, 6),
      },
      {
        kind: 'ai_explain',
        label: 'Check this collocation against the corpus',
        prompt:
          'I want to say that the bank gave a loan. Compare "issue a loan", "grant a loan" and ' +
          '"give a loan" for me: which are attested in professional writing, which register does ' +
          'each belong to, and which should I use in a credit memo?',
      },
    ],
  },

  /* ---------------- Stage 4 — grammar (8 ta dars) ---------------- */
  grammarLesson('present_perfect', 1, 'B1', 40),
  grammarLesson('past_simple', 2, 'A2', 35),
  grammarLesson('passive_voice', 3, 'B1', 40),
  grammarLesson('comparatives', 4, 'A2', 35),
  grammarLesson('modal_verbs', 5, 'B1', 40),
  grammarLesson('conditionals', 6, 'B2', 45),
  grammarLesson('reported_speech', 7, 'B2', 45),
  grammarLesson('linking_devices', 8, 'B2', 45),

  /* ---------------- Stage 4 — pronunciation ---------------- */
  {
    id: 'lesson-word-stress',
    moduleId: 'mod-06-pronunciation',
    courseId: COURSE_ID,
    title: 'Word Stress in Economic Terminology',
    summary:
      'Where the stress falls in economy / economic / economics, the noun-verb shift, and why a ' +
      'misplaced stress costs you comprehension.',
    type: 'interactive',
    cefr: 'B1',
    estimatedMin: 30,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>English does not stress every syllable equally, and in economic terminology the ' +
          'stress moves as the word changes class. Say <code>e-CO-no-my</code> but ' +
          '<code>e-co-NO-mic</code>: the suffix <em>-ic</em> pulls the stress onto the syllable ' +
          'before it. The same happens with <em>finance / financial</em> and ' +
          '<em>strategy / strategic</em>.</p>' +
          '<p>A second pattern matters just as much in meetings: many two-syllable words are ' +
          'stressed on the first syllable as a noun and on the second as a verb. ' +
          '<code>an INcrease</code> but <code>to inCREASE</code>; <code>a REcord</code> but ' +
          '<code>to reCORD</code>. Listeners use the stress to decide which word they heard.</p>',
      },
      {
        kind: 'pronunciation',
        words: [
          { word: 'economy', ipa: '/ɪˈkɒnəmi/' },
          { word: 'economic', ipa: '/ˌiːkəˈnɒmɪk/' },
          { word: 'economics', ipa: '/ˌiːkəˈnɒmɪks/' },
          { word: 'increase (noun)', ipa: '/ˈɪŋkriːs/' },
          { word: 'increase (verb)', ipa: '/ɪŋˈkriːs/' },
          { word: 'growth', ipa: '/ɡrəʊθ/' },
          { word: 'debt', ipa: '/det/' },
          { word: 'mortgage', ipa: '/ˈmɔːɡɪdʒ/' },
        ],
      },
      {
        kind: 'exercises',
        title: 'Stress, sounds and endings',
        itemIds: itemIds({ skill: 'pronunciation' }, 8),
      },
      {
        kind: 'ai_explain',
        label: 'Which sounds should I work on?',
        prompt:
          'Look at my last three pronunciation attempts. Tell me which two sounds cost me the ' +
          'most marks, why they are hard for an Uzbek speaker, and give me three minimal pairs ' +
          'from economic vocabulary to practise each one.',
      },
    ],
  },

  /* ---------------- Stage 4 — reading ---------------- */
  {
    id: 'lesson-reading-reports',
    moduleId: 'mod-07-reading',
    courseId: COURSE_ID,
    title: 'Reading an Economic Report',
    summary:
      'How professional economic texts are organised, and how to find the claim, the evidence and ' +
      'the hedge.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 40,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>An IMF or World Bank paragraph almost always has the same shape: a claim, the ' +
          'evidence for it, and a hedge that limits it. "Growth is projected to moderate to 4.8 ' +
          'per cent in 2026 <em>(claim)</em>, as tighter monetary policy weighs on domestic demand ' +
          '<em>(evidence)</em>, although a faster recovery in trading partners could support ' +
          'exports <em>(hedge)</em>."</p>' +
          '<p>Once you see the shape, you can read faster and disagree more precisely. Notice the ' +
          'hedging verbs — <em>is projected to</em>, <em>could</em>, <em>is likely to</em> ' +
          '— they are not weakness, they are professional accuracy.</p>',
      },
      {
        kind: 'chart',
        chartType: 'bar',
        data: TRADE_CHART,
        caption: 'Quarterly exports and imports, billion USD. Describe the trade balance.',
      },
      {
        kind: 'exercises',
        title: 'Reading comprehension',
        itemIds: itemIds({ skill: 'reading' }, 8),
      },
    ],
  },

  /* ---------------- Stage 4 — listening ---------------- */
  {
    id: 'lesson-listening-news',
    moduleId: 'mod-08-listening',
    courseId: COURSE_ID,
    title: 'Listening to Business News and Meetings',
    summary:
      'Catching figures, dates and signposting language in fast professional speech.',
    type: 'interactive',
    cefr: 'B1',
    estimatedMin: 35,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>Two things make business listening hard: the numbers come fast, and the important ' +
          'information is signposted rather than repeated. Train your ear for the signposts — ' +
          '<em>moving on to</em>, <em>the key point is</em>, <em>to sum up</em>, <em>having said ' +
          'that</em> — because they tell you what is coming and whether it agrees with what ' +
          'came before.</p>' +
          '<p>For figures, listen for the unit before the number: <em>per cent</em>, <em>billion ' +
          'som</em>, <em>basis points</em>. A number without a unit is not information.</p>',
      },
      {
        kind: 'exercises',
        title: 'Listening comprehension',
        itemIds: itemIds({ skill: 'listening' }, 6),
      },
    ],
  },

  /* ---------------- Stage 6 — speaking ---------------- */
  {
    id: 'lesson-explain-the-chart',
    moduleId: 'mod-10-speaking',
    courseId: COURSE_ID,
    title: 'Explain the Chart in Sixty Seconds',
    summary:
      'The four-move structure professionals use to describe data out loud: frame, trend, turning ' +
      'point, implication.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 40,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>A good chart commentary has four moves, in this order:</p>' +
          '<ol><li><strong>Frame</strong> — what is shown, over what period, in what units. ' +
          '"This chart shows annual inflation and real wage growth from 2019 to 2025, in per cent."</li>' +
          '<li><strong>Trend</strong> — the overall movement. "Inflation has fallen steadily ' +
          'since 2022."</li>' +
          '<li><strong>Turning point</strong> — the exception that needs explaining. ' +
          '"The clear exception is 2022, when inflation rose to 12.3 per cent and real wages ' +
          'actually contracted."</li>' +
          '<li><strong>Implication</strong> — what it means for the decision at hand. ' +
          '"That suggests purchasing power, not headline growth, is the risk to watch."</li></ol>' +
          '<p>Practise with the chart below. Record sixty seconds; the system will assess ' +
          'accuracy, fluency, completeness and prosody, and compare it with your previous attempt.</p>',
      },
      {
        kind: 'chart',
        chartType: 'line',
        data: INFLATION_CHART,
        caption: 'Annual inflation and real wage growth, per cent, 2019-2025.',
      },
      {
        kind: 'video',
        provider: 'youtube',
        src: 'PLACEHOLDER_CHART_TALK_VIDEO_ID',
        caption: 'Model chart commentary with subtitles (2 min).',
      },
      {
        kind: 'ai_explain',
        label: 'Role-play: present this to a sceptical investor',
        prompt:
          'Play a sceptical investor. I will present this inflation chart to you for one minute. ' +
          'Interrupt me twice with a hard question, then give me feedback on my structure, my ' +
          'hedging language and my handling of the interruptions.',
      },
    ],
  },

  /* ---------------- Stage 6 — writing ---------------- */
  {
    id: 'lesson-business-email',
    moduleId: 'mod-11-writing',
    courseId: COURSE_ID,
    title: 'Writing a Business Email That Gets an Answer',
    summary:
      'Subject line, opening move, the request, the deadline, the close — and the register ' +
      'that holds them together.',
    type: 'interactive',
    cefr: 'B1',
    estimatedMin: 40,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>A professional email answers three questions before the reader has to ask them: ' +
          '<strong>what do you want</strong>, <strong>by when</strong>, and <strong>why me</strong>. ' +
          'Put the request in the first two lines; the background can wait.</p>' +
          '<p>Register is where most students lose marks. "Send me the figures" is an order; ' +
          '"Could you send me the figures by Thursday?" is a request; "I would be grateful if you ' +
          'could send the figures by Thursday" is formal. All three are correct English — ' +
          'only one of them is right for your reader.</p>' +
          '<p>Write your draft, read the AI feedback, revise it, then submit. Your teacher sees ' +
          'the final version and the history of drafts.</p>',
      },
      {
        kind: 'infographic',
        imageUrl: '/content/infographics/email-structure.svg',
        caption: 'The five moves of a professional email, with sample language for each.',
      },
      {
        kind: 'exercises',
        title: 'Register and business genres',
        itemIds: itemIds({ skill: 'professional' }, 10),
      },
      {
        kind: 'ai_explain',
        label: 'Review my draft (feedback only, not a rewrite)',
        prompt:
          'Here is my draft email. Do NOT rewrite it for me. Mark each problem, tell me why it is ' +
          'a problem, how I could fix it, and where else the same point would matter. Then score ' +
          'it on task achievement, vocabulary, grammar, coherence and register.',
      },
    ],
  },

  /* ---------------- Stage 7 — case studies ---------------- */
  {
    id: 'lesson-case-method',
    moduleId: 'mod-12-cases',
    courseId: COURSE_ID,
    title: 'How to Work a Case Study in a Team',
    summary:
      'The nine steps of an integrative case, the roles in a team of four, and how the work is ' +
      'assessed.',
    type: 'explanation',
    cefr: 'B2',
    estimatedMin: 30,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>A case study is where everything comes together. You will move through nine steps: ' +
          'read the brief, analyse the chart, select the vocabulary you need, choose the grammar ' +
          'that fits, explain the problem aloud, discuss it with your team, propose a solution, ' +
          'write the report, and present it.</p>' +
          '<p>In a team of four, agree the roles at the start: an <strong>analyst</strong> who ' +
          'owns the numbers, a <strong>writer</strong> who owns the report, a ' +
          '<strong>presenter</strong> who owns the final talk, and a ' +
          '<strong>coordinator</strong> who owns the deadline. Everyone contributes language; ' +
          'the platform records individual contribution.</p>' +
          '<p>Assessment has three sources: an AI rubric score, your teacher’s final mark, ' +
          'and peer assessment from your own team. The criteria are content analysis, ' +
          'professional vocabulary, grammar accuracy, communication, critical thinking and ' +
          'teamwork.</p>',
      },
      {
        kind: 'chart',
        chartType: 'bar',
        data: TRADE_CHART,
        caption:
          'Every case begins with data like this. Your first job is to say what it actually shows.',
      },
      {
        kind: 'ai_explain',
        label: 'Help me plan our team approach',
        prompt:
          'Our team has four members and eight days for the finance case. Suggest a realistic ' +
          'plan with roles, deadlines and checkpoints, and tell me which of the nine steps teams ' +
          'usually underestimate.',
      },
    ],
  },

  /* ---------------- Stage 8 — reflection ---------------- */
  {
    id: 'lesson-reflection',
    moduleId: 'mod-13-reflection',
    courseId: COURSE_ID,
    title: 'Reading Your Feedback and Planning What Is Next',
    summary:
      'How to read the AI feedback report, compare pre-test and post-test profiles, and answer ' +
      'the three reflection questions honestly.',
    type: 'interactive',
    cefr: 'B2',
    estimatedMin: 30,
    order: 1,
    published: true,
    createdBy: 'seed',
    blocks: [
      {
        kind: 'text',
        html:
          '<p>Your feedback report has three parts: what you do well, what to improve, and what to ' +
          'do next. Read the middle part slowly. A pattern that appears in three different tasks ' +
          'is not carelessness — it is a rule you have not yet learned, and it is the ' +
          'fastest thing to fix.</p>' +
          '<p>Then answer the three reflection questions in your own words: <em>What did I do ' +
          'well? What mistakes did I repeat? What will I improve next?</em> Short, honest answers ' +
          'are worth more than long ones. Your next learning path is generated from them together ' +
          'with your test data.</p>',
      },
      {
        kind: 'infographic',
        imageUrl: '/content/infographics/skill-radar.svg',
        caption: 'Pre-test and post-test profiles compared across the eight skills.',
      },
      {
        kind: 'ai_explain',
        label: 'What are my three repeated mistakes?',
        prompt:
          'Look at my error profile for the whole course. Name my three most repeated error types, ' +
          'explain the underlying cause of each one in simple terms, and give me one exercise ' +
          'type that would fix each.',
      },
    ],
  },
]

/* ================================================================== */
/* 4. Yordamchilar                                                     */
/* ================================================================== */

export function lessonsOfModule(moduleId: string): SeedLesson[] {
  return SEED_LESSONS.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order)
}

export function modulesOfStage(stage: Stage): SeedModule[] {
  return SEED_MODULES.filter((m) => m.stage === stage)
}
