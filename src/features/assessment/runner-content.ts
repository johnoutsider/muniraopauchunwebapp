/**
 * `ItemDoc` / `TestDoc` → klientga xavfsiz `RunnerTest`.
 *
 * NIMA UCHUN KERAK:
 * Test topshirilayotganda brauzerga `answerKey`, `pairs` va `explanation`
 * yuborilmaydi — aks holda talaba DevTools orqali javoblarni ko'rib qo'yadi
 * va eksperiment natijasi buziladi (PLAN 17: "test yaxlitligi").
 * Shu bilan birga matching/classification/word_order turlari ishlashi uchun
 * kalitdan FAQAT tuzilma (elementlar ro'yxati) ajratib olinadi va
 * DETERMINISTIK tarzda aralashtiriladi — sahifa yangilanganda tartib
 * o'zgarmaydi, ya'ni autosave qilingan javoblar joyida qoladi.
 *
 * Modul TOZA (server-only emas) — unit-test qilinadi.
 */

import type { ItemDoc, TestDoc, TestSection, WithId } from '@/types'
import type { Skill } from '@/config/constants'

import type { RunnerItem, RunnerOpenTask, RunnerSection, RunnerTest } from './types'

const PAIR_SEPARATOR = '::'
const ALT_SEPARATOR = '|'
/** Stem ichidagi bo'shliq belgisi: uch va undan ortiq pastki chiziq. */
const BLANK_RE = /_{3,}/g

/** AI/o'qituvchi baholaydigan turlar (`@/lib/adaptive/grade` bilan bir xil). */
const OPEN_TYPES = new Set<ItemDoc['type']>(['open_writing', 'speaking_prompt', 'imitation'])

/** Ovoz bilan javob beriladigan ko'nikmalar. */
const AUDIO_SKILLS = new Set<Skill>(['speaking', 'pronunciation'])

/* ------------------------------------------------------------------ */
/* Deterministik aralashtirish                                         */
/* ------------------------------------------------------------------ */

/** FNV-1a — matndan barqaror 32-bit urug'. */
function seedFrom(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** mulberry32 — kichik, tez va takrorlanuvchan PRNG. */
function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates; bir xil `key` har doim bir xil natija beradi. */
export function stableShuffle<T>(list: readonly T[], key: string): T[] {
  const out = [...list]
  const next = rng(seedFrom(key))
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Kalitdan tuzilmani ajratish (javobni oshkor qilmasdan)              */
/* ------------------------------------------------------------------ */

function splitPair(value: string): [string, string] | null {
  const index = value.indexOf(PAIR_SEPARATOR)
  if (index < 0) return null
  return [value.slice(0, index).trim(), value.slice(index + PAIR_SEPARATOR.length).trim()]
}

/** Stem ichidagi bo'shliqlar soni; topilmasa kalit bandlari soni. */
export function countBlanks(item: Pick<ItemDoc, 'stem' | 'answerKey'>): number {
  const matches = item.stem.match(BLANK_RE)
  if (matches && matches.length > 0) return matches.length
  return Math.max(1, item.answerKey.length)
}

/** Stemni bo'shliqlar bo'yicha bo'laklarga ajratish (UI interleave uchun). */
export function splitStemByBlanks(stem: string): string[] {
  return stem.split(BLANK_RE)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)))
}

/* ------------------------------------------------------------------ */
/* ItemDoc → RunnerItem                                                */
/* ------------------------------------------------------------------ */

export function toRunnerItem(item: ItemDoc & WithId): RunnerItem {
  const base: RunnerItem = {
    id: item.id,
    type: item.type,
    skill: item.skill,
    topic: item.topic,
    cefr: item.cefr,
    difficulty: item.difficulty,
    stem: item.stem,
    instruction: item.instruction,
    audioUrl: item.audioUrl,
    open: OPEN_TYPES.has(item.type),
  }

  switch (item.type) {
    case 'mcq':
      return {
        ...base,
        options: item.options ?? [],
        multi: item.answerKey.filter((key) => key.trim().length > 0).length > 1,
      }

    case 'matching': {
      const pairs = item.pairs ?? []
      return {
        ...base,
        lefts: pairs.map((pair) => pair.left),
        // O'ng ustun aralashtiriladi — juftlik tartibi javobni oshkor qilmasin
        rights: stableShuffle(
          unique(pairs.map((pair) => pair.right)),
          `${item.id}:rights`
        ),
      }
    }

    case 'classification': {
      const elements = unique(
        item.answerKey.map((key) => splitPair(key)?.[0] ?? '').filter(Boolean)
      )
      return {
        ...base,
        elements: stableShuffle(elements, `${item.id}:elements`),
        categories: item.categories ?? [],
      }
    }

    case 'word_order': {
      const sentence = (item.answerKey[0] ?? '').split(ALT_SEPARATOR)[0] ?? ''
      const words = sentence.split(/\s+/).filter(Boolean)
      return { ...base, scrambled: stableShuffle(words, `${item.id}:words`) }
    }

    case 'gap_fill':
      return { ...base, blanks: countBlanks(item) }

    default:
      return base
  }
}

/* ------------------------------------------------------------------ */
/* TestDoc → RunnerTest                                                */
/* ------------------------------------------------------------------ */

function toRunnerOpenTask(section: TestSection): RunnerOpenTask | undefined {
  const prompt = section.openTask?.prompt?.trim()
  if (!prompt) return undefined
  return {
    prompt,
    minWords: section.openTask?.minWords,
    referenceText: section.openTask?.referenceText,
    kind: AUDIO_SKILLS.has(section.skill) ? 'audio' : 'text',
  }
}

export function toRunnerSection(
  section: TestSection,
  itemsById: Map<string, ItemDoc & WithId>
): RunnerSection {
  const items = section.itemIds
    .map((id) => itemsById.get(id))
    .filter((item): item is ItemDoc & WithId => Boolean(item))
    .map(toRunnerItem)

  const reference = section.openTask?.referenceText

  return {
    id: section.id,
    skill: section.skill,
    title: section.title,
    timeLimitMin: section.timeLimitMin,
    maxScore: section.maxScore,
    items,
    // Reading: matn savollar ustida; Listening: TTS uchun skript
    passage: section.skill === 'reading' ? reference : undefined,
    script: section.skill === 'listening' ? reference : undefined,
    openTask: toRunnerOpenTask(section),
  }
}

export function toRunnerTest(
  test: TestDoc & WithId,
  items: Array<ItemDoc & WithId>
): RunnerTest {
  const itemsById = new Map(items.map((item) => [item.id, item]))
  return {
    id: test.id,
    title: test.title,
    type: test.type,
    variant: test.variant,
    sections: test.sections.map((section) => toRunnerSection(section, itemsById)),
    totalMaxScore: test.totalMaxScore,
  }
}

/** Testdagi barcha `itemIds` (takrorlanmaydigan). */
export function collectItemIds(test: Pick<TestDoc, 'sections'>): string[] {
  return unique(test.sections.flatMap((section) => section.itemIds))
}

/** Bo'limda talaba javob berishi kerak bo'lgan qadamlar soni (item + ochiq topshiriq). */
export function sectionStepCount(section: RunnerSection): number {
  return section.items.length + (section.openTask ? 1 : 0)
}
