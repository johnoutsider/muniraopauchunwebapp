import type { Metadata } from 'next'
import { AlertTriangle, Plus, ShieldOff, Users } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import type { FeatureFlags } from '@/types'

import { GroupFormDialog } from '@/features/researcher/components/group-form-dialog'
import { Randomiser } from '@/features/researcher/components/randomiser'
import {
  listAllGroups,
  listCohorts,
  listParticipants,
  listTeachers,
} from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Guruhlar' }
export const dynamic = 'force-dynamic'

/** Mustaqil o'zgaruvchini tashkil etuvchi AI flaglari (PLAN 1.5). */
const AI_FLAGS: Array<{ key: keyof FeatureFlags; label: string }> = [
  { key: 'aiTutor', label: 'AI o‘qituvchi' },
  { key: 'aiFeedback', label: 'AI feedback' },
  { key: 'adaptive', label: 'Adaptiv dvigatel' },
  { key: 'pronunciationAI', label: 'Talaffuz AI' },
  { key: 'aiRolePlay', label: 'AI role-play' },
  { key: 'promptLab', label: 'Prompt Lab' },
  { key: 'corpusVerification', label: 'Korpus tekshiruvi' },
  { key: 'semanticNetwork', label: 'Semantik tarmoq' },
]

export default async function ResearcherGroupsPage() {
  await requireUser(['researcher', 'admin'])

  const [groups, cohorts, teachers, participants] = await Promise.all([
    listAllGroups(),
    listCohorts(),
    listTeachers(),
    listParticipants(),
  ])

  const teacherName = (id?: string) =>
    teachers.find((teacher) => teacher.id === id)?.displayName ?? '—'
  const cohortName = (id: string) => cohorts.find((cohort) => cohort.id === id)?.name ?? id

  const experimentalGroups = groups.filter((group) => group.type === 'experimental')
  const controlGroups = groups.filter((group) => group.type === 'control')

  const countIn = (groupId: string) =>
    participants.filter((participant) => participant.groupId === groupId).length

  // Nazorat guruhida yoqilib qolgan AI flaglari — dizayn buzilishi
  const violations = controlGroups.flatMap((group) =>
    AI_FLAGS.filter((flag) => group.featureFlags?.[flag.key]).map((flag) => ({
      group: group.name,
      flag: flag.label,
    }))
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guruhlar"
        description="Eksperimental va nazorat guruhlarini boshqarish, o‘qituvchi tayinlash va talabalarni taqsimlash."
        actions={
          <GroupFormDialog
            cohorts={cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name }))}
            teachers={teachers.map((teacher) => ({
              id: teacher.id,
              displayName: teacher.displayName,
            }))}
            trigger={
              <Button>
                <Plus />
                Yangi guruh
              </Button>
            }
          />
        }
      />

      {violations.length ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Dizayn buzilishi aniqlandi</AlertTitle>
          <AlertDescription>
            Nazorat guruhida AI imkoniyati yoqilgan:{' '}
            {violations.map((violation) => `${violation.group} → ${violation.flag}`).join(', ')}.
            Bu mustaqil o‘zgaruvchini yo‘q qiladi — darhol o‘chiring.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami guruhlar"
          value={groups.length}
          sublabel={`${experimentalGroups.length} eksperimental / ${controlGroups.length} nazorat`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Eksperimental ishtirokchilar"
          value={participants.filter((p) => p.expGroup === 'experimental').length}
          sublabel="AI imkoniyatlari yoqilgan"
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Nazorat ishtirokchilari"
          value={participants.filter((p) => p.expGroup === 'control').length}
          sublabel="AI imkoniyatlari o‘chirilgan"
          icon={<ShieldOff className="size-4" />}
        />
        <StatCard
          label="Guruhsiz talabalar"
          value={participants.filter((p) => !p.groupId).length}
          sublabel="Randomizatsiya kerak"
          icon={<Users className="size-4" />}
          tone={participants.filter((p) => !p.groupId).length ? 'warning' : 'success'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guruhlar ro‘yxati</CardTitle>
          <CardDescription>
            Har bir guruhning turi, o‘qituvchisi va talabalar soni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <EmptyState
              title="Guruh yaratilmagan"
              description="Eksperiment uchun kamida bitta eksperimental va bitta nazorat guruhi kerak."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Kohort</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>O‘qituvchi</TableHead>
                    <TableHead className="text-right">Talabalar</TableHead>
                    <TableHead className="text-right">AI flaglar (yoqilgan)</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => {
                    const enabled = AI_FLAGS.filter((flag) => group.featureFlags?.[flag.key]).length
                    return (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cohortName(group.cohortId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={group.type === 'experimental' ? 'default' : 'secondary'}
                          >
                            {group.type === 'experimental' ? 'Eksperimental' : 'Nazorat'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{teacherName(group.teacherId)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {countIn(group.id)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge
                            variant={
                              group.type === 'control'
                                ? enabled > 0
                                  ? 'danger'
                                  : 'success'
                                : 'outline'
                            }
                          >
                            {enabled} / {AI_FLAGS.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <GroupFormDialog
                            cohorts={cohorts.map((cohort) => ({
                              id: cohort.id,
                              name: cohort.name,
                            }))}
                            teachers={teachers.map((teacher) => ({
                              id: teacher.id,
                              displayName: teacher.displayName,
                            }))}
                            group={{
                              id: group.id,
                              name: group.name,
                              cohortId: group.cohortId,
                              type: group.type,
                              teacherId: group.teacherId,
                            }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                Tahrirlash
                              </Button>
                            }
                          />
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
          <CardTitle className="flex items-center gap-2">
            <ShieldOff className="size-4 text-primary" />
            Nazorat guruhida o‘chirilgan imkoniyatlar
          </CardTitle>
          <CardDescription>
            Bu ro‘yxat — eksperimentning MUSTAQIL O‘ZGARUVCHISI. Nazorat guruhi bir xil kontent va
            bir xil mashqlarni oladi, lekin AI qo‘llab-quvvatlovisiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {controlGroups.length === 0 ? (
            <EmptyState
              title="Nazorat guruhi yo‘q"
              description="Taqqoslash uchun kamida bitta nazorat guruhi yarating."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imkoniyat</TableHead>
                    {controlGroups.map((group) => (
                      <TableHead key={group.id} className="text-center">
                        {group.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AI_FLAGS.map((flag) => (
                    <TableRow key={flag.key}>
                      <TableCell className="font-medium">{flag.label}</TableCell>
                      {controlGroups.map((group) => (
                        <TableCell key={group.id} className="text-center">
                          {group.featureFlags?.[flag.key] ? (
                            <Badge variant="danger">YOQILGAN</Badge>
                          ) : (
                            <Badge variant="success">o‘chirilgan</Badge>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Randomiser
        cohorts={cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name }))}
        groups={groups.map((group) => ({ id: group.id, name: group.name, type: group.type }))}
      />
    </div>
  )
}
