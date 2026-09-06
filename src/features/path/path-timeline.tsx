import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Circle, Lock, PlayCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkillIcon } from '@/components/shared/skill-icon'
import { STAGE_META, SKILL_LABELS } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

import type { PathStageGroup, PathStepView } from './queries'

const STATUS_META: Record<
  PathStepView['status'],
  { uz: string; badge: 'default' | 'secondary' | 'outline' | 'success'; icon: React.ElementType }
> = {
  done: { uz: 'Bajarildi', badge: 'success', icon: Check },
  in_progress: { uz: 'Jarayonda', badge: 'default', icon: PlayCircle },
  available: { uz: 'Ochiq', badge: 'secondary', icon: Circle },
  locked: { uz: 'Yopiq', badge: 'outline', icon: Lock },
}

const KIND_LABELS: Record<PathStepView['kind'], string> = {
  lesson: 'Dars',
  practice: 'Mashq',
  speaking: 'Speaking',
  writing: 'Writing',
  test: 'Test',
  project: 'Loyiha',
  prompt_lab: 'Prompt Lab',
}

export interface PathTimelineProps {
  groups: PathStageGroup[]
}

/**
 * 8 bosqich bo'yicha guruhlangan vertikal timeline (PLAN 5).
 * Har qadam o'z SABABINI ko'rsatadi — "nima uchun aynan shu dars" savoli
 * talabaning o'quv avtonomiyasi uchun muhim (PLAN 6.7).
 */
export function PathTimeline({ groups }: PathTimelineProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const meta = STAGE_META[group.stage]
        return (
          <Card key={group.stage}>
            <CardHeader className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {group.stage}
                </span>
                <CardTitle className="text-base">{meta.uz}</CardTitle>
                <Badge variant="outline">{group.steps.length} qadam</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {meta.phase === 'organizational'
                  ? 'Tashkiliy bosqich'
                  : meta.phase === 'practical'
                    ? 'Amaliy bosqich'
                    : 'Refleksiv bosqich'}
              </p>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-3 border-l border-border pl-6">
                {group.steps.map((step) => (
                  <TimelineStep key={step.id} step={step} />
                ))}
              </ol>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function TimelineStep({ step }: { step: PathStepView }) {
  const status = STATUS_META[step.status]
  const StatusIcon = status.icon
  const locked = step.status === 'locked'

  const body = (
    <div
      className={cn(
        'rounded-lg border border-border p-4 transition-colors',
        !locked && 'hover:border-primary/50 hover:bg-muted/40',
        locked && 'opacity-70'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{KIND_LABELS[step.kind]}</Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <SkillIcon skill={step.skill} className="size-3.5" />
          {SKILL_LABELS[step.skill].uz}
        </span>
        <Badge variant={status.badge} className="ml-auto">
          {status.uz}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-medium">{step.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{step.reason}</p>
      {!locked ? (
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
          {step.status === 'done' ? 'Qayta ko‘rish' : 'Boshlash'}
          <ArrowRight className="size-3" />
        </span>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Oldingi qadamni yakunlaganingizdan keyin ochiladi.
        </p>
      )}
    </div>
  )

  return (
    <li className="relative">
      <span
        className={cn(
          'absolute -left-[31px] top-4 grid size-5 place-items-center rounded-full border-2 border-background',
          step.status === 'done'
            ? 'bg-emerald-500 text-white'
            : step.status === 'locked'
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground'
        )}
        aria-hidden="true"
      >
        <StatusIcon className="size-3" />
      </span>
      {locked ? body : <Link href={step.href}>{body}</Link>}
    </li>
  )
}
