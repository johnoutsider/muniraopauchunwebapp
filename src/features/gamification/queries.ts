import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL, xpToLevel } from '@/config/constants'
import { dayKey, serialize, toMillis } from '@/lib/utils/format'
import { getAllMastery } from '@/lib/adaptive'
import { listBadges } from '@/features/shared/queries'
import { SEED_BADGES } from '@/content/badges'
import { LESSON_PROGRESS } from '@/features/learn/queries'
import type { BadgeDoc, StatsDailyDoc, StreakDoc, UserBadgeDoc, UserDoc } from '@/types'

export interface BadgeView {
  id: string
  name: string
  nameUz: string
  description: string
  icon: string
  xp: number
  criteria: BadgeDoc['criteria']
  earned: boolean
  earnedAt: number | null
  /** 0..100 — mezon bo'yicha joriy holat */
  progress: number
  progressText: string
}

export interface StreakDay {
  date: string
  active: boolean
  xp: number
  minutes: number
}

export interface LeaderboardRow {
  /** Ishtirokchi kodi yoki ismning birinchi qismi — email HECH QACHON ko'rsatilmaydi */
  label: string
  xp: number
  isMe: boolean
}

export interface AchievementsData {
  totalXp: number
  level: { level: number; next: number; progress: number }
  xpToNext: number
  streak: { current: number; longest: number }
  weeks: StreakDay[][]
  activeDays: number
  badges: BadgeView[]
  earnedCount: number
  leaderboard: LeaderboardRow[]
  leaderboardOptIn: boolean
  metrics: Record<BadgeDoc['criteria']['kind'], number>
}

const WEEKS = 8
const DAYS = WEEKS * 7

async function safeCount(query: FirebaseFirestore.Query): Promise<number> {
  try {
    const snap = await query.count().get()
    return snap.data().count
  } catch {
    try {
      const snap = await query.limit(200).get()
      return snap.size
    } catch {
      return 0
    }
  }
}

/** Yutuqlar sahifasi uchun barcha ma'lumot (PLAN 8.12). */
export const getAchievements = cache(
  async (uid: string, groupId?: string): Promise<AchievementsData> => {
    const db = adminDb()
    const since = dayKey(new Date(Date.now() - (DAYS - 1) * 86400000))

    const [
      userSnap,
      streakSnap,
      statsSnap,
      earnedSnap,
      badgeDocs,
      mastery,
      knownWords,
      lessonsDone,
      writingCount,
      diagnosticCount,
      reflectionCount,
      projectCount,
      speakingSnap,
    ] = await Promise.all([
      db.collection(COL.users).doc(uid).get(),
      db.collection(COL.streaks).doc(uid).get(),
      db
        .collection(COL.statsDaily)
        .where('uid', '==', uid)
        .where('date', '>=', since)
        .orderBy('date', 'asc')
        .limit(DAYS)
        .get(),
      db.collection(COL.userBadges).doc(uid).collection('items').limit(100).get(),
      listBadges(),
      getAllMastery(uid),
      safeCount(
        db.collection(COL.userVocab).doc(uid).collection('words').where('status', '==', 'known')
      ),
      safeCount(
        db
          .collection(COL.users)
          .doc(uid)
          .collection(LESSON_PROGRESS)
          .where('status', '==', 'done')
      ),
      safeCount(db.collection(COL.writingSubmissions).where('uid', '==', uid)),
      safeCount(
        db.collection(COL.testAttempts).where('uid', '==', uid).where('type', '==', 'diagnostic')
      ),
      safeCount(db.collection(COL.reflections).where('uid', '==', uid)),
      safeCount(db.collection(COL.projects).where('memberUids', 'array-contains', uid)),
      db
        .collection(COL.speakingSubmissions)
        .where('uid', '==', uid)
        .orderBy('ts', 'desc')
        .limit(20)
        .get()
        .catch(() => null),
    ])

    const user = userSnap.data() as UserDoc | undefined
    const totalXp = user?.totalXp ?? 0
    const level = xpToLevel(totalXp)
    const streakData = (streakSnap.data() as StreakDoc | undefined) ?? { current: 0, longest: 0 }

    const statsByDate = new Map<string, StatsDailyDoc>()
    for (const doc of statsSnap.docs) {
      const data = doc.data() as StatsDailyDoc
      statsByDate.set(data.date, data)
    }

    // Oxirgi 8 hafta — dushanbadan boshlanadigan qatorlar
    const days: StreakDay[] = []
    for (let offset = DAYS - 1; offset >= 0; offset -= 1) {
      const date = dayKey(new Date(Date.now() - offset * 86400000))
      const stats = statsByDate.get(date)
      days.push({
        date,
        active: Boolean(stats && ((stats.attempts ?? 0) > 0 || (stats.xp ?? 0) > 0)),
        xp: stats?.xp ?? 0,
        minutes: Math.round(stats?.timeOnTaskMin ?? 0),
      })
    }
    const weeks: StreakDay[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

    const speakingBest = (speakingSnap?.docs ?? []).reduce((best, doc) => {
      const score = (doc.data() as { azure?: { pronScore?: number } }).azure?.pronScore ?? 0
      return Math.max(best, score)
    }, 0)

    const metrics: Record<BadgeDoc['criteria']['kind'], number> = {
      streak_days: Math.max(streakData.current ?? 0, streakData.longest ?? 0),
      items_correct: mastery.reduce((sum, row) => sum + (row.correct ?? 0), 0),
      words_learned: knownWords,
      lessons_done: lessonsDone,
      speaking_score: Math.round(speakingBest),
      writing_submitted: writingCount,
      project_done: projectCount,
      diagnostic_done: diagnosticCount,
      reflections: reflectionCount,
    }

    const earned = new Map<string, UserBadgeDoc>()
    for (const doc of earnedSnap.docs) {
      earned.set(doc.id, serialize({ ...(doc.data() as UserBadgeDoc) }))
    }

    const catalogue = badgeDocs.length
      ? badgeDocs
      : SEED_BADGES.map((badge) => ({ ...badge, id: badge.id }))

    const badges: BadgeView[] = catalogue
      .map((badge) => {
        const record = earned.get(badge.id)
        const current = metrics[badge.criteria.kind] ?? 0
        const target = Math.max(1, badge.criteria.value)
        return {
          id: badge.id,
          name: badge.name,
          nameUz: badge.nameUz,
          description: badge.description,
          icon: badge.icon,
          xp: badge.xp,
          criteria: badge.criteria,
          earned: Boolean(record),
          earnedAt: record ? toMillis(record.earnedAt) : null,
          progress: Math.min(100, Math.round((current / target) * 100)),
          progressText: `${Math.min(current, target)} / ${target}`,
        }
      })
      .sort((a, b) => {
        if (a.earned !== b.earned) return a.earned ? -1 : 1
        return b.progress - a.progress
      })

    const leaderboardOptIn = Boolean(
      (user as (UserDoc & { leaderboardOptIn?: boolean }) | undefined)?.leaderboardOptIn
    )

    let leaderboard: LeaderboardRow[] = []
    if (leaderboardOptIn && groupId) {
      try {
        const snap = await db
          .collection(COL.users)
          .where('groupId', '==', groupId)
          .where('role', '==', 'student')
          .limit(60)
          .get()

        leaderboard = snap.docs
          .map((doc) => {
            const data = doc.data() as UserDoc & { leaderboardOptIn?: boolean }
            if (!data.leaderboardOptIn && doc.id !== uid) return null
            return {
              // Email hech qachon ko'rsatilmaydi (PLAN 9.4 — anonimlik)
              label:
                data.participantCode ??
                (data.displayName?.split(/\s+/)[0] || 'Talaba'),
              xp: data.totalXp ?? 0,
              isMe: doc.id === uid,
            }
          })
          .filter((row): row is LeaderboardRow => row !== null)
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 20)
      } catch {
        leaderboard = []
      }
    }

    return {
      totalXp,
      level,
      xpToNext: Math.max(0, level.next - totalXp),
      streak: { current: streakData.current ?? 0, longest: streakData.longest ?? 0 },
      weeks,
      activeDays: days.filter((day) => day.active).length,
      badges,
      earnedCount: badges.filter((badge) => badge.earned).length,
      leaderboard,
      leaderboardOptIn,
      metrics,
    }
  }
)
