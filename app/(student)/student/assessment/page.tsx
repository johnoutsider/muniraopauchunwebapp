import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  History,
  NotebookPen,
  Route,
  Target,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ScoreBadge } from '@/components/shared/score-badge'
import { requireStudent } from '@/lib/firebase/session'
import { getAssessmentOverview } from '@/features/assessment/queries'
import { TestStatusCard } from '@/features/assessment/test-card'
import { listStudentSurveys } from '@/features/surveys/queries'
import { formatDate } from '@/lib/utils/format'
import type { TestDoc } from '@/types'

export const metadata: Metadata = { title: 'Baholash markazi' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<TestDoc['type'], string> = {
  diagnostic: 'Diagnostika',
  pre: 'Pre-test',
  progress: 'Progress test',
  post: 'Post-test',
  adaptive: 'Adaptiv test',
}

export default async function AssessmentPage() {
  const user = await requireStudent()
  const [data, surveys] = await Promise.all([
    getAssessmentOverview(user.uid, user.groupId),
    listStudentSurveys(user.uid),
  ])

  const assigned = [...data.preTests, ...data.postTests]
  const pendingSurveys = surveys.filter((card) => card.status !== 'submitted').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Baholash markazi"
        description="Bu yerda bilim darajangiz o‘lchanadi: diagnostika individual o‘quv yo‘lingizni tuzadi, progress testlar o‘sishni ko‘rsatadi, pre/post testlar esa tadqiqot doirasida o‘tkaziladi."
        actions={
          data.hasProfile ? (
            <Button asChild variant="outline">
              <Link href="/student/path">
                <Route />
                Yo‘nalishim
              </Link>
            </Button>
          ) : null
        }
      />

      {/* 1. Diagnostika */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Diagnostika (2-bosqich)
        </h2>
        {data.diagnostic ? (
          <TestStatusCard
            card={data.diagnostic}
            href="/student/assessment/diagnostic"
            icon={<Target />}
            description="8 bo‘limli kirish testi: lug‘at, grammatika, tinglash, o‘qish, yozish, gapirish, talaffuz va kasbiy ingliz tili. Natijasi asosida sizga Individual lingvistik profil va shaxsiy o‘quv yo‘li tuziladi."
          />
        ) : (
          <EmptyState
            icon={<Target />}
            title="Diagnostika testi hali tayyor emas"
            description="O‘qituvchi yoki tadqiqotchi diagnostika testini nashr qilgach, shu yerda paydo bo‘ladi."
          />
        )}
      </section>

      {/* 2. Progress testlar */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Progress testlar
        </h2>
        {data.progressTests.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.progressTests.map((card) => (
              <TestStatusCard
                key={card.test.id}
                card={card}
                href={`/student/assessment/progress?test=${card.test.id}`}
                icon={<ClipboardCheck />}
                description="Har 3–4 haftada o‘zlashtirishni o‘lchaydi. Natija o‘quv yo‘lingizni qayta sozlaydi: qaysi mavzuga qaytish kerakligini ko‘rsatadi."
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardCheck />}
            title="Hozircha progress test yo‘q"
            description="Modullarni tugatganingizdan keyin o‘qituvchi progress test tayinlaydi."
          />
        )}
      </section>

      {/* 3. Pre / Post test */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tadqiqot testlari (pre / post)
        </h2>
        {assigned.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {assigned.map((card) => (
              <TestStatusCard
                key={card.test.id}
                card={card}
                href={`/student/assessment/post-test?test=${card.test.id}`}
                icon={<FlaskConical />}
                description={
                  card.test.type === 'pre'
                    ? 'Tadqiqot boshlanishidagi o‘lchov. Natijasi post-test bilan taqqoslanadi — shuning uchun mustaqil ishlang.'
                    : 'Tadqiqot yakunidagi o‘lchov. Pre-test bilan taqqoslanib, o‘sishingiz hisoblanadi.'
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlaskConical />}
            title="Sizga pre/post test tayinlanmagan"
            description="Tadqiqotchi guruhingizga test tayinlaganda va muddat ochilganda bu yerda ko‘rinadi."
          />
        )}
      </section>

      {/* 4. So'rovnoma va refleksiya */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              So‘rovnomalar
            </CardTitle>
            {pendingSurveys > 0 ? (
              <Badge variant="warning" className="shrink-0">
                {pendingSurveys} ta kutilmoqda
              </Badge>
            ) : (
              <Badge variant="success" className="shrink-0">
                Barchasi to‘ldirilgan
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Motivatsiya, AI savodxonligi va qoniqish so‘rovnomalari — tadqiqotning bir qismi.
              To‘g‘ri yoki noto‘g‘ri javob yo‘q.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/student/surveys">
                So‘rovnomalarga o‘tish
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="size-4 text-primary" />
              Refleksiya kundaligi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Test yoki darsdan keyin uchta savolga javob yozing: nimani yaxshi bajardim, qaysi
              xatolarni takrorladim, keyingi safar nimani yaxshilayman.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/student/reflection">
                Kundalikni ochish
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 5. Natijalar tarixi */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Natijalar tarixi
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-muted-foreground" />
              Topshirilgan testlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.history.length === 0 ? (
              <EmptyState
                icon={<History />}
                title="Hali test topshirmagansiz"
                description="Diagnostikadan boshlang — u 30–40 daqiqa oladi va baholanmaydi."
                action={
                  <Button asChild size="sm">
                    <Link href="/student/assessment/diagnostic">Diagnostikani boshlash</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.history.map((attempt) => (
                  <li key={attempt.id}>
                    <Link
                      href={`/student/assessment/results/${attempt.id}`}
                      className="flex flex-wrap items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {TYPE_LABELS[attempt.type] ?? attempt.type}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {attempt.testTitle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(attempt.finishedAt || attempt.startedAt)}
                      </span>
                      <ScoreBadge score={attempt.percent} max={100} />
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
