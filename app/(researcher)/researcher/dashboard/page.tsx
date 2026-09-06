import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Circle,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import { formatDate, formatMinutes } from '@/lib/utils/format'

import { recomputeGroupStatsAction, refreshPredictionsAction } from '@/features/researcher/actions'
import { ActionButton } from '@/features/researcher/components/action-button'
import { getDashboardSummary } from '@/features/researcher/dashboard'

export const metadata: Metadata = { title: 'Tadqiqot boshqaruvi' }
export const dynamic = 'force-dynamic'

const STATUS_META = {
  planned: { label: 'Rejalashtirilgan', variant: 'outline' as const },
  running: { label: 'Davom etmoqda', variant: 'success' as const },
  finished: { label: 'Yakunlangan', variant: 'info' as const },
}

export default async function ResearcherDashboardPage() {
  await requireUser(['researcher', 'admin'])
  const summary = await getDashboardSummary()

  const { experiment, participants, preTest, postTest, activity, quality, checklist } = summary
  const pendingChecklist = checklist.filter((item) => !item.done)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tadqiqot boshqaruvi"
        description="Eksperiment holati, ishtirokchilar, kesimlar va ma’lumot sifati — bir ekranda."
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton
              variant="outline"
              action={() => recomputeGroupStatsAction()}
              successMessage="Kunlik guruh statistikasi qayta hisoblandi"
            >
              <RefreshCw />
              Statistikani yangilash
            </ActionButton>
            <Button asChild>
              <Link href="/researcher/experiment">
                <FlaskConical />
                Eksperiment sozlamalari
              </Link>
            </Button>
          </div>
        }
      />

      {!experiment ? (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Eksperiment hali yaratilmagan</AlertTitle>
          <AlertDescription>
            Ma’lumot yig‘ish boshlanishidan oldin eksperimentni sozlang: gipoteza, dizayn, pre/post
            testlar, so‘rovnomalar va muddatlar.{' '}
            <Link href="/researcher/experiment" className="font-medium underline underline-offset-4">
              Hozir sozlash
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {experiment ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {experiment.title}
                <Badge variant={STATUS_META[experiment.status].variant}>
                  {STATUS_META[experiment.status].label}
                </Badge>
              </CardTitle>
              <CardDescription>
                {experiment.start ? formatDate(experiment.start) : '—'} —{' '}
                {experiment.end ? formatDate(experiment.end) : '—'} ({experiment.daysTotal} kun)
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums">{experiment.daysRemaining}</p>
              <p className="text-xs text-muted-foreground">kun qoldi</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={experiment.progressPercent} />
            <p className="text-xs text-muted-foreground">
              {experiment.daysElapsed} / {experiment.daysTotal} kun o‘tdi (
              {experiment.progressPercent}%)
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ishtirokchilar"
          value={participants.total}
          sublabel={`${participants.experimental} eksperimental / ${participants.control} nazorat`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Rozilik (consent)"
          value={`${participants.consentRate}%`}
          sublabel={`${participants.consented} ta bergan, ${participants.withdrawn} ta chiqqan`}
          icon={<ShieldCheck className="size-4" />}
          tone={participants.consentRate >= 80 ? 'success' : 'warning'}
        />
        <StatCard
          label="Pre-test"
          value={`${preTest.percent}%`}
          sublabel={
            preTest.configured
              ? `${preTest.done} / ${preTest.total} topshirgan`
              : 'Pre-test biriktirilmagan'
          }
          icon={<ClipboardCheck className="size-4" />}
          tone={preTest.configured ? (preTest.percent >= 90 ? 'success' : 'default') : 'warning'}
        />
        <StatCard
          label="Post-test"
          value={`${postTest.percent}%`}
          sublabel={
            postTest.configured
              ? `${postTest.done} / ${postTest.total} topshirgan`
              : 'Post-test biriktirilmagan'
          }
          icon={<ClipboardCheck className="size-4" />}
          tone={postTest.configured ? (postTest.percent >= 90 ? 'success' : 'default') : 'warning'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="O‘rtacha faollik"
          value={formatMinutes(activity.avgMinutes)}
          sublabel={`${activity.avgActiveDays} faol kun / ishtirokchi`}
          icon={<Activity className="size-4" />}
        />
        <StatCard
          label="O‘rtacha mashqlar"
          value={activity.avgAttempts}
          sublabel="ishtirokchi boshiga"
          icon={<ClipboardCheck className="size-4" />}
        />
        <StatCard
          label="AI muloqoti"
          value={activity.avgAiMessages}
          sublabel="o‘rtacha xabar / ishtirokchi"
          icon={<FlaskConical className="size-4" />}
        />
        <StatCard
          label="Tahlilga yaroqli"
          value={quality.analysable}
          sublabel={`${quality.lowActivity} ta kam faol`}
          icon={<CheckCircle2 className="size-4" />}
          tone={quality.analysable > 0 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle>Ma’lumot sifati</CardTitle>
              <CardDescription>
                Tahlilga kiritish mezonidan o‘tmayotgan ishtirokchilar (kamida 120 daqiqa, 30
                mashq, 5 faol kun va pre-test).
              </CardDescription>
            </div>
            <ActionButton
              variant="outline"
              size="sm"
              action={() => refreshPredictionsAction()}
              successMessage="Prognozlar yangilandi"
            >
              <RefreshCw />
              Prognozlarni yangilash
            </ActionButton>
          </CardHeader>
          <CardContent>
            {quality.issues.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="Barcha ishtirokchilar mezonga mos"
                description="Hozircha ma’lumot sifati bo‘yicha ogohlantirish yo‘q."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Guruh</TableHead>
                      <TableHead className="text-right">Vaqt</TableHead>
                      <TableHead className="text-right">Mashqlar</TableHead>
                      <TableHead className="text-right">Faol kun</TableHead>
                      <TableHead>Sabab</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quality.issues.slice(0, 25).map((issue) => (
                      <TableRow key={issue.participantCode}>
                        <TableCell className="font-mono text-xs">
                          {issue.participantCode}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={issue.expGroup === 'experimental' ? 'default' : 'secondary'}
                          >
                            {issue.expGroup === 'experimental' ? 'Eksp.' : 'Nazorat'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {issue.timeOnTaskMin}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{issue.attempts}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {issue.activeDays}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {issue.reasons.join('; ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {quality.issues.length > 25 ? (
                  <p className="border-t border-border p-3 text-xs text-muted-foreground">
                    Yana {quality.issues.length - 25} ta ishtirokchi ro‘yxatda.
                  </p>
                ) : null}
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              Tahlilga kiritish/chiqarish mezoni dissertatsiyada aniq yozilishi shart. Analitika
              sahifasida «kam faol ishtirokchilarni chiqarish» tugmasi bilan ikkala variantni
              taqqoslash mumkin (sezgirlik tahlili).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tayyorgarlik ro‘yxati</CardTitle>
            <CardDescription>
              {pendingChecklist.length === 0
                ? 'Hammasi tayyor — eksperimentni boshlash mumkin.'
                : `${pendingChecklist.length} ta band bajarilmagan.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item.key} className="flex items-start gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                    {item.label}
                  </p>
                  {!item.done ? (
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  ) : null}
                </div>
              </div>
            ))}

            {participants.withoutCode > 0 ? (
              <Alert variant="warning">
                <AlertDescription className="text-xs">
                  {participants.withoutCode} ta talabada ishtirokchi kodi yo‘q.{' '}
                  <Link
                    href="/researcher/participants"
                    className="font-medium underline underline-offset-4"
                  >
                    Kod berish
                  </Link>
                </AlertDescription>
              </Alert>
            ) : null}

            {participants.withoutGroup > 0 ? (
              <Alert variant="info">
                <AlertDescription className="text-xs">
                  {participants.withoutGroup} ta talaba guruhga biriktirilmagan.{' '}
                  <Link href="/researcher/groups" className="font-medium underline underline-offset-4">
                    Randomizatsiya
                  </Link>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Keyingi qadamlar
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/researcher/groups">Guruhlar va randomizatsiya</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/researcher/tests">Testlar monitoringi</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/researcher/analytics">Statistik tahlil</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href="/researcher/export">SPSS eksporti</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
