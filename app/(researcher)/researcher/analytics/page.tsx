import type { Metadata } from 'next'
import { BarChart3, FlaskConical, Info, Sigma, Users } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartCard } from '@/components/charts/chart-card'
import { GroupComparisonChart } from '@/components/charts/group-comparison-chart'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { ScoreBarChart } from '@/components/charts/score-bar-chart'
import { SkillRadarChart } from '@/components/charts/skill-radar-chart'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { getGroupComparison } from '@/lib/analytics/aggregate'
import { formatP } from '@/lib/analytics/stats'
import { requireUser } from '@/lib/firebase/session'

import { AnalyticsFilters } from '@/features/researcher/components/analytics-filters'
import { PrePostChart } from '@/features/researcher/components/pre-post-chart'
import {
  BetweenGroupsTable,
  CorrelationTable,
  PairedTestTable,
  SurveyTable,
} from '@/features/researcher/components/stats-tables'
import { getAnalytics } from '@/features/researcher/analytics'
import { listAllGroups, listCohorts } from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Analitika' }
export const dynamic = 'force-dynamic'

export default async function ResearcherAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cohort?: string
    group?: string
    from?: string
    to?: string
    excludeLow?: string
  }>
}) {
  await requireUser(['researcher', 'admin'])
  const params = await searchParams

  const filters = {
    cohortId: params.cohort,
    groupId: params.group,
    from: params.from,
    to: params.to,
    excludeLowActivity: params.excludeLow === '1',
  }

  const [{ source, result }, cohorts, groups] = await Promise.all([
    getAnalytics(filters),
    listCohorts(),
    listAllGroups(),
  ])

  // Filtrlarsiz yalpi kesim — umumiy kutubxonadan (nazorat uchun taqqoslama)
  let officialTotalP: string | null = null
  let officialPairs: { experimental: number; control: number } | null = null
  if (source.experiment?.id) {
    try {
      const comparison = await getGroupComparison(source.experiment.id)
      const total = comparison.skills.find((skill) => skill.skill === 'total')
      officialTotalP = total ? formatP(total.gainTest.p) : null
      officialPairs = comparison.completePairs
    } catch {
      officialTotalP = null
    }
  }

  const skillsWithoutTotal = result.skills.filter((skill) => skill.skill !== 'total')
  const totalRow = result.skills.find((skill) => skill.skill === 'total')

  const prePostData = result.skills.map((skill) => ({
    name: skill.label,
    expPre: Math.round(skill.experimental.pre.mean * 10) / 10,
    expPreErr: Math.round(skill.experimental.pre.se * 10) / 10,
    expPost: Math.round(skill.experimental.post.mean * 10) / 10,
    expPostErr: Math.round(skill.experimental.post.se * 10) / 10,
    ctrlPre: Math.round(skill.control.pre.mean * 10) / 10,
    ctrlPreErr: Math.round(skill.control.pre.se * 10) / 10,
    ctrlPost: Math.round(skill.control.post.mean * 10) / 10,
    ctrlPostErr: Math.round(skill.control.post.se * 10) / 10,
  }))

  const radarData = skillsWithoutTotal.map((skill) => ({
    skill: skill.label,
    score: Math.round(skill.experimental.post.mean),
    compare: Math.round(skill.control.post.mean),
  }))

  const gainBySkill = skillsWithoutTotal.map((skill) => ({
    name: skill.label,
    value: Math.round(skill.experimental.gain.mean * 10) / 10,
  }))

  const maxHistogram = Math.max(
    1,
    ...result.gainHistogram.map((bin) => Math.max(bin.experimental, bin.control))
  )
  const histogramData = result.gainHistogram.map((bin) => ({
    name: bin.bin,
    experimental: bin.experimental,
    control: bin.control,
  }))

  const errorChartData = result.errorTags.map((tag) => ({
    name: tag.label,
    experimental: tag.experimentalPer,
    control: tag.controlPer,
  }))
  const maxError = Math.max(1, ...errorChartData.map((row) => Math.max(row.experimental, row.control)))

  const hasData = result.n.total > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitika"
        description="Pre/post natijalar, o‘sish taqsimoti, statistik testlar, korrelyatsiyalar va o‘quv analitikasi."
      />

      <Alert variant="warning">
        <Info />
        <AlertTitle>Dastlabki tahlil</AlertTitle>
        <AlertDescription>
          Ushbu sahifadagi barcha statistik ko‘rsatkichlar — <strong>dastlabki</strong> (in-app)
          hisob-kitob. p-qiymatlar t-taqsimotning raqamli approksimatsiyasi bilan olingan.
          Dissertatsiyada keltiriladigan <strong>yakuniy tahlil SPSS’da</strong> bajariladi:
          «Eksport» sahifasidan SPSS paketini yuklab oling (codebook.md va import.sps bilan) va
          normallik, dispersiyalar tengligi, ANCOVA kabi tekshiruvlarni o‘sha yerda o‘tkazing.
        </AlertDescription>
      </Alert>

      <AnalyticsFilters
        cohorts={cohorts.map((cohort) => ({ id: cohort.id, name: cohort.name }))}
        groups={groups.map((group) => ({ id: group.id, name: group.name, type: group.type }))}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tahlildagi ishtirokchilar"
          value={result.n.total}
          sublabel={`${result.n.experimental} eksperimental / ${result.n.control} nazorat`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="To‘liq juftliklar"
          value={result.completePairs.experimental + result.completePairs.control}
          sublabel="pre va post ikkalasi ham bor"
          icon={<Sigma className="size-4" />}
        />
        <StatCard
          label="Umumiy o‘sish (eksp.)"
          value={totalRow ? `${totalRow.experimental.gain.mean.toFixed(1)}` : '—'}
          sublabel={
            totalRow ? `SD ${totalRow.experimental.gain.sd.toFixed(1)}` : 'ma’lumot yetarli emas'
          }
          icon={<BarChart3 className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Umumiy o‘sish (nazorat)"
          value={totalRow ? `${totalRow.control.gain.mean.toFixed(1)}` : '—'}
          sublabel={totalRow ? `SD ${totalRow.control.gain.sd.toFixed(1)}` : '—'}
          icon={<BarChart3 className="size-4" />}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<FlaskConical />}
          title="Tahlil uchun ma’lumot yo‘q"
          description="Ishtirokchilar guruhlarga taqsimlangach va pre-test topshirilgach, bu sahifa avtomatik to‘ladi."
        />
      ) : (
        <>
          {source.excludedLowActivity > 0 || source.excludedNoConsent > 0 ? (
            <Alert variant="info">
              <AlertDescription>
                Tahlildan chiqarildi: {source.excludedNoConsent} ta rozilik bermagan/chiqqan
                ishtirokchi
                {source.excludedLowActivity > 0
                  ? `, ${source.excludedLowActivity} ta kam faol ishtirokchi (filtr yoqilgan)`
                  : ''}
                .
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard
              title="Pre va post ballari (ko‘nikmalar bo‘yicha)"
              description="Ustunlar — o‘rtacha foiz; xato chiziqlari — o‘rtachaning standart xatosi (SE)."
              height={360}
              className="lg:col-span-2"
            >
              <PrePostChart data={prePostData} />
            </ChartCard>

            <ChartCard
              title="Post-test profili"
              description="Eksperimental va nazorat guruhlari ko‘nikmalar kesimida."
              height={360}
            >
              {radarData.length >= 3 ? (
                <SkillRadarChart
                  data={radarData}
                  scoreLabel="Eksperimental"
                  compareLabel="Nazorat"
                />
              ) : (
                <EmptyState title="Radar uchun kamida 3 ta ko‘nikma kerak" />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="O‘sish taqsimoti (gain = post − pre)"
              description="Har ustun — shu oraliqdagi ishtirokchilar soni."
              height={300}
            >
              {result.gainHistogram.length ? (
                <GroupComparisonChart data={histogramData} maxValue={maxHistogram} />
              ) : (
                <EmptyState title="Gain taqsimoti uchun ma’lumot yetarli emas" />
              )}
            </ChartCard>

            <ChartCard
              title="Ko‘nikmalar bo‘yicha o‘rtacha o‘sish (eksperimental)"
              description="Post − pre, foiz punktlarida."
              height={300}
            >
              {gainBySkill.length ? (
                <ScoreBarChart
                  data={gainBySkill}
                  horizontal
                  maxValue={Math.max(10, ...gainBySkill.map((row) => row.value))}
                />
              ) : (
                <EmptyState title="Ma’lumot yo‘q" />
              )}
            </ChartCard>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Guruh ichidagi o‘sish — bog‘liq namunalar t-testi</CardTitle>
              <CardDescription>
                Har guruhda pre → post o‘zgarish. n — pre va post ikkalasini ham topshirganlar soni.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PairedTestTable skills={result.skills} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guruhlararo taqqoslash — asosiy gipoteza sinovi</CardTitle>
              <CardDescription>
                O‘sish (gain) bo‘yicha Welch t-testi, Cohen’s d va noparametrik Mann–Whitney U
                tekshiruvi. Welch tanlangan, chunki guruh hajmlari va dispersiyalari teng emas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <BetweenGroupsTable skills={result.skills} />
              {officialTotalP ? (
                <Alert variant="info">
                  <AlertDescription className="text-xs">
                    Nazorat uchun: filtrlarsiz, butun eksperiment bo‘yicha umumiy ball o‘sishining
                    guruhlararo p-qiymati — {officialTotalP}
                    {officialPairs
                      ? ` (to‘liq juftliklar: ${officialPairs.experimental} eksperimental, ${officialPairs.control} nazorat).`
                      : '.'}
                  </AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <CorrelationTable rows={result.correlations} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Xatolar taksonomiyasi"
              description="Ishtirokchi boshiga o‘rtacha xatolar soni (eng ko‘p uchraydigan 12 ta teg)."
              height={340}
            >
              {errorChartData.length ? (
                <GroupComparisonChart data={errorChartData} maxValue={maxError} />
              ) : (
                <EmptyState title="Xato profillari hali yig‘ilmagan" />
              )}
            </ChartCard>

            <ChartCard
              title="To‘g‘ri javob ulushi dinamikasi"
              description="Kunlik guruh agregatlari (statsGroupDaily), foizda."
              height={340}
            >
              {result.timelineCorrectRate.length ? (
                <ProgressLineChart
                  data={result.timelineCorrectRate as unknown as Record<string, unknown>[]}
                  xKey="date"
                  series={[
                    { key: 'experimental', label: 'Eksperimental' },
                    { key: 'control', label: 'Nazorat' },
                  ]}
                />
              ) : (
                <EmptyState title="Kunlik agregatlar yo‘q" />
              )}
            </ChartCard>
          </div>

          <ChartCard
            title="Platformada sarflangan vaqt dinamikasi"
            description="Kunlik o‘rtacha daqiqalar, guruhlar bo‘yicha."
            height={300}
          >
            {result.timelineTime.length ? (
              <ProgressLineChart
                data={result.timelineTime as unknown as Record<string, unknown>[]}
                xKey="date"
                series={[
                  { key: 'experimental', label: 'Eksperimental' },
                  { key: 'control', label: 'Nazorat' },
                ]}
                domain={[
                  0,
                  Math.max(
                    30,
                    ...result.timelineTime.map((point) =>
                      Math.max(point.experimental ?? 0, point.control ?? 0)
                    )
                  ),
                ]}
              />
            ) : (
              <EmptyState title="Kunlik agregatlar yo‘q" />
            )}
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>So‘rovnomalar: motivatsiya va AI savodxonligi</CardTitle>
              <CardDescription>
                Javoblar eksperimentning oraliq kesim sanasiga qarab «pre» va «post» ga ajratiladi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SurveyTable rows={result.surveys} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
