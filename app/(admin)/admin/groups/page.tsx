import type { Metadata } from 'next'
import { AlertTriangle, Plus, Trash2, Users } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'

import { deleteGroupAction } from '@/features/admin/actions'
import { ActionButton } from '@/features/admin/components/action-button'
import { FLAG_META, GroupFlagsEditor } from '@/features/admin/components/group-flags-editor'
import { MoveStudentsDialog } from '@/features/admin/components/move-students-dialog'
import { listAdminCohorts, listAdminGroups, listAdminUsers } from '@/features/admin/queries'
import { GroupFormDialog } from '@/features/researcher/components/group-form-dialog'

export const metadata: Metadata = { title: 'Guruhlar' }
export const dynamic = 'force-dynamic'

export default async function AdminGroupsPage() {
  await requireUser(['admin'])

  const [groups, cohorts, users] = await Promise.all([
    listAdminGroups(),
    listAdminCohorts(),
    listAdminUsers(),
  ])

  const teachers = users.filter((user) => user.role === 'teacher' || user.role === 'admin')
  const students = users.filter((user) => user.role === 'student')

  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
  }))
  const cohortOptions = cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name }))

  const violations = groups
    .filter((group) => group.type === 'control')
    .flatMap((group) =>
      FLAG_META.filter((meta) => meta.ai && group.featureFlags?.[meta.key]).map((meta) => ({
        group: group.name,
        flag: meta.label,
      }))
    )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guruhlar"
        description="Guruh yaratish, o‘qituvchi tayinlash, talabalarni ko‘chirish va guruh darajasidagi feature flaglar."
        actions={
          <div className="flex flex-wrap gap-2">
            <MoveStudentsDialog
              students={students.map((student) => ({
                uid: student.uid,
                displayName: student.displayName,
                groupName: student.groupName,
              }))}
              groups={groupOptions}
            />
            <GroupFormDialog
              cohorts={cohortOptions}
              teachers={teachers.map((teacher) => ({
                id: teacher.uid,
                displayName: teacher.displayName,
              }))}
              trigger={
                <Button>
                  <Plus />
                  Yangi guruh
                </Button>
              }
            />
          </div>
        }
      />

      {violations.length ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Nazorat guruhida AI imkoniyati yoqilgan</AlertTitle>
          <AlertDescription>
            {violations.map((violation) => `${violation.group} → ${violation.flag}`).join(', ')}.
            Eksperiment dizayni buzilgan — pastdagi sozlamalardan o‘chiring.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Guruhlar" value={groups.length} icon={<Users className="size-4" />} />
        <StatCard
          label="Eksperimental"
          value={groups.filter((group) => group.type === 'experimental').length}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Nazorat"
          value={groups.filter((group) => group.type === 'control').length}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Guruhsiz talabalar"
          value={students.filter((student) => !student.groupId).length}
          icon={<Users className="size-4" />}
          tone={students.filter((student) => !student.groupId).length ? 'warning' : 'success'}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="Guruh yaratilmagan"
          description="Kamida bitta eksperimental va bitta nazorat guruhi kerak."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Guruh sozlamalari</CardTitle>
            <CardDescription>
              Har bir guruh uchun feature flaglarni alohida boshqarish mumkin. Guruh sozlamasi
              global sozlamadan ustun turadi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={groups[0].id}>
              <TabsList className="flex-wrap">
                {groups.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {groups.map((group) => {
                const count = students.filter((student) => student.groupId === group.id).length
                const teacher = teachers.find((item) => item.uid === group.teacherId)
                return (
                  <TabsContent key={group.id} value={group.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 font-medium">
                          {group.name}
                          <Badge variant={group.type === 'experimental' ? 'default' : 'secondary'}>
                            {group.type === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kohort:{' '}
                          {cohorts.find((cohort) => cohort.id === group.cohortId)?.name ??
                            group.cohortId}{' '}
                          · O‘qituvchi: {teacher?.displayName ?? '—'} · Talabalar: {count}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GroupFormDialog
                          cohorts={cohortOptions}
                          teachers={teachers.map((item) => ({
                            id: item.uid,
                            displayName: item.displayName,
                          }))}
                          group={{
                            id: group.id,
                            name: group.name,
                            cohortId: group.cohortId,
                            type: group.type,
                            teacherId: group.teacherId,
                          }}
                          trigger={<Button variant="outline">Tahrirlash</Button>}
                        />
                        <ActionButton
                          variant="ghost"
                          action={() => deleteGroupAction(group.id)}
                          successMessage="Guruh o‘chirildi"
                          confirmTitle="Guruhni o‘chirish"
                          confirmDescription="Guruhda talaba bo‘lmasa o‘chiriladi. Amal qaytarilmaydi."
                        >
                          <Trash2 />
                          O‘chirish
                        </ActionButton>
                      </div>
                    </div>

                    <GroupFlagsEditor
                      groupId={group.id}
                      groupName={group.name}
                      type={group.type}
                      flags={group.featureFlags}
                    />
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
