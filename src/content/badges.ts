/**
 * LinguaEcon AI — gamifikatsiya nishonlari (seed).
 * 20 ta nishon, `BadgeDoc.criteria.kind` ning barcha 9 turi qamrab olingan.
 * `icon` — lucide-react ikonka nomi. `xp` murakkablikka mos ravishda 50..500.
 * Imlo: Britaniya inglizchasi. O'zbekcha nomlar faqat lotin yozuvida.
 */

import type { BadgeDoc } from '@/types'

/** Seed nishon — hujjat identifikatori bilan. */
export type SeedBadge = BadgeDoc & { id: string }

export const SEED_BADGES: SeedBadge[] = [
  /* ---- Boshlanish ------------------------------------------------ */
  {
    id: 'bg-first-step',
    name: 'First Step',
    nameUz: 'Birinchi qadam',
    description: 'Awarded for completing your very first lesson on the platform.',
    icon: 'Footprints',
    xp: 50,
    criteria: { kind: 'lessons_done', value: 1 },
  },
  {
    id: 'bg-know-your-level',
    name: 'Know Your Level',
    nameUz: 'O‘z darajangni bil',
    description: 'Awarded for finishing the diagnostic test and receiving your linguistic profile.',
    icon: 'ClipboardCheck',
    xp: 80,
    criteria: { kind: 'diagnostic_done', value: 1 },
  },

  /* ---- Ketma-ketlik (streak) ------------------------------------- */
  {
    id: 'bg-streak-3',
    name: 'Three-Day Start',
    nameUz: 'Uch kunlik boshlanish',
    description: 'Awarded for studying on three consecutive days.',
    icon: 'Sparkles',
    xp: 60,
    criteria: { kind: 'streak_days', value: 3 },
  },
  {
    id: 'bg-streak-7',
    name: 'Seven-Day Flame',
    nameUz: 'Yetti kunlik olov',
    description: 'Awarded for keeping a study streak of seven days in a row.',
    icon: 'Flame',
    xp: 120,
    criteria: { kind: 'streak_days', value: 7 },
  },
  {
    id: 'bg-streak-30',
    name: 'Month of Discipline',
    nameUz: 'Bir oylik intizom',
    description: 'Awarded for keeping a study streak of thirty consecutive days.',
    icon: 'CalendarCheck',
    xp: 400,
    criteria: { kind: 'streak_days', value: 30 },
  },

  /* ---- To'g'ri javoblar ------------------------------------------ */
  {
    id: 'bg-items-50',
    name: 'Fifty Correct',
    nameUz: 'Ellik to‘g‘ri javob',
    description: 'Awarded for answering fifty practice items correctly.',
    icon: 'CheckCheck',
    xp: 70,
    criteria: { kind: 'items_correct', value: 50 },
  },
  {
    id: 'bg-items-250',
    name: 'Steady Practice',
    nameUz: 'Barqaror mashq',
    description: 'Awarded for answering 250 practice items correctly.',
    icon: 'Target',
    xp: 180,
    criteria: { kind: 'items_correct', value: 250 },
  },
  {
    id: 'bg-items-1000',
    name: 'Thousand Answers',
    nameUz: 'Ming to‘g‘ri javob',
    description: 'Awarded for answering one thousand practice items correctly.',
    icon: 'Trophy',
    xp: 450,
    criteria: { kind: 'items_correct', value: 1000 },
  },

  /* ---- Lug'at ---------------------------------------------------- */
  {
    id: 'bg-words-50',
    name: 'Fifty Words',
    nameUz: 'Ellik so‘z',
    description: 'Awarded for moving fifty professional words to the "known" status in your vocabulary.',
    icon: 'BookA',
    xp: 70,
    criteria: { kind: 'words_learned', value: 50 },
  },
  {
    id: 'bg-words-100',
    name: 'Hundred-Word Master',
    nameUz: 'Yuz so‘z ustasi',
    description: 'Awarded for learning one hundred professional words and keeping them in review.',
    icon: 'BookOpen',
    xp: 150,
    criteria: { kind: 'words_learned', value: 100 },
  },
  {
    id: 'bg-words-300',
    name: 'Lexicon Builder',
    nameUz: 'Lug‘at me’mori',
    description: 'Awarded for learning three hundred professional words across the economic domains.',
    icon: 'Library',
    xp: 400,
    criteria: { kind: 'words_learned', value: 300 },
  },

  /* ---- Darslar --------------------------------------------------- */
  {
    id: 'bg-lessons-5',
    name: 'Five Lessons Done',
    nameUz: 'Besh dars ortda',
    description: 'Awarded for completing five lessons of your learning path.',
    icon: 'ListChecks',
    xp: 90,
    criteria: { kind: 'lessons_done', value: 5 },
  },
  {
    id: 'bg-lessons-16',
    name: 'Course Marathon',
    nameUz: 'Kurs marafoni',
    description: 'Awarded for completing sixteen lessons, that is a full course module cycle.',
    icon: 'GraduationCap',
    xp: 300,
    criteria: { kind: 'lessons_done', value: 16 },
  },

  /* ---- Gapirish -------------------------------------------------- */
  {
    id: 'bg-speaking-70',
    name: 'Clear Voice',
    nameUz: 'Tiniq ovoz',
    description: 'Awarded for reaching a pronunciation score of 70 or higher on a speaking task.',
    icon: 'Mic',
    xp: 150,
    criteria: { kind: 'speaking_score', value: 70 },
  },
  {
    id: 'bg-speaking-85',
    name: 'Confident Speaker',
    nameUz: 'Ishonchli notiq',
    description: 'Awarded for reaching a pronunciation score of 85 or higher on a speaking task.',
    icon: 'AudioLines',
    xp: 350,
    criteria: { kind: 'speaking_score', value: 85 },
  },

  /* ---- Yozish ---------------------------------------------------- */
  {
    id: 'bg-writing-first',
    name: 'First Draft',
    nameUz: 'Birinchi qoralama',
    description: 'Awarded for submitting your first piece of written work for feedback.',
    icon: 'PenLine',
    xp: 60,
    criteria: { kind: 'writing_submitted', value: 1 },
  },
  {
    id: 'bg-writing-10',
    name: 'Ten Reports',
    nameUz: 'O‘nta hisobot',
    description: 'Awarded for submitting ten pieces of written work, including reports and emails.',
    icon: 'FileText',
    xp: 280,
    criteria: { kind: 'writing_submitted', value: 10 },
  },

  /* ---- Loyiha ---------------------------------------------------- */
  {
    id: 'bg-case-solved',
    name: 'Case Solved',
    nameUz: 'Keys yechildi',
    description: 'Awarded for completing a full team case-study project, from analysis to presentation.',
    icon: 'Briefcase',
    xp: 300,
    criteria: { kind: 'project_done', value: 1 },
  },

  /* ---- Refleksiya ------------------------------------------------ */
  {
    id: 'bg-reflections-5',
    name: 'Thoughtful Learner',
    nameUz: 'O‘ylab o‘rganuvchi',
    description: 'Awarded for writing five reflections on your own learning.',
    icon: 'Lightbulb',
    xp: 100,
    criteria: { kind: 'reflections', value: 5 },
  },
  {
    id: 'bg-reflections-20',
    name: 'Reflective Practitioner',
    nameUz: 'Refleksiya ustasi',
    description: 'Awarded for writing twenty reflections and tracking your progress over the course.',
    icon: 'BrainCircuit',
    xp: 320,
    criteria: { kind: 'reflections', value: 20 },
  },
]
