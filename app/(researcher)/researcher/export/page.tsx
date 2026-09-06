import Link from 'next/link'
import type { Metadata } from 'next'
import { AlertTriangle, ShieldCheck } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { requireUser } from '@/lib/firebase/session'
import { formatDateTime } from '@/lib/utils/format'

import { ExportForm } from '@/features/researcher/components/export-form'
import { getExperiment, listExportHistory } from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Eksport' }
export const dynamic = 'force-dynamic'

export default async function ResearcherExportPage() {
  await requireUser(['researcher', 'admin'])

  const [history, experiment] = await Promise.all([listExportHistory(), getExperiment()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ilmiy ma’lumot eksporti"
        description="SPSS uchun tayyor paket, Excel workbook yoki CSV fayllar. Kodlar kitobi va import sintaksisi avtomatik yaratiladi."
      />

      {!experiment ? (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Eksperiment sozlanmagan</AlertTitle>
          <AlertDescription>
            Eksport eksperiment guruhlariga bog‘langan.{' '}
            <Link
              href="/researcher/experiment"
              className="font-medium underline underline-offset-4"
            >
              Eksperimentni sozlang
            </Link>{' '}
            — pre/post testlar va guruhlarni belgilagach eksport ishlaydi.
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert variant="success">
        <ShieldCheck />
        <AlertTitle>Anonimlik kafolati</AlertTitle>
        <AlertDescription>
          Eksport fayllarida <strong>uid, ism, email va foto bo‘lmaydi</strong> — faqat
          <code className="mx-1 font-mono">participantCode</code>. Rozilik bermagan va tadqiqotdan
          chiqqan ishtirokchilarning ma’lumotlari umuman yozilmaydi. Kod ↔ talaba xaritasi faqat
          «Ishtirokchilar» sahifasida saqlanadi va hech qachon eksport qilinmaydi (PLAN 9.3, 9.4).
        </AlertDescription>
      </Alert>

      <ExportForm />

      <Card>
        <CardHeader>
          <CardTitle>Eksport tarixi</CardTitle>
          <CardDescription>
            Audit jurnalidan: kim, qachon va qaysi datasetlarni yuklab oldi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState
              title="Hali eksport qilinmagan"
              description="Birinchi eksportdan keyin bu yerda tarix ko‘rinadi."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Kim</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Datasetlar</TableHead>
                    <TableHead className="text-right">Qatorlar</TableHead>
                    <TableHead className="text-right">Fayllar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {row.at ? formatDateTime(row.at) : '—'}
                      </TableCell>
                      <TableCell className="text-sm">{row.actorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.format}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.datasets.join(', ') || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.rows}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.files}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
