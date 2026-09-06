import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, CheckCircle2, CircleDashed, Lock, PlayCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreBadge } from '@/components/shared/score-badge'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

import type { AssessmentTestCard, TestAvailability } from './types'

/**
 * Assessment Center kartochkasi: test nima uchun kerakligi + holati
 * (boshlanmagan / davom etmoqda / tugallangan) + mos amal tugmasi.
 */

export function availabilityMessage(availability: TestAvailability): string | null {
  switch (availability.state) {
    case 'not_assigned':
      return 'Bu test hali sizning guruhingizga tayinlanmagan. Tadqiqotchi tayinlaganda shu yerda paydo bo‘ladi.'
    case 'not_open':
      return `Test ${formatDate(availability.from)} dan boshlab ochiladi.`
    case 'closed':
      return `Test muddati ${formatDate(availability.to)} da yakunlangan, endi topshirib bo‘lmaydi.`
    default:
      return null
  }
}

export interface TestStatusCardProps {
  card: AssessmentTestCard
  /** Testni boshlash/davom ettirish manzili */
  href: string
  /** Bir-ikki gapda: bu test nima uchun kerak */
  description: string
  icon?: React.ReactNode
  resultsBase?: string
  className?: string
}

export function TestStatusCard({
  card,
  href,
  description,
  icon,
  resultsBase = '/student/assessment/results',
  className,
}: TestStatusCardProps) {
  const blocked = card.availability.state !== 'available'
  const message = availabilityMessage(card.availability)
  const { lastAttempt, inProgressAttemptId } = card

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="truncate">{card.test.title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {card.test.sectionCount} bo‘lim · {card.test.itemCount} topshiriq
            </p>
          </div>
        </div>
        <StatusBadge card={card} />
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>
          {message ? (
            <p className="flex items-start gap-1.5 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {message}
            </p>
          ) : null}
          {lastAttempt ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ScoreBadge score={lastAttempt.percent} max={100} />
              <span>topshirilgan: {formatDate(lastAttempt.finishedAt)}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!blocked ? (
            <Button asChild size="sm" variant={lastAttempt ? 'outline' : 'default'}>
              <Link href={href}>
                <PlayCircle />
                {inProgressAttemptId
                  ? 'Davom ettirish'
                  : lastAttempt
                    ? 'Qayta topshirish'
                    : 'Boshlash'}
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <Lock />
              Yopiq
            </Button>
          )}

          {lastAttempt ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={`${resultsBase}/${lastAttempt.id}`}>
                Natijani ko‘rish
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ card }: { card: AssessmentTestCard }) {
  if (card.inProgressAttemptId) {
    return (
      <Badge variant="warning" className="shrink-0 gap-1">
        <CircleDashed />
        Boshlangan
      </Badge>
    )
  }
  if (card.lastAttempt) {
    return (
      <Badge variant="success" className="shrink-0 gap-1">
        <CheckCircle2 />
        Tugallangan
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="shrink-0">
      Boshlanmagan
    </Badge>
  )
}
