import * as React from 'react'
import {
  Award,
  AudioLines,
  BookA,
  BookOpen,
  BrainCircuit,
  Briefcase,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  FileText,
  Flame,
  Footprints,
  GraduationCap,
  Library,
  Lightbulb,
  ListChecks,
  Lock,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { BadgeDoc } from '@/types'

import type { BadgeView } from './queries'

const ICONS: Record<string, LucideIcon> = {
  AudioLines,
  BookA,
  BookOpen,
  BrainCircuit,
  Briefcase,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  FileText,
  Flame,
  Footprints,
  GraduationCap,
  Library,
  Lightbulb,
  ListChecks,
  Mic,
  PenLine,
  Sparkles,
  Target,
  Trophy,
}

const CRITERIA_TEXT: Record<BadgeDoc['criteria']['kind'], (value: number) => string> = {
  streak_days: (value) => `${value} kun ketma-ket mashq qilish`,
  items_correct: (value) => `${value} ta mashqni to‘g‘ri bajarish`,
  words_learned: (value) => `${value} ta so‘zni o‘zlashtirish`,
  lessons_done: (value) => `${value} ta darsni yakunlash`,
  speaking_score: (value) => `Talaffuz bahosi ${value} ballga yetishi`,
  writing_submitted: (value) => `${value} ta yozma ish topshirish`,
  project_done: (value) => `${value} ta guruh loyihasini yakunlash`,
  diagnostic_done: (value) => `${value} ta diagnostika testidan o‘tish`,
  reflections: (value) => `${value} ta refleksiya yozish`,
}

export interface BadgeGridProps {
  badges: BadgeView[]
}

/** Olingan va hali ochilmagan nishonlar — mezoni bilan (PLAN 8.12). */
export function BadgeGrid({ badges }: BadgeGridProps) {
  if (!badges.length) {
    return (
      <EmptyState
        icon={<Award />}
        title="Nishonlar ro‘yxati bo‘sh"
        description="Nishonlar katalogi hali to‘ldirilmagan."
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon] ?? Award
        return (
          <div
            key={badge.id}
            className={cn(
              'space-y-2 rounded-xl border p-4',
              badge.earned ? 'border-primary/40 bg-primary/5' : 'border-border'
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-lg',
                  badge.earned
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {badge.earned ? <Icon className="size-5" /> : <Lock className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{badge.nameUz}</p>
                <p className="text-xs text-muted-foreground">{badge.name}</p>
              </div>
              <Badge variant={badge.earned ? 'success' : 'outline'} className="shrink-0">
                +{badge.xp} XP
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Mezon: {CRITERIA_TEXT[badge.criteria.kind]?.(badge.criteria.value) ?? '—'}
            </p>

            {badge.earned ? (
              <p className="text-xs text-emerald-600">
                Olingan{badge.earnedAt ? `: ${formatDate(badge.earnedAt)}` : ''}
              </p>
            ) : (
              <div className="space-y-1">
                <Progress value={badge.progress} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">{badge.progressText}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
