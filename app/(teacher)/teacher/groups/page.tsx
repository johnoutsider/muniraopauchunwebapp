import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, BotOff, FlaskConical, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireTeacher } from '@/features/teacher/guards'
import { listTeacherGroups } from '@/features/teacher/queries'

export const metadata: Metadata = { title: 'Guruhlarim' }
export const dynamic = 'force-dynamic'

export default async function TeacherGroupsPage() {
  const user = await requireTeacher()
  const groups = await listTeacherGroups(user)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guruhlarim"
        description="Faqat sizga biriktirilgan guruhlar ko‘rsatiladi. Nazorat guruhida AI imkoniyatlari o‘chirilgan — eksperiment dizayni shuni talab qiladi."
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Guruh topilmadi"
          description="Administrator sizni guruhga biriktirgach, u shu yerda paydo bo‘ladi."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const control = group.type === 'control'
            return (
              <Card key={group.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <Badge variant={control ? 'warning' : 'info'}>
                      {control ? <BotOff /> : <FlaskConical />}
                      {control ? 'Nazorat guruhi' : 'Eksperimental guruh'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {control
                      ? 'AI tutor, AI feedback va adaptivlik o‘chirilgan — faqat statik mashqlar va o‘qituvchi feedbacki.'
                      : 'AI tutor, AI feedback va adaptiv dvigatel yoqilgan.'}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-[11px] text-muted-foreground">Talaba</p>
                        <p className="text-lg font-semibold tabular-nums">
                          {group.studentCountActual}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-[11px] text-muted-foreground">7 kun faol</p>
                        <p className="text-lg font-semibold tabular-nums">{group.activeLast7}</p>
                      </div>
                      <div className="rounded-lg border border-border p-2">
                        <p className="text-[11px] text-muted-foreground">To‘g‘ri %</p>
                        <p className="text-lg font-semibold tabular-nums">{group.avgCorrectRate}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">O‘rtacha yo‘nalish progressi</span>
                        <span className="font-medium tabular-nums">{group.avgProgress}%</span>
                      </div>
                      <Progress value={group.avgProgress} />
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/teacher/groups/${group.id}`}>
                      Guruhni ochish
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
