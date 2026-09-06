import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis } from '@/lib/utils/format'
import { daysUntilDue, isDue } from '@/lib/adaptive/srs'
import type { Doc } from '@/features/shared/queries'
import type { LexiconDoc, UserVocabDoc } from '@/types'

export interface ReviewCard {
  /** userVocab hujjati id — odatda wordId bilan bir xil */
  id: string
  wordId: string
  word: string
  status: UserVocabDoc['status']
  reps: number
  lapses: number
  interval: number
  dueInDays: number
  lexicon: (LexiconDoc & { id: string }) | null
}

export interface VocabOverview {
  total: number
  newCount: number
  learning: number
  known: number
  dueCount: number
  nextDueInDays: number | null
}

const MAX_WORDS = 400

async function listWords(uid: string): Promise<Array<Doc<UserVocabDoc>>> {
  const snap = await adminDb()
    .collection(COL.userVocab)
    .doc(uid)
    .collection('words')
    .limit(MAX_WORDS)
    .get()
  return snap.docs.map((doc) => serialize({ id: doc.id, ...(doc.data() as UserVocabDoc) }))
}

/** «Mening so'zlarim» bo'yicha umumiy holat (PLAN 8.1). */
export const getVocabOverview = cache(async (uid: string): Promise<VocabOverview> => {
  const words = await listWords(uid)
  const due = words.filter((word) => isDue(word.srs))
  const upcoming = words
    .filter((word) => !isDue(word.srs))
    .map((word) => daysUntilDue(word.srs))
    .sort((a, b) => a - b)

  return {
    total: words.length,
    newCount: words.filter((word) => word.status === 'new').length,
    learning: words.filter((word) => word.status === 'learning').length,
    known: words.filter((word) => word.status === 'known').length,
    dueCount: due.length,
    nextDueInDays: upcoming.length ? upcoming[0] : null,
  }
})

/**
 * Takrorlash navbati: muddati kelgan so'zlar + lug'at hujjatlari.
 * Eng ko'p kechikkan so'z birinchi bo'ladi (SM-2, PLAN 6.6).
 */
export const getReviewQueue = cache(
  async (uid: string, limit = 15): Promise<ReviewCard[]> => {
    const words = await listWords(uid)
    const due = words
      .filter((word) => isDue(word.srs))
      .sort((a, b) => toMillis(a.srs?.due) - toMillis(b.srs?.due))
      .slice(0, Math.max(1, limit))

    if (!due.length) return []

    const db = adminDb()
    const snaps = await db.getAll(
      ...due.map((word) => db.collection(COL.lexicon).doc(word.wordId || word.id))
    )
    const lexicon = new Map<string, LexiconDoc & { id: string }>()
    for (const snap of snaps) {
      if (snap.exists) {
        lexicon.set(snap.id, serialize({ id: snap.id, ...(snap.data() as LexiconDoc) }))
      }
    }

    return due.map((word) => ({
      id: word.id,
      wordId: word.wordId || word.id,
      word: word.word,
      status: word.status,
      reps: word.srs?.reps ?? 0,
      lapses: word.srs?.lapses ?? 0,
      interval: word.srs?.interval ?? 0,
      dueInDays: daysUntilDue(word.srs),
      lexicon: lexicon.get(word.wordId || word.id) ?? null,
    }))
  }
)

/** «Mening so'zlarim» ro'yxati (takrorlash rejimidan tashqari). */
export const getMyWords = cache(
  async (uid: string, limit = 60): Promise<ReviewCard[]> => {
    const words = await listWords(uid)
    const sorted = words
      .sort((a, b) => toMillis(a.srs?.due) - toMillis(b.srs?.due))
      .slice(0, Math.max(1, limit))

    if (!sorted.length) return []

    const db = adminDb()
    const snaps = await db.getAll(
      ...sorted.map((word) => db.collection(COL.lexicon).doc(word.wordId || word.id))
    )
    const lexicon = new Map<string, LexiconDoc & { id: string }>()
    for (const snap of snaps) {
      if (snap.exists) {
        lexicon.set(snap.id, serialize({ id: snap.id, ...(snap.data() as LexiconDoc) }))
      }
    }

    return sorted.map((word) => ({
      id: word.id,
      wordId: word.wordId || word.id,
      word: word.word,
      status: word.status,
      reps: word.srs?.reps ?? 0,
      lapses: word.srs?.lapses ?? 0,
      interval: word.srs?.interval ?? 0,
      dueInDays: daysUntilDue(word.srs),
      lexicon: lexicon.get(word.wordId || word.id) ?? null,
    }))
  }
)
