import { Clock3, ListOrdered } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DOMAIN_LABELS, type Domain } from '@/config/constants'
import { formatMinutes, truncate } from '@/lib/utils/format'
import type { CaseStudyDoc } from '@/types'

import { estimateEffortMinutes } from './types'

/**
 * Mavjud keys-stadi kartasi (PLAN 8.10 — keys kutubxonasi).
 * Jamoani o'qituvchi shakllantiradi, shuning uchun bu yerda faqat ma'lumot ko'rsatiladi.
 */
export function CaseStudyCard({
  caseStudy,
  inProgress,
}: {
  caseStudy: CaseStudyDoc & { id: string }
  inProgress?: boolean
}) {
  const minutes = estimateEffortMinutes(caseStudy.tasks ?? [])

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-semibold">{caseStudy.title}</p>
          {inProgress ? (
            <Badge variant="success" className="shrink-0">
              Sizda faol
            </Badge>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {truncate(caseStudy.scenario.replace(/\s+/g, ' '), 220)}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {DOMAIN_LABELS[caseStudy.domain as Domain]?.uz ?? caseStudy.domain}
          </Badge>
          <Badge variant="outline">{caseStudy.cefr}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ListOrdered className="size-3.5" />
            {caseStudy.tasks?.length ?? 0} bosqich
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />~{formatMinutes(minutes)}
          </span>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-primary">
            Bosqichlar ro‘yxati
          </summary>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-muted-foreground">
            {(caseStudy.tasks ?? [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((task) => (
                <li key={task.id}>{task.title}</li>
              ))}
          </ol>
        </details>
      </CardContent>
    </Card>
  )
}
