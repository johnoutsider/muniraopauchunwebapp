import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL, PROJECT_RUBRIC } from '@/config/constants'
import { serialize } from '@/lib/utils/format'
import type { PeerReviewDoc } from '@/types'

import type { PeerArtifactType, PeerReviewRow, PeerState, PeerTarget } from './types'

/**
 * Peer assessment holati (PLAN 8.10).
 * MUHIM: natijalar talaba O'Z bahosini topshirmaguncha SERVERDA ham berilmaydi —
 * bu shunchaki UI yashirish emas.
 */
export const getPeerState = cache(
  async (params: {
    artifactType: PeerArtifactType
    artifactId: string
    uid: string
    teammates: Array<{ uid: string; name: string }>
  }): Promise<PeerState> => {
    const snap = await adminDb()
      .collection(COL.peerReviews)
      .where('artifactId', '==', params.artifactId)
      .limit(200)
      .get()

    const reviews: PeerReviewRow[] = snap.docs
      .map((doc) => serialize({ id: doc.id, ...(doc.data() as PeerReviewDoc) }))
      .filter((review) => review.artifactType === params.artifactType)

    const others = params.teammates.filter((mate) => mate.uid !== params.uid)
    const mine = reviews.filter((review) => review.reviewerUid === params.uid)

    const targets: PeerTarget[] = others.map((mate) => ({
      uid: mate.uid,
      name: mate.name,
      reviewed: mine.some((review) => review.targetUid === mate.uid),
    }))

    const revealed = targets.length > 0 && targets.every((target) => target.reviewed)
    const received = reviews.filter((review) => review.targetUid === params.uid)

    const averages: Record<string, number> = {}
    if (revealed && received.length) {
      for (const criterion of PROJECT_RUBRIC) {
        const scores = received
          .map((review) => review.rubricScores?.[criterion])
          .filter((score): score is number => typeof score === 'number')
        if (scores.length) {
          averages[criterion] =
            Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
        }
      }
    }

    const values = Object.values(averages)

    return {
      artifactType: params.artifactType,
      artifactId: params.artifactId,
      targets,
      revealed,
      receivedCount: received.length,
      receivedAverages: averages,
      receivedOverall: values.length
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
        : null,
      receivedComments: revealed
        ? received.map((review) => review.comment).filter((comment) => Boolean(comment?.trim()))
        : [],
    }
  }
)
