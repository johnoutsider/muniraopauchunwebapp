'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, FilterX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { auditActionLabel } from '../audit-meta'

const ALL = '__all__'

export interface AuditFiltersProps {
  actions: string[]
  actors: Array<{ uid: string; name: string }>
  page: number
  totalPages: number
  total: number
}

export function AuditFilters({ actions, actors, page, totalPages, total }: AuditFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = React.useTransition()

  const set = React.useCallback(
    (key: string, value: string | null, resetPage = true) => {
      const next = new URLSearchParams(params.toString())
      if (!value || value === ALL) next.delete(key)
      else next.set(key, value)
      if (resetPage) next.delete('page')
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
    },
    [params, pathname, router]
  )

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label>Amal</Label>
          <Select
            value={params.get('action') ?? ALL}
            onValueChange={(value) => set('action', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {auditActionLabel(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Kim</Label>
          <Select value={params.get('actor') ?? ALL} onValueChange={(value) => set('actor', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {actors.map((actor) => (
                <SelectItem key={actor.uid} value={actor.uid}>
                  {actor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-from">Sanadan</Label>
          <Input
            id="audit-from"
            type="date"
            value={params.get('from') ?? ''}
            onChange={(event) => set('from', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to">Sanagacha</Label>
          <Input
            id="audit-to"
            type="date"
            value={params.get('to') ?? ''}
            onChange={(event) => set('to', event.target.value)}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            {total} ta yozuv · {page} / {Math.max(1, totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || pending}
              onClick={() => set('page', String(page - 1), false)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || pending}
              onClick={() => set('page', String(page + 1), false)}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={pending}
              onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
            >
              <FilterX />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
