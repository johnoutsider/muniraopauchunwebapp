import Link from 'next/link'
import type { Metadata } from 'next'
import { Award, CalendarDays, Flame, Trophy, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getAchievements } from '@/features/gamification/queries'
import { BadgeGrid } from '@/features/gamification/badge-grid'
import { StreakCalendar } from '@/features/gamification/streak-calendar'
import { LeaderboardOptIn } from '@/features/gamification/leaderboard-optin'

export const metadata: Metadata = { title: 'Yutuqlar' }
export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  if (!flags.gamification) {
    return (
      <div className="space-y-6">
        <PageHeader title="Yutuqlar" />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Trophy />}
              title="Gamifikatsiya o‘chirilgan"
              description="Sizning guruhingizda XP, nishon va reyting ko‘rsatilmaydi. Mashqlar va darslar odatdagidek ishlaydi."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/student/practice">Mashq maydoniga o‘tish</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = await getAchievements(user.uid, user.groupId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yutuqlar"
        description="XP, daraja, ketma-ketlik va nishonlar. Gamifikatsiya barcha guruhlarda bir xil ishlaydi."
        breadcrumbs={[{ label: 'Bosh sahifa', href: '/student/dashboard' }, { label: 'Yutuqlar' }]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami XP"
          value={data.totalXp}
          sublabel={`Keyingi darajagacha ${data.xpToNext} XP`}
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          label="Daraja"
          value={`${data.level.level}-daraja`}
          sublabel={`${Math.round(data.level.progress)}% bajarildi`}
          icon={<Award className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Ketma-ketlik"
          value={`${data.streak.current} kun`}
          sublabel={`Eng uzun: ${data.streak.longest} kun`}
          icon={<Flame className="size-4" />}
          tone={data.streak.current >= 3 ? 'success' : 'default'}
        />
        <StatCard
          label="Faol kunlar"
          value={`${data.activeDays} / 56`}
          sublabel="So‘nggi 8 hafta"
          icon={<CalendarDays className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Darajaga erishish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={data.level.progress} />
          <p className="text-xs text-muted-foreground">
            {data.totalXp} XP · {data.level.level}-darajadan {data.level.level + 1}-darajaga
            o‘tish uchun yana {data.xpToNext} XP kerak.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-muted-foreground" />
              Faollik kalendari — 8 hafta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakCalendar weeks={data.weeks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              Guruh reytingi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LeaderboardOptIn optIn={data.leaderboardOptIn} />

            {!data.leaderboardOptIn ? (
              <p className="text-sm text-muted-foreground">
                Reyting o‘chirilgan. Yoqsangiz, guruhdagi boshqa ishtirokchilar bilan XP bo‘yicha
                taqqoslash ochiladi.
              </p>
            ) : data.leaderboard.length === 0 ? (
              <EmptyState
                title="Reyting bo‘sh"
                description="Guruhingizda hali hech kim reytingga qo‘shilmagan yoki guruh biriktirilmagan."
              />
            ) : (
              <ol className="space-y-1.5">
                {data.leaderboard.map((row, index) => (
                  <li
                    key={`${row.label}-${index}`}
                    className={
                      row.isMe
                        ? 'flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-2.5 text-sm'
                        : 'flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm'
                    }
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {row.label}
                      {row.isMe ? ' (siz)' : ''}
                    </span>
                    <Badge variant="outline">{row.xp} XP</Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Nishonlar</h2>
          <Badge variant="secondary">
            {data.earnedCount} / {data.badges.length} olingan
          </Badge>
        </div>
        <BadgeGrid badges={data.badges} />
      </section>
    </div>
  )
}
