import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, CheckCircle2, ClipboardList, PencilLine } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { listStudentSurveys } from '@/features/surveys/queries'
import { SURVEY_TYPE_HINTS, SURVEY_TYPE_LABELS } from '@/features/surveys/types'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'So‘rovnomalar' }
export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
  const user = await requireStudent()
  const surveys = await listStudentSurveys(user.uid)

  const pending = surveys.filter((card) => card.status !== 'submitted')
  const completed = surveys.filter((card) => card.status === 'submitted')

  return (
    <div className="space-y-6">
      <PageHeader
        title="So‘rovnomalar"
        description="So‘rovnomalar tadqiqotning bir qismi: motivatsiya, AI savodxonligi va platformadan qoniqishni o‘lchaydi. To‘g‘ri yoki noto‘g‘ri javob yo‘q — samimiy javob bering."
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          To‘ldirish kerak ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 />}
            title="Kutilayotgan so‘rovnoma yo‘q"
            description="Barcha so‘rovnomalarni to‘ldirgansiz. Yangisi ochilganda shu yerda paydo bo‘ladi."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((card) => (
              <Card key={card.survey.id} className="flex h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {card.survey.titleUz?.trim() || card.survey.title}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {SURVEY_TYPE_LABELS[card.survey.type]} · {card.questionCount} savol
                    </p>
                  </div>
                  {card.status === 'draft' ? (
                    <Badge variant="warning" className="shrink-0 gap-1">
                      <PencilLine />
                      Qoralama
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Boshlanmagan
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {card.survey.description?.trim() || SURVEY_TYPE_HINTS[card.survey.type]}
                    </p>
                    {card.status === 'draft' && card.questionCount ? (
                      <div className="space-y-1">
                        <Progress value={(card.answeredCount / card.questionCount) * 100} />
                        <p className="text-xs text-muted-foreground">
                          {card.answeredCount} / {card.questionCount} javob berilgan
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <Button asChild size="sm">
                      <Link href={`/student/surveys/${card.survey.id}`}>
                        {card.status === 'draft' ? 'Davom ettirish' : 'To‘ldirish'}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Topshirilgan ({completed.length})
        </h2>
        <Card>
          <CardContent className="p-4">
            {completed.length === 0 ? (
              <EmptyState
                icon={<ClipboardList />}
                title="Hali so‘rovnoma topshirmagansiz"
                description="To‘ldirilgan so‘rovnomalar sanasi bilan shu yerda saqlanadi."
              />
            ) : (
              <ul className="divide-y divide-border">
                {completed.map((card) => (
                  <li key={card.survey.id}>
                    <Link
                      href={`/student/surveys/${card.survey.id}`}
                      className="flex flex-wrap items-center gap-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {SURVEY_TYPE_LABELS[card.survey.type]}
                      </Badge>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {card.survey.titleUz?.trim() || card.survey.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.submittedAt ? formatDate(card.submittedAt) : '—'}
                      </span>
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
