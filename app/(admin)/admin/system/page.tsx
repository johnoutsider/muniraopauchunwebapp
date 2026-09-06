import type { Metadata } from 'next'
import { AlertTriangle, CheckCircle2, Coins, Database, MessageSquare, Server } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { ChartCard } from '@/components/charts/chart-card'
import { ProgressLineChart } from '@/components/charts/progress-line-chart'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'
import { formatDateTime } from '@/lib/utils/format'

import { AI_COST_PER_MILLION_USD, getSystemStatus } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Tizim holati' }
export const dynamic = 'force-dynamic'

export default async function AdminSystemPage() {
  await requireUser(['admin'])
  const status = await getSystemStatus()

  const chartData = status.ai.days.map((day) => ({
    date: day.date.slice(5),
    tokens: Math.round(day.tokens / 1000),
    messages: day.messages,
  }))

  const maxTokens = Math.max(1, ...chartData.map((day) => day.tokens))
  const seededOk = status.seeding.filter((row) => row.ok).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tizim holati"
        description="AI sarfi va taxminiy xarajat, Firestore hujjatlari soni, kontent seed holati va qayd etilgan xatoliklar."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="AI xabarlari (30 kun)"
          value={status.ai.totalMessages.toLocaleString('uz-UZ')}
          sublabel={`${status.ai.activeUsers} ta faol foydalanuvchi`}
          icon={<MessageSquare className="size-4" />}
        />
        <StatCard
          label="Tokenlar (30 kun)"
          value={`${Math.round(status.ai.totalTokens / 1000).toLocaleString('uz-UZ')}K`}
          sublabel="kirish + chiqish"
          icon={<Server className="size-4" />}
        />
        <StatCard
          label="Taxminiy xarajat"
          value={`$${status.ai.estimatedCostUsd.toFixed(2)}`}
          sublabel={`~$${AI_COST_PER_MILLION_USD}/1M token (aralash tarif)`}
          icon={<Coins className="size-4" />}
          tone={status.ai.estimatedCostUsd > 300 ? 'warning' : 'default'}
        />
        <StatCard
          label="Seed holati"
          value={`${seededOk} / ${status.seeding.length}`}
          sublabel="kontent kolleksiyalari to‘ldirilgan"
          icon={<Database className="size-4" />}
          tone={seededOk === status.seeding.length ? 'success' : 'warning'}
        />
      </div>

      {status.settings?.maintenanceMode ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>
            Texnik xizmat rejimi yoqilgan — talabalar platformadan foydalana olmaydi.
          </AlertDescription>
        </Alert>
      ) : null}

      <ChartCard
        title="AI sarfi dinamikasi (oxirgi 30 kun)"
        description="Kunlik tokenlar (mingda) va xabarlar soni."
        height={300}
      >
        {chartData.length ? (
          <ProgressLineChart
            data={chartData}
            xKey="date"
            series={[
              { key: 'tokens', label: 'Tokenlar (K)' },
              { key: 'messages', label: 'Xabarlar' },
            ]}
            domain={[0, Math.max(maxTokens, ...chartData.map((day) => day.messages))]}
          />
        ) : (
          <EmptyState
            title="AI sarfi qayd etilmagan"
            description="statsDaily kolleksiyasida oxirgi 30 kunga ma’lumot yo‘q."
          />
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kontent seed holati</CardTitle>
            <CardDescription>
              Kutilgan minimal hajm — PLAN 14-bo‘limdagi kontent tayyorlash rejasidan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.seeding.map((row) => (
              <div key={row.collection} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {row.ok ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    )}
                    {row.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.count} / {row.expected}
                  </span>
                </div>
                <Progress value={Math.min(100, (row.count / row.expected) * 100)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firestore hujjatlari</CardTitle>
            <CardDescription>
              Har kolleksiyadagi hujjatlar soni (aggregation query orqali).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kolleksiya</TableHead>
                    <TableHead className="text-right">Hujjatlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.counts.map((row) => (
                    <TableRow key={row.collection}>
                      <TableCell className="font-mono text-xs">{row.collection}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.count < 0 ? (
                          <Badge variant="danger">o‘qib bo‘lmadi</Badge>
                        ) : (
                          row.count.toLocaleString('uz-UZ')
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oxirgi xatoliklar</CardTitle>
          <CardDescription>
            `systemErrors` kolleksiyasidan (agar server xatoliklarni yozib borsa).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.errors.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="Qayd etilgan xatolik yo‘q"
              description="Xatoliklar `systemErrors` kolleksiyasiga yozilsa shu yerda ko‘rinadi."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Kontekst</TableHead>
                    <TableHead>Xabar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {status.errors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {error.ts ? formatDateTime(error.ts) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{error.context}</TableCell>
                      <TableCell className="max-w-lg truncate text-sm">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Joriy sozlamalar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            Asosiy model:{' '}
            <code className="font-mono text-xs">{status.settings?.models?.main ?? '—'}</code>
          </p>
          <p>
            Tez model:{' '}
            <code className="font-mono text-xs">{status.settings?.models?.fast ?? '—'}</code>
          </p>
          <p>Kunlik xabar limiti: {status.settings?.limits?.messagesPerDay ?? '—'}</p>
          <p>Kunlik token limiti: {status.settings?.limits?.tokensPerDay ?? '—'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
