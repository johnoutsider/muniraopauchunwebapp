'use client'

import * as React from 'react'
import { GitCompare, History, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'
import { formatDateTime } from '@/lib/utils/format'

import { diffStats, diffWords } from '../diff'
import type { DraftSummary } from '../types'

export interface DraftHistoryProps {
  drafts: DraftSummary[]
  /** Muharrirdagi joriy matn — oxirgi qoralama bilan taqqoslash uchun */
  currentText: string
}

/** Qoralama tarixi + ikkita versiyani taqqoslash (PLAN 8.5). */
export function DraftHistory({ drafts, currentText }: DraftHistoryProps) {
  const [compareIndex, setCompareIndex] = React.useState<number | null>(null)

  const selected = compareIndex !== null ? drafts[compareIndex] : null
  const tokens = React.useMemo(
    () => (selected ? diffWords(selected.text, currentText) : []),
    [selected, currentText]
  )
  const stats = React.useMemo(() => diffStats(tokens), [tokens])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4 text-primary" />
          Qoralamalar tarixi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {drafts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Yozishni boshlaganingizda qoralama avtomatik saqlanadi.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {drafts.map((draft, index) => {
              const isLast = index === drafts.length - 1
              return (
                <li
                  key={draft.index}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {draft.index + 1}-qoralama
                      {isLast && (
                        <Badge variant="secondary" className="text-[10px]">
                          joriy
                        </Badge>
                      )}
                      {draft.hasFeedback && (
                        <Sparkles
                          className="size-3 text-primary"
                          aria-label="AI feedback olingan"
                        />
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {draft.wordCount} so‘z · {formatDateTime(draft.ts)}
                    </p>
                  </div>
                  {!isLast && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCompareIndex(index)}
                      aria-label={`${draft.index + 1}-qoralamani joriy matn bilan taqqoslash`}
                    >
                      <GitCompare />
                      Taqqoslash
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setCompareIndex(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? `${selected.index + 1}-qoralama ↔ joriy matn` : 'Taqqoslash'}
            </DialogTitle>
            <DialogDescription>
              Yashil — qo‘shilgan so‘zlar ({stats.added} ta), qizil — olib tashlangan so‘zlar (
              {stats.removed} ta).
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <p className="whitespace-pre-wrap break-words text-sm leading-7">
              {tokens.map((token, index) => (
                <span
                  key={index}
                  className={cn(
                    token.op === 'added' &&
                      'rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-100',
                    token.op === 'removed' &&
                      'rounded bg-rose-100 text-rose-900 line-through dark:bg-rose-500/25 dark:text-rose-100'
                  )}
                >
                  {token.text}
                </span>
              ))}
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
