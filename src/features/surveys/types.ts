import type { SurveyDoc, SurveyResponseDoc, TimeValue, WithId } from '@/types'

/**
 * `surveyResponses/{uid}_{surveyId}` hujjati.
 *
 * Hujjat id DETERMINISTIK: bitta talaba bitta so'rovnomaga faqat bitta javob
 * qoldiradi (PLAN 9.1). `status` — qoralama (tahrirlash mumkin) yoki
 * topshirilgan (o'zgartirib bo'lmaydi).
 */
export interface SurveyResponseRecord extends SurveyResponseDoc {
  status: 'draft' | 'submitted'
  updatedAt?: TimeValue
  submittedAt?: TimeValue
}

export interface SurveyCard {
  survey: WithId & Pick<SurveyDoc, 'title' | 'titleUz' | 'description' | 'type'>
  questionCount: number
  status: 'pending' | 'draft' | 'submitted'
  answeredCount: number
  submittedAt: number | null
}

export type SurveyAnswers = Record<string, number | string>

export function surveyResponseId(uid: string, surveyId: string): string {
  return `${uid}_${surveyId}`
}

export const SURVEY_TYPE_LABELS: Record<SurveyDoc['type'], string> = {
  motivation: 'Motivatsiya',
  ai_literacy: 'AI savodxonligi',
  satisfaction: 'Qoniqish',
  pre: 'Boshlang‘ich so‘rovnoma',
  post: 'Yakuniy so‘rovnoma',
  custom: 'So‘rovnoma',
}

export const SURVEY_TYPE_HINTS: Record<SurveyDoc['type'], string> = {
  motivation:
    'Ingliz tilini o‘rganishdagi motivatsiyangizni o‘lchaydi. To‘g‘ri yoki noto‘g‘ri javob yo‘q — o‘zingizga xos javobni tanlang.',
  ai_literacy:
    'Sun’iy intellekt vositalari bilan ishlash tajribangizni aniqlaydi. Natija o‘quv materiallarini moslashtirish uchun ishlatiladi.',
  satisfaction:
    'Platformadan qanchalik qoniqqaningizni bildiradi. Javoblaringiz platformani yaxshilashga yordam beradi.',
  pre: 'Tadqiqot boshlanishidagi so‘rovnoma. Natijasi yakuniy so‘rovnoma bilan taqqoslanadi.',
  post: 'Tadqiqot yakunidagi so‘rovnoma. Boshlang‘ich natijangiz bilan taqqoslanadi.',
  custom: 'O‘qituvchi yoki tadqiqotchi tayyorlagan so‘rovnoma.',
}
