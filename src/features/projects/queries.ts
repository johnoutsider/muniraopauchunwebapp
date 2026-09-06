import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis } from '@/lib/utils/format'
import { getCaseStudy, listCaseStudies, listGroupStudents } from '@/features/shared/queries'
import type { ContributionDoc, ProjectDoc } from '@/types'

import type { ProjectRow, ProjectWorkspaceData, TaskWorkDoc, TaskWorkRow } from './types'

/**
 * Group Project Zone o'qishlari (PLAN 8.10).
 * A'zolik SERVERDA tekshiriladi: a'zo bo'lmagan talaba loyihani umuman ololmaydi.
 */

export const listMyProjects = cache(async (uid: string): Promise<ProjectRow[]> => {
  const snap = await adminDb()
    .collection(COL.projects)
    .where('memberUids', 'array-contains', uid)
    .limit(50)
    .get()
  return snap.docs
    .map((doc) => serialize({ id: doc.id, ...(doc.data() as ProjectDoc) }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
})

export const getProjectForUser = cache(
  async (projectId: string, uid: string): Promise<ProjectRow | null> => {
    if (!projectId || projectId.includes('/')) return null
    const snap = await adminDb().collection(COL.projects).doc(projectId).get()
    if (!snap.exists) return null
    const data = snap.data() as ProjectDoc
    if (!data.memberUids?.includes(uid)) return null
    return serialize({ id: snap.id, ...data })
  }
)

export const listContributions = cache(
  async (projectId: string): Promise<Array<ContributionDoc & { id: string }>> => {
    const snap = await adminDb()
      .collection(COL.projects)
      .doc(projectId)
      .collection('contributions')
      .get()
    return snap.docs.map((doc) => serialize({ id: doc.id, ...(doc.data() as ContributionDoc) }))
  }
)

export const listTaskWork = cache(async (projectId: string): Promise<TaskWorkRow[]> => {
  const snap = await adminDb().collection(COL.projects).doc(projectId).collection('taskWork').get()
  return snap.docs.map((doc) => serialize({ ...(doc.data() as TaskWorkDoc), id: doc.id }))
})

/** Loyiha ish zonasi uchun to'liq ma'lumot to'plami. */
export const getProjectWorkspace = cache(
  async (projectId: string, uid: string): Promise<ProjectWorkspaceData | null> => {
    const project = await getProjectForUser(projectId, uid)
    if (!project) return null

    const [caseStudy, contributions, taskWork, chatSnap, members] = await Promise.all([
      project.caseStudyId ? getCaseStudy(project.caseStudyId) : Promise.resolve(null),
      listContributions(projectId),
      listTaskWork(projectId),
      adminDb().collection(COL.chats).doc(`project_${projectId}`).get(),
      project.groupId ? listGroupStudents(project.groupId) : Promise.resolve([]),
    ])

    const sharedMeta = taskWork.find((row) => row.id === '_shared')

    return {
      project,
      caseStudy: caseStudy
        ? {
            id: caseStudy.id,
            title: caseStudy.title,
            scenario: caseStudy.scenario,
            domain: caseStudy.domain,
            cefr: caseStudy.cefr,
            chartData: caseStudy.chartData,
            chartType: caseStudy.chartType,
            chartCaption: caseStudy.chartCaption,
            tasks: [...(caseStudy.tasks ?? [])].sort((a, b) => a.order - b.order),
            requiredVocab: caseStudy.requiredVocab ?? [],
            requiredGrammar: caseStudy.requiredGrammar ?? [],
            rubric: caseStudy.rubric ?? [],
          }
        : null,
      contributions,
      taskWork,
      shared: {
        solution: project.solution ?? '',
        report: project.report ?? '',
        version: project.sharedDocVersion ?? 0,
        lastEditedByName: sharedMeta?.updatedByName,
        lastEditedAt: sharedMeta?.updatedAt,
      },
      chatId: chatSnap.exists ? chatSnap.id : null,
      members: members.filter((member) => project.memberUids.includes(member.uid)),
    }
  }
)

/** Mavjud keys-stadilar (loyiha ochilmagan talabaga ham ko'rsatiladi). */
export const listPublishedCaseStudies = cache(async () => {
  const caseStudies = await listCaseStudies()
  return caseStudies.sort((a, b) => a.title.localeCompare(b.title))
})
