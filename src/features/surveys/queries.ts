import 'server-only'

import { cache } from 'react'

import { adminDb } from '@/lib/firebase/admin'
import { COL } from '@/config/constants'
import { serialize, toMillis } from '@/lib/utils/format'
import { getSurvey, listSurveys, type Doc } from '@/features/shared/queries'
import type { SurveyDoc } from '@/types'

import { answeredCount } from './scoring'
import { surveyResponseId, type SurveyCard, type SurveyResponseRecord } from './types'

/** Talabaning bitta so'rovnoma bo'yicha javobi (bo'lmasa `null`). */
export const getSurveyResponse = cache(
  async (uid: string, surveyId: string): Promise<Doc<SurveyResponseRecord> | null> => {
    const snap = await adminDb()
      .collection(COL.surveyResponses)
      .doc(surveyResponseId(uid, surveyId))
      .get()
    if (!snap.exists) return null
    return serialize({ id: snap.id, ...(snap.data() as SurveyResponseRecord) })
  }
)

export interface SurveyWithResponse {
  survey: Doc<SurveyDoc>
  response: Doc<SurveyResponseRecord> | null
}

export const getSurveyForStudent = cache(
  async (uid: string, surveyId: string): Promise<SurveyWithResponse | null> => {
    const survey = await getSurvey(surveyId)
    if (!survey || !survey.active) return null
    const response = await getSurveyResponse(uid, surveyId)
    return { survey, response }
  }
)

/** Faol so'rovnomalar + har biri bo'yicha talabaning holati. */
export const listStudentSurveys = cache(async (uid: string): Promise<SurveyCard[]> => {
  const surveys = await listSurveys(true)
  if (!surveys.length) return []

  const db = adminDb()
  const refs = surveys.map((survey) =>
    db.collection(COL.surveyResponses).doc(surveyResponseId(uid, survey.id))
  )
  const snaps = await db.getAll(...refs)

  return surveys.map((survey, index) => {
    const snap = snaps[index]
    const response = snap?.exists ? (snap.data() as SurveyResponseRecord) : null
    const answers = response?.answers ?? {}
    return {
      survey: {
        id: survey.id,
        title: survey.title,
        titleUz: survey.titleUz,
        description: survey.description,
        type: survey.type,
      },
      questionCount: survey.questions?.length ?? 0,
      status: response ? (response.status === 'submitted' ? 'submitted' : 'draft') : 'pending',
      answeredCount: answeredCount(survey, answers),
      submittedAt: response?.submittedAt ? toMillis(response.submittedAt) : null,
    }
  })
})
