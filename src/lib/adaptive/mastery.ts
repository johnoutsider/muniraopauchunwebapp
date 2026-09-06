import 'server-only'

/**
 * Adaptiv dvigatelning Firestore qatlami (PLAN.md 4.3, 6-bo'lim).
 *
 * ILMIY MAQSAD:
 * Har bir urinish tadqiqotning xom ma'lumoti — shuning uchun u YO'QOLMASLIGI
 * va IZCHIL bo'lishi kerak. `recordAttempt` barcha yozuvlarni BITTA
 * `WriteBatch` da bajaradi: yo hammasi yoziladi, yo hech biri. Shu tufayli
 * `attempts` va `statsDaily`/`errorProfiles` agregatlari hech qachon bir-biriga
 * zid bo'lib qolmaydi (eksport va SPSS tahlili uchun kritik).
 *
 * Bitta batch ichida:
 *   1. `attempts/{id}`                       — xom urinish (long dataset)
 *   2. `mastery/{uid}/skills/{skill}__{topic}` — BKT + qiyinlik holati
 *   3. `errorProfiles/{uid}`                  — xato taksonomiyasi hisoblagichlari
 *   4. `statsDaily/{uid}_{YYYY-MM-DD}`        — kunlik agregat
 *   5. `xpEvents/{id}` + `users/{uid}.totalXp` — gamifikatsiya
 *   6. `events_{YYYY_MM}/{id}`                — append-only event log
 *   7. `items/{itemId}.stats`                 — item bank sifat ko'rsatkichi
 */

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { COL, eventsCollection, XP, type ErrorTag, type Skill } from '@/config/constants'
import { dayKey } from '@/lib/utils/format'
import type { AttemptDoc, ItemDoc, MasteryDoc, SessionUser, WithId } from '@/types'

import { applyAttempt, emptyMasteryState, type AttemptOutcome, type MasteryState } from './policy'

/** `mastery/{uid}/skills/{id}` hujjat identifikatori. */
export function masteryId(skill: Skill, topic: string): string {
  return `${skill}__${topic || 'general'}`
}

function masteryRef(uid: string, skill: Skill, topic: string) {
  return adminDb()
    .collection(COL.mastery)
    .doc(uid)
    .collection('skills')
    .doc(masteryId(skill, topic))
}

/* ------------------------------------------------------------------ */
/* O'qish                                                              */
/* ------------------------------------------------------------------ */

/**
 * Ko'nikma holatini olish. Hujjat bo'lmasa — boshlang'ich holat qaytadi
 * (hech qachon `null` emas, chaqiruvchi kodni soddalashtiradi).
 */
export async function getMastery(
  uid: string,
  skill: Skill,
  topic: string,
  diagnosticScore?: number
): Promise<MasteryDoc> {
  const snap = await masteryRef(uid, skill, topic).get()
  const data = snap.data() as Partial<MasteryDoc> | undefined
  const base = emptyMasteryState(diagnosticScore)
  return {
    uid,
    skill,
    topic,
    pMastery: data?.pMastery ?? base.pMastery,
    currentDifficulty: data?.currentDifficulty ?? base.currentDifficulty,
    streakCorrect: data?.streakCorrect ?? 0,
    streakWrong: data?.streakWrong ?? 0,
    attempts: data?.attempts ?? 0,
    correct: data?.correct ?? 0,
    lastPracticedAt: data?.lastPracticedAt ?? 0,
  }
}

/** Talabaning barcha ko'nikma hujjatlari (Learning Path va dashboard uchun). */
export async function getAllMastery(uid: string): Promise<Array<MasteryDoc & WithId>> {
  const snap = await adminDb().collection(COL.mastery).doc(uid).collection('skills').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as MasteryDoc) }))
}

/** Ko'nikma bo'yicha o'rtacha pMastery (0..1) — progress dashboard. */
export async function getSkillMastery(uid: string): Promise<Partial<Record<Skill, number>>> {
  const docs = await getAllMastery(uid)
  const sums = new Map<Skill, { sum: number; n: number }>()
  for (const doc of docs) {
    const entry = sums.get(doc.skill) ?? { sum: 0, n: 0 }
    entry.sum += doc.pMastery ?? 0
    entry.n += 1
    sums.set(doc.skill, entry)
  }
  const out: Partial<Record<Skill, number>> = {}
  for (const [skill, entry] of sums) out[skill] = entry.n ? entry.sum / entry.n : 0
  return out
}

/**
 * Yaqinda ko'rilgan itemlar — `pickNextItem` uchun (takrorlanishning oldini olish).
 */
export async function getRecentItemIds(uid: string, limit = 40): Promise<string[]> {
  const snap = await adminDb()
    .collection(COL.attempts)
    .where('uid', '==', uid)
    .orderBy('ts', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map((doc) => (doc.data() as AttemptDoc).itemId).filter(Boolean)
}

/* ------------------------------------------------------------------ */
/* Yozish                                                              */
/* ------------------------------------------------------------------ */

export interface RecordAttemptInput {
  /** Baholangan item (id bilan). */
  item: ItemDoc & WithId
  /** Talaba javobi. */
  answer: string[]
  isCorrect: boolean
  /** Qisman ball 0..1 (`gradeItem().score`). */
  score?: number
  timeMs: number
  hintsUsed?: number
  context: AttemptDoc['context']
  contextId?: string
  /** `gradeItem()` qaytargan teglar; berilmasa itemning o'z teglari. */
  errorTags?: ErrorTag[]
  /**
   * Adaptivlik yoqilganmi. Standart: nazorat guruhida O'CHIRILGAN (PLAN 6.8) —
   * difficulty o'zgarmaydi va mikro-tushuntirish ko'rsatilmaydi.
   */
  adaptive?: boolean
}

export interface RecordAttemptResult {
  attemptId: string
  mastery: MasteryDoc
  leveledUp: boolean
  leveledDown: boolean
  needsReteach: boolean
  mastered: boolean
  justMastered: boolean
  xpAwarded: number
}

type AttemptUser = Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>

/**
 * Urinishni qayd etish — adaptiv dvigatelning yagona yozuv nuqtasi.
 * Barcha yozuvlar bitta atomik batch'da.
 */
export async function recordAttempt(
  user: AttemptUser,
  input: RecordAttemptInput
): Promise<RecordAttemptResult> {
  const db = adminDb()
  const { item } = input
  const skill = item.skill
  const topic = item.topic || 'general'
  const hintsUsed = input.hintsUsed ?? 0
  const adaptive = input.adaptive ?? user.expGroup !== 'control'
  const errorTags = input.errorTags ?? (input.isCorrect ? [] : item.errorTags)

  // 1) Joriy holatni o'qiymiz (batchdan tashqarida — batch faqat yozadi)
  const current = await getMastery(user.uid, skill, topic)
  const state: MasteryState = {
    pMastery: current.pMastery,
    currentDifficulty: current.currentDifficulty,
    streakCorrect: current.streakCorrect,
    streakWrong: current.streakWrong,
    attempts: current.attempts,
    correct: current.correct,
  }

  const outcome: AttemptOutcome = applyAttempt(
    state,
    { isCorrect: input.isCorrect, hintsUsed, timeMs: input.timeMs },
    { adaptive }
  )

  const batch = db.batch()
  const now = FieldValue.serverTimestamp()
  const date = dayKey()

  // --- 1. attempts ---------------------------------------------------
  const attemptRef = db.collection(COL.attempts).doc()
  const attemptDoc: Omit<AttemptDoc, 'ts'> & { ts: unknown } = {
    uid: user.uid,
    groupId: user.groupId,
    expGroup: user.expGroup,
    participantCode: user.participantCode,
    itemId: item.id,
    skill,
    topic,
    context: input.context,
    contextId: input.contextId,
    answer: input.answer,
    isCorrect: input.isCorrect,
    score: input.score ?? (input.isCorrect ? 1 : 0),
    timeMs: input.timeMs,
    hintsUsed,
    errorTags,
    difficultyAtTime: current.currentDifficulty,
    ts: now,
  }
  batch.set(attemptRef, attemptDoc)

  // --- 2. mastery ----------------------------------------------------
  batch.set(
    masteryRef(user.uid, skill, topic),
    {
      uid: user.uid,
      skill,
      topic,
      pMastery: outcome.pMastery,
      currentDifficulty: outcome.currentDifficulty,
      streakCorrect: outcome.streakCorrect,
      streakWrong: outcome.streakWrong,
      attempts: outcome.attempts,
      correct: outcome.correct,
      lastPracticedAt: now,
    },
    { merge: true }
  )

  // --- 3. errorProfiles ---------------------------------------------
  if (errorTags.length) {
    const profileUpdate: Record<string, unknown> = {
      uid: user.uid,
      updatedAt: now,
      recent: FieldValue.arrayUnion(
        ...errorTags.slice(0, 3).map((tag) => ({
          tag,
          example: item.stem.slice(0, 160),
          ts: Date.now(),
        }))
      ),
    }
    for (const tag of errorTags) {
      profileUpdate[`counts.${tag}`] = FieldValue.increment(1)
    }
    batch.set(db.collection(COL.errorProfiles).doc(user.uid), profileUpdate, { merge: true })
  }

  // --- 4. statsDaily -------------------------------------------------
  const xpAwarded = input.isCorrect ? XP.ITEM_CORRECT : XP.ITEM_WRONG
  batch.set(
    db.collection(COL.statsDaily).doc(`${user.uid}_${date}`),
    {
      uid: user.uid,
      date,
      participantCode: user.participantCode ?? null,
      expGroup: user.expGroup ?? null,
      groupId: user.groupId ?? null,
      attempts: FieldValue.increment(1),
      correct: FieldValue.increment(input.isCorrect ? 1 : 0),
      timeOnTaskMin: FieldValue.increment(Math.min(10, input.timeMs / 60000)),
      xp: FieldValue.increment(xpAwarded),
      updatedAt: now,
    },
    { merge: true }
  )

  // --- 5. XP ---------------------------------------------------------
  batch.set(db.collection(COL.xpEvents).doc(), {
    uid: user.uid,
    amount: xpAwarded,
    reason: input.isCorrect ? 'item_correct' : 'item_attempt',
    refId: item.id,
    ts: now,
  })
  batch.set(
    db.collection(COL.users).doc(user.uid),
    { totalXp: FieldValue.increment(xpAwarded), lastActiveAt: now },
    { merge: true }
  )

  // --- 6. event log --------------------------------------------------
  batch.set(db.collection(eventsCollection()).doc(), {
    uid: user.uid,
    participantCode: user.participantCode ?? null,
    expGroup: user.expGroup ?? null,
    groupId: user.groupId ?? null,
    type: 'item_attempt',
    payload: {
      itemId: item.id,
      skill,
      topic,
      itemType: item.type,
      difficulty: current.currentDifficulty,
      isCorrect: input.isCorrect,
      timeMs: input.timeMs,
      hintsUsed,
      errorTags,
      context: input.context,
      contextId: input.contextId ?? null,
      leveledUp: outcome.leveledUp,
      leveledDown: outcome.leveledDown,
    },
    ts: now,
  })

  // --- 7. item bank statistikasi -------------------------------------
  batch.set(
    db.collection(COL.items).doc(item.id),
    {
      stats: {
        attempts: FieldValue.increment(1),
        correct: FieldValue.increment(input.isCorrect ? 1 : 0),
      },
    },
    { merge: true }
  )

  await batch.commit()

  return {
    attemptId: attemptRef.id,
    mastery: {
      uid: user.uid,
      skill,
      topic,
      pMastery: outcome.pMastery,
      currentDifficulty: outcome.currentDifficulty,
      streakCorrect: outcome.streakCorrect,
      streakWrong: outcome.streakWrong,
      attempts: outcome.attempts,
      correct: outcome.correct,
      lastPracticedAt: Date.now(),
    },
    leveledUp: outcome.leveledUp,
    leveledDown: outcome.leveledDown,
    needsReteach: outcome.needsReteach,
    mastered: outcome.mastered,
    justMastered: outcome.justMastered,
    xpAwarded,
  }
}

/**
 * Diagnostika natijasidan boshlang'ich mastery hujjatlarini yaratish
 * (PLAN 6.1 — "boshlang'ich difficulty diagnostikadan").
 */
export async function seedMasteryFromDiagnostic(
  uid: string,
  scores: Partial<Record<Skill, number>>,
  topic = 'general'
): Promise<void> {
  const db = adminDb()
  const batch = db.batch()
  for (const [skill, score] of Object.entries(scores) as Array<[Skill, number]>) {
    const base = emptyMasteryState(score)
    batch.set(
      masteryRef(uid, skill, topic),
      {
        uid,
        skill,
        topic,
        ...base,
        lastPracticedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }
  await batch.commit()
}
