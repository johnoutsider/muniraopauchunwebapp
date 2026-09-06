import * as React from 'react'
import {
  AudioLines,
  BookA,
  BookOpen,
  Braces,
  Briefcase,
  Circle,
  Headphones,
  Mic,
  PenLine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SKILL_LABELS, type Skill } from '@/config/constants'
import { cn } from '@/lib/utils/cn'

/** SKILL_LABELS[skill].icon (matn) → lucide komponenti */
const ICON_MAP: Record<string, LucideIcon> = {
  BookA,
  Braces,
  AudioLines,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Briefcase,
}

export function skillIcon(skill: Skill): LucideIcon {
  return ICON_MAP[SKILL_LABELS[skill].icon] ?? Circle
}

export interface SkillIconProps {
  skill: Skill
  className?: string
}

export function SkillIcon({ skill, className }: SkillIconProps) {
  const Icon = skillIcon(skill)
  return (
    <Icon
      className={cn('size-4 shrink-0', className)}
      aria-label={SKILL_LABELS[skill].uz}
      role="img"
    />
  )
}
