import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, CheckCircle2, Clock, GraduationCap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { SkillIcon } from '@/components/shared/skill-icon'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { DOMAIN_LABELS, SKILL_LABELS, type Domain, type Skill, type Stage } from '@/config/constants'
import { formatMinutes, percent } from '@/lib/utils/format'
import { getLearnCatalogue, type ModuleRow } from '@/features/learn/queries'
import { CatalogueFilters } from '@/features/learn/catalogue-filters'

export const metadata: Metadata = { title: 'Darslar' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ skill?: string; domain?: string }>
}

export default async function LearnPage({ searchParams }: PageProps) {
  const user = await requireStudent()
  const params = await searchParams
  const catalogue = await getLearnCatalogue(user.uid)

  const skillFilter = params.skill as Skill | undefined
  const domainFilter = params.domain as Domain | undefined

  const courses = catalogue.courses
    .map((course) => ({
      ...course,
      modules: course.modules.filter(
        (module) =>
          (!skillFilter || module.skill === skillFilter) &&
          (!domainFilter || module.domain === domainFilter)
      ),
    }))
    .filter((course) => course.modules.length > 0)

  const overallProgress = percent(catalogue.totals.done, catalogue.totals.lessons)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Darslar"
        description="Kurs → modul → dars. Har modul ma’lum bir ko‘nikma va kasbiy sohaga qaratilgan (4-bosqich: o‘rgatuvchi)."
        breadcrumbs={[{ label: 'Bosh sahifa', href: '/student/dashboard' }, { label: 'Darslar' }]}
        actions={
          <Button asChild variant="outline">
            <Link href="/student/path">
              <GraduationCap />
              Mening yo‘nalishim
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Umumiy jarayon"
          value={`${overallProgress}%`}
          sublabel={`${catalogue.totals.done} / ${catalogue.totals.lessons} dars`}
          icon={<CheckCircle2 className="size-4" />}
          tone={overallProgress >= 60 ? 'success' : 'default'}
        />
        <StatCard
          label="Modullar"
          value={catalogue.courses.reduce((sum, course) => sum + course.modules.length, 0)}
          sublabel={`${catalogue.courses.length} ta kurs`}
          icon={<BookOpen className="size-4" />}
        />
        <StatCard
          label="Taxminiy vaqt"
          value={formatMinutes(catalogue.totals.minutes)}
          sublabel="Barcha modullar bo‘yicha"
          icon={<Clock className="size-4" />}
        />
      </div>

      <Suspense fallback={<Skeleton className="h-9 w-96 max-w-full" />}>
        <CatalogueFilters
          skills={catalogue.skills}
          domains={catalogue.domains}
          skill={params.skill}
          domain={params.domain}
        />
      </Suspense>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<BookOpen />}
              title={
                catalogue.courses.length === 0
                  ? 'Darslar hali qo‘shilmagan'
                  : 'Filtrga mos modul topilmadi'
              }
              description={
                catalogue.courses.length === 0
                  ? 'Nashr qilingan kurslar paydo bo‘lgach, ular shu yerda ko‘rinadi.'
                  : 'Boshqa ko‘nikma yoki sohani tanlab ko‘ring.'
              }
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/learn">Filtrni tozalash</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        courses.map((course) => (
          <section key={course.id} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{course.title}</h2>
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <p className="text-xs text-muted-foreground">
                {course.doneCount} / {course.lessonCount} dars bajarilgan
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {course.modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function ModuleCard({ module }: { module: ModuleRow }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={module.stage as Stage} />
          <Badge variant="outline" className="gap-1">
            <SkillIcon skill={module.skill} className="size-3" />
            {SKILL_LABELS[module.skill].uz}
          </Badge>
          <Badge variant="secondary">{DOMAIN_LABELS[module.domain].uz}</Badge>
        </div>
        <CardTitle className="text-base">{module.title}</CardTitle>
        {module.description ? (
          <p className="text-sm text-muted-foreground">{module.description}</p>
        ) : null}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {module.doneCount} / {module.lessons.length} dars
            </span>
            <span>{formatMinutes(module.estimatedMin)}</span>
          </div>
          <Progress value={module.progress} aria-label={`${module.title} jarayoni`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {module.lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu modulda hali dars yo‘q.</p>
        ) : (
          module.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/student/learn/${lesson.id}`}
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <span
                className={
                  lesson.done
                    ? 'grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600'
                    : 'grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'
                }
              >
                {lesson.done ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <BookOpen className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{lesson.title}</span>
                {lesson.summary ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {lesson.summary}
                  </span>
                ) : null}
              </span>
              <Badge variant="outline" className="shrink-0">
                {lesson.estimatedMin} daq
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
