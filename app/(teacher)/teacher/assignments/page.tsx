import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardList, Users } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { requireTeacher } from '@/features/teacher/guards'
import { listTeacherAssignments, listTeacherGroups } from '@/features/teacher/queries'
import {
  AssignmentDialog,
  AssignmentList,
  type AssignmentItem,
} from '@/features/teacher/components/assignment-manager'
import { cn } from '@/lib/utils/cn'
import { toMillis } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Topshiriqlar' }
export const dynamic = 'force-dynamic'

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group } = await searchParams
  const user = await requireTeacher()

  const groups = await listTeacherGroups(user)
  const groupOptions = groups.map((entry) => ({
    id: entry.id,
    name: entry.name,
    type: entry.type,
  }))

  if (!groups.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Topshiriqlar" description="Guruhlarga topshiriq berish va kuzatish." />
        <EmptyState
          icon={<Users />}
          title="Sizga guruh biriktirilmagan"
          description="Topshiriq berish uchun avval administrator sizni guruhga biriktirishi kerak."
        />
      </div>
    )
  }

  // Guruh filtri ham serverda tekshiriladi (assertTeachesGroup listTeacherAssignments ichida)
  const activeGroup = group && groups.some((entry) => entry.id === group) ? group : undefined
  const assignments = await listTeacherAssignments(user, activeGroup)

  const items: AssignmentItem[] = assignments.map((assignment) => ({
    id: assignment.id,
    groupId: assignment.groupId,
    groupName: assignment.groupName,
    title: assignment.title,
    description: assignment.description ?? '',
    kind: assignment.kind,
    refId: assignment.refId ?? null,
    dueAt: assignment.dueAt,
    completion: assignment.completion,
    doneCount: assignment.doneCount,
    totalCount: assignment.totalCount,
  }))

  const now = Date.now()
  const upcoming = items.filter((item) => toMillis(item.dueAt) >= now).length
  const totalDone = items.reduce((sum, item) => sum + item.doneCount, 0)
  const totalExpected = items.reduce((sum, item) => sum + item.totalCount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topshiriqlar"
        description="Guruhga topshiriq bering, muddatini belgilang va bajarilganlikni kuzating."
        actions={<AssignmentDialog groups={groupOptions} fixedGroupId={activeGroup} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Jami topshiriqlar"
          value={items.length}
          icon={<ClipboardList className="size-4" />}
        />
        <StatCard label="Muddati kelmagan" value={upcoming} sublabel="Faol topshiriqlar" />
        <StatCard
          label="Umumiy bajarilganlik"
          value={totalExpected ? `${Math.round((totalDone / totalExpected) * 100)}%` : '—'}
          sublabel={`${totalDone} / ${totalExpected}`}
          tone={totalExpected && totalDone / totalExpected >= 0.7 ? 'success' : 'default'}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/teacher/assignments"
          className={cn(
            'rounded-full border px-3 py-1 text-sm transition-colors',
            !activeGroup
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Barcha guruhlar
        </Link>
        {groups.map((entry) => (
          <Link
            key={entry.id}
            href={`/teacher/assignments?group=${entry.id}`}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              activeGroup === entry.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {entry.name}
          </Link>
        ))}
      </div>

      <AssignmentList assignments={items} groups={groupOptions} />
    </div>
  )
}
