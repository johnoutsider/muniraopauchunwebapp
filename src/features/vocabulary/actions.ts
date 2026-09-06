'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL, XP } from '@/config/constants'
import { awardXp, bumpDailyStats, logEvent, touchStreak } from '@/lib/analytics/events'
import { newSrs, reviewWord } from '@/lib/adaptive/srs'
import type { ActionResult, LexiconDoc, UserVocabDoc } from '@/types'

function cleanId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 128) return null
  return trimmed
}

export interface ReviewWordInput {
  wordId: string
  /** SM-2 sifat bahosi: 0..5 */
  quality: number
}

export interface ReviewWordResult {
  status: UserVocabDoc['status']
  intervalDays: number
  dueAt: number
  reps: number
  xp: number
}

/**
 * SRS takrorlashini qayd etish (SM-2 — PLAN 6.6).
 * Interval, ease va keyingi muddat `reviewWord` da hisoblanadi.
 */
export async function reviewWordAction(
  input: ReviewWordInput
): Promise<ActionResult<ReviewWordResult>> {
  const user = await requireStudent()

  const wordId = cleanId(input?.wordId)
  if (!wordId) return { ok: false, error: 'So‘z identifikatori noto‘g‘ri.' }

  const quality =
    typeof input?.quality === 'number' && Number.isFinite(input.quality)
      ? Math.min(5, Math.max(0, Math.round(input.quality)))
      : null
  if (quality === null) return { ok: false, error: 'Baho 0 dan 5 gacha bo‘lishi kerak.' }

  const ref = adminDb()
    .collection(COL.userVocab)
    .doc(user.uid)
    .collection('words')
    .doc(wordId)

  const snap = await ref.get()
  const existing = snap.data() as UserVocabDoc | undefined
  if (!existing) return { ok: false, error: 'Bu so‘z sizning ro‘yxatingizda yo‘q.' }

  const next = reviewWord(existing.srs, quality)
  const status: UserVocabDoc['status'] =
    quality < 3 ? 'learning' : next.reps >= 3 && next.interval >= 14 ? 'known' : 'learning'

  const becameKnown = status === 'known' && existing.status !== 'known'
  const xp = quality >= 3 ? XP.ITEM_CORRECT : XP.ITEM_WRONG

  await ref.set(
    {
      status,
      srs: {
        interval: next.interval,
        ease: next.ease,
        due: next.due,
        reps: next.reps,
        lapses: next.lapses,
      },
      lastReviewedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  await Promise.all([
    logEvent(user, 'vocab_review', {
      wordId,
      word: existing.word,
      quality,
      interval: next.interval,
      reps: next.reps,
      lapses: next.lapses,
      status,
    }),
    bumpDailyStats(user, becameKnown ? { wordsLearned: 1 } : {}),
    awardXp(user, xp, 'vocab_review', wordId),
    touchStreak(user.uid),
  ])

  revalidatePath('/student/practice/vocabulary')
  revalidatePath('/student/dashboard')

  return {
    ok: true,
    data: {
      status,
      intervalDays: next.interval,
      dueAt: next.due.getTime(),
      reps: next.reps,
      xp,
    },
  }
}

/** Lug'atdagi so'zni «Mening so'zlarim» ga qo'shish. */
export async function addWordAction(wordId: string): Promise<ActionResult<{ word: string }>> {
  const user = await requireStudent()
  const id = cleanId(wordId)
  if (!id) return { ok: false, error: 'So‘z identifikatori noto‘g‘ri.' }

  const db = adminDb()
  const lexiconSnap = await db.collection(COL.lexicon).doc(id).get()
  if (!lexiconSnap.exists) return { ok: false, error: 'So‘z lug‘atda topilmadi.' }
  const lexicon = lexiconSnap.data() as LexiconDoc
  if (lexicon.status !== 'approved') {
    return { ok: false, error: 'Bu so‘z hali tasdiqlanmagan.' }
  }

  const ref = db.collection(COL.userVocab).doc(user.uid).collection('words').doc(id)
  const existing = await ref.get()
  if (existing.exists) return { ok: true, data: { word: lexicon.word } }

  const srs = newSrs()
  await ref.set({
    uid: user.uid,
    wordId: id,
    word: lexicon.word,
    status: 'new',
    srs: {
      interval: srs.interval,
      ease: srs.ease,
      due: srs.due,
      reps: srs.reps,
      lapses: srs.lapses,
    },
    addedAt: FieldValue.serverTimestamp(),
  })

  revalidatePath('/student/practice/vocabulary')
  return { ok: true, data: { word: lexicon.word } }
}

/** Takrorlash sessiyasini yakunlash — faollik logi. */
export async function finishReviewSessionAction(input: {
  reviewed: number
  remembered: number
}): Promise<ActionResult<{ streak: number }>> {
  const user = await requireStudent()
  const reviewed = Math.min(200, Math.max(0, Math.round(Number(input?.reviewed) || 0)))
  const remembered = Math.min(reviewed, Math.max(0, Math.round(Number(input?.remembered) || 0)))
  if (!reviewed) return { ok: false, error: 'Takrorlangan so‘z yo‘q.' }

  const streak = await touchStreak(user.uid)
  await logEvent(user, 'practice_session', {
    skill: 'vocabulary',
    mode: 'srs_review',
    total: reviewed,
    correct: remembered,
    accuracy: Math.round((remembered / reviewed) * 100),
  })

  revalidatePath('/student/practice/vocabulary')
  return { ok: true, data: { streak: streak.current } }
}
