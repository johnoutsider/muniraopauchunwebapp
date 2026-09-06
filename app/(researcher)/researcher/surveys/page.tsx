import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardList, MessageSquareText, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils/cn'
import { toDate } from '@/lib/utils/format'
import type { TimeValue } from '@/types'

import { AssignForm } from '@/features/researcher/components/assign-form'
import { SurveyCompletionTable } from '@/features/researcher/components/monitoring-tables'
import {
  getSurveyById,
  getSurveyCompletion,
  listAllGroups,
  listAllSurveys,
} from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'So‘rovnomalar' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  motivation: 'Motivatsiya',
  ai_literacy: 'AI savodxonligi',
  satisfaction: 'Qoniqish',
  pre: 'Boshlang‘ich',
  post: 'Yakuniy',
  custom: 'Boshqa',
}

/** So'rovnomaga biriktirish maydonlari `SurveyDoc` tipida yo'q — kengaytma. */
type SurveyAssignment = {
  assignedTo?: { groupIds?: string[]; from?: TimeValue; to?: TimeValue }
}

export default async function ResearcherSurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ survey?: string }>
}) {
  await requireUser(['researcher', 'admin'])
  const params = await searchParams

  const [surveys, groups] = await Promise.all([listAllSurveys(), listAllGroups()])
  const selectedId = params.survey ?? surveys[0]?.id ?? null
  const selected = selectedId ? await getSurveyById(selectedId) : null
  const completion = selected ? await getSurveyCompletion(selected.id) : null
  const assignment = selected ? (selected as unknown as SurveyAssignment).assignedTo : undefined

  const likertQuestions =
    selected?.questions?.filter((question) => question.type.startsWith('likert')).length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="So‘rovnomalar"
        description="Motivatsiya, AI savodxonligi va qoniqish so‘rovnomalarini guruhlarga biriktirish va to‘ldirilishini kuzatish."
      />

      {surveys.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="So‘rovnoma yaratilmagan"
          description="Eksperimentga so‘rovnoma biriktirish uchun avval uni yarating."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>So‘rovnomalar</CardTitle>
              <CardDescription>Monitoring uchun so‘rovnomani tanlang.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {surveys.map((survey) => (
                <Link
                  key={survey.id}
                  href={`/researcher/surveys?survey=${survey.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    survey.id === selectedId
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="font-medium">{survey.titleUz ?? survey.title}</span>
                  <Badge variant="outline">{TYPE_LABELS[survey.type] ?? survey.type}</Badge>
                  {survey.active ? (
                    <Badge variant="success">faol</Badge>
                  ) : (
                    <Badge variant="secondary">yopiq</Badge>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>

          {selected && completion ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="To‘ldirganlar"
                  value={`${completion.answered} / ${completion.total}`}
                  sublabel={
                    completion.total
                      ? `${Math.round((completion.answered / completion.total) * 100)}%`
                      : '—'
                  }
                  icon={<Users className="size-4" />}
                />
                <StatCard
                  label="Savollar"
                  value={selected.questions?.length ?? 0}
                  sublabel={`${likertQuestions} ta Likert savoli`}
                  icon={<MessageSquareText className="size-4" />}
                />
                <StatCard
                  label="Turi"
                  value={TYPE_LABELS[selected.type] ?? selected.type}
                  sublabel="tahlilda shu bo‘yicha guruhlanadi"
                  icon={<ClipboardList className="size-4" />}
                />
                <StatCard
                  label="Holati"
                  value={selected.active ? 'Faol' : 'Yopiq'}
                  sublabel={selected.active ? 'talabalar to‘ldira oladi' : 'javob qabul qilinmaydi'}
                  icon={<ClipboardList className="size-4" />}
                  tone={selected.active ? 'success' : 'default'}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>To‘ldirilish darajasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={
                      completion.total
                        ? Math.round((completion.answered / completion.total) * 100)
                        : 0
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    So‘rovnoma javoblari eksperimentning oraliq kesim sanasiga qarab «pre» va «post»
                    ga ajratiladi.
                  </p>
                </CardContent>
              </Card>

              <AssignForm
                kind="survey"
                targetId={selected.id}
                groups={groups.map((group) => ({
                  id: group.id,
                  name: group.name,
                  type: group.type,
                }))}
                initialGroupIds={assignment?.groupIds ?? []}
                initialFrom={toDate(assignment?.from)?.toISOString()}
                initialTo={toDate(assignment?.to)?.toISOString()}
                initialActive={selected.active}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Savollar</CardTitle>
                  <CardDescription>
                    Teskari (reverse) belgilangan savollar tahlilda qayta kodlanadi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selected.questions?.length ? (
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Savol</TableHead>
                            <TableHead>Tur</TableHead>
                            <TableHead>Teskari</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.questions.map((question) => (
                            <TableRow key={question.id}>
                              <TableCell className="font-mono text-xs">{question.id}</TableCell>
                              <TableCell className="max-w-md text-sm">
                                {question.textUz ?? question.text}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{question.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {question.reverse ? <Badge variant="warning">ha</Badge> : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState title="Savollar yo‘q" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ishtirokchilar kesimida</CardTitle>
                  <CardDescription>Faqat anonim kodlar ko‘rsatiladi.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SurveyCompletionTable rows={completion.rows} />
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
