import Link from 'next/link'
import type { Metadata } from 'next'
import { Bot, BotOff, Clock, Target, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ChartCard } from '@/components/charts/chart-card'
import { DonutChart } from '@/components/charts/donut-chart'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { SKILL_LABELS } from '@/config/constants'
import { requireTeacher } from '@/features/teacher/guards'
import { getGroupAnalytics, listTeacherGroups } from '@/features/teacher/queries'
import { CsvDownloadButton } from '@/features/teacher/components/csv-download-button'
import { cn } from '@/lib/utils/cn'
import { formatMinutes, scoreColor } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Analitika' }
export const dynamic = 'force-dynamic'

export default async function TeacherAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>
}) {
  const { group } = await searchParams
  const user = await requireTeacher()
  const groups = await listTeacherGroups(user)

  if (!groups.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analitika" description="Guruh bo‘yicha o‘quv analitikasi." />
        <EmptyState
          icon={<Users />}
          title="Guruh yo‘q"
          description="Analitika uchun sizga kamida bitta guruh biriktirilgan bo‘lishi kerak."
        />
      </div>
    )
  }

  // Guruh id serverda tekshiriladi (assertTeachesGroup getGroupAnalytics ichida)
  const activeGroupId = group && groups.some((entry) => entry.id === group) ? group : groups[0].id
  const data = await getGroupAnalytics(user, activeGroupId)
  const experimental = data.group.type === 'experimental'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitika"
        description="Guruh darajasidagi o‘quv analitikasi: ko‘nikmalar dinamikasi, xatolar taksonomiyasi, mashq sifati va vaqt sarfi."
        actions={
          <Badge variant={experimental ? 'info' : 'warning'}>
            {experimental ? <Bot /> : <BotOff />}
            {experimental ? 'Eksperimental guruh' : 'Nazorat guruhi (AI o‘chirilgan)'}
          </Badge>
        }
      />

      <div className="flex flex-wrap gap-2">
        {groups.map((entry) => (
          <Link
            key={entry.id}
            href={`/teacher/analytics?group=${entry.id}`}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              activeGroupId === entry.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {entry.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Talabalar"
          value={data.totals.students}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Urinishlar (30 kun)"
          value={data.totals.attempts}
          sublabel={`${data.totals.correctRate}% to‘g‘ri`}
          icon={<Target className="size-4" />}
          tone={data.totals.correctRate >= 70 ? 'success' : 'default'}
        />
        <StatCard
          label="Vaqt sarfi"
          value={formatMinutes(data.totals.timeOnTaskMin)}
          sublabel={`Talabaga o‘rtacha ${formatMinutes(data.totals.avgTimePerStudentMin)}`}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="AI muloqot hajmi"
          value={experimental ? data.totals.aiMessages : '—'}
          sublabel={experimental ? 'AI xabarlar soni (30 kun)' : 'Nazorat guruhida AI o‘chirilgan'}
          icon={<Bot className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Ko‘nikma ballari dinamikasi"
          description="Kunlik o‘rtacha ballar (statsDaily)"
          height={300}
        >
          {data.skillKeys.length ? (
            <ProgressLineChart
              data={data.skillSeries}
              xKey="date"
              series={data.skillKeys.map((skill) => ({
                key: skill,
                label: SKILL_LABELS[skill].uz,
              }))}
            />
          ) : (
            <EmptyState
              title="Ma’lumot yig‘ilmagan"
              description="Kunlik ko‘nikma ballari to‘planganidan keyin grafik chiziladi."
            />
          )}
        </ChartCard>

        <ChartCard
          title="Xatolar taqsimoti"
          description="Xatolar taksonomiyasi bo‘yicha (urinishlar + xatolar profili)"
          height={300}
          actions={<CsvDownloadButton groupId={data.group.id} table="errors" label="CSV" />}
        >
          {data.errorDistribution.length ? (
            <DonutChart data={data.errorDistribution} centerLabel="xato" />
          ) : (
            <EmptyState
              title="Xato yozuvi yo‘q"
              description="Talabalar mashq bajarganidan keyin bu grafik to‘ladi."
            />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Vaqt sarfi (time-on-task)"
          description="Guruh bo‘yicha kunlik jami daqiqalar"
          height={280}
        >
          <ProgressLineChart
            data={data.timeSeries}
            xKey="date"
            domain={[0, Math.max(30, ...data.timeSeries.map((point) => point.daqiqa))]}
            series={[{ key: 'daqiqa', label: 'Daqiqa' }]}
          />
        </ChartCard>

        <ChartCard
          title={experimental ? 'AI foydalanish hajmi' : 'AI foydalanish (nazorat guruhi)'}
          description={
            experimental
              ? 'Kunlik AI xabarlar soni — eksperiment o‘zgaruvchisi'
              : 'Nazorat guruhida AI o‘chirilgan, shuning uchun ko‘rsatkich nolga teng bo‘lishi kutiladi'
          }
          height={280}
        >
          <ProgressLineChart
            data={data.aiSeries}
            xKey="date"
            domain={[0, Math.max(5, ...data.aiSeries.map((point) => point.xabarlar))]}
            series={[{ key: 'xabarlar', label: 'AI xabarlar' }]}
          />
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-base">Mashq sifati tahlili</CardTitle>
            <p className="text-sm text-muted-foreground">
              Eng past to‘g‘ri javob foizli mashqlar — item bank sifatini yaxshilash uchun (kamida 3
              urinish).
            </p>
          </div>
          <CsvDownloadButton groupId={data.group.id} table="items" label="Jadvalni CSV" />
        </CardHeader>
        <CardContent>
          {!data.hardestItems.length ? (
            <EmptyState
              title="Yetarli ma’lumot yo‘q"
              description="Mashqlar kamida 3 martadan bajarilgach tahlil ko‘rsatiladi."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Mashq</th>
                    <th className="py-2 pr-3 font-medium">Ko‘nikma</th>
                    <th className="py-2 pr-3 font-medium">Mavzu</th>
                    <th className="py-2 pr-3 font-medium">Qiyinlik</th>
                    <th className="py-2 pr-3 font-medium">Urinish</th>
                    <th className="py-2 font-medium">To‘g‘ri %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.hardestItems.map((item) => (
                    <tr key={item.id}>
                      <td className="max-w-md py-2 pr-3">
                        <span className="line-clamp-2">{item.stem}</span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {SKILL_LABELS[item.skill as keyof typeof SKILL_LABELS]?.uz ?? item.skill}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{item.topic}</td>
                      <td className="py-2 pr-3 tabular-nums">{item.difficulty}</td>
                      <td className="py-2 pr-3 tabular-nums">{item.attempts}</td>
                      <td
                        className={cn(
                          'py-2 font-medium tabular-nums',
                          scoreColor(item.correctRate)
                        )}
                      >
                        {item.correctRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Talabalar jadvali</CardTitle>
          <CsvDownloadButton groupId={data.group.id} table="students" label="Talabalarni CSV" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To‘liq jadval{' '}
            <Link
              href={`/teacher/groups/${data.group.id}`}
              className="font-medium text-primary hover:underline"
            >
              guruh sahifasida
            </Link>{' '}
            — bu yerdan uni CSV sifatida yuklab olish mumkin (SPSS/Excel uchun UTF-8).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
