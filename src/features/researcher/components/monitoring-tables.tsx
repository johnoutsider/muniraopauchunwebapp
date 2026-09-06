'use client'

import * as React from 'react'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { SKILL_LABELS } from '@/config/constants'
import { formatDate } from '@/lib/utils/format'

import type { CompletionRow, ItemStatRow, SurveyCompletionRow } from '../queries'

const STATUS_LABELS: Record<CompletionRow['status'], { label: string; variant: 'outline' | 'warning' | 'success' | 'info' }> =
  {
    not_started: { label: 'Boshlanmagan', variant: 'outline' },
    in_progress: { label: 'Jarayonda', variant: 'warning' },
    submitted: { label: 'Topshirilgan', variant: 'info' },
    graded: { label: 'Baholangan', variant: 'success' },
  }

/** Test bo'yicha talabalar kesimida tugallanish (anonim kodlar bilan). */
export function TestCompletionTable({ rows }: { rows: CompletionRow[] }) {
  const columns = React.useMemo<ColumnDef<CompletionRow, unknown>[]>(
    () => [
      {
        accessorKey: 'participantCode',
        header: 'Kod',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.participantCode}</span>
        ),
      },
      { accessorKey: 'groupName', header: 'Guruh' },
      {
        accessorKey: 'expGroup',
        header: 'Tur',
        cell: ({ row }) =>
          row.original.expGroup ? (
            <Badge variant={row.original.expGroup === 'experimental' ? 'default' : 'secondary'}>
              {row.original.expGroup === 'experimental' ? 'Eksperimental' : 'Nazorat'}
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'status',
        header: 'Holat',
        cell: ({ row }) => {
          const meta = STATUS_LABELS[row.original.status]
          return <Badge variant={meta.variant}>{meta.label}</Badge>
        },
      },
      {
        accessorKey: 'percent',
        header: 'Natija (%)',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.percent === null ? '—' : `${row.original.percent}%`}
          </span>
        ),
      },
      {
        accessorKey: 'finishedAt',
        header: 'Tugatgan vaqti',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.finishedAt ? formatDate(row.original.finishedAt) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={15}
      searchPlaceholder="Kod bo‘yicha qidirish…"
      emptyMessage="Bu testga biriktirilgan talaba topilmadi"
    />
  )
}

export function SurveyCompletionTable({ rows }: { rows: SurveyCompletionRow[] }) {
  const columns = React.useMemo<ColumnDef<SurveyCompletionRow, unknown>[]>(
    () => [
      {
        accessorKey: 'participantCode',
        header: 'Kod',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.participantCode}</span>
        ),
      },
      { accessorKey: 'groupName', header: 'Guruh' },
      {
        accessorKey: 'expGroup',
        header: 'Tur',
        cell: ({ row }) =>
          row.original.expGroup ? (
            <Badge variant={row.original.expGroup === 'experimental' ? 'default' : 'secondary'}>
              {row.original.expGroup === 'experimental' ? 'Eksperimental' : 'Nazorat'}
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'responses',
        header: 'Javoblar soni',
        cell: ({ row }) =>
          row.original.responses ? (
            <Badge variant="success">{row.original.responses}</Badge>
          ) : (
            <Badge variant="outline">0</Badge>
          ),
      },
      {
        accessorKey: 'scoreTotal',
        header: 'Umumiy ball',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.scoreTotal ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'lastAt',
        header: 'Oxirgi javob',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.lastAt ? formatDate(row.original.lastAt) : '—'}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={15}
      searchPlaceholder="Kod bo‘yicha qidirish…"
      emptyMessage="Javob topilmadi"
    />
  )
}

const FLAG_META: Record<ItemStatRow['flag'], { label: string; variant: 'success' | 'warning' | 'danger' | 'outline' }> =
  {
    ok: { label: 'Yaxshi', variant: 'success' },
    too_easy: { label: 'Juda oson', variant: 'warning' },
    too_hard: { label: 'Juda qiyin', variant: 'warning' },
    weak_discrimination: { label: 'Zaif ajratadi', variant: 'danger' },
  }

/** Topshiriq statistikasi: qiyinlik indeksi va diskriminatsiya. */
export function ItemAnalysisTable({ rows }: { rows: ItemStatRow[] }) {
  const columns = React.useMemo<ColumnDef<ItemStatRow, unknown>[]>(
    () => [
      {
        accessorKey: 'order',
        header: '№',
        cell: ({ row }) => <span className="tabular-nums">{row.original.order}</span>,
      },
      {
        accessorKey: 'itemId',
        header: 'Topshiriq',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.itemId}</span>,
      },
      {
        accessorKey: 'skill',
        header: 'Ko‘nikma',
        cell: ({ row }) => SKILL_LABELS[row.original.skill]?.uz ?? row.original.skill,
      },
      {
        accessorKey: 'responses',
        header: 'Javoblar',
        cell: ({ row }) => <span className="tabular-nums">{row.original.responses}</span>,
      },
      {
        accessorKey: 'difficultyIndex',
        header: 'p (qiyinlik)',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.difficultyIndex.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'discrimination',
        header: 'D (diskriminatsiya)',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.discrimination === null ? '—' : row.original.discrimination.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'pointBiserial',
        header: 'r(pb)',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.pointBiserial === null ? '—' : row.original.pointBiserial.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'flag',
        header: 'Baho',
        cell: ({ row }) => {
          const meta = FLAG_META[row.original.flag]
          return <Badge variant={meta.variant}>{meta.label}</Badge>
        },
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      pageSize={20}
      searchPlaceholder="Topshiriq ID bo‘yicha qidirish…"
      emptyMessage="Topshiriq statistikasi hali yo‘q"
    />
  )
}
