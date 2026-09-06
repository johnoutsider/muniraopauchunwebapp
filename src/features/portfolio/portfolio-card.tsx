'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pin, PinOff, StickyNote } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScoreBadge } from '@/components/shared/score-badge'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

import { savePortfolioNoteAction, togglePinAction } from './actions'
import type { PortfolioEntry, PortfolioType } from './queries'

const TYPE_LABELS: Record<PortfolioType, string> = {
  writing: 'Yozma ish',
  speaking: 'Nutq',
  project: 'Loyiha',
  achievement: 'Nishon',
  feedback: 'Feedback',
}

export interface PortfolioCardProps {
  entry: PortfolioEntry
}

/** Portfolio yozuvi: pin, izoh va manbaga havola. */
export function PortfolioCard({ entry }: PortfolioCardProps) {
  const router = useRouter()
  const [pinned, setPinned] = React.useState(entry.pinned)
  const [note, setNote] = React.useState(entry.note ?? '')
  const [editing, setEditing] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const payload = {
    type: entry.type,
    refId: entry.refId,
    title: entry.title,
    preview: entry.preview,
    score: entry.score,
  }

  async function handlePin() {
    setPending(true)
    setError(null)
    const next = !pinned
    const result = await togglePinAction({ ...payload, pinned: next })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPinned(next)
    router.refresh()
  }

  async function handleSaveNote() {
    setPending(true)
    setError(null)
    const result = await savePortfolioNoteAction({ ...payload, note })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setEditing(false)
    router.refresh()
  }

  return (
    <Card className={cn(pinned && 'border-primary/40 bg-primary/5')}>
      <CardContent className="space-y-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{TYPE_LABELS[entry.type]}</Badge>
              {entry.meta ? (
                <span className="text-xs text-muted-foreground">{entry.meta}</span>
              ) : null}
              {typeof entry.score === 'number' ? <ScoreBadge score={entry.score} /> : null}
            </div>
            <p className="text-sm font-medium">{entry.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
          </div>
          <Button
            type="button"
            variant={pinned ? 'secondary' : 'ghost'}
            size="sm"
            className="no-print shrink-0"
            onClick={() => void handlePin()}
            disabled={pending}
            aria-pressed={pinned}
          >
            {pinned ? <PinOff /> : <Pin />}
            {pinned ? 'Olib tashlash' : 'Pin qilish'}
          </Button>
        </div>

        {entry.preview ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed">{entry.preview}</p>
        ) : null}

        {note && !editing ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Izohim
            </span>
            <span className="mt-1 block">{note}</span>
          </p>
        ) : null}

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={note}
              rows={3}
              maxLength={600}
              placeholder="Bu ish nima uchun siz uchun muhim? Nimani o‘rgandingiz?"
              onChange={(event) => setNote(event.target.value)}
              aria-label="Portfolio izohi"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void handleSaveNote()}
                loading={pending}
                disabled={pending}
              >
                Saqlash
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNote(entry.note ?? '')
                  setEditing(false)
                }}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <div className="no-print flex flex-wrap gap-2">
          {!editing ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              <StickyNote />
              {note ? 'Izohni tahrirlash' : 'Izoh qo‘shish'}
            </Button>
          ) : null}
          {entry.href ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={entry.href}>
                Ochish
                <ExternalLink />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
