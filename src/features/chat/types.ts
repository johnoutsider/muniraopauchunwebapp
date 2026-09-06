import type { ChatDoc, ChatMessageDoc, TimeValue } from '@/types'

/**
 * Chat modulining ichki tiplari (PLAN 8.9).
 * `ChatDoc` ustiga qo'shimcha server yozadigan maydonlar:
 *  - `lastRead`  — har bir a'zoning oxirgi o'qigan vaqti (o'qilmagan xabarlar soni uchun)
 *  - `typing`    — kim yozmoqda (server action throttling bilan yozadi)
 */
export type ChatDocEx = ChatDoc & {
  lastRead?: Record<string, TimeValue>
  typing?: Record<string, TimeValue>
}

export interface ChatAttachment {
  name: string
  path: string
  type: string
  size?: number
}

/** Firestore'dan onSnapshot orqali keladigan xabar. */
export type ChatMessage = ChatMessageDoc & {
  id: string
  /** Optimistik qo'shishda dublikatni aniqlash uchun */
  clientId?: string
}

/** UI'da ko'rsatiladigan (hali serverga yetib bormagan) xabar. */
export interface PendingChatMessage {
  clientId: string
  text: string
  attachments: ChatAttachment[]
  failed?: boolean
}

/** Suhbatlar ro'yxati uchun tayyorlangan qator. */
export interface ChatSummary {
  id: string
  type: ChatDoc['type']
  title: string
  subtitle?: string
  otherUid?: string
  memberUids: string[]
  lastMessageText: string
  lastMessageTs: number
  lastMessageSenderUid?: string
  unread: number
  groupId?: string
  projectId?: string
}

/** Yangi suhbat boshlash uchun nomzod (sinfdosh yoki o'qituvchi). */
export interface ChatCandidate {
  uid: string
  name: string
  role: 'student' | 'teacher'
  existingChatId?: string
}

export interface CommunicationOverview {
  chats: ChatSummary[]
  dmUnread: number
  teacherUnread: number
  groupUnread: number
  projectUnread: number
  totalUnread: number
  groupChatId?: string
  hasTeacher: boolean
  forumNewThreads: number
}

/* ------------------------------------------------------------------ */
/* Konstantalar                                                        */
/* ------------------------------------------------------------------ */

export const MESSAGE_PAGE_SIZE = 100
export const MAX_MESSAGE_LENGTH = 4000

/** Fayl biriktirish: faqat rasm va PDF, 10 MB gacha (PLAN 8.9). */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const

/**
 * Server Action tanasi ~1 MB bilan cheklangan, shuning uchun fayl bo'laklab
 * yuboriladi va serverda (Admin SDK) yagona obyektga birlashtiriladi.
 * GCS `combine` bir vaqtda 32 tagacha bo'lakni qo'shadi — 10 MB / 768 KB = 14.
 */
export const ATTACHMENT_CHUNK_BYTES = 768 * 1024

/** Typing indikatori shu muddat ichida "faol" hisoblanadi. */
export const TYPING_TTL_MS = 6000
/** Server action'ga typing signali shu oraliqda bir marta yuboriladi. */
export const TYPING_THROTTLE_MS = 4000

export function isAllowedAttachmentType(type: string): boolean {
  return (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(type)
}
