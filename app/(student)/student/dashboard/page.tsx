import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Flame,
  Route,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { SkillIcon } from '@/components/shared/skill-icon'
import { ProficiencyBadge } from '@/components/shared/proficiency-badge'
import { SkillRadarChart } from '@/components/charts/skill-radar-chart'
import { ChartCard } from '@/components/charts/chart-card'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getStudentDashboard, getTodayTasks } from '@/features/student/queries'
import { SKILL_LABELS, XP, scoreToLabel, xpToLevel, type Skill } from '@/config/constants'
import { formatMinutes, percent } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Bosh sahifa' }
export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  const [data, tasks] = await Promise.all([
    getStudentDashboard(user.uid, user.groupId),
    getTodayTasks(user.uid, user.groupId),
  ])

  const level = xpToLevel(data.totalXp)
  const todayXp = data.todayStats?.xp ?? 0
  const dailyProgress = percent(todayXp, XP.DAILY_GOAL)
  const skillEntries = Object.entries(data.skillScores) as Array<[Skill, number]>
  const radarData = skillEntries.map(([skill, score]) => ({
    skill: SKILL_LABELS[skill].uz,
    score,
  }))

  const weekMinutes = data.weekStats.reduce((sum, day) => sum + (day.timeOnTaskMin ?? 0), 0)
  const weekAttempts = data.weekStats.reduce((sum, day) => sum + (day.attempts ?? 0), 0)
  const weekCorrect = data.weekStats.reduce((sum, day) => sum + (day.correct ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Salom, ${user.displayName.split(' ')[0] || 'talaba'}!`}
        description={
          data.path
            ? 'Bugungi vazifalaringiz tayyor. Individual yo‘nalishingiz bo‘yicha davom eting.'
            : 'Boshlash uchun diagnostika testidan o‘ting — platforma sizga individual yo‘nalish tuzadi.'
        }
        actions={
          data.path ? (
            <Button asChild>
              <Link href="/student/path">
                <Route />
                Yo‘nalishim
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/student/assessment/diagnostic">
                <Target />
                Diagnostikadan o‘tish
              </Link>
            </Button>
          )
        }
      />

      {/* Statistika */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Kunlik maqsad"
          value={`${todayXp} / ${XP.DAILY_GOAL} XP`}
          sublabel={dailyProgress >= 100 ? 'Bajarildi!' : `${dailyProgress}% bajarildi`}
          icon={<Target className="size-4" />}
          tone={dailyProgress >= 100 ? 'success' : 'default'}
        />
        <StatCard
          label="Seriya"
          value={`${data.streak.current} kun`}
          sublabel={`Eng uzun: ${data.streak.longest} kun`}
          icon={<Flame className="size-4" />}
          tone={data.streak.current >= 3 ? 'success' : 'default'}
        />
        <StatCard
          label="Daraja"
          value={`${level.level}-daraja`}
          sublabel={`${data.totalXp} XP jami`}
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          label="Haftalik faollik"
          value={formatMinutes(weekMinutes)}
          sublabel={
            weekAttempts
              ? `${percent(weekCorrect, weekAttempts)}% to‘g‘ri javob`
              : 'Hali mashq yo‘q'
          }
          icon={<CalendarCheck className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bugungi vazifalar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Bugungi vazifalar</CardTitle>
            <Badge variant="secondary">{tasks.filter((t) => !t.done).length} ta</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <EmptyState
                title="Bugunga vazifa yo‘q"
                description="Mashqlar zonasiga o‘tib mustaqil mashq qilishingiz mumkin."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/student/practice">Mashqlar zonasi</Link>
                  </Button>
                }
              />
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    {task.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">{task.subtitle}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    +{task.xp} XP
                  </Badge>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Lingvistik profil */}
        <ChartCard
          title="Lingvistik profil"
          description={
            skillEntries.length
              ? 'Diagnostika va mashqlar asosida'
              : 'Diagnostikadan keyin shakllanadi'
          }
        >
          {radarData.length >= 3 ? (
            <SkillRadarChart data={radarData} />
          ) : (
            <EmptyState
              title="Profil hali yo‘q"
              description="8 bo‘limli diagnostika testidan o‘ting."
              action={
                <Button asChild size="sm">
                  <Link href="/student/assessment/diagnostic">Boshlash</Link>
                </Button>
              }
            />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ko'nikmalar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ko‘nikmalar bo‘yicha holat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Diagnostika testidan keyin bu yerda har bir ko‘nikma bo‘yicha darajangiz
                ko‘rsatiladi.
              </p>
            ) : (
              skillEntries.map(([skill, score]) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <SkillIcon skill={skill} className="size-4 text-muted-foreground" />
                      {SKILL_LABELS[skill].uz}
                    </span>
                    <span className="flex items-center gap-2">
                      <ProficiencyBadge label={scoreToLabel(score)} />
                      <span className="w-9 text-right font-medium tabular-nums">{score}%</span>
                    </span>
                  </div>
                  <Progress value={score} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI o'qituvchi / oxirgi feedback */}
        <div className="space-y-6">
          {flags.aiTutor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="size-4 text-primary" />
                  AI o‘qituvchi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Savolingiz bormi? Grammatikani tushuntirishni, so‘z o‘rgatishni yoki suhbat
                  mashqini so‘rang — 24/7 ochiq.
                </p>
                <Button asChild className="w-full">
                  <Link href="/student/ai-teacher">
                    Suhbatni boshlash
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Oxirgi feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentFeedback.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Speaking yoki writing topshirig‘ini bajarganingizdan keyin feedback shu yerda
                  ko‘rinadi.
                </p>
              ) : (
                data.recentFeedback.map((feedback) => (
                  <Link
                    key={`${feedback.kind}-${feedback.id}`}
                    href={
                      feedback.kind === 'speaking'
                        ? `/student/speaking-lab/${feedback.id}`
                        : `/student/writing-lab/${feedback.id}`
                    }
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 truncate">{feedback.title}</span>
                    {typeof feedback.score === 'number' && (
                      <Badge variant="outline">{Math.round(feedback.score)}</Badge>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
