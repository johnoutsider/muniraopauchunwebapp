/**
 * src/content/items.ts — mashq banki (item bank) seed kontenti.
 *
 * Kontent ikkita fokusli faylga bo'lingan:
 *   - `items-grammar.ts` — 8 ta grammatik mavzu (GRAMMAR_TOPICS) bo'yicha itemlar;
 *   - `items-vocab.ts`   — lug'at (8 domain) + reading, listening, pronunciation,
 *                          professional English itemlari.
 *
 * Bu fayl ularni bitta `SEED_ITEMS` ro'yxatiga birlashtiradi va test/dars
 * tuzishda ishlatiladigan tanlash yordamchilarini beradi.
 *
 * Barcha seed itemlar: `source: 'human'`, `status: 'approved'`.
 * AI generatsiya qilgan itemlar `scripts/generate-items.ts` orqali
 * `status: 'draft'` bilan qo'shiladi va o'qituvchi tomonidan tasdiqlanadi
 * (PLAN 1.5, 7.4 — human-in-the-loop).
 */

import type { Domain, ItemType, Skill } from '@/config/constants'
import type { ItemDoc } from '@/types'

import { SEED_GRAMMAR_ITEMS } from './items-grammar'
import { SEED_VOCAB_ITEMS } from './items-vocab'

/** Seed item — `createdAt` seed skriptida qo'shiladi. */
export type SeedItem = Omit<ItemDoc, 'createdAt'> & { id: string }

/** Butun mashq banki (grammatika + lug'at/ko'nikma itemlari). */
export const SEED_ITEMS: SeedItem[] = [...SEED_GRAMMAR_ITEMS, ...SEED_VOCAB_ITEMS]

export { SEED_GRAMMAR_ITEMS, SEED_VOCAB_ITEMS }

/* ------------------------------------------------------------------ */
/* Tanlash yordamchilari                                               */
/* ------------------------------------------------------------------ */

export interface ItemFilter {
  skill?: Skill
  skills?: Skill[]
  topic?: string
  topics?: string[]
  domain?: Domain
  domains?: Domain[]
  type?: ItemType
  difficulty?: number
  difficulties?: number[]
}

/** Filtr bo'yicha itemlarni qaytaradi (id bo'yicha deterministik tartibda). */
export function filterItems(filter: ItemFilter = {}): SeedItem[] {
  const skills = filter.skills ?? (filter.skill ? [filter.skill] : undefined)
  const topics = filter.topics ?? (filter.topic ? [filter.topic] : undefined)
  const domains = filter.domains ?? (filter.domain ? [filter.domain] : undefined)
  const difficulties =
    filter.difficulties ?? (filter.difficulty !== undefined ? [filter.difficulty] : undefined)

  return SEED_ITEMS.filter((item) => {
    if (skills && !skills.includes(item.skill)) return false
    if (topics && !topics.includes(item.topic)) return false
    if (domains && !domains.includes(item.domain)) return false
    if (filter.type && item.type !== filter.type) return false
    if (difficulties && !difficulties.includes(item.difficulty)) return false
    return true
  }).sort((a, b) => a.id.localeCompare(b.id))
}

/** Filtrga mos itemlarning id lari (dars `exercises` bloki uchun). */
export function itemIds(filter: ItemFilter, limit?: number): string[] {
  const found = filterItems(filter).map((item) => item.id)
  return limit === undefined ? found : found.slice(0, limit)
}

/**
 * Qiyinlik bo'yicha aralashtirilgan tanlov: itemlar avval difficulty, so'ng id
 * bo'yicha tartiblanadi va `stride` qadam bilan olinadi. Bu parallel test
 * variantlarini (pre/post) qiyinlik jihatidan taqqoslanuvchan qiladi.
 */
export function stratifiedPick(
  filter: ItemFilter,
  count: number,
  offset = 0,
  stride = 1
): string[] {
  const pool = filterItems(filter).sort(
    (a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id)
  )
  const picked: string[] = []
  for (let i = offset; i < pool.length && picked.length < count; i += stride) {
    picked.push(pool[i].id)
  }
  return picked
}

/* ------------------------------------------------------------------ */
/* Indekslar (CMS va statistika uchun)                                 */
/* ------------------------------------------------------------------ */

function groupBy<K extends string>(keyOf: (item: SeedItem) => K): Record<K, SeedItem[]> {
  const out = {} as Record<K, SeedItem[]>
  for (const item of SEED_ITEMS) {
    const key = keyOf(item)
    ;(out[key] ??= []).push(item)
  }
  return out
}

export const SEED_ITEMS_BY_SKILL: Record<string, SeedItem[]> = groupBy((i) => i.skill)
export const SEED_ITEMS_BY_TOPIC: Record<string, SeedItem[]> = groupBy((i) => i.topic)
export const SEED_ITEMS_BY_DOMAIN: Record<string, SeedItem[]> = groupBy((i) => i.domain)

/** Seed bankining qisqacha statistikasi (seed skripti xulosasi uchun). */
export function itemBankStats(): {
  total: number
  bySkill: Record<string, number>
  byTopic: Record<string, number>
  byType: Record<string, number>
  byDifficulty: Record<number, number>
} {
  const bySkill: Record<string, number> = {}
  const byTopic: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const byDifficulty: Record<number, number> = {}

  for (const item of SEED_ITEMS) {
    bySkill[item.skill] = (bySkill[item.skill] ?? 0) + 1
    byTopic[item.topic] = (byTopic[item.topic] ?? 0) + 1
    byType[item.type] = (byType[item.type] ?? 0) + 1
    byDifficulty[item.difficulty] = (byDifficulty[item.difficulty] ?? 0) + 1
  }

  return { total: SEED_ITEMS.length, bySkill, byTopic, byType, byDifficulty }
}
