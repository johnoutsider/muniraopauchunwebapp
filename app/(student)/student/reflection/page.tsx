import type { Metadata } from 'next'
import { NotebookPen } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { AiBadge } from '@/components/shared/ai-badge'
import { StageBadge } from '@/components/shared/stage-badge'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { listReflections } from '@/features/student/queries'
import { ReflectionForm } from '@/features/reflection/reflection-form'
import { MOOD_LABELS, REFLECTION_QUESTIONS } from '@/features/reflection/constants'
import { formatDateTime } from '@/lib/utils/format'
import { STAGES, type Stage } from '@/config/constants'

export const metadata: Metadata = { title: 'Refleksiya kundaligi' }
export const dynamic = 'force-dynamic'

/**
 * Refleksiya kundaligi — metodikaning 1 va 8-bosqichlari (PLAN 5, 8.14).
 * `?stage=1` bilan maqsad qo'yish bosqichidagi refleksiya yoziladi.
 */
export default async function ReflectionPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; context?: string }>
}) {
  const { stage: stageParam, context } = await searchParams
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  const parsed = Number(stageParam)
  const stage: Stage = (STAGES as readonly number[]).includes(parsed) ? (parsed as Stage) : 8

  const entries = await listReflections(user.uid, 30)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refleksiya kundaligi"
        description="Har dars yoki hafta oxirida uchta savolga javob yozing. Refleksiya — o‘quv jarayonining majburiy bosqichi: u xatolarni anglash va keyingi qadamni aniq belgilash uchun kerak."
        actions={<StageBadge stage={stage} />}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ReflectionForm canUseAi={flags.aiFeedback} stage={stage} contextId={context} />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Yozuvlar tarixi</CardTitle>
              <p className="text-sm text-muted-foreground">
                {entries.length ? `${entries.length} ta yozuv` : 'Hali yozuv yo‘q'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.length === 0 ? (
                <EmptyState
                  icon={<NotebookPen />}
                  title="Kundalik bo‘sh"
                  description="Birinchi yozuvingizni chapdagi shakl orqali qo‘shing. Yozuvlar sana bo‘yicha shu yerda saqlanadi."
                />
              ) : (
                <ol className="space-y-3">
                  {entries.map((entry) => {
                    const mood = MOOD_LABELS[entry.mood]
                    return (
                      <li
                        key={entry.id}
                        className="space-y-2 rounded-lg border border-border p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(entry.ts)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline">{entry.stage}-bosqich</Badge>
                            {mood ? (
                              <span title={mood.uz} aria-label={mood.uz}>
                                {mood.emoji}
                              </span>
                            ) : null}
                          </span>
                        </div>

                        <dl className="space-y-1.5">
                          {REFLECTION_QUESTIONS.map((question) => {
                            const answer = entry.answers?.[question.key]
                            if (!answer) return null
                            return (
                              <div key={question.key}>
                                <dt className="text-xs font-medium text-muted-foreground">
                                  {question.uz}
                                </dt>
                                <dd className="whitespace-pre-line">{answer}</dd>
                              </div>
                            )
                          })}
                        </dl>

                        {entry.aiComment && flags.aiFeedback ? (
                          <div className="space-y-1 rounded-md bg-muted/50 p-2.5">
                            <AiBadge label="AI izohi" />
                            <p className="whitespace-pre-line text-xs text-muted-foreground">
                              {entry.aiComment}
                            </p>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
