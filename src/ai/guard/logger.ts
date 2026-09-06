import 'server-only'

/**
 * AI chaqiruvlarini yozish (PLAN 7.4, 9.1).
 * Har bir chaqiruv:
 *   1) `aiSessions/{id}` hisoblagichlarini yangilaydi (tokenlar, xabarlar soni),
 *   2) `events_{YYYY_MM}` ga `ai_message` eventi qo'shadi (ilmiy ma'lumot),
 *   3) `statsDaily/{uid}_{date}` agregatini oshiradi.
 * Loglash hech qachon o'quv jarayonini to'xtatmaydi — xatolar yutiladi.
 */

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { bumpDailyStats, logEvent } from '@/lib/analytics/events'
import type { AiMessageDoc, AiSessionDoc, SessionUser } from '@/types'
import type { AiUsage } from '@/ai/client'

import { recordAiUsage } from './rate-limit'

/** Analitika uchun kerakli minimal foydalanuvchi maydonlari. */
export type AnalyticsUser = Pick<SessionUser, 'uid' | 'participantCode' | 'expGroup' | 'groupId'>

export type AiMode = AiSessionDoc['mode']

function toUser(uid: string | AnalyticsUser): AnalyticsUser {
  return typeof uid === 'string' ? { uid } : uid
}

/* ------------------------------------------------------------------ */
/* Sessiya                                                              */
/* ------------------------------------------------------------------ */

export interface StartAiSessionInput {
  mode: AiMode
  title: string
  model: string
  persona?: AiSessionDoc['persona']
  scenarioId?: string
  scaffoldLevel?: AiSessionDoc['scaffoldLevel']
}

/** Yangi AI sessiyasini ochadi va uning id sini qaytaradi. */
export async function startAiSession(
  user: string | AnalyticsUser,
  input: StartAiSessionInput
): Promise<string> {
  const u = toUser(user)
  const doc: Omit<AiSessionDoc, 'startedAt' | 'lastMessageAt'> & {
    startedAt: FirebaseFirestore.FieldValue
    lastMessageAt: FirebaseFirestore.FieldValue
  } = {
    uid: u.uid,
    mode: input.mode,
    title: input.title.slice(0, 120),
    model: input.model,
    persona: input.persona,
    scenarioId: input.scenarioId,
    scaffoldLevel: input.scaffoldLevel,
    tokensIn: 0,
    tokensOut: 0,
    messageCount: 0,
    startedAt: FieldValue.serverTimestamp(),
    lastMessageAt: FieldValue.serverTimestamp(),
  }
  const ref = await adminDb().collection(COL.aiSessions).add(doc)
  await logEvent(
    u,
    'ai_session_start',
    { sessionId: ref.id, mode: input.mode },
    { sessionId: ref.id }
  )
  return ref.id
}

/** Sessiyaga bitta xabar qo'shadi (`aiSessions/{id}/messages`). */
export async function appendAiMessage(
  sessionId: string,
  message: Pick<AiMessageDoc, 'role' | 'content'> &
    Partial<Pick<AiMessageDoc, 'feedbackTags' | 'helpful' | 'tokensIn' | 'tokensOut'>>
): Promise<string | null> {
  if (!sessionId) return null
  try {
    const db = adminDb()
    const sessionRef = db.collection(COL.aiSessions).doc(sessionId)
    const msgRef = sessionRef.collection('messages').doc()
    const batch = db.batch()
    batch.set(msgRef, {
      role: message.role,
      content: message.content,
      feedbackTags: message.feedbackTags ?? [],
      helpful: message.helpful ?? null,
      tokensIn: message.tokensIn ?? 0,
      tokensOut: message.tokensOut ?? 0,
      ts: FieldValue.serverTimestamp(),
    })
    batch.set(
      sessionRef,
      {
        messageCount: FieldValue.increment(1),
        tokensIn: FieldValue.increment(message.tokensIn ?? 0),
        tokensOut: FieldValue.increment(message.tokensOut ?? 0),
        lastMessageAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    await batch.commit()
    return msgRef.id
  } catch (err) {
    console.error('[ai/guard] appendAiMessage failed', err)
    return null
  }
}

/** Sessiya tarixini o'qiydi (eskisidan yangisiga). */
export async function getSessionMessages(
  sessionId: string,
  limit = 40
): Promise<Array<AiMessageDoc & { id: string }>> {
  if (!sessionId) return []
  try {
    const snap = await adminDb()
      .collection(COL.aiSessions)
      .doc(sessionId)
      .collection('messages')
      .orderBy('ts', 'desc')
      .limit(Math.max(1, Math.min(limit, 200)))
      .get()
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AiMessageDoc) })).reverse()
  } catch (err) {
    console.error('[ai/guard] getSessionMessages failed', err)
    return []
  }
}

/* ------------------------------------------------------------------ */
/* Chaqiruvni loglash                                                   */
/* ------------------------------------------------------------------ */

export interface LogAiCallInput {
  /** uid yoki analitika maydonlari bilan foydalanuvchi */
  uid: string | AnalyticsUser
  mode: AiMode
  model: string
  usage: AiUsage
  sessionId?: string
  meta?: Record<string, unknown>
}

/**
 * Bitta AI chaqiruvini yozadi: sessiya hisoblagichlari + event + kunlik agregat + kvota.
 * Hech qachon istisno tashlamaydi.
 */
export async function logAiCall(input: LogAiCallInput): Promise<void> {
  const u = toUser(input.uid)
  const tokensIn = input.usage.promptTokens ?? 0
  const tokensOut = input.usage.completionTokens ?? 0

  const tasks: Array<Promise<unknown>> = [
    recordAiUsage(u.uid, {
      promptTokens: tokensIn,
      completionTokens: tokensOut,
      model: input.model,
    }),
    logEvent(
      u,
      'ai_message',
      {
        mode: input.mode,
        model: input.model,
        tokensIn,
        tokensOut,
        latencyMs: input.usage.latencyMs,
        ...(input.meta ?? {}),
      },
      { sessionId: input.sessionId }
    ),
    bumpDailyStats(u, { aiMessages: 1, aiTokens: tokensIn + tokensOut }),
  ]

  if (input.sessionId) {
    tasks.push(
      adminDb()
        .collection(COL.aiSessions)
        .doc(input.sessionId)
        .set(
          {
            tokensIn: FieldValue.increment(tokensIn),
            tokensOut: FieldValue.increment(tokensOut),
            model: input.model,
            lastMessageAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
    )
  }

  const results = await Promise.allSettled(tasks)
  for (const r of results) {
    if (r.status === 'rejected') console.error('[ai/guard] logAiCall partial failure', r.reason)
  }
}
