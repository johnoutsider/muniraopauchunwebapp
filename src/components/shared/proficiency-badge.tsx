import * as React from 'react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { PROFICIENCY_LABEL_TEXT, type ProficiencyLabel } from '@/config/constants'

const VARIANT: Record<ProficiencyLabel, NonNullable<BadgeProps['variant']>> = {
  weak: 'danger',
  needs_improvement: 'warning',
  intermediate: 'info',
  strong: 'success',
}

export interface ProficiencyBadgeProps {
  label: ProficiencyLabel
  className?: string
}

/** Individual Linguistic Profile yorlig‘i (PLAN 5, 2-bosqich) */
export function ProficiencyBadge({ label, className }: ProficiencyBadgeProps) {
  return (
    <Badge variant={VARIANT[label]} className={className}>
      {PROFICIENCY_LABEL_TEXT[label].uz}
    </Badge>
  )
}
