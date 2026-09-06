import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getPromptLabData } from '@/features/prompt-lab/queries'
import { PromptLabClient } from '@/features/prompt-lab/components/prompt-lab-client'

export const metadata: Metadata = { title: 'Prompt Lab' }
export const dynamic = 'force-dynamic'

export default async function PromptLabPage() {
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  /* Nazorat guruhi: Prompt Lab AI bilan ishlash moduli — o'chirilgan (PLAN 1.5). */
  if (!flags.promptLab) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prompt Lab"
          description="Bu imkoniyat sizning guruhingiz uchun yoqilmagan."
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="size-4 text-muted-foreground" />
              Bu bo‘lim sizda faol emas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Siz qatnashayotgan o‘quv guruhida mashg‘ulotlar AI vositalarisiz olib boriladi.
              Darslar, mashqlar, Speaking Lab va Writing Lab sizga to‘liq ochiq.
            </p>
            <Button asChild variant="outline">
              <Link href="/student/learn">
                <BookOpen />
                Darslarga o‘tish
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = await getPromptLabData(user)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prompt Practice Lab"
        description="AI bilan qanday ishlash kerak: yaxshi prompt yozish, javobni tekshirish va akademik halollik."
        actions={<StageBadge stage={3} />}
      />
      <PromptLabClient data={data} corpusEnabled={flags.corpusVerification} />
    </div>
  )
}
