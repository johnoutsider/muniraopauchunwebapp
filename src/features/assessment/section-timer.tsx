'use client'

import * as React from 'react'
import { Timer } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface SectionTimerProps {
  /** Bo'lim tugaydigan vaqt (ms, `Date.now()` shkalasi). */
  endsAt: number
  /** Vaqt tugaganda bir marta chaqiriladi. */
  onExpire: () => void
  className?: string
}

function format(seconds: number): string {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`
}

/**
 * Bo'lim taymeri (PLAN 8.11 — `TestSection.timeLimitMin`).
 *
 * Tugash vaqti SERVERDA saqlangan `sectionStartedAt` dan hisoblanadi, shuning
 * uchun sahifa yangilansa ham taymer noldan boshlanmaydi — talaba vaqtni
 * "yangilash" bilan cho'zib yubora olmaydi.
 */
export function SectionTimer({ endsAt, onExpire, className }: SectionTimerProps) {
  const [left, setLeft] = React.useState(() => Math.round((endsAt - Date.now()) / 1000))
  const fired = React.useRef(false)
  const expireRef = React.useRef(onExpire)
  expireRef.current = onExpire

  React.useEffect(() => {
    fired.current = false
    setLeft(Math.round((endsAt - Date.now()) / 1000))

    const id = setInterval(() => {
      const seconds = Math.round((endsAt - Date.now()) / 1000)
      setLeft(seconds)
      if (seconds <= 0 && !fired.current) {
        fired.current = true
        expireRef.current()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [endsAt])

  const warning = left <= 60 && left > 0
  const over = left <= 0

  return (
    <span
      role="timer"
      aria-live={warning ? 'assertive' : 'off'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium tabular-nums',
        over
          ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300'
          : warning
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : 'border-border bg-muted/50 text-muted-foreground',
        className
      )}
    >
      <Timer className="size-3.5 shrink-0" aria-hidden="true" />
      {format(left)}
      <span className="sr-only">bo‘lim uchun qolgan vaqt</span>
    </span>
  )
}
