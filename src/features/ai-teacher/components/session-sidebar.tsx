'use client'

import * as React from 'react'
import { MessageSquare, Plus, Theater, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'
import { relativeTime } from '@/lib/utils/format'
import { PERSONA_LABELS } from '@/config/constants'

import type { SessionSummary } from '../types'

export interface SessionSidebarProps {
  sessions: SessionSummary[]
  activeId: string | null
  loadingId: string | null
  onSelect: (session: SessionSummary) => void
  onNew: () => void
  onDelete: (session: SessionSummary) => void
}

export function SessionSidebar({
  sessions,
  activeId,
  loadingId,
  onSelect,
  onNew,
  onDelete,
}: SessionSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={onNew} className="w-full" variant="outline">
        <Plus />
        Yangi suhbat
      </Button>

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Hali suhbat yo‘q. Birinchi savolingizni yozing — suhbat avtomatik saqlanadi va shu yerda
          paydo bo‘ladi.
        </p>
      ) : (
        <ScrollArea className="-mr-2 h-[min(52vh,420px)] pr-2">
          <ul className="space-y-1">
            {sessions.map((session) => {
              const persona = session.persona ? PERSONA_LABELS[session.persona] : null
              return (
                <li key={session.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors hover:bg-muted/60',
                      activeId === session.id && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(session)}
                      disabled={loadingId === session.id}
                      className="flex min-w-0 flex-1 items-start gap-2 text-left disabled:opacity-60"
                    >
                      <span className="mt-0.5 shrink-0 text-muted-foreground">
                        {session.mode === 'roleplay' ? (
                          <Theater className="size-4" />
                        ) : (
                          <MessageSquare className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{session.title}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {persona ? `${persona.emoji} ${persona.uz} · ` : ''}
                          {session.messageCount} xabar ·{' '}
                          {session.lastMessageAt ? relativeTime(session.lastMessageAt) : '—'}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(session)}
                      aria-label="Suhbatni ro‘yxatdan yashirish"
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
