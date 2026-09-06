'use client'

import * as React from 'react'
import { ArrowRight, Lightbulb, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'
import { ERROR_TAG_LABELS, type ErrorTag } from '@/config/constants'
import type { WritingError } from '@/types'

export interface AnnotatedTextProps {
  text: string
  errors: WritingError[]
  /** Tanlangan xato (ro'yxatdan bosilganda) */
  activeIndex?: number | null
  onSelect?: (index: number | null) => void
}

interface Segment {
  text: string
  errorIndex: number | null
}

/** Matnni xato `span`lari bo'yicha bo'laklarga ajratadi (birinchi uchrashi bo'yicha). */
function buildSegments(text: string, errors: WritingError[]): Segment[] {
  const ranges: Array<{ start: number; end: number; index: number }> = []
  const used: Array<[number, number]> = []

  errors.forEach((error, index) => {
    const span = error.span?.trim()
    if (!span) return

    // Bir xil span bir necha marta uchrasa — hali band bo'lmagan birinchisini olamiz
    let from = 0
    for (;;) {
      const start = text.indexOf(span, from)
      if (start === -1) return
      const end = start + span.length
      const overlaps = used.some(([usedStart, usedEnd]) => start < usedEnd && end > usedStart)
      if (!overlaps) {
        ranges.push({ start, end, index })
        used.push([start, end])
        return
      }
      from = start + 1
    }
  })

  ranges.sort((a, b) => a.start - b.start)

  const segments: Segment[] = []
  let cursor = 0
  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), errorIndex: null })
    }
    segments.push({ text: text.slice(range.start, range.end), errorIndex: range.index })
    cursor = range.end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), errorIndex: null })

  return segments
}

export function ErrorCard({ error }: { error: WritingError }) {
  const label = ERROR_TAG_LABELS[error.type as ErrorTag]
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{label?.uz ?? error.type}</Badge>
        <span className="font-mono text-xs text-destructive line-through">{error.span}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
          {error.fix}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3" />
            Nima uchun
          </p>
          <p className="mt-0.5">{error.why}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="size-3" />
            Qanday tuzatish
          </p>
          <p className="mt-0.5">{error.fix}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <ArrowRight className="size-3" />
            Yana qayerda uchraydi
          </p>
          <p className="mt-0.5">{error.whereElse}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Talaba matni + AI topgan xatolar: har bir `span` ajratib ko'rsatiladi,
 * bosilganda «nima uchun → qanday tuzatish → yana qayerda» kartasi ochiladi (PLAN 8.5, 7.3).
 */
export function AnnotatedText({ text, errors, activeIndex, onSelect }: AnnotatedTextProps) {
  const segments = React.useMemo(() => buildSegments(text, errors), [text, errors])

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-7">
      {segments.map((segment, index) => {
        if (segment.errorIndex === null) {
          return <React.Fragment key={index}>{segment.text}</React.Fragment>
        }
        const error = errors[segment.errorIndex]
        const isActive = activeIndex === segment.errorIndex

        return (
          <Popover
            key={index}
            open={isActive}
            onOpenChange={(open) => onSelect?.(open ? segment.errorIndex : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'rounded-sm bg-amber-100 decoration-amber-500 decoration-wavy underline-offset-4 transition-colors hover:bg-amber-200 dark:bg-amber-500/25 dark:hover:bg-amber-500/40',
                  'underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-amber-300 dark:bg-amber-500/50'
                )}
                aria-label={`Xato: ${error.span}`}
              >
                {segment.text}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <ErrorCard error={error} />
            </PopoverContent>
          </Popover>
        )
      })}
    </div>
  )
}
