'use server'

import { revalidatePath } from 'next/cache'

import { adminDb } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult, AiMessageDoc, AiSessionDoc } from '@/types'

import { loadSessionMessages } from './queries'
import type { ChatMessage } from './types'

/** Yon paneldan tanlangan suhbat tarixini yuklaydi. */
export async function fetchSessionMessages(
  sessionId: string
): Promise<ActionResult<{ messages: ChatMessage[]; title: string }>> {
  const user = await requireStudent()
  if (!sessionId) return { ok: false, error: 'Suhbat aniqlanmadi.', code: 'bad_input' }

  const loaded = await loadSessionMessages(user.uid, sessionId)
  if (!loaded.ok) {
    return { ok: false, error: 'Suhbat topilmadi yoki sizga tegishli emas.', code: 'not_found' }
  }
  return { ok: true, data: { messages: loaded.messages, title: loaded.title ?? 'Suhbat' } }
}

/**
 * "Foydali bo'ldimi?" — javob sifati bo'yicha tadqiqot ma'lumoti (PLAN 8.8, 9.1).
 * Xabar hujjatini matn bo'yicha topamiz: oqim tugaganda klientda id yo'q,
 * lekin server `appendAiMessage` orqali aynan shu matnni saqlagan.
 */
export async function rateAssistantMessage(input: {
  sessionId: string
  content: string
  helpful: boolean | null
}): Promise<ActionResult<{ messageId: string }>> {
  const user = await requireStudent()
  const { sessionId, helpful } = input
  const content = String(input.content ?? '').trim()

  if (!sessionId || !content) {
    return { ok: false, error: 'Xabar aniqlanmadi.', code: 'bad_input' }
  }

  try {
    const db = adminDb()
    const sessionRef = db.collection(COL.aiSessions).doc(sessionId)
    const sessionSnap = await sessionRef.get()
    const session = sessionSnap.data() as AiSessionDoc | undefined

    if (!sessionSnap.exists || !session || session.uid !== user.uid) {
      return { ok: false, error: 'Suhbat topilmadi.', code: 'not_found' }
    }

    const snap = await sessionRef.collection('messages').orderBy('ts', 'desc').limit(30).get()

    const head = content.slice(0, 200)
    const match =
      snap.docs.find((doc) => {
        const data = doc.data() as AiMessageDoc
        return data.role === 'assistant' && String(data.content ?? '').slice(0, 200) === head
      }) ?? snap.docs.find((doc) => (doc.data() as AiMessageDoc).role === 'assistant')

    if (!match) return { ok: false, error: 'Xabar topilmadi.', code: 'not_found' }

    await match.ref.set({ helpful }, { merge: true })
    await logEvent(user, 'ai_message', {
      action: 'helpful_vote',
      helpful,
      mode: session.mode,
      messageId: match.id,
    })

    return { ok: true, data: { messageId: match.id } }
  } catch (err) {
    console.error('[ai-teacher] rateAssistantMessage failed', err)
    return { ok: false, error: 'Baholashni saqlab bo‘lmadi.', code: 'internal' }
  }
}

/** Bo'sh yoki keraksiz suhbatni yon paneldan olib tashlash. */
export async function deleteAiSession(sessionId: string): Promise<ActionResult<null>> {
  const user = await requireStudent()
  if (!sessionId) return { ok: false, error: 'Suhbat aniqlanmadi.', code: 'bad_input' }

  try {
    const db = adminDb()
    const ref = db.collection(COL.aiSessions).doc(sessionId)
    const snap = await ref.get()
    const session = snap.data() as AiSessionDoc | undefined

    if (!snap.exists || !session || session.uid !== user.uid) {
      return { ok: false, error: 'Suhbat topilmadi.', code: 'not_found' }
    }

    // Xabarlar ilmiy ma'lumot — o'chirilmaydi, sessiya faqat yashiriladi.
    await ref.set({ hidden: true }, { merge: true })
    revalidatePath('/student/ai-teacher')
    return { ok: true, data: null }
  } catch (err) {
    console.error('[ai-teacher] deleteAiSession failed', err)
    return { ok: false, error: 'Suhbatni yashirib bo‘lmadi.', code: 'internal' }
  }
}
