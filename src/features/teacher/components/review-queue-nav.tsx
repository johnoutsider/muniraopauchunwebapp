'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Keyboard } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface ReviewQueueNavProps {
  /** Joriy tabdagi navbat elementlari tartibi */
  ids: string[]
  currentId: string | null
  tab: string
}

function hrefFor(tab: string, id: string): string {
  return `/teacher/review?tab=${encodeURIComponent(tab)}&id=${encodeURIComponent(id)}`
}

/**
 * Navbat bo'ylab klaviatura navigatsiyasi:
 *  j / ↓ — keyingisi, k / ↑ — oldingisi, Enter — birinchisini ochish.
 * Matn maydonlarida yozayotganda tugmalar ishlamaydi.
 */
export function ReviewQueueNav({ ids, currentId, tab }: ReviewQueueNavProps) {
  const router = useRouter()
  const index = currentId ? ids.indexOf(currentId) : -1
  const next = index >= 0 ? ids[index + 1] : ids[0]
  const previous = index > 0 ? ids[index - 1] : undefined

  const go = React.useCallback(
    (id: string | undefined) => {
      if (!id) return
      router.push(hrefFor(tab, id))
    },
    [router, tab]
  )

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
          target.closest('[role="dialog"]'))
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault()
        go(next)
      } else if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault()
        go(previous)
      } else if (event.key === 'Enter' && index < 0) {
        event.preventDefault()
        go(ids[0])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [go, ids, index, next, previous])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {index >= 0 ? `${index + 1} / ${ids.length}` : `${ids.length} ta topshiriq`}
      </p>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
              <Keyboard className="size-3.5" aria-hidden="true" />j / k
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span>
              j yoki ↓ — keyingisi, k yoki ↑ — oldingisi. Matn yozayotganda o‘chirib qo‘yiladi.
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {previous ? (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(tab, previous)}>Oldingisi</Link>
        </Button>
      ) : null}

      {next ? (
        <Button asChild size="sm">
          <Link href={hrefFor(tab, next)}>
            Keyingisi
            <ChevronRight />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
