import * as React from 'react'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface AiBadgeProps {
  /** Standart: «AI yaratgan» */
  label?: string
  className?: string
}

/**
 * AI yaratgan kontent / AI feedback belgisi.
 * Akademik halollik talabi: AI ishtiroki har doim ko‘rinib turishi kerak (PLAN 7.3).
 */
export function AiBadge({ label = 'AI yaratgan', className }: AiBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary',
        className
      )}
    >
      <Sparkles className="size-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  )
}
