import Link from 'next/link'
import { ArrowRight, CalendarClock, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils/format'

import { PROJECT_STATUS_LABELS, type ProjectRow } from './types'

/** Loyiha kartasi (talabaning faol/tugallangan loyihalari ro'yxati uchun). */
export function ProjectCard({
  project,
  totalTasks,
  caseTitle,
}: {
  project: ProjectRow
  totalTasks?: number
  caseTitle?: string
}) {
  const statuses = Object.values(project.taskStatus ?? {})
  const done = statuses.filter((status) => status === 'done').length
  const total = totalTasks ?? Math.max(statuses.length, 9)
  const percent = Math.round((done / (total || 1)) * 100)

  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/student/projects/${project.id}`}
              className="block truncate text-sm font-semibold hover:underline"
            >
              {project.title}
            </Link>
            {caseTitle ? (
              <p className="truncate text-xs text-muted-foreground">{caseTitle}</p>
            ) : null}
          </div>
          <Badge
            variant={
              project.status === 'active'
                ? 'info'
                : project.status === 'graded'
                  ? 'success'
                  : 'secondary'
            }
            className="shrink-0"
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} / {total} bosqich
            </span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {project.memberUids?.length ?? 0} a’zo
          </span>
          {project.deadline ? (
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3.5" />
              {formatDate(project.deadline)}
            </span>
          ) : null}
          <Link
            href={`/student/projects/${project.id}`}
            className="ml-auto flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Ish zonasi
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
