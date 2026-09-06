import type { Metadata } from 'next'
import { BookOpen, Languages, ShieldCheck, Sparkles } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { requireTeacher } from '@/features/teacher/guards'
import { getContentQueue } from '@/features/teacher/queries'
import { ItemApprovalList } from '@/features/teacher/components/item-approval-list'
import {
  LessonApprovalList,
  LexiconApprovalList,
} from '@/features/teacher/components/draft-content-lists'

export const metadata: Metadata = { title: 'Kontent tasdig‘i' }
export const dynamic = 'force-dynamic'

export default async function TeacherContentPage() {
  await requireTeacher()
  const data = await getContentQueue()

  const aiItems = data.items.filter((item) => item.source === 'ai').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kontent tasdig‘i"
        description="Human-in-the-loop: AI yaratgan har bir mashq, dars va lug‘at yozuvi o‘qituvchi tasdig‘idan keyingina talabalarga yetadi."
      />

      <Alert variant="info">
        <Sparkles />
        <AlertTitle>Nima uchun bu muhim</AlertTitle>
        <AlertDescription>
          Tasdiqlangan mashq item bankka tushadi va qayta ishlatiladi — bu AI xarajatini kamaytiradi
          va kontent sifatini bir xil ushlab turadi. Rad etilgan kontent talabalarga ko‘rinmaydi.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Qoralama mashqlar"
          value={data.items.length}
          sublabel={`${aiItems} tasi AI yaratgan`}
          icon={<ShieldCheck className="size-4" />}
          tone={data.items.length ? 'warning' : 'success'}
        />
        <StatCard
          label="Qoralama darslar"
          value={data.lessons.length}
          icon={<BookOpen className="size-4" />}
          tone={data.lessons.length ? 'warning' : 'success'}
        />
        <StatCard
          label="Qoralama lug‘at"
          value={data.lexicon.length}
          icon={<Languages className="size-4" />}
          tone={data.lexicon.length ? 'warning' : 'success'}
        />
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">
            Mashqlar
            {data.items.length ? <Badge variant="secondary">{data.items.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="lessons">
            Darslar
            {data.lessons.length ? <Badge variant="secondary">{data.lessons.length}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="lexicon">
            Lug‘at
            {data.lexicon.length ? <Badge variant="secondary">{data.lexicon.length}</Badge> : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ItemApprovalList items={data.items} />
        </TabsContent>

        <TabsContent value="lessons">
          <LessonApprovalList lessons={data.lessons} />
        </TabsContent>

        <TabsContent value="lexicon">
          <LexiconApprovalList words={data.lexicon} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
