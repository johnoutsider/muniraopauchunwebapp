import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Bot, Dumbbell } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getAiTeacherData } from '@/features/ai-teacher/queries'
import { AiTeacherClient } from '@/features/ai-teacher/components/ai-teacher-client'

export const metadata: Metadata = { title: 'AI o‘qituvchi' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ context?: string; topic?: string }>
}

export default async function AiTeacherPage({ searchParams }: PageProps) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const params = await searchParams

  /* Nazorat guruhi: AI o'qituvchi yo'q — lekin ekran bo'sh qolmaydi (PLAN 1.5). */
  if (!flags.aiTutor) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI o‘qituvchi"
          description="Bu imkoniyat sizning guruhingiz uchun yoqilmagan."
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-muted-foreground" />
              Bu bo‘lim sizda faol emas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Siz qatnashayotgan o‘quv guruhida mashg‘ulotlar AI yordamchisisiz olib boriladi.
              Savollaringiz bo‘lsa, o‘qituvchingizga murojaat qiling yoki darslar va mashqlar
              bo‘limidan foydalaning — ular sizga to‘liq ochiq.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/student/learn">
                  <BookOpen />
                  Darslar
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/student/practice">
                  <Dumbbell />
                  Mashq maydoni
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = await getAiTeacherData(user)

  const context = params.context?.slice(0, 400)
  const topic = params.topic?.slice(0, 120)

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI o‘qituvchi"
        description="24/7 ochiq: grammatika, lug‘at, talaffuz va kasbiy muloqot bo‘yicha savol bering yoki rol o‘yinida mashq qiling."
        actions={<StageBadge stage={6} />}
      />
      <AiTeacherClient
        data={data}
        lessonContext={context}
        topic={topic}
        rolePlayEnabled={flags.aiRolePlay}
      />
    </div>
  )
}
