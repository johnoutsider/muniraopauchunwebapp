import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardCheck, Gauge, ListChecks } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'
import { cn } from '@/lib/utils/cn'
import { toDate } from '@/lib/utils/format'

import { AssignForm } from '@/features/researcher/components/assign-form'
import {
  ItemAnalysisTable,
  TestCompletionTable,
} from '@/features/researcher/components/monitoring-tables'
import {
  getExperiment,
  getItemAnalysis,
  getTestById,
  getTestCompletion,
  listAllGroups,
  listAllTests,
} from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Testlar' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  diagnostic: 'Diagnostika',
  pre: 'Pre-test',
  progress: 'Oraliq',
  post: 'Post-test',
  adaptive: 'Adaptiv',
}

export default async function ResearcherTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>
}) {
  await requireUser(['researcher', 'admin'])
  const params = await searchParams

  const [tests, groups, experiment] = await Promise.all([
    listAllTests(),
    listAllGroups(),
    getExperiment(),
  ])

  const selectedId = params.test ?? experiment?.preTestId ?? tests[0]?.id ?? null
  const selected = selectedId ? await getTestById(selectedId) : null

  const [completion, itemAnalysis] = selected
    ? await Promise.all([getTestCompletion(selected.id), getItemAnalysis(selected.id)])
    : [null, null]

  const roleOf = (id: string) => {
    if (experiment?.preTestId === id) return 'Pre-test'
    if (experiment?.postTestId === id) return 'Post-test'
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testlar"
        description="Testlarni guruhlarga biriktirish, tugallanishni kuzatish va topshiriqlar statistikasini ko‘rish."
      />

      {tests.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck />}
          title="Test topilmadi"
          description="Admin bo‘limidagi kontent boshqaruvida test yarating, so‘ng bu yerda biriktiring."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Testlar ro‘yxati</CardTitle>
              <CardDescription>Monitoring uchun testni tanlang.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tests.map((test) => (
                <Link
                  key={test.id}
                  href={`/researcher/tests?test=${test.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    test.id === selectedId
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <span className="font-medium">{test.title}</span>
                  <Badge variant="outline">{TYPE_LABELS[test.type] ?? test.type}</Badge>
                  {roleOf(test.id) ? <Badge variant="info">{roleOf(test.id)}</Badge> : null}
                  {!test.published ? <Badge variant="warning">nashr etilmagan</Badge> : null}
                </Link>
              ))}
            </CardContent>
          </Card>

          {selected && completion && itemAnalysis ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Topshirganlar"
                  value={`${completion.submitted} / ${completion.total}`}
                  sublabel={
                    completion.total
                      ? `${Math.round((completion.submitted / completion.total) * 100)}% tugallangan`
                      : 'Biriktirilgan talaba yo‘q'
                  }
                  icon={<ClipboardCheck className="size-4" />}
                />
                <StatCard
                  label="Topshiriqlar"
                  value={itemAnalysis.rows.length}
                  sublabel={`${selected.sections?.length ?? 0} ta bo‘lim`}
                  icon={<ListChecks className="size-4" />}
                />
                <StatCard
                  label="Baholangan urinishlar"
                  value={itemAnalysis.attempts}
                  sublabel="statistika shulardan hisoblanadi"
                  icon={<Gauge className="size-4" />}
                />
                <StatCard
                  label="KR-20 ishonchlilik"
                  value={itemAnalysis.kr20 === null ? '—' : itemAnalysis.kr20.toFixed(2)}
                  sublabel="≥ 0.70 maqbul"
                  icon={<Gauge className="size-4" />}
                  tone={
                    itemAnalysis.kr20 === null
                      ? 'default'
                      : itemAnalysis.kr20 >= 0.7
                        ? 'success'
                        : 'warning'
                  }
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tugallanish darajasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress
                    value={
                      completion.total
                        ? Math.round((completion.submitted / completion.total) * 100)
                        : 0
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {completion.submitted} ta ishtirokchi topshirdi, {completion.total} tadan.
                  </p>
                </CardContent>
              </Card>

              <AssignForm
                kind="test"
                targetId={selected.id}
                groups={groups.map((group) => ({
                  id: group.id,
                  name: group.name,
                  type: group.type,
                }))}
                initialGroupIds={selected.assignedTo?.groupIds ?? []}
                initialFrom={toDate(selected.assignedTo?.from)?.toISOString()}
                initialTo={toDate(selected.assignedTo?.to)?.toISOString()}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Ishtirokchilar kesimida</CardTitle>
                  <CardDescription>
                    Talabalar faqat anonim kod bilan ko‘rsatiladi (anonimlik qoidasi).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestCompletionTable rows={completion.rows} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Topshiriqlar statistikasi</CardTitle>
                  <CardDescription>
                    p — qiyinlik indeksi (to‘g‘ri javob ulushi), D — diskriminatsiya (yuqori 27% −
                    quyi 27%), r(pb) — nuqtali-biserial korrelyatsiya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ItemAnalysisTable rows={itemAnalysis.rows} />
                  <Alert variant="info">
                    <AlertDescription className="text-xs">
                      Talqin: p &lt; 0.20 — juda qiyin, p &gt; 0.90 — juda oson, D &lt; 0.20 — zaif
                      ajratuvchi topshiriq. Bunday topshiriqlarni yakuniy testdan chiqarish yoki
                      qayta ishlash tavsiya etiladi. Statistika kamida 30 ta urinishdan keyin
                      barqaror bo‘ladi.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
