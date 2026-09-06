'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { COL } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult, ForumPostDoc, ForumThreadDoc, SessionUser } from '@/types'

/**
 * Forum server action'lari (PLAN 8.9).
 * Talaba faqat O'Z postini tahrirlaydi/o'chiradi; o'qituvchi moderatsiyasi
 * qoidalar va o'qituvchi paneli orqali amalga oshiriladi (bu yerda taklif etilmaydi).
 */

const MAX_TITLE = 200
const MAX_BODY = 8000
const MAX_TAGS = 5

async function currentStudent(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'student') return null
  return user
}

function normalizeTags(input: string[] | undefined): string[] {
  return [
    ...new Set(
      (input ?? [])
        .map((tag) => tag.trim().toLowerCase().replace(/^#/, '').slice(0, 24))
        .filter(Boolean)
    ),
  ].slice(0, MAX_TAGS)
}

function canSeeThread(thread: ForumThreadDoc, user: SessionUser): boolean {
  return !thread.groupId || thread.groupId === user.groupId
}

export async function createThreadAction(input: {
  title: string
  body: string
  tags?: string[]
  scope?: 'global' | 'group'
}): Promise<ActionResult<{ threadId: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const flags = await resolveFlags(user)
  if (!flags.forum) return { ok: false, error: 'Forum sizning guruhingiz uchun yoqilmagan.' }

  const title = (input.title ?? '').trim()
  const body = (input.body ?? '').trim()

  if (title.length < 5) return { ok: false, error: 'Sarlavha kamida 5 ta belgidan iborat bo‘lsin.' }
  if (title.length > MAX_TITLE) return { ok: false, error: 'Sarlavha juda uzun.' }
  if (body.length < 10) return { ok: false, error: 'Matn kamida 10 ta belgidan iborat bo‘lsin.' }
  if (body.length > MAX_BODY) return { ok: false, error: 'Matn juda uzun (8000 belgigacha).' }

  const groupScope = input.scope === 'group' ? (user.groupId ?? null) : null
  if (input.scope === 'group' && !groupScope) {
    return { ok: false, error: 'Siz hali guruhga biriktirilmagansiz.' }
  }

  const ref = adminDb().collection(COL.forumThreads).doc()
  const doc: ForumThreadDoc = {
    title,
    body,
    authorUid: user.uid,
    authorName: user.displayName || 'Talaba',
    groupId: groupScope,
    tags: normalizeTags(input.tags),
    postCount: 0,
    likes: [],
    pinned: false,
    createdAt: FieldValue.serverTimestamp() as never,
    lastPostAt: FieldValue.serverTimestamp() as never,
  }
  await ref.set(doc)

  await logEvent(user, 'forum_post', {
    kind: 'thread',
    threadId: ref.id,
    length: body.length,
    words: body.split(/\s+/).filter(Boolean).length,
    scope: groupScope ? 'group' : 'global',
    tags: doc.tags,
  })

  revalidatePath('/student/communication/forum')
  return { ok: true, data: { threadId: ref.id } }
}

export async function createPostAction(input: {
  threadId: string
  text: string
}): Promise<ActionResult<{ postId: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const flags = await resolveFlags(user)
  if (!flags.forum) return { ok: false, error: 'Forum sizning guruhingiz uchun yoqilmagan.' }

  const text = (input.text ?? '').trim()
  if (text.length < 2) return { ok: false, error: 'Javob juda qisqa.' }
  if (text.length > MAX_BODY) return { ok: false, error: 'Javob juda uzun (8000 belgigacha).' }

  const db = adminDb()
  const threadRef = db.collection(COL.forumThreads).doc(input.threadId)
  const threadSnap = await threadRef.get()
  if (!threadSnap.exists) return { ok: false, error: 'Mavzu topilmadi.' }
  if (!canSeeThread(threadSnap.data() as ForumThreadDoc, user)) {
    return { ok: false, error: 'Bu mavzuga yozish huquqingiz yo‘q.', code: 'forbidden' }
  }

  const postRef = threadRef.collection('posts').doc()
  const post: ForumPostDoc = {
    authorUid: user.uid,
    authorName: user.displayName || 'Talaba',
    text,
    likes: [],
    ts: FieldValue.serverTimestamp() as never,
  }

  const batch = db.batch()
  batch.set(postRef, post)
  batch.update(threadRef, {
    postCount: FieldValue.increment(1),
    lastPostAt: FieldValue.serverTimestamp(),
  })
  await batch.commit()

  await logEvent(user, 'forum_post', {
    kind: 'post',
    threadId: input.threadId,
    postId: postRef.id,
    length: text.length,
    words: text.split(/\s+/).filter(Boolean).length,
  })

  revalidatePath(`/student/communication/forum/${input.threadId}`)
  revalidatePath('/student/communication/forum')
  return { ok: true, data: { postId: postRef.id } }
}

export async function updatePostAction(input: {
  threadId: string
  postId: string
  text: string
}): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const text = (input.text ?? '').trim()
  if (text.length < 2) return { ok: false, error: 'Javob juda qisqa.' }
  if (text.length > MAX_BODY) return { ok: false, error: 'Javob juda uzun.' }

  const ref = adminDb()
    .collection(COL.forumThreads)
    .doc(input.threadId)
    .collection('posts')
    .doc(input.postId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Javob topilmadi.' }
  if ((snap.data() as ForumPostDoc).authorUid !== user.uid) {
    return { ok: false, error: 'Faqat o‘z javobingizni tahrirlay olasiz.', code: 'forbidden' }
  }

  await ref.update({ text, editedAt: FieldValue.serverTimestamp() })
  revalidatePath(`/student/communication/forum/${input.threadId}`)
  return { ok: true, data: undefined }
}

export async function deletePostAction(input: {
  threadId: string
  postId: string
}): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const db = adminDb()
  const threadRef = db.collection(COL.forumThreads).doc(input.threadId)
  const ref = threadRef.collection('posts').doc(input.postId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Javob topilmadi.' }
  if ((snap.data() as ForumPostDoc).authorUid !== user.uid) {
    return { ok: false, error: 'Faqat o‘z javobingizni o‘chira olasiz.', code: 'forbidden' }
  }

  const batch = db.batch()
  batch.delete(ref)
  batch.update(threadRef, { postCount: FieldValue.increment(-1) })
  await batch.commit()

  revalidatePath(`/student/communication/forum/${input.threadId}`)
  return { ok: true, data: undefined }
}

export async function updateThreadAction(input: {
  threadId: string
  title: string
  body: string
  tags?: string[]
}): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const title = (input.title ?? '').trim()
  const body = (input.body ?? '').trim()
  if (title.length < 5 || title.length > MAX_TITLE) {
    return { ok: false, error: 'Sarlavha 5–200 belgi bo‘lsin.' }
  }
  if (body.length < 10 || body.length > MAX_BODY) {
    return { ok: false, error: 'Matn 10–8000 belgi bo‘lsin.' }
  }

  const ref = adminDb().collection(COL.forumThreads).doc(input.threadId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Mavzu topilmadi.' }
  if ((snap.data() as ForumThreadDoc).authorUid !== user.uid) {
    return { ok: false, error: 'Faqat o‘z mavzuingizni tahrirlay olasiz.', code: 'forbidden' }
  }

  await ref.update({ title, body, tags: normalizeTags(input.tags) })
  revalidatePath(`/student/communication/forum/${input.threadId}`)
  revalidatePath('/student/communication/forum')
  return { ok: true, data: undefined }
}

/** O'z mavzusini o'chirish (javoblari bilan). */
export async function deleteThreadAction(threadId: string): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const db = adminDb()
  const ref = db.collection(COL.forumThreads).doc(threadId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Mavzu topilmadi.' }
  if ((snap.data() as ForumThreadDoc).authorUid !== user.uid) {
    return { ok: false, error: 'Faqat o‘z mavzuingizni o‘chira olasiz.', code: 'forbidden' }
  }

  const posts = await ref.collection('posts').limit(300).get()
  const batch = db.batch()
  posts.docs.forEach((doc) => batch.delete(doc.ref))
  batch.delete(ref)
  await batch.commit()

  revalidatePath('/student/communication/forum')
  return { ok: true, data: undefined }
}

/** Like / unlike — mavzu yoki javob uchun. */
export async function toggleLikeAction(input: {
  threadId: string
  postId?: string
}): Promise<ActionResult<{ liked: boolean }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const db = adminDb()
  const threadRef = db.collection(COL.forumThreads).doc(input.threadId)
  const threadSnap = await threadRef.get()
  if (!threadSnap.exists) return { ok: false, error: 'Mavzu topilmadi.' }
  if (!canSeeThread(threadSnap.data() as ForumThreadDoc, user)) {
    return { ok: false, error: 'Bu mavzu sizga ochiq emas.', code: 'forbidden' }
  }

  const ref = input.postId ? threadRef.collection('posts').doc(input.postId) : threadRef
  const snap = input.postId ? await ref.get() : threadSnap
  if (!snap.exists) return { ok: false, error: 'Javob topilmadi.' }

  const likes = ((snap.data() as { likes?: string[] }).likes ?? []) as string[]
  const liked = likes.includes(user.uid)
  await ref.update({
    likes: liked ? FieldValue.arrayRemove(user.uid) : FieldValue.arrayUnion(user.uid),
  })

  revalidatePath(`/student/communication/forum/${input.threadId}`)
  return { ok: true, data: { liked: !liked } }
}
