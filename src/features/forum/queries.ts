import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis } from '@/lib/utils/format'
import type { ForumPostDoc, ForumThreadDoc } from '@/types'

/**
 * Muhokama forumi (PLAN 8.9).
 * Ko'rinish qoidasi: `groupId` bo'sh bo'lsa — global mavzu, aks holda
 * faqat o'sha guruh talabalari ko'radi. Bu qoida firestore.rules'da ham,
 * bu yerda ham (server o'qishi Admin SDK bo'lgani uchun) tekshiriladi.
 */

export type ThreadRow = ForumThreadDoc & { id: string }
export type PostRow = ForumPostDoc & { id: string }

export type ForumSort = 'new' | 'active'

const THREAD_FETCH_LIMIT = 60

export function isThreadVisible(thread: { groupId?: string | null }, groupId?: string): boolean {
  return !thread.groupId || thread.groupId === groupId
}

/** Global + o'z guruhi mavzulari (`lastPostAt` indeksi bo'yicha, keyin xotirada filtr). */
export const listThreads = cache(
  async (params: {
    groupId?: string
    sort?: ForumSort
    tag?: string
    search?: string
  }): Promise<ThreadRow[]> => {
    const db = adminDb()
    const base = db.collection(COL.forumThreads)

    const [globalSnap, groupSnap] = await Promise.all([
      base
        .where('groupId', '==', null)
        .orderBy('lastPostAt', 'desc')
        .limit(THREAD_FETCH_LIMIT)
        .get(),
      params.groupId
        ? base
            .where('groupId', '==', params.groupId)
            .orderBy('lastPostAt', 'desc')
            .limit(THREAD_FETCH_LIMIT)
            .get()
        : null,
    ])

    const rows = new Map<string, ThreadRow>()
    for (const snap of [globalSnap, groupSnap]) {
      if (!snap) continue
      for (const doc of snap.docs) {
        rows.set(doc.id, serialize({ id: doc.id, ...(doc.data() as ForumThreadDoc) }))
      }
    }

    let threads = [...rows.values()].filter((thread) => isThreadVisible(thread, params.groupId))

    if (params.tag) {
      threads = threads.filter((thread) => thread.tags?.includes(params.tag as string))
    }
    if (params.search) {
      const needle = params.search.trim().toLowerCase()
      if (needle) {
        threads = threads.filter(
          (thread) =>
            thread.title.toLowerCase().includes(needle) ||
            thread.body.toLowerCase().includes(needle) ||
            thread.authorName.toLowerCase().includes(needle)
        )
      }
    }

    const sortKey = params.sort === 'new' ? 'createdAt' : 'lastPostAt'
    threads.sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1
      return toMillis(b[sortKey]) - toMillis(a[sortKey])
    })

    return threads
  }
)

/** Ro'yxatdagi mavzulardan teglar to'plami (filtr uchun). */
export function collectTags(threads: ThreadRow[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  for (const thread of threads) {
    for (const tag of thread.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export const getThread = cache(
  async (threadId: string, groupId?: string): Promise<ThreadRow | null> => {
    const snap = await adminDb().collection(COL.forumThreads).doc(threadId).get()
    if (!snap.exists) return null
    const data = snap.data() as ForumThreadDoc
    if (!isThreadVisible(data, groupId)) return null
    return serialize({ id: snap.id, ...data })
  }
)

export const listPosts = cache(async (threadId: string): Promise<PostRow[]> => {
  const snap = await adminDb()
    .collection(COL.forumThreads)
    .doc(threadId)
    .collection('posts')
    .orderBy('ts', 'asc')
    .limit(200)
    .get()
  return snap.docs.map((doc) => serialize({ id: doc.id, ...(doc.data() as ForumPostDoc) }))
})
