import * as React from 'react'

import { cn } from '@/lib/utils/cn'

import type { StreakDay } from './queries'

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

function intensity(day: StreakDay): string {
  if (!day.active) return 'bg-muted'
  if (day.xp >= 120) return 'bg-emerald-600'
  if (day.xp >= 60) return 'bg-emerald-500'
  if (day.xp >= 20) return 'bg-emerald-400'
  return 'bg-emerald-300'
}

export interface StreakCalendarProps {
  weeks: StreakDay[][]
}

/** So'nggi 8 haftalik faollik kalendari (PLAN 8.12). */
export function StreakCalendar({ weeks }: StreakCalendarProps) {
  if (!weeks.length) {
    return <p className="text-sm text-muted-foreground">Faollik ma’lumoti yo‘q.</p>
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1.5">
          <div className="flex flex-col gap-1.5 pr-1">
            {WEEKDAYS.map((label) => (
              <span
                key={label}
                className="flex h-4 items-center text-[10px] leading-none text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.xp} XP · ${day.minutes} daq`}
                  aria-label={`${day.date}: ${day.xp} XP`}
                  className={cn('size-4 rounded-sm', intensity(day))}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Kam</span>
        <span className="size-3 rounded-sm bg-muted" />
        <span className="size-3 rounded-sm bg-emerald-300" />
        <span className="size-3 rounded-sm bg-emerald-400" />
        <span className="size-3 rounded-sm bg-emerald-500" />
        <span className="size-3 rounded-sm bg-emerald-600" />
        <span>Ko‘p</span>
      </div>
    </div>
  )
}
