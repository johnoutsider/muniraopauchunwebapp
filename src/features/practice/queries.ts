import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import {
  COL,
  GRAMMAR_TOPICS,
  type Skill,
} from '@/config/constants'
import { serialize } from '@/lib/utils/format'
import { getAllMastery, getRecentItemIds, pickSession, type SelectableItem } from '@/lib/adaptive'
import { listItemsFor, type Doc } from '@/features/shared/queries'
import type { ItemDoc, MasteryDoc, UserVocabDoc } from '@/types'

import type { RunnerItem, SkillPracticeCard } from './types'

/** Mashq maydonida ko'rsatiladigan ko'nikmalar (PLAN 8.1–8.4). */
export const PRACTICE_SKILLS: Skill[] = ['vocabulary', 'grammar', 'listening', 'reading']

/* ------------------------------------------------------------------ */
/* Aralashtirish — item id'dan olingan urug' bilan (barqaror tartib)   */
/* ------------------------------------------------------------------ */

function seedFrom(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededShuffle<T>(input: readonly T[], seed: number): T[] {
  const out = [...input]
  let state = seed || 1
  for (let i = out.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const j = state % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const PAIR_SEPARATOR = '::'

/**
 * Firestore itemini klient uchun xavfsiz shaklga o'tkazish.
 * Javob kaliti chiqarilmaydi; matching/classification/word_order uchun
 * kerakli bo'laklar aralashtiriladi.
 */
export function toRunnerItem(item: Doc<ItemDoc>): RunnerItem {
  const seed = seedFrom(item.id)
  const base: RunnerItem = {
    id: item.id,
    type: item.type,
    skill: item.skill,
    topic: item.topic || 'general',
    domain: item.domain,
    cefr: item.cefr,
    difficulty: item.difficulty,
    stem: item.stem,
    instruction: item.instruction,
    blanks: Math.max(1, item.answerKey?.length ?? 1),
    audioUrl: item.audioUrl,
    tags: item.tags ?? [],
  }

  if (item.type === 'mcq' && item.options?.length) {
    base.options = seededShuffle(item.options, seed)
    base.blanks = 1
    return base
  }

  if (item.type === 'matching' && item.pairs?.length) {
    base.left = item.pairs.map((pair) => pair.left)
    base.right = seededShuffle(
      item.pairs.map((pair) => pair.right),
      seed
    )
    base.blanks = item.pairs.length
    return base
  }

  if (item.type === 'classification') {
    const elements = (item.answerKey ?? [])
      .map((key) => key.split(PAIR_SEPARATOR)[0]?.trim())
      .filter((value): value is string => Boolean(value))
    base.elements = seededShuffle(elements, seed)
    base.categories = item.categories ?? []
    base.blanks = elements.length
    return base
  }

  if (item.type === 'word_order') {
    const sentence = (item.answerKey?.[0] ?? '').split('|')[0] ?? ''
    const words = sentence.split(/\s+/).filter(Boolean)
    base.chips = seededShuffle(words, seed)
    base.blanks = words.length
    return base
  }

  return base
}

/* ------------------------------------------------------------------ */
/* Hub — ko'nikmalar bo'yicha holat                                    */
/* ------------------------------------------------------------------ */

function masteryPercent(rows: Array<MasteryDoc & { id: string }>): number {
  if (!rows.length) return 0
  const sum = rows.reduce((total, row) => total + (row.pMastery ?? 0), 0)
  return Math.round((sum / rows.length) * 100)
}

async function countApprovedItems(skill: Skill): Promise<number> {
  try {
    const snap = await adminDb()
      .collection(COL.items)
      .where('status', '==', 'approved')
      .where('skill', '==', skill)
      .count()
      .get()
    return snap.data().count
  } catch {
    return 0
  }
}

async function countDueWords(uid: string): Promise<number> {
  try {
    const snap = await adminDb()
      .collection(COL.userVocab)
      .doc(uid)
      .collection('words')
      .where('srs.due', '<=', new Date())
      .limit(200)
      .get()
    return snap.size
  } catch {
    return 0
  }
}

export const getPracticeHub = cache(async (uid: string): Promise<SkillPracticeCard[]> => {
  const [mastery, dueCount, counts] = await Promise.all([
    getAllMastery(uid),
    countDueWords(uid),
    Promise.all(PRACTICE_SKILLS.map((skill) => countApprovedItems(skill))),
  ])

  return PRACTICE_SKILLS.map((skill, index) => {
    const rows = mastery.filter((row) => row.skill === skill)
    const attempts = rows.reduce((sum, row) => sum + (row.attempts ?? 0), 0)
    const correct = rows.reduce((sum, row) => sum + (row.correct ?? 0), 0)
    const difficulty = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (row.currentDifficulty ?? 2), 0) / rows.length)
      : 2

    return {
      skill,
      mastery: masteryPercent(rows),
      difficulty,
      attempts,
      correct,
      itemCount: counts[index] ?? 0,
      dueCount: skill === 'vocabulary' ? dueCount : 0,
      topics: rows
        .map((row) => ({
          topic: row.topic,
          mastery: Math.round((row.pMastery ?? 0) * 100),
          attempts: row.attempts ?? 0,
        }))
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 6),
    }
  })
})

/* ------------------------------------------------------------------ */
/* Sessiya uchun itemlar                                               */
/* ------------------------------------------------------------------ */

export interface PracticeSessionParams {
  skill: Skill
  topic?: string
  count?: number
  /** Nazorat guruhida adaptiv tanlash o'chirilgan — barcha bir xil ketma-ketlik. */
  adaptive?: boolean
}

export interface PracticeSession {
  items: RunnerItem[]
  difficulty: number
  topic?: string
  masteryPercent: number
}

export const getPracticeSession = cache(
  async (uid: string, params: PracticeSessionParams): Promise<PracticeSession> => {
    const count = params.count ?? 10
    const adaptive = params.adaptive ?? true

    const [pool, mastery, recent] = await Promise.all([
      listItemsFor({ skill: params.skill, topic: params.topic, limit: 60 }),
      getAllMastery(uid),
      getRecentItemIds(uid, 30),
    ])

    const rows = mastery.filter(
      (row) => row.skill === params.skill && (!params.topic || row.topic === params.topic)
    )
    const difficulty = rows.length
      ? Math.round(rows.reduce((sum, row) => sum + (row.currentDifficulty ?? 2), 0) / rows.length)
      : 2

    if (!pool.length) {
      return { items: [], difficulty, topic: params.topic, masteryPercent: masteryPercent(rows) }
    }

    // Nazorat guruhi: barqaror (adaptiv bo'lmagan) ketma-ketlik — PLAN 6.8
    const selected: Array<Doc<ItemDoc>> = adaptive
      ? (pickSession(
          pool as unknown as SelectableItem[],
          { currentDifficulty: difficulty },
          count,
          recent
        ) as unknown as Array<Doc<ItemDoc>>)
      : [...pool]
          .sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
          .slice(0, count)

    return {
      items: selected.map(toRunnerItem),
      difficulty,
      topic: params.topic,
      masteryPercent: masteryPercent(rows),
    }
  }
)

/* ------------------------------------------------------------------ */
/* Grammatika — 8 mavzu iqtisodiy kontekstda (PLAN 8.2)                */
/* ------------------------------------------------------------------ */

export interface GrammarTopicCard {
  id: string
  en: string
  context: string
  cefr: string
  mastery: number
  attempts: number
  itemCount: number
  difficulty: number
}

export const getGrammarTopics = cache(async (uid: string): Promise<GrammarTopicCard[]> => {
  const [mastery, itemsSnap] = await Promise.all([
    getAllMastery(uid),
    adminDb()
      .collection(COL.items)
      .where('status', '==', 'approved')
      .where('skill', '==', 'grammar')
      .select('topic')
      .get()
      .catch(() => null),
  ])

  const counts = new Map<string, number>()
  for (const doc of itemsSnap?.docs ?? []) {
    const topic = (doc.data().topic as string | undefined) ?? 'general'
    counts.set(topic, (counts.get(topic) ?? 0) + 1)
  }

  return GRAMMAR_TOPICS.map((topic) => {
    const row = mastery.find((entry) => entry.skill === 'grammar' && entry.topic === topic.id)
    return {
      id: topic.id,
      en: topic.en,
      context: topic.context,
      cefr: topic.cefr,
      mastery: Math.round((row?.pMastery ?? 0) * 100),
      attempts: row?.attempts ?? 0,
      itemCount: counts.get(topic.id) ?? 0,
      difficulty: row?.currentDifficulty ?? 2,
    }
  })
})

/* ------------------------------------------------------------------ */
/* Lug'at — takrorlash navbati                                         */
/* ------------------------------------------------------------------ */

export const getUserVocabWords = cache(
  async (uid: string, limit = 200): Promise<Array<Doc<UserVocabDoc>>> => {
    const snap = await adminDb()
      .collection(COL.userVocab)
      .doc(uid)
      .collection('words')
      .limit(limit)
      .get()
    return snap.docs.map((doc) => serialize({ id: doc.id, ...(doc.data() as UserVocabDoc) }))
  }
)
