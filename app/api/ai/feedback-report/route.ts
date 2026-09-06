import { NextResponse } from 'next/server'
import { z } from 'zod'

import { aiResponse, guardRoute } from '@/features/shared/api-helpers'
import { buildFeedbackReport, type FeedbackReportStats } from '@/ai/services/analysis'
import { getLearningPath, getRecentDailyStats, getUserDoc } from '@/features/shared/queries'
import { adminDb } from '@/lib/firebase/admin'
import { CEFR_LEVELS, COL, type ErrorTag, type Skill } from '@/config/constants'
import type { ErrorProfileDoc, StatsDailyDoc } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 90

const Schema = z.object({
  uid: z.string().max(60).optional(),
  periodDays: z.number().int().min(7).max(90).optional(),
  cefr: z.enum(CEFR_LEVELS).optional(),
})

function sum(rows: StatsDailyDoc[], key: keyof StatsDailyDoc): number {
  return rows.reduce((total, row) => {
    const value = row[key]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

/**
 * 8-bosqich "AI Feedback Report" (PLAN 5, 8.11).
 * Lingvistik profil + oxirgi N kun statistikasi + xatolar profili →
 * Strengths / Areas to improve / Next steps.
 */
export async function POST(request: Request) {
  const guard = await guardRoute(request, { schema: Schema, flag: 'aiFeedback' })
  if (!guard.ok) return guard.response

  const { user, body } = guard.ctx
  const targetUid = body.uid ?? user.uid
  if (targetUid !== user.uid && user.role === 'student') {
    return NextResponse.json({ error: 'Ruxsat yo‘q.' }, { status: 403 })
  }

  const periodDays = body.periodDays ?? 30

  const [userDoc, path, stats, errorSnap] = await Promise.all([
    getUserDoc(targetUid),
    getLearningPath(targetUid),
    getRecentDailyStats(targetUid, periodDays),
    adminDb().collection(COL.errorProfiles).doc(targetUid).get(),
  ])

  const attempts = sum(stats, 'attempts')
  const correct = sum(stats, 'correct')

  // Ko'nikma ballari: eng oxirgi mavjud qiymat; trend: birinchi va oxirgi farqi
  const skillScores: Partial<Record<Skill, number>> = {}
  const firstSeen: Partial<Record<Skill, number>> = {}
  for (const day of stats) {
    for (const [skill, score] of Object.entries(day.skillScores ?? {}) as Array<[Skill, number]>) {
      if (typeof score !== 'number') continue
      if (firstSeen[skill] == null) firstSeen[skill] = score
      skillScores[skill] = score
    }
  }
  const skillTrend: Partial<Record<Skill, number>> = {}
  for (const [skill, score] of Object.entries(skillScores) as Array<[Skill, number]>) {
    skillTrend[skill] = Math.round(score - (firstSeen[skill] ?? score))
  }

  const profileEntries = path?.linguisticProfile ?? {}
  if (Object.keys(skillScores).length === 0) {
    for (const [skill, entry] of Object.entries(profileEntries) as Array<
      [Skill, { score: number }]
    >) {
      if (entry && typeof entry.score === 'number') skillScores[skill] = entry.score
    }
  }

  const reportStats: FeedbackReportStats = {
    periodDays,
    attempts,
    correctRate: attempts ? Math.round((correct / attempts) * 100) / 100 : 0,
    timeOnTaskMin: sum(stats, 'timeOnTaskMin'),
    lessonsDone: sum(stats, 'lessonsDone'),
    wordsLearned: sum(stats, 'wordsLearned'),
    aiMessages: sum(stats, 'aiMessages'),
    writingSubmissions: sum(stats, 'writingSubmissions'),
    speakingSubmissions: sum(stats, 'speakingSubmissions'),
    skillScores,
    skillTrend,
  }

  const errorProfile = errorSnap.data() as ErrorProfileDoc | undefined
  const recentErrors = (errorProfile?.counts ?? {}) as Partial<Record<ErrorTag, number>>

  if (attempts === 0 && Object.keys(skillScores).length === 0) {
    return NextResponse.json(
      {
        error: 'Hisobot uchun ma’lumot yetarli emas. Bir necha mashq bajarib, keyin qaytib keling.',
        code: 'no_data',
      },
      { status: 409 }
    )
  }

  const result = await buildFeedbackReport({
    user: {
      uid: targetUid,
      displayName: userDoc?.displayName ?? user.displayName,
      participantCode: userDoc?.participantCode,
      expGroup: userDoc?.expGroup,
      groupId: userDoc?.groupId,
    },
    profile: path?.linguisticProfile,
    stats: reportStats,
    recentErrors,
    cefr: body.cefr ?? userDoc?.onboarding?.selfAssessedLevel,
    signal: request.signal,
  })

  if (!result.ok) return aiResponse(result)
  return NextResponse.json({ ...result.data, periodDays, stats: reportStats })
}
