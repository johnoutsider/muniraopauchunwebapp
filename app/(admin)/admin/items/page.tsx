import type { Metadata } from 'next'
import { Bot, CheckCircle2, Database, FileEdit } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import type { CefrLevel, Domain, Skill } from '@/config/constants'
import { requireUser } from '@/lib/firebase/session'
import type { ItemDoc } from '@/types'

import { ItemFilters, ItemsTable } from '@/features/admin/components/item-browser'
import { listAdminItems } from '@/features/admin/queries'

export const metadata: Metadata = { title: 'Mashq banki' }
export const dynamic = 'force-dynamic'

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    skill?: string
    status?: string
    source?: string
    difficulty?: string
    domain?: string
    cefr?: string
    topic?: string
  }>
}) {
  await requireUser(['admin'])
  const params = await searchParams

  const items = await listAdminItems({
    skill: params.skill as Skill | undefined,
    status: params.status as ItemDoc['status'] | undefined,
    source: params.source as ItemDoc['source'] | undefined,
    difficulty: params.difficulty ? Number(params.difficulty) : undefined,
    domain: params.domain as Domain | undefined,
    cefr: params.cefr as CefrLevel | undefined,
    topic: params.topic,
  })

  const approved = items.filter((item) => item.status === 'approved').length
  const drafts = items.filter((item) => item.status === 'draft').length
  const aiGenerated = items.filter((item) => item.source === 'ai').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mashq banki"
        description="Mashqlarni filtrlash, tahrirlash va tasdiqlash. AI yaratgan mashqlar tasdiqlanmaguncha talabalarga chiqmaydi."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ko‘rsatilayotgan mashqlar"
          value={items.length}
          sublabel="filtrlar bo‘yicha (maks. 500)"
          icon={<Database className="size-4" />}
        />
        <StatCard
          label="Tasdiqlangan"
          value={approved}
          sublabel="talabalarga ko‘rinadi"
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Qoralama"
          value={drafts}
          sublabel="tasdiq kutmoqda"
          icon={<FileEdit className="size-4" />}
          tone={drafts ? 'warning' : 'default'}
        />
        <StatCard
          label="AI yaratgan"
          value={aiGenerated}
          sublabel="metodik tekshiruv talab qiladi"
          icon={<Bot className="size-4" />}
        />
      </div>

      <ItemFilters />

      <Card>
        <CardHeader>
          <CardTitle>Mashqlar</CardTitle>
          <CardDescription>
            Statistika ustuni — to‘g‘ri javob ulushi va urinishlar soni. 30% dan past yoki 95% dan
            yuqori ko‘rsatkich mashqni qayta ko‘rib chiqish uchun signal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemsTable rows={items} />
        </CardContent>
      </Card>
    </div>
  )
}
