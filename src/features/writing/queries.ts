import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { getUserDoc } from '@/features/shared/queries'
import { getErrorProfile } from '@/features/student/queries'
import { COL, ERROR_TAG_LABELS, type CefrLevel } from '@/config/constants'
import { toMillis } from '@/lib/utils/format'
import type { SessionUser, WritingSubmissionDoc } from '@/types'

import { BUILTIN_WRITING_TASKS } from './genres'
import type { DraftSummary, SubmissionDetail, SubmissionSummary, WritingLabData } from './types'

function toSummary(id: string, data: WritingSubmissionDoc): SubmissionSummary {
  return {
    id,
    taskId: data.taskId,
    taskTitle: data.taskTitle,
    genre: data.genre,
    status: data.status,
    wordCount: data.wordCount ?? 0,
    draftCount: data.drafts?.length ?? 0,
    hasTeacherFeedback: Boolean(data.teacherFeedback),
    createdAt: toMillis(data.createdAt),
    submittedAt: data.submittedAt ? toMillis(data.submittedAt) : null,
  }
}

export const listWritingSubmissions = cache(
  async (uid: string, limit = 20): Promise<SubmissionSummary[]> => {
    try {
      const snap = await adminDb()
        .collection(COL.writingSubmissions)
        .where('uid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get()
      return snap.docs.map((doc) => toSummary(doc.id, doc.data() as WritingSubmissionDoc))
    } catch (err) {
      console.error('[writing] listWritingSubmissions failed', err)
      return []
    }
  }
)

export const getWritingSubmission = cache(
  async (uid: string, submissionId: string): Promise<SubmissionDetail | null> => {
    try {
      const snap = await adminDb().collection(COL.writingSubmissions).doc(submissionId).get()
      const data = snap.data() as WritingSubmissionDoc | undefined
      if (!snap.exists || !data || data.uid !== uid) return null

      const drafts: DraftSummary[] = (data.drafts ?? []).map((draft, index) => ({
        index,
        text: draft.text ?? '',
        wordCount: draft.wordCount ?? 0,
        hasFeedback: Boolean(draft.aiFeedback),
        ts: toMillis(draft.ts),
      }))

      const last = data.drafts?.[data.drafts.length - 1]

      return {
        ...toSummary(snap.id, data),
        drafts,
        currentText: data.finalText ?? last?.text ?? '',
        currentFeedback: last?.aiFeedback ?? null,
        teacherFeedback: data.teacherFeedback
          ? { text: data.teacherFeedback.text, score: data.teacherFeedback.score }
          : null,
        rubricScores: data.rubricScores ?? {},
      }
    } catch (err) {
      console.error('[writing] getWritingSubmission failed', err)
      return null
    }
  }
)

export const getWritingLabData = cache(async (user: SessionUser): Promise<WritingLabData> => {
  const [userDoc, submissions, errorProfile] = await Promise.all([
    getUserDoc(user.uid),
    listWritingSubmissions(user.uid),
    getErrorProfile(user.uid),
  ])

  const cefr: CefrLevel = userDoc?.onboarding?.selfAssessedLevel ?? 'B1'
  const knownWeaknesses = (errorProfile?.topTags ?? [])
    .slice(0, 6)
    .map((tag) => ERROR_TAG_LABELS[tag]?.en ?? tag)

  return { tasks: BUILTIN_WRITING_TASKS, submissions, cefr, knownWeaknesses }
})
