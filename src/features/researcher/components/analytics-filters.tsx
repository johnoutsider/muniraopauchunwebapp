'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FilterX } from 'lucide-react'

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
import { Switch } from '@/components/ui/switch'

export interface AnalyticsFiltersProps {
  cohorts: Array<{ id: string; name: string }>
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
}

const ALL = '__all__'

/** Analitika filtrlari — URL query orqali (sahifa server tomonda qayta hisoblanadi). */
export function AnalyticsFilters({ cohorts, groups }: AnalyticsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = React.useTransition()

  const set = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (!value || value === ALL) next.delete(key)
      else next.set(key, value)
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
    },
    [params, pathname, router]
  )

  const cohortId = params.get('cohort') ?? ALL
  const groupId = params.get('group') ?? ALL
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const excludeLow = params.get('excludeLow') === '1'

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label>Kohort</Label>
          <Select value={cohortId} onValueChange={(value) => set('cohort', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Guruh</Label>
          <Select value={groupId} onValueChange={(value) => set('group', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.type === 'experimental' ? 'eksp.' : 'nazorat'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="from">Sanadan</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(event) => set('from', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="to">Sanagacha</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(event) => set('to', event.target.value)}
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <div className="flex items-center gap-2">
            <Switch
              id="exclude-low"
              checked={excludeLow}
              onCheckedChange={(checked) => set('excludeLow', checked ? '1' : null)}
            />
            <Label htmlFor="exclude-low" className="text-xs leading-tight">
              Kam faol ishtirokchilarni chiqarish
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          >
            <FilterX />
            Filtrlarni tozalash
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
