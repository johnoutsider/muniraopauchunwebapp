import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  ArrowRight,
  ClipboardList,
  Clock,
  MessageSquareText,
  Route,
  TrendingUp,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ProficiencyBadge } from '@/components/shared/proficiency-badge'
import { SkillIcon } from '@/components/shared/skill-icon'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/charts/chart-card'
import { SkillRadarChart } from '@/components/charts/skill-radar-chart'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getTest } from '@/features/shared/queries'
import {
  getAttempt,
  getComparisonAttempt,
  getOpenReviews,
  loadTestItems,
} from '@/features/assessment/queries'
import { toRunnerItem } from '@/features/assessment/runner-content'
import { topErrorTags } from '@/features/assessment/scoring'
import { AiFeedbackReport } from '@/features/assessment/ai-feedback-report'
import { AttemptReview, type ReviewSection } from '@/features/assessment/attempt-review'
import {
  ERROR_TAG_LABELS,
  SKILLS,
  SKILL_LABELS,
  scoreToLabel,
  type Skill,
} from '@/config/constants'
import { formatDateTime } from '@/lib/utils/format'
import type { TestDoc } from '@/types'

export const metadata: Metadata = { title: 'Test natijalari' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<TestDoc['type'], string> = {
  diagnostic: 'Diagnostika',
  pre: 'Pre-test',
  progress: 'Progress test',
  post: 'Post-test',
  adaptive: 'Adaptiv test',
}

/**
 * 8-bosqich: baholash, feedback va refleksiya (PLAN 5, 8.11).
 *
 * EKSPERIMENT DIZAYNI: AI Feedback Report FAQAT `flags.aiFeedback === true`
 * bo'lganda render qilinadi. Nazorat guruhi aynan shu joyda deterministik ball
 * taqsimoti va o'qituvchi izohini ko'radi — AI chiqishi umuman yuklanmaydi.
 */
export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  const attempt = await getAttempt(attemptId)
  if (!attempt || attempt.uid !== user.uid) notFound()
  if (attempt.status === 'in_progress') redirect('/student/assessment')

  const [test, comparison, openReviews] = await Promise.all([
    getTest(attempt.testId),
    getComparisonAttempt(user.uid, attempt),
    getOpenReviews(attempt),
  ])

  const skillEntries = SKILLS.map((skill) => ({
    skill,
    entry: attempt.sectionScores?.[skill],
  })).filter((row): row is { skill: Skill; entry: { score: number; max: number; percent: number } } =>
    Boolean(row.entry)
  )

  const radarData = skillEntries.map(({ skill, entry }) => ({
    skill: SKILL_LABELS[skill].uz,
    score: Math.round(entry.percent),
    compare: comparison?.sectionScores?.[skill]?.percent
      ? Math.round(comparison.sectionScores[skill]!.percent)
      : undefined,
  }))

  const errorTags = topErrorTags(attempt.errorTagCounts)
  const pendingCount = attempt.pendingSections?.length ?? 0

  // Savollar tahlili — test topshirilgani uchun kalitni yuklash xavfsiz
  const items = test ? await loadTestItems(test) : []
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const answersById = new Map(
    (attempt.rawAnswers ?? []).map((row) => [row.itemId, row])
  )

  const reviewSections: ReviewSection[] = (test?.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    skill: section.skill,
    items: section.itemIds
      .map((itemId) => {
        const item = itemsById.get(itemId)
        if (!item) return null
        const row = answersById.get(itemId)
        return {
          item: toRunnerItem(item),
          answer: row?.answer ?? [],
          result: {
            isCorrect: row?.isCorrect,
            score: row?.score,
            answerKey: item.answerKey,
            explanation: item.explanation,
          },
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  }))

  const revealAnswers = attempt.type === 'diagnostic' || attempt.type === 'progress'
  const comparisonLabel = comparison ? TYPE_LABELS[comparison.type] : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title={attempt.testTitle ?? test?.title ?? 'Test natijalari'}
        description={`${TYPE_LABELS[attempt.type] ?? attempt.type} · ${formatDateTime(attempt.finishedAt)}`}
        breadcrumbs={[
          { label: 'Baholash markazi', href: '/student/assessment' },
          { label: 'Natijalar' },
        ]}
        actions={
          <Button asChild>
            <Link href="/student/path">
              <Route />
              Yo‘nalishimni ko‘rish
            </Link>
          </Button>
        }
      />

      {/* Umumiy ko'rsatkichlar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Umumiy natija"
          value={`${Math.round(attempt.percent ?? 0)}%`}
          sublabel={`${attempt.totalScore ?? 0} / ${attempt.totalMax ?? 0} ball`}
          icon={<ClipboardList className="size-4" />}
          tone={
            (attempt.percent ?? 0) >= 60
              ? 'success'
              : (attempt.percent ?? 0) >= 40
                ? 'warning'
                : 'danger'
          }
        />
        <StatCard
          label="O‘lchangan ko‘nikmalar"
          value={`${skillEntries.length} / ${test?.sections?.length ?? skillEntries.length}`}
          sublabel={pendingCount ? `${pendingCount} bo‘lim baholanmoqda` : 'Barchasi baholandi'}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          label="Umumiy daraja"
          value={
            skillEntries.length
              ? {
                  strong: 'Kuchli',
                  intermediate: 'O‘rta',
                  needs_improvement: 'Yaxshilash kerak',
                  weak: 'Zaif',
                }[scoreToLabel(attempt.percent ?? 0)]
              : '—'
          }
          sublabel="Individual lingvistik profil"
          icon={<SkillIcon skill="professional" className="size-4" />}
        />
        <StatCard
          label="Topshirilgan"
          value={formatDateTime(attempt.finishedAt).split(',')[0] ?? '—'}
          sublabel={comparison ? `${comparisonLabel} bilan taqqoslandi` : 'Taqqoslash uchun ma’lumot yo‘q'}
          icon={<Clock className="size-4" />}
        />
      </div>

      {pendingCount > 0 ? (
        <Alert variant="info">
          <Clock />
          <AlertTitle>Ba’zi bo‘limlar baholanmoqda</AlertTitle>
          <AlertDescription>
            Yozish, gapirish va talaffuz javoblaringiz o‘qituvchi navbatiga yuborildi. Ular
            baholanganidan keyin natijangiz va o‘quv yo‘lingiz yangilanadi.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ko'nikmalar bo'yicha ball */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ko‘nikmalar bo‘yicha natija</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillEntries.length === 0 ? (
              <EmptyState
                title="Avtomatik baholanadigan bo‘lim topilmadi"
                description="Bu testda faqat ochiq topshiriqlar bo‘lgan. Ular baholangach natija shu yerda ko‘rinadi."
              />
            ) : (
              skillEntries.map(({ skill, entry }) => {
                const before = comparison?.sectionScores?.[skill]?.percent
                const delta =
                  typeof before === 'number' ? Math.round(entry.percent - before) : null
                return (
                  <div key={skill} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <SkillIcon skill={skill} className="size-4 text-muted-foreground" />
                        {SKILL_LABELS[skill].uz}
                      </span>
                      <span className="flex items-center gap-2">
                        {delta !== null ? (
                          <Badge
                            variant={delta > 0 ? 'success' : delta < 0 ? 'danger' : 'secondary'}
                          >
                            {delta > 0 ? '+' : ''}
                            {delta}%
                          </Badge>
                        ) : null}
                        <ProficiencyBadge label={scoreToLabel(entry.percent)} />
                        <span className="w-10 text-right font-medium tabular-nums">
                          {Math.round(entry.percent)}%
                        </span>
                      </span>
                    </div>
                    <Progress value={entry.percent} />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Radar */}
        <ChartCard
          title="Lingvistik profil"
          description={
            comparison
              ? `Joriy natija va ${comparisonLabel} taqqoslandi`
              : 'Ko‘nikmalar bo‘yicha kesim'
          }
        >
          {radarData.length >= 3 ? (
            <SkillRadarChart
              data={radarData}
              scoreLabel={TYPE_LABELS[attempt.type] ?? 'Joriy natija'}
              compareLabel={comparisonLabel ?? 'Taqqoslash'}
            />
          ) : (
            <EmptyState
              title="Grafik uchun ma’lumot yetarli emas"
              description="Kamida uchta ko‘nikma bo‘yicha ball kerak."
            />
          )}
        </ChartCard>
      </div>

      {/* Pre vs post jadvali */}
      {comparison && skillEntries.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Taqqoslash: {comparisonLabel} → {TYPE_LABELS[attempt.type]}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-96 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Ko‘nikma</th>
                  <th className="pb-2 pr-4 font-medium">{comparisonLabel}</th>
                  <th className="pb-2 pr-4 font-medium">{TYPE_LABELS[attempt.type]}</th>
                  <th className="pb-2 font-medium">O‘zgarish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {skillEntries.map(({ skill, entry }) => {
                  const before = comparison.sectionScores?.[skill]?.percent
                  const delta = typeof before === 'number' ? Math.round(entry.percent - before) : null
                  return (
                    <tr key={skill}>
                      <td className="py-2 pr-4">{SKILL_LABELS[skill].uz}</td>
                      <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                        {typeof before === 'number' ? `${Math.round(before)}%` : '—'}
                      </td>
                      <td className="py-2 pr-4 font-medium tabular-nums">
                        {Math.round(entry.percent)}%
                      </td>
                      <td className="py-2 tabular-nums">
                        {delta === null ? (
                          '—'
                        ) : (
                          <span
                            className={
                              delta > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : delta < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-muted-foreground'
                            }
                          >
                            {delta > 0 ? '+' : ''}
                            {delta}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {/* Asosiy xatolar */}
      <Card>
        <CardHeader>
          <CardTitle>Eng ko‘p uchragan xatolar</CardTitle>
        </CardHeader>
        <CardContent>
          {errorTags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bu urinishda tizimli xato aniqlanmadi. Mashqlarni davom ettirsangiz, xato profilingiz
              aniqroq bo‘ladi.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {errorTags.map(({ tag, count }) => (
                <Badge key={tag} variant="warning" className="gap-1.5">
                  {ERROR_TAG_LABELS[tag]?.uz ?? tag}
                  <span className="tabular-nums opacity-70">{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Feedback Report yoki nazorat guruhi uchun izoh */}
      {flags.aiFeedback ? (
        <AiFeedbackReport attemptId={attempt.id} initialReport={attempt.aiFeedbackReport ?? null} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="size-4 text-muted-foreground" />
              Ball taqsimoti va o‘qituvchi izohi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {skillEntries.map(({ skill, entry }) => (
                <li
                  key={skill}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <SkillIcon skill={skill} className="size-4 text-muted-foreground" />
                    {SKILL_LABELS[skill].uz}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {entry.score} / {entry.max} ball · {Math.round(entry.percent)}%
                  </span>
                </li>
              ))}
            </ul>

            {attempt.teacherComment?.text ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="mb-1 font-medium">O‘qituvchi izohi</p>
                <p className="whitespace-pre-line text-muted-foreground">
                  {attempt.teacherComment.text}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                O‘qituvchi izohi hali yozilmagan. Yozish va gapirish topshiriqlaringiz baholangach,
                izoh shu yerda paydo bo‘ladi.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ochiq topshiriqlar bo'yicha baho */}
      {openReviews.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Ochiq topshiriqlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openReviews.map((review) => (
              <div
                key={review.sectionId}
                className="space-y-1 rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{review.title}</span>
                  {typeof review.score === 'number' ? (
                    <Badge variant="success">{Math.round(review.score)} ball</Badge>
                  ) : (
                    <Badge variant="secondary">Baholanmoqda</Badge>
                  )}
                </div>
                {review.teacherComment ? (
                  <p className="whitespace-pre-line text-muted-foreground">
                    {review.teacherComment}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <AttemptReview sections={reviewSections} revealAnswers={revealAnswers} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-medium">Keyingi qadam</p>
            <p className="text-sm text-muted-foreground">
              Natijangiz asosida o‘quv yo‘lingiz yangilandi — eng zaif ko‘nikmadan boshlab
              darslar, mashqlar va topshiriqlar tayyorlandi.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/student/path">
                Yo‘nalishimni ko‘rish
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/student/reflection">Refleksiya yozish</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
