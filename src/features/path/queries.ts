import 'server-only'

import { cache } from 'react'

import { STAGES, SKILLS, scoreToLabel, type Skill, type Stage } from '@/config/constants'
import { getLearningPath, type Doc } from '@/features/shared/queries'
import { pathStepHref } from '@/features/student/queries'
import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import type { LearningPathDoc, PathStep, SkillProfileEntry, UserDoc } from '@/types'

export interface PathStepView extends PathStep {
  href: string
}

export interface PathStageGroup {
  stage: Stage
  steps: PathStepView[]
}

export interface ProfileRow {
  skill: Skill
  entry: SkillProfileEntry
}

export interface PathOverview {
  path: Doc<LearningPathDoc> | null
  groups: PathStageGroup[]
  profile: ProfileRow[]
  goal: string | null
  track: string | null
  weeklyMinutes: number | null
  counts: { total: number; done: number; available: number; locked: number }
  hasDiagnostic: boolean
}

/** Yo'l sahifasi uchun barcha ma'lumot (PLAN 5, 1–2-bosqich). */
export const getPathOverview = cache(async (uid: string): Promise<PathOverview> => {
  const db = adminDb()
  const [path, userSnap, diagnosticSnap] = await Promise.all([
    getLearningPath(uid),
    db.collection(COL.users).doc(uid).get(),
    db
      .collection(COL.testAttempts)
      .where('uid', '==', uid)
      .where('type', '==', 'diagnostic')
      .limit(1)
      .get()
      .catch(() => null),
  ])

  const user = userSnap.data() as UserDoc | undefined
  const steps = [...(path?.steps ?? [])].sort((a, b) => a.order - b.order)

  const groups: PathStageGroup[] = STAGES.map((stage) => ({
    stage,
    steps: steps
      .filter((step) => step.stage === stage)
      .map((step) => ({ ...step, href: pathStepHref(step) })),
  })).filter((group) => group.steps.length > 0)

  const profileSource = path?.linguisticProfile ?? {}
  const profile: ProfileRow[] = SKILLS.map((skill) => {
    const entry = profileSource[skill]
    return entry ? { skill, entry } : null
  }).filter((row): row is ProfileRow => row !== null)

  return {
    path,
    groups,
    profile,
    goal: user?.onboarding?.goal ?? path?.goals?.[0] ?? null,
    track: user?.onboarding?.professionalTrack ?? path?.professionalTrack ?? null,
    weeklyMinutes: user?.onboarding?.weeklyMinutes ?? null,
    counts: {
      total: steps.length,
      done: steps.filter((step) => step.status === 'done').length,
      available: steps.filter((step) => step.status === 'available' || step.status === 'in_progress')
        .length,
      locked: steps.filter((step) => step.status === 'locked').length,
    },
    hasDiagnostic: (diagnosticSnap?.size ?? 0) > 0 || profile.length > 0,
  }
})

/** Profilni radar grafigi uchun tayyorlash. */
export function profileToRadar(
  profile: ProfileRow[],
  labels: Record<Skill, { uz: string }>
): Array<{ skill: string; score: number }> {
  return profile.map((row) => ({
    skill: labels[row.skill].uz,
    score: Math.round(row.entry.score),
  }))
}

/** Ball → yorliq (profil hujjatida yorliq bo'lmasa hisoblanadi). */
export function labelFor(entry: SkillProfileEntry) {
  return entry.label ?? scoreToLabel(entry.score)
}
