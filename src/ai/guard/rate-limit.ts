import 'server-only'

/**
 * AI kunlik limiti (PLAN 7.4, 16, 17).
 *
 * Hisoblagichlar Firestore'da: `aiQuota/{uid}_{YYYY-MM-DD}`.
 * `FieldValue.increment` atomik — parallel so'rovlar ham to'g'ri sanaladi.
 * O'qishlarni kamaytirish uchun jarayon xotirasida qisqa muddatli kesh bor
 * (Vercel'da har instansiya alohida — bu faqat optimizatsiya, haqiqat Firestore'da).
 */

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { AI_LIMITS } from '@/config/constants'
import { dayKey } from '@/lib/utils/format'
import type { AiUsage } from '@/ai/client'

export const AI_QUOTA_COLLECTION = 'aiQuota'

/** Kesh yaroqlilik muddati (ms) — limitgacha uzoq bo'lsa qayta o'qimaymiz. */
const CACHE_TTL_MS = 30_000
/** Kesh hajmi chegarasi — xotira o'sib ketmasligi uchun. */
const CACHE_MAX_ENTRIES = 2000

export interface QuotaResult {
  allowed: boolean
  /** Bugun qolgan xabarlar soni */
  remaining: number
  reason?: string
  /** Qo'shimcha kontekst (UI progress bar uchun) */
  messages?: number
  tokens?: number
  limitMessages?: number
  limitTokens?: number
}

export interface QuotaCounters {
  messages: number
  tokens: number
}

interface CacheEntry extends QuotaCounters {
  key: string
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()

function quotaKey(uid: string, date = dayKey()): string {
  return `${uid}_${date}`
}

function pruneCache(): void {
  if (cache.size <= CACHE_MAX_ENTRIES) return
  const cutoff = Date.now() - CACHE_TTL_MS
  for (const [k, v] of cache) {
    if (v.fetchedAt < cutoff) cache.delete(k)
    if (cache.size <= CACHE_MAX_ENTRIES) break
  }
  // Hali ham to'la bo'lsa — eng eskilarini tashlaymiz
  if (cache.size > CACHE_MAX_ENTRIES) {
    const keys = [...cache.keys()].slice(0, cache.size - CACHE_MAX_ENTRIES)
    for (const k of keys) cache.delete(k)
  }
}

function limitsFor(): { messages: number; tokens: number } {
  return { messages: AI_LIMITS.MESSAGES_PER_DAY, tokens: AI_LIMITS.TOKENS_PER_DAY }
}

function evaluate(counters: QuotaCounters): QuotaResult {
  const limits = limitsFor()
  const remaining = Math.max(0, limits.messages - counters.messages)
  const base = {
    messages: counters.messages,
    tokens: counters.tokens,
    limitMessages: limits.messages,
    limitTokens: limits.tokens,
  }
  if (counters.messages >= limits.messages) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Bugungi AI limitiga yetdingiz (${limits.messages} ta so‘rov). Ertaga yangilanadi — hozircha statik materiallardan foydalaning.`,
      ...base,
    }
  }
  if (counters.tokens >= limits.tokens) {
    return {
      allowed: false,
      remaining,
      reason:
        'Bugungi AI hajmi limitiga yetdingiz. Ertaga yangilanadi — hozircha statik materiallardan foydalaning.',
      ...base,
    }
  }
  return { allowed: true, remaining, ...base }
}

/**
 * Kunlik limitni tekshiradi. AI chaqiruvidan OLDIN chaqiriladi.
 * Firestore o'qib bo'lmasa — o'quv jarayonini to'xtatmaslik uchun ruxsat beriladi.
 */
export async function checkAiQuota(uid: string): Promise<QuotaResult> {
  if (!uid) return { allowed: false, remaining: 0, reason: 'Foydalanuvchi aniqlanmadi.' }

  const key = quotaKey(uid)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return evaluate(cached)
  }

  try {
    const snap = await adminDb().collection(AI_QUOTA_COLLECTION).doc(key).get()
    const data = snap.data() as Partial<QuotaCounters> | undefined
    const counters: QuotaCounters = { messages: data?.messages ?? 0, tokens: data?.tokens ?? 0 }
    cache.set(key, { key, ...counters, fetchedAt: Date.now() })
    pruneCache()
    return evaluate(counters)
  } catch (err) {
    console.error('[ai/guard] checkAiQuota failed', err)
    // Fail-open: limit tekshiruvi ishlamasa ham talaba o'qiy olsin (xarajat logdan ko'rinadi).
    return { allowed: true, remaining: AI_LIMITS.MESSAGES_PER_DAY, reason: undefined }
  }
}

/**
 * AI chaqiruvidan KEYIN sarfni yozadi (atomik increment) va keshni yangilaydi.
 */
export async function recordAiUsage(
  uid: string,
  usage: Pick<AiUsage, 'promptTokens' | 'completionTokens'> & { model?: string }
): Promise<void> {
  if (!uid) return
  const tokens = (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0)
  const date = dayKey()
  const key = quotaKey(uid, date)

  // Optimistik kesh yangilanishi — keyingi tekshiruv darhol to'g'ri bo'lsin
  const cached = cache.get(key)
  cache.set(key, {
    key,
    messages: (cached?.messages ?? 0) + 1,
    tokens: (cached?.tokens ?? 0) + tokens,
    fetchedAt: cached?.fetchedAt ?? Date.now(),
  })

  try {
    await adminDb()
      .collection(AI_QUOTA_COLLECTION)
      .doc(key)
      .set(
        {
          uid,
          date,
          messages: FieldValue.increment(1),
          tokens: FieldValue.increment(tokens),
          lastModel: usage.model ?? null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
  } catch (err) {
    console.error('[ai/guard] recordAiUsage failed', err)
  }
}

/** Test va admin uchun — keshni tozalash. */
export function resetQuotaCache(uid?: string): void {
  if (!uid) {
    cache.clear()
    return
  }
  cache.delete(quotaKey(uid))
}
