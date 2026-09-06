import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { SKILL_LABELS, DOMAIN_LABELS } from '@/config/constants'
import { getLessonView } from '@/features/learn/queries'
import { LessonBlocks } from '@/features/learn/lesson-blocks'
import { LessonPlayer } from '@/features/learn/lesson-player'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ lessonId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params
  const user = await requireStudent()
  const view = await getLessonView(user.uid, lessonId)
  return { title: view?.lesson.title ?? 'Dars' }
}

export default async function LessonPage({ params }: PageProps) {
  const { lessonId } = await params
  const user = await requireStudent()
  const [view, flags] = await Promise.all([getLessonView(user.uid, lessonId), resolveFlags(user)])

  if (!view || !view.lesson.published) notFound()

  const { lesson, module, course } = view

  return (
    <div className="space-y-6">
      <PageHeader
        title={lesson.title}
        description={lesson.summary}
        breadcrumbs={[
          { label: 'Darslar', href: '/student/learn' },
          ...(course ? [{ label: course.title, href: '/student/learn' }] : []),
          ...(module
            ? [{ label: module.title, href: `/student/learn?skill=${module.skill}` }]
            : []),
          { label: lesson.title },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{lesson.cefr}</Badge>
            {module ? (
              <>
                <Badge variant="secondary">{SKILL_LABELS[module.skill].uz}</Badge>
                <Badge variant="outline">{DOMAIN_LABELS[module.domain].uz}</Badge>
              </>
            ) : null}
            <Badge variant="outline">
              {view.positionInModule.index} / {view.positionInModule.total}
            </Badge>
          </div>
        }
      />

      <LessonPlayer
        lessonId={lesson.id}
        title={lesson.title}
        estimatedMin={lesson.estimatedMin ?? 10}
        done={view.done}
        prev={view.prev}
        next={view.next}
        pathStepTitle={view.pathStep?.title ?? null}
      >
        <LessonBlocks
          blocks={lesson.blocks ?? []}
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          words={view.words}
          exercises={view.exercises}
          flags={flags}
        />
      </LessonPlayer>
    </div>
  )
}
