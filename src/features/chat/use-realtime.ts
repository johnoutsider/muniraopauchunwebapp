'use client'

import * as React from 'react'
import {
  collection,
  doc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type FirestoreError,
} from 'firebase/firestore'

import { getDb } from '@/lib/firebase/client'
import { COL } from '@/config/constants'
import type { ChatMessageDoc, PresenceDoc, TimeValue } from '@/types'

import { MESSAGE_PAGE_SIZE, TYPING_TTL_MS, type ChatDocEx, type ChatMessage } from './types'

/**
 * Realtime qatlam: Firebase klient SDK + `onSnapshot` (PLAN 8.9).
 * Polling ham, alohida websocket server ham yo'q.
 *
 * Qoidalar (firestore.rules) o'qishni rad etsa, ilova qulamaydi —
 * foydalanuvchiga o'zbekcha tushunarli xabar ko'rsatiladi.
 */

export function firestoreErrorMessage(error: FirestoreError | Error): string {
  const code = (error as FirestoreError).code
  switch (code) {
    case 'permission-denied':
      return 'Bu suhbatni ko‘rish huquqingiz yo‘q yoki sessiya eskirgan. Sahifani yangilang yoki qaytadan tizimga kiring.'
    case 'unauthenticated':
      return 'Sessiya tugagan. Iltimos, qaytadan tizimga kiring.'
    case 'unavailable':
      return 'Internet aloqasi yo‘q. Ulanish tiklangach xabarlar avtomatik yangilanadi.'
    case 'failed-precondition':
      return 'Ma’lumotlar bazasi indeksi hali tayyor emas. Birozdan so‘ng qayta urinib ko‘ring.'
    case 'resource-exhausted':
      return 'So‘rovlar chegarasi tugadi. Birozdan so‘ng qayta urinib ko‘ring.'
    default:
      return 'Xabarlarni yuklab bo‘lmadi. Sahifani yangilab ko‘ring.'
  }
}

export interface ChatMessagesState {
  messages: ChatMessage[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
  hasMore: boolean
  loadingMore: boolean
  loadOlder: () => void
}

/** Chat xabarlari: oxirgi 100 tasi, «eskilarini yuklash» bilan. */
export function useChatMessages(chatId: string, pageSize = MESSAGE_PAGE_SIZE): ChatMessagesState {
  const [count, setCount] = React.useState(pageSize)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(false)
  const [loadingMore, setLoadingMore] = React.useState(false)

  React.useEffect(() => {
    setCount(pageSize)
  }, [chatId, pageSize])

  React.useEffect(() => {
    let active = true
    const messagesQuery = query(
      collection(getDb(), COL.chats, chatId, 'messages'),
      orderBy('ts', 'desc'),
      fsLimit(count)
    )

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (!active) return
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as ChatMessageDoc & { clientId?: string }),
        }))
        rows.reverse()
        setMessages(rows)
        setHasMore(snapshot.size >= count)
        setStatus('ready')
        setLoadingMore(false)
        setError(null)
      },
      (err) => {
        if (!active) return
        setStatus('error')
        setLoadingMore(false)
        setError(firestoreErrorMessage(err))
      }
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [chatId, count])

  const loadOlder = React.useCallback(() => {
    setLoadingMore(true)
    setCount((prev) => prev + MESSAGE_PAGE_SIZE)
  }, [])

  return { messages, status, error, hasMore, loadingMore, loadOlder }
}

/** Chat hujjati: typing indikatori va a'zolar nomlari uchun. */
export function useChatDoc(chatId: string): { chat: ChatDocEx | null; error: string | null } {
  const [chat, setChat] = React.useState<ChatDocEx | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(getDb(), COL.chats, chatId),
      (snap) => {
        setChat(snap.exists() ? (snap.data() as ChatDocEx) : null)
        setError(null)
      },
      (err) => setError(firestoreErrorMessage(err))
    )
    return unsubscribe
  }, [chatId])

  return { chat, error }
}

function tsToMillis(value: TimeValue | null | undefined): number {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return new Date(value).getTime()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && 'seconds' in value) return value.seconds * 1000
  return 0
}

/** Hozir kim yozmoqda (o'zimdan boshqa, oxirgi 6 soniya ichida). */
export function useTypingNames(chat: ChatDocEx | null, myUid: string): string[] {
  const [, forceTick] = React.useReducer((x: number) => x + 1, 0)

  React.useEffect(() => {
    const timer = setInterval(forceTick, 2000)
    return () => clearInterval(timer)
  }, [])

  if (!chat?.typing) return []
  const now = Date.now()
  return Object.entries(chat.typing)
    .filter(([uid, value]) => uid !== myUid && now - tsToMillis(value) < TYPING_TTL_MS)
    .map(([uid]) => chat.memberNames?.[uid] ?? 'Kimdir')
}

/** O'z online holatini yozadi (presence/{uid} — qoidalar bo'yicha ruxsat etilgan). */
export function usePresenceHeartbeat(uid: string): void {
  React.useEffect(() => {
    if (!uid) return
    const ref = doc(getDb(), COL.presence, uid)

    const write = (online: boolean) => {
      void setDoc(ref, { online, lastSeen: serverTimestamp() }, { merge: true }).catch(() => {
        // presence ikkinchi darajali — xatolik ilovani to'xtatmaydi
      })
    }

    write(true)
    const timer = setInterval(() => write(document.visibilityState === 'visible'), 45_000)
    const onVisibility = () => write(document.visibilityState === 'visible')
    const onHide = () => write(false)

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      write(false)
    }
  }, [uid])
}

/** Suhbatdoshning online holati. */
export function useUserPresence(uid?: string): PresenceDoc | null {
  const [presence, setPresence] = React.useState<PresenceDoc | null>(null)

  React.useEffect(() => {
    if (!uid) {
      setPresence(null)
      return
    }
    const unsubscribe = onSnapshot(
      doc(getDb(), COL.presence, uid),
      (snap) => setPresence(snap.exists() ? (snap.data() as PresenceDoc) : null),
      () => setPresence(null)
    )
    return unsubscribe
  }, [uid])

  return presence
}
