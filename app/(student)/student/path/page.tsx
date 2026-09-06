import Link from 'next/link'
import type { Metadata } from 'next'
import { Briefcase, Clock, Route, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireStudent } from '@/lib/firebase/session'
import { DOMAIN_LABELS, type Domain } from '@/config/constants'
import { formatDate, percent } from '@/lib/utils/format'
import { getPathOverview } from '@/features/path/queries'
import { LinguisticProfileSection } from '@/features/path/linguistic-profile'
import { PathTimeline } from '@/features/path/path-timeline'
import { RegeneratePathButton } from '@/features/path/regenerate-path-button'

export const metadata: Metadata = { title: 'Mening o‘quv yo‘lim' }
export const dynamic = 'force-dynamic'

export default async function StudentPathPage() {
  const user = await requireStudent()
  const data = await getPathOverview(user.uid)

  const progress = percent(data.counts.done, data.counts.total)
  const trackLabel = data.track ? DOMAIN_LABELS[data.track as Domain]?.uz : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mening o‘quv yo‘lim"
        description="Diagnostika natijangiz, maqsadingiz va kasbiy yo‘nalishingiz asosida tuzilgan individual traektoriya."
        breadcrumbs={[{ label: 'Bosh sahifa', href: '/student/dashboard' }, { label: 'O‘quv yo‘lim' }]}
        actions={data.path ? <RegeneratePathButton /> : null}
      />

      {!data.path ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Route />}
              title="Yo‘nalish hali tuzilmagan"
              description="Individual o‘quv yo‘lini tuzish uchun avval 8 bo‘limli diagnostika testidan o‘ting. Natijaga qarab tizim sizga kerakli darslar va mashqlarni sabablari bilan tayinlaydi."
              action={
                <>
                  <Button asChild>
                    <Link href="/student/assessment/diagnostic">
                      <Target />
                      Diagnostikadan o‘tish
                    </Link>
                  </Button>
                  <RegeneratePathButton label="Baribir tuzib ko‘rish" variant="ghost" />
                </>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Maqsad va yo'nalish */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Yo‘nalish jarayoni"
              value={`${progress}%`}
              sublabel={`${data.counts.done} / ${data.counts.total} qadam bajarildi`}
              icon={<Route className="size-4" />}
              tone={progress >= 60 ? 'success' : 'default'}
            />
            <StatCard
              label="Ochiq qadamlar"
              value={data.counts.available}
              sublabel={`${data.counts.locked} ta hali yopiq`}
              icon={<Target className="size-4" />}
            />
            <StatCard
              label="Kasbiy yo‘nalish"
              value={trackLabel ?? 'Belgilanmagan'}
              sublabel="Onboardingda tanlangan"
              icon={<Briefcase className="size-4" />}
            />
            <StatCard
              label="Haftalik reja"
              value={data.weeklyMinutes ? `${data.weeklyMinutes} daq` : '—'}
              sublabel={
                data.path.generatedAt
                  ? `Yangilangan: ${formatDate(data.path.generatedAt)}`
                  : 'Yangilanish sanasi yo‘q'
              }
              icon={<Clock className="size-4" />}
            />
          </div>

          {data.goal ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Maqsadim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">{data.goal}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">v{data.path.version}</Badge>
                  <Badge variant="outline">
                    {data.path.generatedBy === 'ai' ? 'AI tuzgan' : 'Qoidalar asosida'}
                  </Badge>
                  {data.path.note ? (
                    <span className="text-xs text-muted-foreground">{data.path.note}</span>
                  ) : null}
                </div>
                <Progress value={progress} aria-label="Yo‘nalish jarayoni" />
              </CardContent>
            </Card>
          ) : null}

          {/* Lingvistik profil */}
          <LinguisticProfileSection profile={data.profile} />

          {/* Qadamlar */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Qadamlar — 8 bosqich bo‘yicha</h2>
              <p className="text-xs text-muted-foreground">
                Har qadam yonida u nima uchun tayinlangani ko‘rsatilgan.
              </p>
            </div>

            {data.groups.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    title="Qadamlar ro‘yxati bo‘sh"
                    description="Yo‘nalish hujjati mavjud, lekin qadamlar topilmadi. Yo‘nalishni qayta tuzib ko‘ring."
                    action={<RegeneratePathButton />}
                  />
                </CardContent>
              </Card>
            ) : (
              <PathTimeline groups={data.groups} />
            )}
          </section>
        </>
      )}
    </div>
  )
}
