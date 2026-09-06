'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { ProficiencyBadge } from '@/components/shared/proficiency-badge'
import { StreakFlame } from '@/components/shared/streak-flame'
import { SKILLS, SKILL_LABELS, type Skill } from '@/config/constants'
import { cn } from '@/lib/utils/cn'
import { relativeTime, scoreColor } from '@/lib/utils/format'

import type { TeacherStudentRow } from '../queries'

/** Ko‘nikma ballari — ixcham, ustun kengligiga sig‘adigan ko‘rinish. */
function SkillScores({ scores }: { scores: Partial<Record<Skill, number>> }) {
  const entries = SKILLS.filter((skill) => typeof scores[skill] === 'number')
  if (!entries.length) return <span className="text-xs text-muted-foreground">—</span>

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((skill) => {
        const score = scores[skill] as number
        return (
          <span
            key={skill}
            title={`${SKILL_LABELS[skill].uz}: ${score}%`}
            className={cn(
              'inline-flex min-w-7 justify-center rounded bg-muted px-1 py-0.5 text-[11px] font-medium tabular-nums',
              scoreColor(score)
            )}
          >
            {score}
          </span>
        )
      })}
    </div>
  )
}

export interface StudentTableProps {
  rows: TeacherStudentRow[]
  /** Guruh ustunini ko‘rsatish (bir nechta guruh birga chiqsa) */
  showGroup?: boolean
}

export function StudentTable({ rows, showGroup = false }: StudentTableProps) {
  const columns = React.useMemo<ColumnDef<TeacherStudentRow, unknown>[]>(() => {
    const base: ColumnDef<TeacherStudentRow, unknown>[] = [
      {
        id: 'displayName',
        accessorKey: 'displayName',
        header: 'Talaba',
        cell: ({ row }) => (
          <Link
            href={`/teacher/students/${row.original.uid}`}
            className="font-medium hover:underline"
          >
            {row.original.displayName}
          </Link>
        ),
      },
      {
        id: 'participantCode',
        accessorKey: 'participantCode',
        header: 'Kod',
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">{row.original.participantCode}</span>
        ),
      },
    ]

    if (showGroup) {
      base.push({
        id: 'groupName',
        accessorKey: 'groupName',
        header: 'Guruh',
        cell: ({ row }) => <span className="text-sm">{row.original.groupName}</span>,
      })
    }

    base.push(
      {
        id: 'lastActiveAt',
        accessorFn: (row) => row.lastActiveAt ?? 0,
        header: 'Oxirgi faollik',
        cell: ({ row }) => {
          const days = row.original.daysInactive
          return (
            <span
              className={cn(
                'text-xs',
                days !== null && days >= 7
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-muted-foreground'
              )}
            >
              {row.original.lastActiveAt ? relativeTime(row.original.lastActiveAt) : 'hech qachon'}
            </span>
          )
        },
      },
      {
        id: 'profileAvg',
        accessorFn: (row) => row.profileAvg ?? -1,
        header: 'Diagnostika profili',
        cell: ({ row }) =>
          row.original.profileLabel ? (
            <span className="flex items-center gap-1.5">
              <ProficiencyBadge label={row.original.profileLabel} />
              <span className="text-xs tabular-nums text-muted-foreground">
                {row.original.profileAvg}%
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Diagnostika yo‘q</span>
          ),
      },
      {
        id: 'skills',
        header: 'Ko‘nikmalar',
        enableSorting: false,
        cell: ({ row }) => <SkillScores scores={row.original.skillScores} />,
      },
      {
        id: 'attempts',
        accessorKey: 'attempts',
        header: 'Urinishlar',
        cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.attempts}</span>,
      },
      {
        id: 'correctRate',
        accessorKey: 'correctRate',
        header: 'To‘g‘ri %',
        cell: ({ row }) => (
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              row.original.attempts ? scoreColor(row.original.correctRate) : 'text-muted-foreground'
            )}
          >
            {row.original.attempts ? `${row.original.correctRate}%` : '—'}
          </span>
        ),
      },
      {
        id: 'totalXp',
        accessorKey: 'totalXp',
        header: 'XP',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.totalXp.toLocaleString('uz-UZ')}
          </span>
        ),
      },
      {
        id: 'streak',
        accessorKey: 'streak',
        header: 'Seriya',
        cell: ({ row }) => <StreakFlame days={row.original.streak} />,
      },
      {
        id: 'risk',
        accessorFn: (row) => row.riskLevel ?? '',
        header: 'Xavf',
        cell: ({ row }) => {
          const risk = row.original.riskLevel
          if (!risk) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <Badge variant={risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'}>
              {risk === 'high' ? 'Yuqori' : risk === 'medium' ? 'O‘rta' : 'Past'}
            </Badge>
          )
        },
      },
      {
        id: 'open',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/teacher/students/${row.original.uid}`}
            aria-label={`${row.original.displayName} sahifasi`}
            className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </Link>
        ),
      }
    )

    return base
  }, [showGroup])

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Ism yoki ishtirokchi kodi bo‘yicha qidirish…"
      emptyMessage="Bu guruhda talaba topilmadi"
      pageSize={15}
    />
  )
}
