import Link from 'next/link'
import type { Metadata } from 'next'
import { BarChart3, BotOff, FlaskConical, Target, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ChartCard } from '@/components/charts/chart-card'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { ScoreBarChart } from '@/components/charts/score-bar-chart'
import { requireTeacher } from '@/features/teacher/guards'
import { getGroupDetail, listTeacherGroups } from '@/features/teacher/queries'
import { AssignmentDialog } from '@/features/teacher/components/assignment-manager'
import { StudentTable } from '@/features/teacher/components/student-table'
import { formatDateTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Guruh' }
export const dynamic = 'force-dynamic'

export default async function TeacherGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const user = await requireTeacher()

  // assertTeachesGroup getGroupDetail ichida — route parametriga ishonilmaydi
  const [data, groups] = await Promise.all([getGroupDetail(user, groupId), listTeacherGroups(user)])

  const control = data.group.type === 'control'
  const groupOptions = groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Guruhlarim', href: '/teacher/groups' }, { label: data.group.name }]}
        title={data.group.name}
        description={
          control
            ? 'Nazorat guruhi — AI tutor, AI feedback va adaptivlik o‘chirilgan (eksperiment dizayni).'
            : 'Eksperimental guruh — AI imkoniyatlari to‘liq yoqilgan.'
        }
        actions={
          <>
            <Badge variant={control ? 'warning' : 'info'}>
              {control ? <BotOff /> : <FlaskConical />}
              {control ? 'Nazorat guruhi' : 'Eksperimental guruh'}
            </Badge>
            <Button asChild variant="outline">
              <Link href={`/teacher/analytics?group=${data.group.id}`}>
                <BarChart3 />
                Analitika
              </Link>
            </Button>
            <AssignmentDialog groups={groupOptions} fixedGroupId={data.group.id} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Talabalar"
          value={data.rows.length}
          sublabel={`Ro‘yxatda: ${data.group.studentCount ?? data.rows.length}`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="7 kun ichida faol"
          value={`${data.activeLast7} / ${data.rows.length}`}
          icon={<Target className="size-4" />}
          tone={data.activeLast7 >= data.rows.length * 0.7 ? 'success' : 'warning'}
        />
        <StatCard
          label="O‘rtacha to‘g‘ri javob"
          value={`${data.avgCorrectRate}%`}
          sublabel="Oxirgi 30 kun"
          icon={<Target className="size-4" />}
        />
        <StatCard
          label="Berilgan topshiriqlar"
          value={data.assignments.length}
          sublabel={
            data.assignments[0]
              ? `Oxirgisi: ${formatDateTime(data.assignments[0].dueAt)}`
              : 'Hali yo‘q'
          }
          icon={<Target className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Ko‘nikmalar bo‘yicha o‘rtacha"
          description="Diagnostika va o‘quv yo‘nalishi profillari asosida"
          height={300}
        >
          {data.skillAverages.length ? (
            <ScoreBarChart data={data.skillAverages} horizontal />
          ) : (
            <EmptyState
              title="Ma’lumot yo‘q"
              description="Talabalar diagnostika testidan o‘tgach shu yerda ko‘rinadi."
            />
          )}
        </ChartCard>

        <ChartCard
          title="Progress dinamikasi (30 kun)"
          description="Kunlik to‘g‘ri javob foizi va faol talabalar"
          height={300}
        >
          <ProgressLineChart
            data={data.progressSeries}
            xKey="date"
            domain={[0, Math.max(10, data.rows.length)]}
            series={[
              { key: 'togriFoiz', label: 'To‘g‘ri javob %' },
              { key: 'faol', label: 'Faol talabalar' },
            ]}
          />
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Talabalar</CardTitle>
        </CardHeader>
        <CardContent>
          {data.rows.length ? (
            <StudentTable rows={data.rows} />
          ) : (
            <EmptyState
              icon={<Users />}
              title="Guruhda talaba yo‘q"
              description="Administrator talabalarni import qilgach ular shu yerda ko‘rinadi."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
