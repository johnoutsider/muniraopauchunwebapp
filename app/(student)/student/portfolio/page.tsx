import Link from 'next/link'
import type { Metadata } from 'next'
import { FolderOpen, Pin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireStudent } from '@/lib/firebase/session'
import { getPortfolio, type PortfolioEntry, type PortfolioType } from '@/features/portfolio/queries'
import { PortfolioCard } from '@/features/portfolio/portfolio-card'
import { PrintButton } from '@/features/portfolio/print-button'

export const metadata: Metadata = { title: 'Portfolio' }
export const dynamic = 'force-dynamic'

const TABS: Array<{ value: PortfolioType | 'all'; label: string }> = [
  { value: 'all', label: 'Hammasi' },
  { value: 'writing', label: 'Yozma ishlar' },
  { value: 'speaking', label: 'Nutq' },
  { value: 'project', label: 'Loyihalar' },
  { value: 'achievement', label: 'Nishonlar' },
  { value: 'feedback', label: 'Feedback' },
]

export default async function PortfolioPage() {
  const user = await requireStudent()
  const data = await getPortfolio(user.uid)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mening portfoliom"
        description="Eng yaxshi ishlaringiz avtomatik yig‘iladi: yozma ishlar, nutq yozuvlari, loyihalar, nishonlar va o‘qituvchi fikrlari."
        breadcrumbs={[{ label: 'Bosh sahifa', href: '/student/dashboard' }, { label: 'Portfolio' }]}
        actions={<PrintButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami yozuvlar"
          value={data.entries.length}
          sublabel={`${data.pinned.length} ta pin qilingan`}
          icon={<FolderOpen className="size-4" />}
        />
        <StatCard
          label="Yozma ishlar"
          value={data.counts.writing}
          sublabel={`${data.counts.speaking} ta nutq yozuvi`}
        />
        <StatCard
          label="Loyihalar"
          value={data.counts.project}
          sublabel={`${data.counts.achievement} ta nishon`}
        />
        <StatCard
          label="Eng yuqori baho"
          value={data.bestScore !== null ? Math.round(data.bestScore) : '—'}
          sublabel="Baholangan ishlar bo‘yicha"
          tone={data.bestScore !== null && data.bestScore >= 80 ? 'success' : 'default'}
        />
      </div>

      {data.entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<FolderOpen />}
              title="Portfolio hali bo‘sh"
              description="Writing Lab yoki Speaking Lab topshirig‘ini yakunlaganingizdan so‘ng ishlaringiz shu yerda avtomatik to‘planadi."
              action={
                <>
                  <Button asChild size="sm">
                    <Link href="/student/writing-lab">Writing Lab</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/student/speaking-lab">Speaking Lab</Link>
                  </Button>
                </>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {data.pinned.length > 0 ? (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Pin className="size-4 text-primary" />
                Pin qilingan ishlar
                <Badge variant="secondary">{data.pinned.length}</Badge>
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.pinned.map((entry) => (
                  <PortfolioCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ) : (
            <p className="no-print rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              Hali hech narsa pin qilinmagan. Eng yaxshi ishlaringizni pin qilsangiz, ular
              portfolioning boshida va chop etilgan versiyada birinchi bo‘lib chiqadi.
            </p>
          )}

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="no-print">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => {
              const entries: PortfolioEntry[] =
                tab.value === 'all' ? data.entries : data.byType[tab.value]
              return (
                <TabsContent key={tab.value} value={tab.value}>
                  {entries.length === 0 ? (
                    <EmptyState
                      title="Bu bo‘limda yozuv yo‘q"
                      description="Tegishli topshiriqni bajarganingizdan keyin bu yerda paydo bo‘ladi."
                    />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {entries.map((entry) => (
                        <PortfolioCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </>
      )}
    </div>
  )
}
