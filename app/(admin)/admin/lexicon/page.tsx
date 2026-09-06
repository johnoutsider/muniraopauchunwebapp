import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2, Languages, Link2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DOMAINS, DOMAIN_LABELS, type CefrLevel, type Domain } from '@/config/constants'
import { requireUser } from '@/lib/firebase/session'
import { cn } from '@/lib/utils/cn'
import type { LexiconDoc } from '@/types'

import { LexiconFormDialog, LexiconTable } from '@/features/admin/components/lexicon-editor'
import { listAdminLexicon } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Lug‘at (lexicon)' }
export const dynamic = 'force-dynamic'

const ALL = 'all'

export default async function AdminLexiconPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; cefr?: string; status?: string }>
}) {
  await requireUser(['admin'])
  const params = await searchParams

  const words = await listAdminLexicon({
    domain: params.domain && params.domain !== ALL ? (params.domain as Domain) : undefined,
    cefr: params.cefr && params.cefr !== ALL ? (params.cefr as CefrLevel) : undefined,
    status:
      params.status && params.status !== ALL
        ? (params.status as LexiconDoc['status'])
        : undefined,
  })

  const approved = words.filter((word) => word.status === 'approved').length
  const collocations = words.reduce((sum, word) => sum + (word.collocations?.length ?? 0), 0)
  const verified = words.reduce(
    (sum, word) => sum + (word.collocations?.filter((item) => item.verified).length ?? 0),
    0
  )

  const activeDomain = params.domain ?? ALL

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kasbiy lug‘at (lexicon)"
        description="So‘z birligi, ta’riflar, kollokatsiyalar, semantik bog‘lanishlar va kasbiy kontekst."
        actions={
          <LexiconFormDialog
            trigger={
              <Button>
                <Plus />
                Yangi so‘z
              </Button>
            }
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="So‘zlar"
          value={words.length}
          sublabel="filtrlar bo‘yicha (maks. 500)"
          icon={<Languages className="size-4" />}
        />
        <StatCard
          label="Tasdiqlangan"
          value={approved}
          sublabel="talabalarga ko‘rinadi"
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Kollokatsiyalar"
          value={collocations}
          sublabel={`${verified} tasi korpusda tekshirilgan`}
          icon={<Link2 className="size-4" />}
        />
        <StatCard
          label="Semantik bog‘lanishlar"
          value={words.reduce((sum, word) => sum + (word.semanticLinks?.length ?? 0), 0)}
          sublabel="so‘zlararo aloqalar"
          icon={<Link2 className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soha bo‘yicha filtr</CardTitle>
          <CardDescription>Kasbiy soha bo‘yicha lug‘atni ajratib ko‘ring.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link
            href="/admin/lexicon"
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm transition-colors',
              activeDomain === ALL ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
            )}
          >
            Barchasi
          </Link>
          {DOMAINS.map((domain) => (
            <Link
              key={domain}
              href={`/admin/lexicon?domain=${domain}`}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                activeDomain === domain
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              {DOMAIN_LABELS[domain].uz}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lug‘at birliklari</CardTitle>
          <CardDescription>
            Har bir so‘z uchun kamida bitta ta’rif, ikkita kollokatsiya va kasbiy kontekst bo‘lishi
            tavsiya etiladi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LexiconTable rows={words} />
        </CardContent>
      </Card>
    </div>
  )
}
