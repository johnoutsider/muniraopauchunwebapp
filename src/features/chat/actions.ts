'use server'

import { revalidatePath } from 'next/cache'

import { adminBucket, adminDb, FieldValue } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import { truncate } from '@/lib/utils/format'
import type { ActionResult, ChatDoc, SessionUser, UserDoc } from '@/types'

import {
  ATTACHMENT_CHUNK_BYTES,
  MAX_ATTACHMENT_BYTES,
  MAX_MESSAGE_LENGTH,
  isAllowedAttachmentType,
  type ChatAttachment,
  type ChatDocEx,
} from './types'

/**
 * Chat server action'lari (PLAN 8.9).
 *
 * Xabar YUBORISH har doim shu yerdan o'tadi: shunda analitika yoziladi
 * (`chat_message` — faqat uzunlik, matn EMAS) va `lastMessage` yangilanadi.
 * Xabarlarni O'QISH esa klientda `onSnapshot` orqali realtime bo'ladi.
 *
 * Har bir yozuvdan oldin a'zolik SERVERDA tekshiriladi — UI'da tugma
 * yashirilgani himoya hisoblanmaydi.
 */

async function currentStudent(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'student') return null
  return user
}

async function loadChatIfMember(
  chatId: string,
  uid: string
): Promise<(ChatDocEx & { id: string }) | null> {
  if (!chatId || chatId.includes('/')) return null
  const snap = await adminDb().collection(COL.chats).doc(chatId).get()
  if (!snap.exists) return null
  const data = snap.data() as ChatDocEx
  if (!data.memberUids?.includes(uid)) return null
  return { id: snap.id, ...data }
}

/* ------------------------------------------------------------------ */
/* Xabar yuborish                                                      */
/* ------------------------------------------------------------------ */

export async function sendChatMessageAction(input: {
  chatId: string
  text: string
  clientId?: string
  attachments?: ChatAttachment[]
}): Promise<ActionResult<{ id: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.', code: 'unauthenticated' }

  const text = (input.text ?? '').trim()
  const attachments = (input.attachments ?? []).slice(0, 5)

  if (!text && !attachments.length) {
    return { ok: false, error: 'Xabar bo‘sh bo‘lishi mumkin emas.', code: 'empty' }
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Xabar juda uzun (${MAX_MESSAGE_LENGTH} belgigacha).`,
      code: 'too_long',
    }
  }
  for (const attachment of attachments) {
    if (!attachment.path.startsWith(`chats/${input.chatId}/`)) {
      return { ok: false, error: 'Fayl manzili noto‘g‘ri.', code: 'bad_attachment' }
    }
  }

  const chat = await loadChatIfMember(input.chatId, user.uid)
  if (!chat) {
    return { ok: false, error: 'Bu suhbatga yozish huquqingiz yo‘q.', code: 'forbidden' }
  }

  const db = adminDb()
  const chatRef = db.collection(COL.chats).doc(chat.id)
  const messageRef = chatRef.collection('messages').doc()
  const senderName = chat.memberNames?.[user.uid] || user.displayName || 'Talaba'

  const batch = db.batch()
  batch.set(messageRef, {
    senderUid: user.uid,
    senderName,
    text,
    attachments,
    clientId: input.clientId ?? null,
    ts: FieldValue.serverTimestamp(),
  })
  batch.set(
    chatRef,
    {
      lastMessage: {
        text: text ? truncate(text, 120) : `📎 ${attachments[0]?.name ?? 'fayl'}`,
        senderUid: user.uid,
        ts: FieldValue.serverTimestamp(),
      },
      lastRead: { [user.uid]: FieldValue.serverTimestamp() },
      typing: { [user.uid]: FieldValue.delete() },
    },
    { merge: true }
  )
  await batch.commit()

  // Ilmiy ma'lumot: matn EMAS, faqat uzunlik va kontekst (PLAN 9.4).
  await logEvent(user, 'chat_message', {
    chatId: chat.id,
    chatType: chat.type,
    length: text.length,
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
    attachments: attachments.length,
    projectId: chat.projectId ?? null,
    groupId: chat.groupId ?? null,
  })

  // Loyiha kanalidagi xabarlar individual hissa hisobiga qo'shiladi (PLAN 8.10).
  if (chat.projectId) {
    await db
      .collection(COL.projects)
      .doc(chat.projectId)
      .collection('contributions')
      .doc(user.uid)
      .set(
        {
          uid: user.uid,
          name: senderName,
          messages: FieldValue.increment(1),
          lastActiveAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
  }

  return { ok: true, data: { id: messageRef.id } }
}

/** Suhbat o'qildi deb belgilanadi (o'qilmagan xabarlar hisobi uchun). */
export async function markChatReadAction(chatId: string): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const chat = await loadChatIfMember(chatId, user.uid)
  if (!chat) return { ok: false, error: 'Suhbat topilmadi.' }

  await adminDb()
    .collection(COL.chats)
    .doc(chat.id)
    .set({ lastRead: { [user.uid]: FieldValue.serverTimestamp() } }, { merge: true })

  return { ok: true, data: undefined }
}

/** Typing indikatori — klient buni ~4 soniyada bir marta chaqiradi. */
export async function setTypingAction(chatId: string, typing: boolean): Promise<ActionResult> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const chat = await loadChatIfMember(chatId, user.uid)
  if (!chat) return { ok: false, error: 'Suhbat topilmadi.' }

  await adminDb()
    .collection(COL.chats)
    .doc(chat.id)
    .set(
      {
        typing: {
          [user.uid]: typing ? FieldValue.serverTimestamp() : FieldValue.delete(),
        },
      },
      { merge: true }
    )

  return { ok: true, data: undefined }
}

/* ------------------------------------------------------------------ */
/* Suhbat ochish                                                       */
/* ------------------------------------------------------------------ */

function dmChatId(a: string, b: string): string {
  return `dm_${[a, b].sort().join('__')}`
}

/**
 * Sinfdosh yoki guruh o'qituvchisi bilan shaxsiy suhbat ochish.
 * Faqat bir xil guruhdagi talaba yoki guruhning o'qituvchisi bilan mumkin.
 */
export async function startDirectChatAction(
  targetUid: string
): Promise<ActionResult<{ chatId: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }
  if (!targetUid || targetUid === user.uid) {
    return { ok: false, error: 'Suhbatdoshni tanlang.' }
  }
  if (!user.groupId) {
    return { ok: false, error: 'Siz hali guruhga biriktirilmagansiz.' }
  }

  const db = adminDb()
  const [targetSnap, groupSnap, meSnap] = await Promise.all([
    db.collection(COL.users).doc(targetUid).get(),
    db.collection(COL.groups).doc(user.groupId).get(),
    db.collection(COL.users).doc(user.uid).get(),
  ])

  const target = targetSnap.data() as UserDoc | undefined
  if (!target) return { ok: false, error: 'Foydalanuvchi topilmadi.' }

  const teacherId = (groupSnap.data() as { teacherId?: string } | undefined)?.teacherId
  const isClassmate = target.role === 'student' && target.groupId === user.groupId
  const isMyTeacher = target.role === 'teacher' && teacherId === targetUid

  if (!isClassmate && !isMyTeacher) {
    return {
      ok: false,
      error: 'Faqat o‘z guruhingiz talabalari yoki o‘qituvchingiz bilan yozisha olasiz.',
      code: 'forbidden',
    }
  }

  const chatId = dmChatId(user.uid, targetUid)
  const chatRef = db.collection(COL.chats).doc(chatId)
  const existing = await chatRef.get()

  if (!existing.exists) {
    const myName = (meSnap.data() as UserDoc | undefined)?.displayName ?? user.displayName
    const doc: ChatDoc & { lastRead: Record<string, unknown> } = {
      type: isMyTeacher ? 'teacher' : 'dm',
      memberUids: [user.uid, targetUid],
      memberNames: { [user.uid]: myName, [targetUid]: target.displayName },
      lastMessage: {
        text: '',
        senderUid: '',
        ts: FieldValue.serverTimestamp() as never,
      },
      createdAt: FieldValue.serverTimestamp() as never,
      lastRead: { [user.uid]: FieldValue.serverTimestamp() },
    }
    await chatRef.set(doc)
  }

  revalidatePath('/student/communication')
  revalidatePath('/student/communication/chats')
  return { ok: true, data: { chatId } }
}

/**
 * Guruh kanalini ochish (yoki mavjudiga qo'shilish).
 * Kanal id'si `group_{groupId}` — guruhga bitta kanal.
 */
export async function openGroupChannelAction(
  groupId: string
): Promise<ActionResult<{ chatId: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }
  if (!groupId || user.groupId !== groupId) {
    return { ok: false, error: 'Bu guruh kanaliga kirish huquqingiz yo‘q.', code: 'forbidden' }
  }

  const db = adminDb()
  const [groupSnap, studentsSnap] = await Promise.all([
    db.collection(COL.groups).doc(groupId).get(),
    db
      .collection(COL.users)
      .where('groupId', '==', groupId)
      .where('role', '==', 'student')
      .limit(100)
      .get(),
  ])
  if (!groupSnap.exists) return { ok: false, error: 'Guruh topilmadi.' }

  const group = groupSnap.data() as { name?: string; teacherId?: string }
  const memberNames: Record<string, string> = {}
  const memberUids: string[] = []
  for (const doc of studentsSnap.docs) {
    const data = doc.data() as UserDoc
    memberUids.push(doc.id)
    memberNames[doc.id] = data.displayName
  }
  if (group.teacherId) {
    const teacher = await db.collection(COL.users).doc(group.teacherId).get()
    if (teacher.exists) {
      memberUids.push(group.teacherId)
      memberNames[group.teacherId] = (teacher.data() as UserDoc).displayName
    }
  }
  if (!memberUids.includes(user.uid)) memberUids.push(user.uid)

  const chatId = `group_${groupId}`
  const chatRef = db.collection(COL.chats).doc(chatId)
  const existing = await chatRef.get()

  if (existing.exists) {
    await chatRef.set(
      {
        memberUids: FieldValue.arrayUnion(...memberUids),
        memberNames,
      },
      { merge: true }
    )
  } else {
    await chatRef.set({
      type: 'group',
      title: group.name ? `${group.name} — guruh kanali` : 'Guruh kanali',
      groupId,
      memberUids,
      memberNames,
      lastMessage: { text: '', senderUid: '', ts: FieldValue.serverTimestamp() },
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  revalidatePath(`/student/communication/groups/${groupId}`)
  return { ok: true, data: { chatId } }
}

/* ------------------------------------------------------------------ */
/* Fayl biriktirish (rasm / PDF, 10 MB gacha)                          */
/* ------------------------------------------------------------------ */

const UPLOAD_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/

function safeFileName(name: string): string {
  return (
    name
      .replace(/[/\\]/g, '_')
      .replace(/[^\w.\- ]+/g, '')
      .trim()
      .slice(0, 80) || 'fayl'
  )
}

/**
 * Faylning bir bo'lagini yuklaydi. Server Action tanasi ~1 MB bilan
 * cheklangani uchun katta fayl bo'laklab yuboriladi.
 */
export async function uploadChatAttachmentChunkAction(
  formData: FormData
): Promise<ActionResult<{ index: number }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const chatId = String(formData.get('chatId') ?? '')
  const uploadId = String(formData.get('uploadId') ?? '')
  const index = Number(formData.get('index') ?? -1)
  const chunk = formData.get('chunk')

  if (!UPLOAD_ID_RE.test(uploadId)) return { ok: false, error: 'Yuklash identifikatori noto‘g‘ri.' }
  if (!Number.isInteger(index) || index < 0 || index > 31) {
    return { ok: false, error: 'Fayl juda katta.' }
  }
  if (!(chunk instanceof Blob)) return { ok: false, error: 'Fayl bo‘lagi topilmadi.' }
  if (chunk.size > ATTACHMENT_CHUNK_BYTES + 1024) {
    return { ok: false, error: 'Fayl bo‘lagi juda katta.' }
  }

  const chat = await loadChatIfMember(chatId, user.uid)
  if (!chat) return { ok: false, error: 'Bu suhbatga fayl yuklay olmaysiz.', code: 'forbidden' }

  const buffer = Buffer.from(await chunk.arrayBuffer())
  await adminBucket()
    .file(`chats/${chatId}/.uploads/${uploadId}/${String(index).padStart(2, '0')}`)
    .save(buffer, { resumable: false, contentType: 'application/octet-stream' })

  return { ok: true, data: { index } }
}

/** Bo'laklarni bitta faylga birlashtiradi va biriktirma ma'lumotini qaytaradi. */
export async function finalizeChatAttachmentAction(input: {
  chatId: string
  uploadId: string
  chunkCount: number
  name: string
  contentType: string
  size: number
}): Promise<ActionResult<ChatAttachment>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  if (!UPLOAD_ID_RE.test(input.uploadId)) {
    return { ok: false, error: 'Yuklash identifikatori noto‘g‘ri.' }
  }
  if (!isAllowedAttachmentType(input.contentType)) {
    return { ok: false, error: 'Faqat rasm (PNG, JPEG, WebP, GIF) va PDF fayllar mumkin.' }
  }
  if (input.size <= 0 || input.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Fayl hajmi 10 MB dan oshmasligi kerak.' }
  }
  if (input.chunkCount < 1 || input.chunkCount > 32) {
    return { ok: false, error: 'Fayl juda katta.' }
  }

  const chat = await loadChatIfMember(input.chatId, user.uid)
  if (!chat) return { ok: false, error: 'Bu suhbatga fayl yuklay olmaysiz.', code: 'forbidden' }

  const bucket = adminBucket()
  const prefix = `chats/${input.chatId}/.uploads/${input.uploadId}`
  const parts = Array.from({ length: input.chunkCount }, (_, i) =>
    bucket.file(`${prefix}/${String(i).padStart(2, '0')}`)
  )
  const destPath = `chats/${input.chatId}/${input.uploadId}-${safeFileName(input.name)}`
  const dest = bucket.file(destPath)

  try {
    if (parts.length === 1) {
      await parts[0].move(dest)
    } else {
      await bucket.combine(parts, dest)
      await Promise.all(parts.map((part) => part.delete({ ignoreNotFound: true })))
    }
    await dest.setMetadata({ contentType: input.contentType })
  } catch {
    return { ok: false, error: 'Faylni saqlashda xatolik. Qaytadan urinib ko‘ring.' }
  }

  return {
    ok: true,
    data: {
      name: safeFileName(input.name),
      path: destPath,
      type: input.contentType,
      size: input.size,
    },
  }
}

/** Biriktirmani ko'rish uchun vaqtinchalik (1 soat) imzolangan havola. */
export async function getChatAttachmentUrlAction(
  path: string
): Promise<ActionResult<{ url: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const match = /^chats\/([^/]+)\/[^/]+$/.exec(path ?? '')
  if (!match) return { ok: false, error: 'Fayl manzili noto‘g‘ri.' }

  const chat = await loadChatIfMember(match[1], user.uid)
  if (!chat) return { ok: false, error: 'Faylni ko‘rish huquqingiz yo‘q.', code: 'forbidden' }

  try {
    const [url] = await adminBucket()
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + 3600_000 })
    return { ok: true, data: { url } }
  } catch {
    return { ok: false, error: 'Faylni ochib bo‘lmadi.' }
  }
}
