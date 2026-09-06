import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/layout/page-header'
import { requireStudent } from '@/lib/firebase/session'
import { getSurveyForStudent } from '@/features/surveys/queries'
import { SurveyForm } from '@/features/surveys/survey-form'
import { SURVEY_TYPE_HINTS, SURVEY_TYPE_LABELS } from '@/features/surveys/types'

export const metadata: Metadata = { title: 'So‘rovnoma' }
export const dynamic = 'force-dynamic'

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const user = await requireStudent()

  const data = await getSurveyForStudent(user.uid, surveyId)
  if (!data) notFound()

  const { survey, response } = data
  const status = response ? (response.status === 'submitted' ? 'submitted' : 'draft') : 'pending'

  return (
    <div className="space-y-6">
      <PageHeader
        title={survey.titleUz?.trim() || survey.title}
        description={survey.description?.trim() || SURVEY_TYPE_HINTS[survey.type]}
        breadcrumbs={[
          { label: 'So‘rovnomalar', href: '/student/surveys' },
          { label: SURVEY_TYPE_LABELS[survey.type] },
        ]}
      />

      <Alert variant="info">
        <ShieldCheck />
        <AlertTitle>Javoblaringiz maxfiy</AlertTitle>
        <AlertDescription>
          Ilmiy tahlilda ismingiz emas, faqat ishtirokchi kodingiz ishlatiladi. To‘g‘ri yoki
          noto‘g‘ri javob yo‘q — o‘zingizga eng mos variantni tanlang.
        </AlertDescription>
      </Alert>

      <SurveyForm
        surveyId={survey.id}
        survey={{
          questions: survey.questions ?? [],
          title: survey.title,
          titleUz: survey.titleUz,
          description: survey.description,
          type: survey.type,
        }}
        initialAnswers={response?.answers ?? {}}
        initialStatus={status}
      />
    </div>
  )
}
