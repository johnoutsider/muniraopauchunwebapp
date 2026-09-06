import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { AiBadge } from '@/components/shared/ai-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { formatDateTime } from '@/lib/utils/format'
import { getWritingLabData, getWritingSubmission } from '@/features/writing/queries'
import { GENRE_LABELS, findWritingTask, type WritingTask } from '@/features/writing/genres'
import { WritingWorkspace } from '@/features/writing/components/writing-workspace'

export const metadata: Metadata = { title: 'Yozma ish' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ submissionId: string }>
}

export default async function WritingSubmissionPage({ params }: PageProps) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const { submissionId } = await params

  const submission = await getWritingSubmission(user.uid, submissionId)
  if (!submission) notFound()

  const data = await getWritingLabData(user)
  const genre = GENRE_LABELS[submission.genre]

  /* Topshiriq platforma to'plamida bo'lmasa (masalan case zonasidan kelgan) —
     saqlangan sarlavha asosida minimal topshiriq quramiz. */
  const task: WritingTask = findWritingTask(submission.taskId) ?? {
    id: submission.taskId,
    genre: submission.genre,
    title: submission.taskTitle,
    prompt: 'Topshiriq matni saqlanmagan. Yozgan ishingizni davom ettiring yoki qayta ishlang.',
    minWords: genre.minWords,
    maxWords: genre.maxWords,
    checklist: [genre.description],
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={submission.taskTitle}
        description={`${genre.uz} · ${submission.draftCount}-qoralama · ${formatDateTime(submission.createdAt)}`}
        breadcrumbs={[{ label: 'Writing Lab', href: '/student/writing-lab' }, { label: 'Ish' }]}
        actions={
          <div className="flex items-center gap-2">
            <StageBadge stage={6} />
            {flags.aiFeedback && submission.currentFeedback && <AiBadge label="AI feedback bor" />}
          </div>
        }
      />

      <WritingWorkspace
        task={task}
        submission={submission}
        cefr={data.cefr}
        knownWeaknesses={data.knownWeaknesses}
        aiEnabled={flags.aiFeedback}
        readOnly={submission.status !== 'draft'}
      />
    </div>
  )
}
