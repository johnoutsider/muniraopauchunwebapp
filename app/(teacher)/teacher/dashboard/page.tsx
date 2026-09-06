import Link from 'next/link'
import type { Metadata } from 'next'
import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CalendarClock,
  FileCheck2,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ChartCard } from '@/components/charts/chart-card'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { requireTeacher } from '@/features/teacher/guards'
import { attentionReasons, getTeacherDashboard } from '@/features/teacher/queries'
import { formatDateTime, relativeTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'O‘qituvchi paneli' }
export const dynamic = 'force-dynamic'

export default async function TeacherDashboardPage() {
  const user = await requireTeacher()
  const data = await getTeacherDashboard(user)

  if (!data.groups.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Salom, ${user.displayName.split(' ')[0] || 'ustoz'}!`}
          description="Guruhlaringiz bo‘yicha umumiy ko‘rinish."
        />
        <EmptyState
          icon={<Users />}
          title="Sizga hali guruh biriktirilmagan"
          description="Administrator sizni guruhga biriktirgach, talabalar, baholash navbati va analitika shu yerda paydo bo‘ladi."
        />
      </div>
    )
  }

  const activePercent = data.studentCount
    ? Math.round((data.activeLast7 / data.studentCount) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Salom, ${user.displayName.split(' ')[0] || 'ustoz'}!`}
        description={`${data.groups.length} ta guruh · ${data.studentCount} ta talaba. Kunlik ish: baholash navbati va kontent tasdig‘i.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/teacher/content">
                <BookMarked />
                Kontent tasdig‘i
                {data.pendingContent > 0 ? (
                  <Badge variant="warning">{data.pendingContent}</Badge>
                ) : null}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/teacher/review">
                <FileCheck2 />
                Baholash navbati
                {data.pendingReview.total > 0 ? (
                  <Badge variant="secondary">{data.pendingReview.total}</Badge>
                ) : null}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Talabalar"
          value={data.studentCount}
          sublabel={`${data.groups.length} ta guruhda`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="7 kun ichida faol"
          value={`${data.activeLast7} / ${data.studentCount}`}
          sublabel={`${activePercent}% faol`}
          icon={<Target className="size-4" />}
          tone={activePercent >= 70 ? 'success' : activePercent >= 40 ? 'warning' : 'danger'}
        />
        <StatCard
          label="O‘rtacha to‘g‘ri javob"
          value={`${data.avgCorrectRate}%`}
          sublabel="Oxirgi 30 kun"
          icon={<Target className="size-4" />}
          tone={data.avgCorrectRate >= 70 ? 'success' : 'default'}
        />
        <StatCard
          label="Baholash navbati"
          value={data.pendingReview.total}
          sublabel={`W ${data.pendingReview.writing} · S ${data.pendingReview.speaking} · P ${data.pendingReview.project}`}
          icon={<FileCheck2 className="size-4" />}
          tone={data.pendingReview.total > 0 ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Guruh faolligi (30 kun)"
          description="Har kuni mashq qilgan talabalar soni va to‘g‘ri javob foizi"
          className="lg:col-span-2"
          height={300}
        >
          <ProgressLineChart
            data={data.activity}
            xKey="date"
            domain={[0, Math.max(10, data.studentCount)]}
            series={[
              { key: 'faol', label: 'Faol talabalar' },
              { key: 'togriFoiz', label: 'To‘g‘ri javob %' },
            ]}
          />
        </ChartCard>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-muted-foreground" />
              Yaqin muddatlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingAssignments.length === 0 ? (
              <EmptyState
                title="Yaqin muddat yo‘q"
                description="Guruhga yangi topshiriq bering."
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/teacher/assignments">Topshiriqlar</Link>
                  </Button>
                }
              />
            ) : (
              data.upcomingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href="/teacher/assignments"
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <p className="truncate text-sm font-medium">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.groupName} · {formatDateTime(assignment.dueAt)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            E’tibor talab qiladigan talabalar
          </CardTitle>
          <Badge variant={data.attention.length ? 'warning' : 'success'}>
            {data.attention.length} ta
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.attention.length === 0 ? (
            <EmptyState
              title="Hammasi joyida"
              description="Hech bir talaba 7 kundan ortiq g‘oyib bo‘lmagan va natijalar pasaymagan."
            />
          ) : (
            data.attention.map((row) => (
              <Link
                key={row.uid}
                href={`/teacher/students/${row.uid}`}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {row.displayName}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.participantCode}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.groupName} ·{' '}
                    {row.lastActiveAt
                      ? `oxirgi faollik ${relativeTime(row.lastActiveAt)}`
                      : 'hech qachon kirmagan'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {attentionReasons(row).map((reason) => (
                    <Badge
                      key={reason}
                      variant={reason.includes('xavf') ? 'danger' : 'warning'}
                      className="whitespace-nowrap"
                    >
                      {reason.includes('pasaygan') ? <TrendingDown /> : null}
                      {reason}
                    </Badge>
                  ))}
                </div>

                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
