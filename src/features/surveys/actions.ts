'use server'

import { revalidatePath } from 'next/cache'

import { adminDb, FieldValue } from '@/lib/firebase/admin'
import { requireStudent } from '@/lib/firebase/session'
import { COL } from '@/config/constants'
import { logEvent } from '@/lib/analytics/events'
import type { ActionResult, SurveyDoc } from '@/types'

import { computeScoreTotal, likertMax, maxScoreTotal, missingQuestions } from './scoring'
import { surveyResponseId, type SurveyAnswers, type SurveyResponseRecord } from './types'

/**
 * So'rovnoma javoblari (PLAN 9.1).
 *
 * QOIDALAR:
 *  • bir talaba — bir javob: hujjat id `{uid}_{surveyId}`, shuning uchun
 *    takroriy yuborish yangi yozuv yaratmaydi;
 *  • topshirilgunicha tahrirlash mumkin, topshirilgandan keyin — yo'q;
 *  • `participantCode` va `expGroup` javob ichiga NUSXALANADI — eksport
 *    paytida `users` bilan JOIN qilish shart bo'lmasin (anonimlik, PLAN 9.4);
 *  • umumiy ball serverda hisoblanadi (teskari savollar bilan) — klient
 *    yuborgan ballga ishonilmaydi.
 */

const MAX_OPEN_LENGTH = 4000

function fail(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code }
}

async function loadSurvey(surveyId: string): Promise<(SurveyDoc & { id: string }) | null> {
  const snap = await adminDb().collection(COL.surveys).doc(surveyId).get()
  if (!snap.exists) return null
  return { id: snap.id, ...(snap.data() as SurveyDoc) }
}

/** Faqat mavjud savollarga va turiga mos qiymatlarni qoldirish. */
function sanitizeAnswers(survey: SurveyDoc, answers: SurveyAnswers | undefined): SurveyAnswers {
  const out: SurveyAnswers = {}
  if (!answers) return out

  for (const question of survey.questions ?? []) {
    const raw = answers[question.id]
    if (raw === undefined || raw === null) continue

    const max = likertMax(question.type)
    if (max > 0) {
      const value = typeof raw === 'number' ? raw : Number(raw)
      if (Number.isFinite(value) && value >= 1 && value <= max) out[question.id] = Math.round(value)
      continue
    }

    if (question.type === 'mcq') {
      const value = String(raw)
      if ((question.options ?? []).includes(value)) out[question.id] = value
      continue
    }

    if (question.type === 'open') {
      const value = String(raw).slice(0, MAX_OPEN_LENGTH)
      if (value.trim()) out[question.id] = value
    }
  }
  return out
}

async function writeResponse(
  surveyId: string,
  answers: SurveyAnswers | undefined,
  submit: boolean
): Promise<ActionResult<{ scoreTotal: number; maxScore: number; status: string }>> {
  const user = await requireStudent()

  const survey = await loadSurvey(surveyId)
  if (!survey || !survey.active) return fail('So‘rovnoma topilmadi yoki yopilgan.', 'not_found')

  const db = adminDb()
  const ref = db.collection(COL.surveyResponses).doc(surveyResponseId(user.uid, surveyId))
  const existing = (await ref.get()).data() as SurveyResponseRecord | undefined

  if (existing?.status === 'submitted') {
    return fail('Bu so‘rovnomani allaqachon topshirgansiz — javoblarni o‘zgartirib bo‘lmaydi.', 'submitted')
  }

  const clean = sanitizeAnswers(survey, answers)

  if (submit) {
    const missing = missingQuestions(survey, clean)
    if (missing.length) {
      return fail(
        `${missing.length} ta savol javobsiz qoldi. Topshirishdan oldin barcha savollarga javob bering.`,
        'incomplete'
      )
    }
  }

  const scoreTotal = computeScoreTotal(survey, clean)

  const doc: Record<string, unknown> = {
    uid: user.uid,
    participantCode: user.participantCode ?? null,
    expGroup: user.expGroup ?? null,
    surveyId,
    surveyType: survey.type,
    answers: clean,
    scoreTotal,
    status: submit ? 'submitted' : 'draft',
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (submit) {
    doc.submittedAt = FieldValue.serverTimestamp()
    doc.ts = FieldValue.serverTimestamp()
  } else if (!existing) {
    doc.ts = FieldValue.serverTimestamp()
  }

  await ref.set(doc, { merge: true })

  if (submit) {
    await logEvent(user, 'survey_submit', {
      surveyId,
      surveyType: survey.type,
      scoreTotal,
      maxScore: maxScoreTotal(survey),
      questionCount: survey.questions?.length ?? 0,
    })
    revalidatePath('/student/surveys')
    revalidatePath(`/student/surveys/${surveyId}`)
  }

  return {
    ok: true,
    data: {
      scoreTotal,
      maxScore: maxScoreTotal(survey),
      status: submit ? 'submitted' : 'draft',
    },
  }
}

/** Qoralamani saqlash (avtosaqlash) — topshirilmaydi. */
export async function saveSurveyDraftAction(
  surveyId: string,
  answers: SurveyAnswers
): Promise<ActionResult<{ scoreTotal: number; maxScore: number; status: string }>> {
  return writeResponse(surveyId, answers, false)
}

/** Yakuniy topshirish — bundan keyin tahrirlab bo'lmaydi. */
export async function submitSurveyAction(
  surveyId: string,
  answers: SurveyAnswers
): Promise<ActionResult<{ scoreTotal: number; maxScore: number; status: string }>> {
  return writeResponse(surveyId, answers, true)
}
