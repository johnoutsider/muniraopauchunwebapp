import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis, truncate } from '@/lib/utils/format'
import { getGroup, getUserDoc, listGroupStudents, type Doc } from '@/features/shared/queries'
import type { AssignmentDoc, ChatMessageDoc } from '@/types'

import type { ChatCandidate, ChatDocEx, ChatSummary, CommunicationOverview } from './types'

/**
 * Muloqot markazining server o'qishlari (PLAN 8.9).
 * Realtime qism klientda (`onSnapshot`) ishlaydi — bu yerda faqat
 * dastlabki render uchun kerak bo'lgan ma'lumot yig'iladi.
 */

const CHAT_LIST_LIMIT = 60

function chatTitleFor(chat: ChatDocEx, uid: string): { title: string; otherUid?: string } {
  if (chat.type === 'group' || chat.type === 'project') {
    return { title: chat.title || (chat.type === 'group' ? 'Guruh kanali' : 'Loyiha kanali') }
  }
  const otherUid = chat.memberUids.find((member) => member !== uid)
  const title = (otherUid && chat.memberNames?.[otherUid]) || chat.title || 'Suhbat'
  return { title, otherUid }
}

/** Bitta chat hujjati — faqat a'zo bo'lsa qaytariladi. */
export const getChatForUser = cache(
  async (chatId: string, uid: string): Promise<(ChatDocEx & { id: string }) | null> => {
    const snap = await adminDb().collection(COL.chats).doc(chatId).get()
    if (!snap.exists) return null
    const data = snap.data() as ChatDocEx
    if (!data.memberUids?.includes(uid)) return null
    return serialize({ id: snap.id, ...data })
  }
)

/** O'qilmagan xabarlar soni (lastRead'dan keyin kelganlar, o'zimniki hisobga olinmaydi). */
async function unreadCountFor(chatId: string, uid: string, lastRead: number): Promise<number> {
  try {
    const snap = await adminDb()
      .collection(COL.chats)
      .doc(chatId)
      .collection('messages')
      .where('ts', '>', new Date(lastRead))
      .limit(50)
      .get()
    return snap.docs.filter((d) => (d.data() as ChatMessageDoc).senderUid !== uid).length
  } catch {
    return 0
  }
}

/** Talabaning barcha suhbatlari, oxirgi xabar vaqti bo'yicha tartiblangan. */
export const listMyChats = cache(async (uid: string): Promise<ChatSummary[]> => {
  const snap = await adminDb()
    .collection(COL.chats)
    .where('memberUids', 'array-contains', uid)
    .orderBy('lastMessage.ts', 'desc')
    .limit(CHAT_LIST_LIMIT)
    .get()

  const rows = snap.docs.map((doc) => {
    const data = doc.data() as ChatDocEx
    const { title, otherUid } = chatTitleFor(data, uid)
    const lastMessageTs = toMillis(data.lastMessage?.ts)
    const lastRead = toMillis(data.lastRead?.[uid])
    return {
      id: doc.id,
      data,
      summary: {
        id: doc.id,
        type: data.type,
        title,
        otherUid,
        memberUids: data.memberUids ?? [],
        lastMessageText: data.lastMessage?.text ? truncate(data.lastMessage.text, 80) : '',
        lastMessageTs,
        lastMessageSenderUid: data.lastMessage?.senderUid,
        unread: 0,
        groupId: data.groupId,
        projectId: data.projectId,
      } satisfies ChatSummary,
      needsCount: lastMessageTs > lastRead && Boolean(data.lastMessage?.senderUid),
      lastRead,
    }
  })

  await Promise.all(
    rows.map(async (row) => {
      if (!row.needsCount) return
      row.summary.unread = await unreadCountFor(row.id, uid, row.lastRead)
    })
  )

  return rows.map((row) => serialize(row.summary))
})

/** Muloqot markazi bosh sahifasi uchun yig'ma ko'rsatkichlar. */
export const getCommunicationOverview = cache(
  async (uid: string, groupId?: string): Promise<CommunicationOverview> => {
    const [chats, group, forumNewThreads] = await Promise.all([
      listMyChats(uid),
      groupId ? getGroup(groupId) : Promise.resolve(null),
      countRecentForumThreads(groupId),
    ])

    const sumBy = (type: ChatSummary['type']) =>
      chats.filter((chat) => chat.type === type).reduce((total, chat) => total + chat.unread, 0)

    return {
      chats,
      dmUnread: sumBy('dm'),
      teacherUnread: sumBy('teacher'),
      groupUnread: sumBy('group'),
      projectUnread: sumBy('project'),
      totalUnread: chats.reduce((total, chat) => total + chat.unread, 0),
      groupChatId: chats.find((chat) => chat.type === 'group' && chat.groupId === groupId)?.id,
      hasTeacher: Boolean(group?.teacherId),
      forumNewThreads,
    }
  }
)

/** Oxirgi 7 kunda faollashgan forum mavzulari (global + o'z guruhi). */
async function countRecentForumThreads(groupId?: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 86400000)
  try {
    const snap = await adminDb()
      .collection(COL.forumThreads)
      .where('lastPostAt', '>=', since)
      .limit(100)
      .get()
    return snap.docs.filter((doc) => {
      const scope = (doc.data() as { groupId?: string | null }).groupId
      return !scope || scope === groupId
    }).length
  } catch {
    return 0
  }
}

/** "Yangi suhbat" oynasi uchun: sinfdoshlar + guruh o'qituvchisi. */
export const listChatCandidates = cache(
  async (uid: string, groupId?: string): Promise<ChatCandidate[]> => {
    if (!groupId) return []

    const [students, group, chats] = await Promise.all([
      listGroupStudents(groupId),
      getGroup(groupId),
      listMyChats(uid),
    ])

    const existingByUid = new Map<string, string>()
    for (const chat of chats) {
      if ((chat.type === 'dm' || chat.type === 'teacher') && chat.otherUid) {
        existingByUid.set(chat.otherUid, chat.id)
      }
    }

    const candidates: ChatCandidate[] = students
      .filter((student) => student.uid !== uid && student.status !== 'disabled')
      .map((student) => ({
        uid: student.uid,
        name: student.displayName,
        role: 'student' as const,
        existingChatId: existingByUid.get(student.uid),
      }))

    if (group?.teacherId) {
      const teacher = await getUserDoc(group.teacherId)
      if (teacher) {
        candidates.unshift({
          uid: teacher.uid,
          name: teacher.displayName,
          role: 'teacher',
          existingChatId: existingByUid.get(teacher.uid),
        })
      }
    }

    return candidates
  }
)

/** Guruh kanali (agar ochilgan bo'lsa). */
export const getGroupChat = cache(
  async (groupId: string, uid: string): Promise<(ChatDocEx & { id: string }) | null> => {
    const snap = await adminDb().collection(COL.chats).doc(`group_${groupId}`).get()
    if (!snap.exists) return null
    const data = snap.data() as ChatDocEx
    if (!data.memberUids?.includes(uid)) return null
    return serialize({ id: snap.id, ...data })
  }
)

/** Guruh kanalidagi "guruh topshiriqlari" paneli. */
export const listGroupAssignments = cache(
  async (groupId: string): Promise<Doc<AssignmentDoc>[]> => {
    // Indeks: assignments (groupId ASC, dueAt ASC) — firestore.indexes.json
    const since = new Date(Date.now() - 30 * 86400000)
    const snap = await adminDb()
      .collection(COL.assignments)
      .where('groupId', '==', groupId)
      .where('dueAt', '>=', since)
      .orderBy('dueAt', 'asc')
      .limit(20)
      .get()
    return snap.docs.map((doc) => serialize({ id: doc.id, ...(doc.data() as AssignmentDoc) }))
  }
)
