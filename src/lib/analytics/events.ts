import 'server-only'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { COL, eventsCollection, XP, type EventType } from '@/config/constants'
import { dayKey } from '@/lib/utils/format'
import type { SessionUser, StatsDailyDoc } from '@/types'

/**
 * Append-only event log — barcha ilmiy ma'lumotning yagona manbai (PLAN 4.4, 9.1).
 * Hech qachon o'chirilmaydi va yangilanmaydi.
 */
export async function logEvent(
  user: Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>,
  type: EventType,
  payload: Record<string, unknown> = {},
  opts: { sessionId?: string; device?: string } = {}
): Promise<void> {
  try {
    const col = eventsCollection()
    await adminDb()
      .collection(col)
      .add({
        uid: user.uid,
        participantCode: user.participantCode ?? null,
        expGroup: user.expGroup ?? null,
        groupId: user.groupId ?? null,
        type,
        payload,
        sessionId: opts.sessionId ?? null,
        device: opts.device ?? null,
        ts: FieldValue.serverTimestamp(),
      })
  } catch (err) {
    // Analitika ilovani hech qachon to'xtatmasligi kerak
    console.error('[events] logEvent failed', type, err)
  }
}

/** Bir nechta eventni bitta batch'da yozish (mashq sessiyasi oxirida). */
export async function logEvents(
  user: Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>,
  events: Array<{ type: EventType; payload?: Record<string, unknown> }>
): Promise<void> {
  if (!events.length) return
  try {
    const db = adminDb()
    const col = db.collection(eventsCollection())
    const batch = db.batch()
    for (const e of events) {
      batch.set(col.doc(), {
        uid: user.uid,
        participantCode: user.participantCode ?? null,
        expGroup: user.expGroup ?? null,
        groupId: user.groupId ?? null,
        type: e.type,
        payload: e.payload ?? {},
        ts: FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()
  } catch (err) {
    console.error('[events] logEvents failed', err)
  }
}

type DailyDelta = Partial<
  Pick<
    StatsDailyDoc,
    | 'timeOnTaskMin'
    | 'attempts'
    | 'correct'
    | 'aiMessages'
    | 'aiTokens'
    | 'wordsLearned'
    | 'lessonsDone'
    | 'speakingSubmissions'
    | 'writingSubmissions'
    | 'xp'
  >
>

/**
 * Kunlik agregat — Firestore o'qishlarini kamaytirish uchun (PLAN 17).
 * Hujjat kaliti: `${uid}_${YYYY-MM-DD}`.
 */
export async function bumpDailyStats(
  user: Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>,
  delta: DailyDelta
): Promise<void> {
  try {
    const date = dayKey()
    const ref = adminDb().collection(COL.statsDaily).doc(`${user.uid}_${date}`)
    const inc: Record<string, unknown> = {
      uid: user.uid,
      date,
      participantCode: user.participantCode ?? null,
      expGroup: user.expGroup ?? null,
      groupId: user.groupId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    }
    for (const [k, v] of Object.entries(delta)) {
      if (typeof v === 'number' && v !== 0) inc[k] = FieldValue.increment(v)
    }
    await ref.set(inc, { merge: true })
  } catch (err) {
    console.error('[events] bumpDailyStats failed', err)
  }
}

/** XP berish + kunlik agregat + foydalanuvchi jamg'armasi. */
export async function awardXp(
  user: Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>,
  amount: number,
  reason: string,
  refId?: string
): Promise<void> {
  if (amount <= 0) return
  try {
    const db = adminDb()
    await Promise.all([
      db.collection(COL.xpEvents).add({
        uid: user.uid,
        amount,
        reason,
        refId: refId ?? null,
        ts: FieldValue.serverTimestamp(),
      }),
      db
        .collection(COL.users)
        .doc(user.uid)
        .set({ totalXp: FieldValue.increment(amount) }, { merge: true }),
      bumpDailyStats(user, { xp: amount }),
    ])
  } catch (err) {
    console.error('[events] awardXp failed', err)
  }
}

/** Kunlik seriya (streak) — kirish yoki mashq bajarilganda. */
export async function touchStreak(uid: string): Promise<{ current: number; longest: number }> {
  const db = adminDb()
  const ref = db.collection(COL.streaks).doc(uid)
  const today = dayKey()
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const data = snap.data() as
        { current?: number; longest?: number; lastDay?: string } | undefined
      if (data?.lastDay === today) {
        return { current: data.current ?? 1, longest: data.longest ?? 1 }
      }
      const yesterday = dayKey(new Date(Date.now() - 86400000))
      const current = data?.lastDay === yesterday ? (data.current ?? 0) + 1 : 1
      const longest = Math.max(current, data?.longest ?? 0)
      tx.set(ref, { uid, current, longest, lastDay: today }, { merge: true })
      return { current, longest }
    })
  } catch (err) {
    console.error('[events] touchStreak failed', err)
    return { current: 0, longest: 0 }
  }
}

export { XP }
