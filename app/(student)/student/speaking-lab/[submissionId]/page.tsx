import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, GraduationCap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { formatDateTime } from '@/lib/utils/format'
import { getSpeakingSubmission, listTaskAttempts } from '@/features/speaking/queries'
import { getUserDoc } from '@/features/shared/queries'
import { AssessmentView } from '@/features/speaking/components/assessment-view'
import { AiFeedbackPanel } from '@/features/speaking/components/ai-feedback-panel'
import { AttemptTrend } from '@/features/speaking/components/attempt-trend'
import { TASK_TYPE_LABELS } from '@/features/speaking/tasks'

export const metadata: Metadata = { title: 'Talaffuz natijasi' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ submissionId: string }>
}

export default async function SpeakingSubmissionPage({ params }: PageProps) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const { submissionId } = await params

  const submission = await getSpeakingSubmission(user.uid, submissionId)
  if (!submission) notFound()

  const [attempts, userDoc] = await Promise.all([
    listTaskAttempts(user.uid, submission.taskId),
    getUserDoc(user.uid),
  ])
  const cefr = userDoc?.onboarding?.selfAssessedLevel ?? 'B1'

  return (
    <div className="space-y-4">
      <PageHeader
        title={submission.taskTitle}
        description={`${TASK_TYPE_LABELS[submission.type].uz} · ${submission.attemptNo}-urinish · ${formatDateTime(submission.ts)}`}
        breadcrumbs={[
          { label: 'Speaking Lab', href: '/student/speaking-lab' },
          { label: 'Natija' },
        ]}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/student/speaking-lab?task=${encodeURIComponent(submission.taskId)}`}>
              <ArrowLeft />
              Qayta urinish
            </Link>
          </Button>
        }
      />

      {submission.referenceText && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">O‘qilgan matn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{submission.referenceText}</p>
          </CardContent>
        </Card>
      )}

      {submission.azure ? (
        <AssessmentView
          assessment={submission.azure}
          referenceText={submission.referenceText}
          problematicSounds={submission.problematicSounds}
          durationSec={submission.durationSec}
          attemptNo={submission.attemptNo}
        />
      ) : (
        <EmptyState
          title="Baholash natijasi saqlanmagan"
          description="Bu yozuv uchun Azure ballari mavjud emas. Topshiriqni qaytadan yozib yuboring."
        />
      )}

      {flags.pronunciationAI ? (
        <AiFeedbackPanel
          submissionId={submission.id}
          cefr={cefr}
          initial={submission.aiFeedback}
          autoLoad={Boolean(submission.aiFeedback)}
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-muted-foreground" />
              O‘qituvchi izohi
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {submission.teacherFeedback?.text ??
              'Yozuvingiz o‘qituvchingizga yuborildi. Izoh tayyor bo‘lgach, shu yerda ko‘rinadi.'}
          </CardContent>
        </Card>
      )}

      {flags.pronunciationAI && submission.teacherFeedback && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-primary" />
              O‘qituvchi izohi
              {typeof submission.teacherFeedback.score === 'number' && (
                <span className="text-sm font-normal text-muted-foreground">
                  · {submission.teacherFeedback.score} ball
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{submission.teacherFeedback.text}</CardContent>
        </Card>
      )}

      <AttemptTrend attempts={attempts} taskTitle={submission.taskTitle} />
    </div>
  )
}
