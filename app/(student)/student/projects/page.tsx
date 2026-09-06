import type { Metadata } from 'next'
import { BookOpen, FolderKanban } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { listMyProjects, listPublishedCaseStudies } from '@/features/projects/queries'
import { ProjectCard } from '@/features/projects/project-card'
import { CaseStudyCard } from '@/features/projects/case-study-card'

export const metadata: Metadata = { title: 'Guruh loyihalari' }
export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const user = await requireStudent()

  const [projects, caseStudies] = await Promise.all([
    listMyProjects(user.uid),
    listPublishedCaseStudies(),
  ])

  const caseById = new Map(caseStudies.map((item) => [item.id, item]))
  const active = projects.filter((project) => project.status === 'active')
  const finished = projects.filter((project) => project.status !== 'active')
  const activeCaseIds = new Set(active.map((project) => project.caseStudyId))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guruh loyihalari"
        description="7-bosqich: integrativ-kasbiy faoliyat — jamoada keys yechish, hisobot va taqdimot."
        actions={<StageBadge stage={7} />}
      />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Faol loyihalar</h2>
          <Badge variant="secondary">{active.length}</Badge>
        </div>
        {active.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={<FolderKanban />}
                title="Faol loyiha yo‘q"
                description="Jamoalarni o‘qituvchi shakllantiradi. Loyiha ochilgach, u shu yerda paydo bo‘ladi — quyidagi keyslar bilan oldindan tanishib qo‘ying."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                totalTasks={caseById.get(project.caseStudyId)?.tasks?.length}
                caseTitle={caseById.get(project.caseStudyId)?.title}
              />
            ))}
          </div>
        )}
      </section>

      {finished.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Tugallangan loyihalar</h2>
            <Badge variant="secondary">{finished.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {finished.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                totalTasks={caseById.get(project.caseStudyId)?.tasks?.length}
                caseTitle={caseById.get(project.caseStudyId)?.title}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Mavjud keys-stadilar</h2>
          <Badge variant="secondary">{caseStudies.length}</Badge>
        </div>
        {caseStudies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={<BookOpen />}
                title="Keys-stadi yo‘q"
                description="Kontent tayyor bo‘lgach, keyslar shu yerda ko‘rinadi."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {caseStudies.map((caseStudy) => (
              <CaseStudyCard
                key={caseStudy.id}
                caseStudy={caseStudy}
                inProgress={activeCaseIds.has(caseStudy.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
