import Link from 'next/link'
import type { Metadata } from 'next'
import { History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { AiBadge } from '@/components/shared/ai-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { formatDateTime } from '@/lib/utils/format'
import { getSpeakingLabData, listTaskAttempts } from '@/features/speaking/queries'
import { SpeakingLabClient } from '@/features/speaking/components/speaking-lab-client'

export const metadata: Metadata = { title: 'Speaking Lab' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ task?: string }>
}

export default async function SpeakingLabPage({ searchParams }: PageProps) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const params = await searchParams

  const data = await getSpeakingLabData(user)
  const initialTaskId = params.task?.slice(0, 80)
  const initialAttempts = initialTaskId ? await listTaskAttempts(user.uid, initialTaskId) : []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Speaking Lab"
        description="Yozing → tahlil qiling → feedback oling → qayta urinib ko‘ring. Talaffuz ballari Azure tomonidan obyektiv hisoblanadi."
        actions={
          <div className="flex items-center gap-2">
            <StageBadge stage={6} />
            {flags.pronunciationAI && <AiBadge label="AI talaffuz tahlili yoqilgan" />}
          </div>
        }
      />

      <SpeakingLabClient
        tasks={data.tasks}
        initialTaskId={initialTaskId}
        initialAttempts={initialAttempts}
        cefr={data.cefr}
        aiEnabled={flags.pronunciationAI}
      />

      {data.recentAttempts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" />
              Oxirgi yozuvlaringiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.recentAttempts.slice(0, 10).map((attempt) => (
                <li key={attempt.id}>
                  <Link
                    href={`/student/speaking-lab/${attempt.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{attempt.taskTitle}</span>
                      <span className="block text-xs text-muted-foreground">
                        {attempt.attemptNo}-urinish · {formatDateTime(attempt.ts)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {attempt.hasAiFeedback && <AiBadge label="AI tahlili bor" />}
                      <Badge variant="outline" className="tabular-nums">
                        {attempt.pronScore}
                      </Badge>
                    </span>
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
