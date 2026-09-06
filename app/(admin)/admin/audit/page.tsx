import type { Metadata } from 'next'
import { ScrollText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireUser } from '@/lib/firebase/session'
import { formatDateTime } from '@/lib/utils/format'

import { auditActionLabel } from '@/features/admin/audit-meta'
import { AuditFilters } from '@/features/admin/components/audit-filters'
import { listAuditLogs } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Audit jurnali' }
export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  student: 'Talaba',
  teacher: 'O‘qituvchi',
  researcher: 'Tadqiqotchi',
  admin: 'Administrator',
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string
    actor?: string
    from?: string
    to?: string
    page?: string
  }>
}) {
  await requireUser(['admin'])
  const params = await searchParams

  const result = await listAuditLogs({
    action: params.action,
    actorUid: params.actor,
    from: params.from,
    to: params.to,
    page: params.page ? Number(params.page) : 1,
    pageSize: 25,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit jurnali"
        description="Barcha ma’muriy o‘zgarishlar: rol berish, guruh o‘zgartirish, flaglar, kontent nashri va ilmiy ma’lumot eksporti."
      />

      <AuditFilters
        actions={result.actions}
        actors={result.actors}
        page={result.page}
        totalPages={totalPages}
        total={result.total}
      />

      <Card>
        <CardHeader>
          <CardTitle>Yozuvlar</CardTitle>
          <CardDescription>
            Jurnal o‘zgartirilmaydi va o‘chirilmaydi — tadqiqot yaxlitligi uchun (PLAN 10).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.rows.length === 0 ? (
            <EmptyState
              icon={<ScrollText />}
              title="Yozuv topilmadi"
              description="Filtrlarni o‘zgartiring yoki tozalang."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Kim</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Amal</TableHead>
                    <TableHead>Obyekt</TableHead>
                    <TableHead>Tafsilot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row) => {
                    const { actorName: _actorName, ...meta } = row.meta as Record<string, unknown>
                    const detail = Object.entries(meta)
                      .filter(([, value]) => value !== null && value !== undefined)
                      .map(
                        ([key, value]) =>
                          `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
                      )
                      .join(' · ')
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {row.ts ? formatDateTime(row.ts) : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{row.actorName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ROLE_LABELS[row.actorRole] ?? row.actorRole}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {auditActionLabel(row.action)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {row.target ?? '—'}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                          {detail || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
