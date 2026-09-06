import Link from 'next/link'
import type { Metadata } from 'next'
import { FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { AiBadge } from '@/components/shared/ai-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { formatDateTime } from '@/lib/utils/format'
import { getWritingLabData } from '@/features/writing/queries'
import { GENRE_LABELS } from '@/features/writing/genres'
import { WritingLabClient } from '@/features/writing/components/writing-lab-client'

export const metadata: Metadata = { title: 'Writing Lab' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ task?: string }>
}

const STATUS_TEXT = {
  draft: 'Qoralama',
  submitted: 'Yuborilgan',
  reviewed: 'Baholangan',
} as const

export default async function WritingLabPage({ searchParams }: PageProps) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const params = await searchParams

  const data = await getWritingLabData(user)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Writing Lab"
        description={
          flags.aiFeedback
            ? 'Yozing → AI feedback oling → qayta ishlang → o‘qituvchiga yuboring. Yakuniy bahoni o‘qituvchi qo‘yadi.'
            : 'Yozing → qoralamani qayta ishlang → o‘qituvchiga yuboring. Ishingizni o‘qituvchi baholaydi.'
        }
        actions={
          <div className="flex items-center gap-2">
            <StageBadge stage={6} />
            {flags.aiFeedback && <AiBadge label="AI feedback yoqilgan" />}
          </div>
        }
      />

      <WritingLabClient
        tasks={data.tasks}
        submissions={data.submissions}
        initialTaskId={params.task?.slice(0, 80)}
        cefr={data.cefr}
        knownWeaknesses={data.knownWeaknesses}
        aiEnabled={flags.aiFeedback}
      />

      {data.submissions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Mening ishlarim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.submissions.map((submission) => (
                <li key={submission.id}>
                  <Link
                    href={`/student/writing-lab/${submission.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{submission.taskTitle}</span>
                      <span className="block text-xs text-muted-foreground">
                        {GENRE_LABELS[submission.genre].uz} · {submission.draftCount}-qoralama ·{' '}
                        {submission.wordCount} so‘z · {formatDateTime(submission.createdAt)}
                      </span>
                    </span>
                    <Badge
                      variant={
                        submission.status === 'reviewed'
                          ? 'success'
                          : submission.status === 'submitted'
                            ? 'info'
                            : 'secondary'
                      }
                    >
                      {STATUS_TEXT[submission.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
