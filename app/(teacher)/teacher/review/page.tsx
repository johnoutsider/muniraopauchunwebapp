import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2, FileCheck2, Mic, PenLine, UsersRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { AiBadge } from '@/components/shared/ai-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { requireTeacher } from '@/features/teacher/guards'
import {
  getProjectForReview,
  getReviewQueue,
  getSpeakingForReview,
  getWritingForReview,
  type ReviewKind,
} from '@/features/teacher/queries'
import { ProjectReviewPanel } from '@/features/teacher/components/project-review-panel'
import { ReviewQueueNav } from '@/features/teacher/components/review-queue-nav'
import { SpeakingReviewPanel } from '@/features/teacher/components/speaking-review-panel'
import { WritingReviewPanel } from '@/features/teacher/components/writing-review-panel'
import { cn } from '@/lib/utils/cn'
import { relativeTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Baholash navbati' }
export const dynamic = 'force-dynamic'

const TABS: Array<{ value: ReviewKind; label: string; icon: React.ReactNode }> = [
  { value: 'writing', label: 'Writing', icon: <PenLine className="size-4" /> },
  { value: 'speaking', label: 'Speaking', icon: <Mic className="size-4" /> },
  { value: 'project', label: 'Loyihalar', icon: <UsersRound className="size-4" /> },
]

function isReviewKind(value: string | undefined): value is ReviewKind {
  return value === 'writing' || value === 'speaking' || value === 'project'
}

export default async function TeacherReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; id?: string }>
}) {
  const { tab: rawTab, id } = await searchParams
  const tab: ReviewKind = isReviewKind(rawTab) ? rawTab : 'writing'

  const user = await requireTeacher()
  const queue = await getReviewQueue(user)
  const rows = queue.filter((row) => row.kind === tab)
  const selectedId = id && rows.some((row) => row.id === id) ? id : null

  const counts = {
    writing: queue.filter((row) => row.kind === 'writing' && !row.reviewed).length,
    speaking: queue.filter((row) => row.kind === 'speaking' && !row.reviewed).length,
    project: queue.filter((row) => row.kind === 'project' && !row.reviewed).length,
  }

  // Har bir detal so'rovi guard bilan himoyalangan (assertTeachesStudent / assertTeachesGroup)
  const writingData =
    tab === 'writing' && selectedId ? await getWritingForReview(user, selectedId) : null
  const speakingData =
    tab === 'speaking' && selectedId ? await getSpeakingForReview(user, selectedId) : null
  const projectData =
    tab === 'project' && selectedId ? await getProjectForReview(user, selectedId) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baholash navbati"
        description="Kundalik asosiy ish. AI feedback faqat yordamchi — yakuniy baho va pedagogik izoh o‘qituvchida."
        actions={
          <ReviewQueueNav ids={rows.map((row) => row.id)} currentId={selectedId} tab={tab} />
        }
      />

      <div className="inline-flex h-9 w-full max-w-full items-center justify-start gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:w-auto">
        {TABS.map((entry) => {
          const active = entry.value === tab
          return (
            <Link
              key={entry.value}
              href={`/teacher/review?tab=${entry.value}`}
              className={cn(
                'inline-flex flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {entry.icon}
              {entry.label}
              {counts[entry.value] > 0 ? (
                <Badge variant={active ? 'warning' : 'secondary'}>{counts[entry.value]}</Badge>
              ) : null}
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="Navbat bo‘sh"
              description="Bu turdagi baholanmagan topshiriq yo‘q. Yaxshi ish!"
            />
          ) : (
            <ul className="max-h-[36rem] space-y-2 overflow-y-auto pr-1">
              {rows.map((row) => {
                const active = row.id === selectedId
                return (
                  <li key={row.id}>
                    <Link
                      href={`/teacher/review?tab=${tab}&id=${row.id}`}
                      className={cn(
                        'block rounded-lg border p-3 transition-colors',
                        active
                          ? 'border-primary bg-muted/60'
                          : 'border-border hover:border-primary/40 hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-medium">
                          {row.studentName}
                        </p>
                        {row.reviewed ? (
                          <Badge variant="success">Baholangan</Badge>
                        ) : (
                          <Badge variant="warning">Yangi</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{row.taskTitle}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {row.participantCode}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{row.groupName}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {row.submittedAt ? relativeTime(row.submittedAt) : '—'}
                        </span>
                        {row.hasAiFeedback ? <AiBadge label="AI feedback bor" /> : null}
                      </div>
                      {row.extra ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">{row.extra}</p>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {!selectedId ? (
            <EmptyState
              icon={<FileCheck2 />}
              title="Topshiriqni tanlang"
              description="Chapdagi navbatdan bittasini tanlang. Klaviatura: j / k — navbatda harakat."
            />
          ) : writingData ? (
            <WritingReviewPanel
              submission={writingData.submission}
              studentName={writingData.student.displayName}
              studentUid={writingData.student.id}
              participantCode={writingData.student.participantCode ?? '—'}
            />
          ) : speakingData ? (
            <SpeakingReviewPanel
              submission={speakingData.submission}
              studentName={speakingData.student.displayName}
              studentUid={speakingData.student.id}
              participantCode={speakingData.student.participantCode ?? '—'}
              audioUrl={speakingData.audioUrl}
            />
          ) : projectData ? (
            <ProjectReviewPanel
              project={projectData.project}
              contributions={projectData.contributions}
              groupName={projectData.group.name}
            />
          ) : (
            <EmptyState
              title="Topshiriq topilmadi"
              description="U o‘chirilgan bo‘lishi mumkin. Navbatdan boshqasini tanlang."
            />
          )}
        </div>
      </div>
    </div>
  )
}
