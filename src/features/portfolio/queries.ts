import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis, truncate } from '@/lib/utils/format'
import type {
  PortfolioItemDoc,
  ProjectDoc,
  SpeakingSubmissionDoc,
  UserBadgeDoc,
  WritingSubmissionDoc,
} from '@/types'

export type PortfolioType = PortfolioItemDoc['type']

export interface PortfolioEntry {
  /** Firestore hujjat id — `${type}__${refId}` */
  id: string
  type: PortfolioType
  refId: string
  title: string
  preview?: string
  score?: number
  pinned: boolean
  note?: string
  createdAt: number
  href?: string
  /** Bu yozuv o'qituvchi fikri asosida yaratilgan bo'lsa — muallif nomi */
  meta?: string
}

export interface PortfolioData {
  entries: PortfolioEntry[]
  pinned: PortfolioEntry[]
  byType: Record<PortfolioType, PortfolioEntry[]>
  counts: Record<PortfolioType, number>
  bestScore: number | null
}

export function portfolioDocId(type: PortfolioType, refId: string): string {
  return `${type}__${refId}`
}

/**
 * Portfolio avtomatik yig'iladi (PLAN 8.13): eng yaxshi yozma ishlar, nutq
 * yozuvlari, loyihalar, nishonlar va o'qituvchi feedbacklari. Talaba faqat
 * «pin» qiladi va izoh yozadi — hech narsani qo'lda qo'shmaydi.
 */
export const getPortfolio = cache(async (uid: string): Promise<PortfolioData> => {
  const db = adminDb()

  const [storedSnap, writingSnap, speakingSnap, projectSnap, badgeSnap] = await Promise.all([
    db.collection(COL.portfolioItems).where('uid', '==', uid).limit(300).get(),
    db
      .collection(COL.writingSubmissions)
      .where('uid', '==', uid)
      .limit(50)
      .get()
      .catch(() => null),
    db
      .collection(COL.speakingSubmissions)
      .where('uid', '==', uid)
      .limit(50)
      .get()
      .catch(() => null),
    db
      .collection(COL.projects)
      .where('memberUids', 'array-contains', uid)
      .limit(20)
      .get()
      .catch(() => null),
    db
      .collection(COL.userBadges)
      .doc(uid)
      .collection('items')
      .limit(50)
      .get()
      .catch(() => null),
  ])

  const stored = new Map<string, PortfolioItemDoc & { id: string }>()
  for (const doc of storedSnap.docs) {
    stored.set(doc.id, serialize({ id: doc.id, ...(doc.data() as PortfolioItemDoc) }))
  }

  const entries: PortfolioEntry[] = []
  const push = (entry: Omit<PortfolioEntry, 'id' | 'pinned' | 'note'>) => {
    const id = portfolioDocId(entry.type, entry.refId)
    const saved = stored.get(id)
    entries.push({
      ...entry,
      id,
      pinned: Boolean(saved?.pinned),
      note: saved?.note,
    })
  }

  /* --- Yozma ishlar --------------------------------------------- */
  for (const doc of writingSnap?.docs ?? []) {
    const data = doc.data() as WritingSubmissionDoc
    if (data.status === 'draft') continue
    const score =
      data.teacherFeedback?.score ??
      (data.rubricScores
        ? Object.values(data.rubricScores).reduce<number>((sum, value) => sum + (value ?? 0), 0)
        : undefined)
    push({
      type: 'writing',
      refId: doc.id,
      title: data.taskTitle || 'Yozma ish',
      preview: truncate(data.finalText ?? data.drafts?.at(-1)?.text ?? '', 180),
      score,
      createdAt: toMillis(data.submittedAt ?? data.createdAt),
      href: `/student/writing-lab/${doc.id}`,
      meta: data.genre,
    })

    if (data.teacherFeedback?.text) {
      push({
        type: 'feedback',
        refId: `w_${doc.id}`,
        title: `O‘qituvchi fikri: ${data.taskTitle || 'yozma ish'}`,
        preview: truncate(data.teacherFeedback.text, 200),
        score: data.teacherFeedback.score,
        createdAt: toMillis(data.teacherFeedback.at),
        href: `/student/writing-lab/${doc.id}`,
      })
    }
  }

  /* --- Nutq yozuvlari ------------------------------------------- */
  for (const doc of speakingSnap?.docs ?? []) {
    const data = doc.data() as SpeakingSubmissionDoc
    push({
      type: 'speaking',
      refId: doc.id,
      title: data.taskTitle || 'Nutq mashqi',
      preview: truncate(data.transcript ?? data.referenceText ?? '', 180),
      score: data.azure?.pronScore,
      createdAt: toMillis(data.ts),
      href: `/student/speaking-lab/${doc.id}`,
      meta: `${Math.round(data.durationSec ?? 0)} s · urinish ${data.attemptNo ?? 1}`,
    })

    if (data.teacherFeedback?.text) {
      push({
        type: 'feedback',
        refId: `s_${doc.id}`,
        title: `O‘qituvchi fikri: ${data.taskTitle || 'nutq mashqi'}`,
        preview: truncate(data.teacherFeedback.text, 200),
        score: data.teacherFeedback.score,
        createdAt: toMillis(data.teacherFeedback.at),
        href: `/student/speaking-lab/${doc.id}`,
      })
    }
  }

  /* --- Loyihalar ------------------------------------------------- */
  for (const doc of projectSnap?.docs ?? []) {
    const data = doc.data() as ProjectDoc
    if (data.status === 'active') continue
    const teacherTotal = data.teacherScores
      ? Object.values(data.teacherScores).reduce<number>((sum, value) => sum + (value ?? 0), 0)
      : undefined
    push({
      type: 'project',
      refId: doc.id,
      title: data.title || 'Guruh loyihasi',
      preview: truncate(data.solution ?? data.report ?? '', 180),
      score: teacherTotal,
      createdAt: toMillis(data.createdAt),
      href: `/student/projects/${doc.id}`,
      meta: data.status === 'graded' ? 'Baholangan' : 'Topshirilgan',
    })
  }

  /* --- Nishonlar ------------------------------------------------- */
  for (const doc of badgeSnap?.docs ?? []) {
    const data = doc.data() as UserBadgeDoc
    push({
      type: 'achievement',
      refId: doc.id,
      title: data.name || 'Nishon',
      createdAt: toMillis(data.earnedAt),
      href: '/student/achievements',
    })
  }

  entries.sort((a, b) => b.createdAt - a.createdAt)

  const byType: Record<PortfolioType, PortfolioEntry[]> = {
    writing: [],
    speaking: [],
    project: [],
    achievement: [],
    feedback: [],
  }
  for (const entry of entries) byType[entry.type].push(entry)

  const scores = entries
    .map((entry) => entry.score)
    .filter((score): score is number => typeof score === 'number')

  return {
    entries,
    pinned: entries.filter((entry) => entry.pinned),
    byType,
    counts: {
      writing: byType.writing.length,
      speaking: byType.speaking.length,
      project: byType.project.length,
      achievement: byType.achievement.length,
      feedback: byType.feedback.length,
    },
    bestScore: scores.length ? Math.max(...scores) : null,
  }
})
