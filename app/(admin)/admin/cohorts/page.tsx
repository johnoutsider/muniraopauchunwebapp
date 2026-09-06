import type { Metadata } from 'next'
import { Boxes, Plus, Trash2, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'
import { formatDate } from '@/lib/utils/format'

import { deleteCohortAction } from '@/features/admin/actions'
import { ActionButton } from '@/features/admin/components/action-button'
import { CohortFormDialog } from '@/features/admin/components/cohort-form-dialog'
import { listAdminCohorts, listAdminGroups, listAdminUsers } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Kohortlar' }
export const dynamic = 'force-dynamic'

export default async function AdminCohortsPage() {
  await requireUser(['admin'])

  const [cohorts, groups, users] = await Promise.all([
    listAdminCohorts(),
    listAdminGroups(),
    listAdminUsers(),
  ])

  const teachers = users
    .filter((user) => user.role === 'teacher' || user.role === 'admin')
    .map((user) => ({ id: user.uid, displayName: user.displayName }))

  const studentsInCohort = (cohortId: string) => {
    const cohortGroups = groups.filter((group) => group.cohortId === cohortId).map((g) => g.id)
    return users.filter(
      (user) =>
        user.role === 'student' &&
        (user.cohortName === cohorts.find((c) => c.id === cohortId)?.name ||
          (user.groupId ? cohortGroups.includes(user.groupId) : false))
    ).length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kohortlar"
        description="O‘quv yili bo‘yicha talabalar to‘plami. Guruhlar va eksperiment shu kohort ichida tashkil qilinadi."
        actions={
          <CohortFormDialog
            teachers={teachers}
            trigger={
              <Button>
                <Plus />
                Yangi kohort
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Kohortlar" value={cohorts.length} icon={<Boxes className="size-4" />} />
        <StatCard label="Guruhlar" value={groups.length} icon={<Users className="size-4" />} />
        <StatCard
          label="Talabalar"
          value={users.filter((user) => user.role === 'student').length}
          icon={<Users className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kohortlar ro‘yxati</CardTitle>
          <CardDescription>
            Kohortni o‘chirish uchun avval undagi guruhlarni o‘chirish yoki ko‘chirish kerak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cohorts.length === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title="Kohort yaratilmagan"
              description="Eksperimentni boshlash uchun avval kohort yarating."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Universitet</TableHead>
                    <TableHead>Fakultet</TableHead>
                    <TableHead>Muddat</TableHead>
                    <TableHead className="text-right">Guruhlar</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohorts.map((cohort) => {
                    const cohortGroups = groups.filter((group) => group.cohortId === cohort.id)
                    return (
                      <TableRow key={cohort.id}>
                        <TableCell className="font-medium">{cohort.name}</TableCell>
                        <TableCell className="text-sm">{cohort.university}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cohort.faculty || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(cohort.startDate)}
                          {cohort.endDate ? ` — ${formatDate(cohort.endDate)}` : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{cohortGroups.length}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {studentsInCohort(cohort.id)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <CohortFormDialog
                              teachers={teachers}
                              cohort={{
                                id: cohort.id,
                                name: cohort.name,
                                university: cohort.university,
                                faculty: cohort.faculty,
                                startDate:
                                  typeof cohort.startDate === 'string'
                                    ? cohort.startDate
                                    : undefined,
                                endDate:
                                  typeof cohort.endDate === 'string' ? cohort.endDate : undefined,
                                teacherIds: cohort.teacherIds ?? [],
                              }}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  Tahrirlash
                                </Button>
                              }
                            />
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              action={() => deleteCohortAction(cohort.id)}
                              successMessage="Kohort o‘chirildi"
                              confirmTitle="Kohortni o‘chirish"
                              confirmDescription="Bu amal qaytarilmaydi. Kohortda guruh bo‘lmasa o‘chiriladi."
                            >
                              <Trash2 />
                            </ActionButton>
                          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Kohortdagi guruhlar</CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <EmptyState title="Guruh yo‘q" description="«Guruhlar» sahifasidan yarating." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guruh</TableHead>
                    <TableHead>Kohort</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cohorts.find((cohort) => cohort.id === group.cohortId)?.name ??
                          group.cohortId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.type === 'experimental' ? 'default' : 'secondary'}>
                          {group.type === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {group.studentCount ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
