import type { PeerReviewDoc } from '@/types'

/** O'zaro baholash (peer assessment) tiplari — PLAN 8.10, 8.11. */

export type PeerArtifactType = 'project' | 'writing'

export type PeerReviewRow = PeerReviewDoc & { id: string }

export interface PeerTarget {
  uid: string
  name: string
  /** Men bu jamoadoshni baholadimmi */
  reviewed: boolean
}

export interface PeerState {
  artifactType: PeerArtifactType
  artifactId: string
  targets: PeerTarget[]
  /** Natijalar faqat o'z bahosini topshirgandan keyin ochiladi */
  revealed: boolean
  receivedCount: number
  /** Kriteriya bo'yicha o'rtacha (revealed bo'lsa) */
  receivedAverages: Record<string, number>
  receivedOverall: number | null
  receivedComments: string[]
}

export const PEER_SCORE_MIN = 0
export const PEER_SCORE_MAX = 5
export const PEER_COMMENT_MIN = 10
export const PEER_COMMENT_MAX = 1000

export function peerReviewId(
  artifactType: PeerArtifactType,
  artifactId: string,
  reviewerUid: string,
  targetUid: string
): string {
  return `${artifactType}_${artifactId}_${reviewerUid}_${targetUid}`
}
