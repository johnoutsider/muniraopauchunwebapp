'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { getSessionUser } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { COL, PROJECT_RUBRIC } from '@/config/constants'
import { awardXp, logEvent } from '@/lib/analytics/events'
import type {
  ActionResult,
  PeerReviewDoc,
  ProjectDoc,
  SessionUser,
  UserDoc,
  WritingSubmissionDoc,
} from '@/types'

import {
  PEER_COMMENT_MAX,
  PEER_COMMENT_MIN,
  PEER_SCORE_MAX,
  PEER_SCORE_MIN,
  peerReviewId,
  type PeerArtifactType,
} from './types'

/**
 * O'zaro baholash (PLAN 8.10, 8.11).
 * Qoidalar:
 *  - bir baholovchi bitta artefakt bo'yicha bir talabani FAQAT BIR MARTA baholaydi;
 *  - baholash faqat topshirilgan ish uchun;
 *  - baholovchi va baholanuvchi bir jamoada (loyiha) yoki bir guruhda (writing) bo'lishi shart.
 */

/** Peer baho bergani uchun XP. */
const PEER_REVIEW_XP = 20

async function currentStudent(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'student') return null
  return user
}

export async function submitPeerReviewAction(input: {
  artifactType: PeerArtifactType
  artifactId: string
  targetUid: string
  rubricScores: Record<string, number>
  comment: string
}): Promise<ActionResult<{ id: string }>> {
  const user = await currentStudent()
  if (!user) return { ok: false, error: 'Avval tizimga kiring.' }

  const flags = await resolveFlags(user)
  if (!flags.peerAssessment) {
    return { ok: false, error: 'O‘zaro baholash sizning guruhingiz uchun yoqilmagan.' }
  }
  if (input.targetUid === user.uid) {
    return { ok: false, error: 'O‘zingizni baholay olmaysiz.' }
  }

  /* --- rubrika --- */
  const scores: Record<string, number> = {}
  for (const criterion of PROJECT_RUBRIC) {
    const value = input.rubricScores?.[criterion]
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { ok: false, error: 'Har bir mezon bo‘yicha baho qo‘ying.' }
    }
    if (value < PEER_SCORE_MIN || value > PEER_SCORE_MAX) {
      return { ok: false, error: `Baho ${PEER_SCORE_MIN}–${PEER_SCORE_MAX} oralig‘ida bo‘lsin.` }
    }
    scores[criterion] = Math.round(value)
  }

  const comment = (input.comment ?? '').trim()
  if (comment.length < PEER_COMMENT_MIN) {
    return { ok: false, error: 'Izoh kamida 10 ta belgidan iborat bo‘lsin.' }
  }
  if (comment.length > PEER_COMMENT_MAX) {
    return { ok: false, error: 'Izoh juda uzun (1000 belgigacha).' }
  }

  /* --- artefaktga huquq --- */
  const db = adminDb()
  let targetName = 'Jamoadosh'

  if (input.artifactType === 'project') {
    const snap = await db.collection(COL.projects).doc(input.artifactId).get()
    if (!snap.exists) return { ok: false, error: 'Loyiha topilmadi.' }
    const project = snap.data() as ProjectDoc
    if (!project.memberUids?.includes(user.uid) || !project.memberUids.includes(input.targetUid)) {
      return { ok: false, error: 'Faqat o‘z jamoangiz a’zolarini baholaysiz.', code: 'forbidden' }
    }
    if (project.status === 'active') {
      return {
        ok: false,
        error: 'Loyiha topshirilgandan keyin baholash mumkin.',
        code: 'too_early',
      }
    }
    targetName =
      project.members?.find((member) => member.uid === input.targetUid)?.name ?? targetName
  } else {
    const snap = await db.collection(COL.writingSubmissions).doc(input.artifactId).get()
    if (!snap.exists) return { ok: false, error: 'Yozma ish topilmadi.' }
    const submission = snap.data() as WritingSubmissionDoc
    if (submission.uid !== input.targetUid) {
      return { ok: false, error: 'Bu ish ko‘rsatilgan talabaga tegishli emas.', code: 'forbidden' }
    }
    if (submission.status === 'draft') {
      return { ok: false, error: 'Ish hali topshirilmagan.', code: 'too_early' }
    }
    const targetSnap = await db.collection(COL.users).doc(input.targetUid).get()
    const target = targetSnap.data() as UserDoc | undefined
    if (!target || !user.groupId || target.groupId !== user.groupId) {
      return {
        ok: false,
        error: 'Faqat o‘z guruhingiz talabalarini baholaysiz.',
        code: 'forbidden',
      }
    }
    targetName = target.displayName
  }

  /* --- yozish (bitta baholovchi — bitta baho) --- */
  const id = peerReviewId(input.artifactType, input.artifactId, user.uid, input.targetUid)
  const review: PeerReviewDoc = {
    reviewerUid: user.uid,
    reviewerName: user.displayName || 'Talaba',
    targetUid: input.targetUid,
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    rubricScores: scores,
    comment,
    ts: FieldValue.serverTimestamp() as never,
  }

  try {
    await db.collection(COL.peerReviews).doc(id).create(review)
  } catch (err) {
    const code = (err as { code?: number | string }).code
    if (code === 6 || code === 'already-exists') {
      return {
        ok: false,
        error: `${targetName}ni allaqachon baholagansiz.`,
        code: 'already_reviewed',
      }
    }
    return { ok: false, error: 'Bahoni saqlab bo‘lmadi. Qaytadan urinib ko‘ring.' }
  }

  await logEvent(user, 'peer_review', {
    artifactType: input.artifactType,
    artifactId: input.artifactId,
    targetUid: input.targetUid,
    average:
      Math.round(
        (Object.values(scores).reduce((sum, score) => sum + score, 0) /
          Object.values(scores).length) *
          10
      ) / 10,
    commentLength: comment.length,
  })
  await awardXp(user, PEER_REVIEW_XP, 'peer_review', input.artifactId)

  if (input.artifactType === 'project') {
    revalidatePath(`/student/projects/${input.artifactId}`)
  }
  return { ok: true, data: { id } }
}
