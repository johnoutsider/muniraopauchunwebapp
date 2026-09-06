'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { assignSurveyAction, assignTestAction } from '../actions'

export interface AssignFormProps {
  kind: 'test' | 'survey'
  targetId: string
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
  initialGroupIds: string[]
  initialFrom?: string
  initialTo?: string
  initialActive?: boolean
}

function dateTimeValue(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/** Test yoki so'rovnomani guruhlarga ochilish/yopilish oynasi bilan biriktirish. */
export function AssignForm({
  kind,
  targetId,
  groups,
  initialGroupIds,
  initialFrom,
  initialTo,
  initialActive = true,
}: AssignFormProps) {
  const router = useRouter()
  const [groupIds, setGroupIds] = React.useState<string[]>(initialGroupIds)
  const [from, setFrom] = React.useState(dateTimeValue(initialFrom))
  const [to, setTo] = React.useState(dateTimeValue(initialTo))
  const [active, setActive] = React.useState(initialActive)
  const [pending, setPending] = React.useState(false)

  function toggle(id: string) {
    setGroupIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result =
        kind === 'test'
          ? await assignTestAction({
              testId: targetId,
              groupIds,
              from: from || undefined,
              to: to || undefined,
            })
          : await assignSurveyAction({
              surveyId: targetId,
              groupIds,
              from: from || undefined,
              to: to || undefined,
              active,
            })
      if (result.ok) {
        toast.success('Biriktirish saqlandi')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-primary" />
          Guruhlarga biriktirish
        </CardTitle>
        <CardDescription>
          Guruhlarni tanlang va ochilish/yopilish vaqtini belgilang. Guruh tanlanmasa —
          {kind === 'test' ? ' test' : ' so‘rovnoma'} barcha guruhlarga ochiq bo‘ladi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
              >
                <Checkbox
                  checked={groupIds.includes(group.id)}
                  onCheckedChange={() => toggle(group.id)}
                />
                <span className="min-w-0 flex-1 truncate">{group.name}</span>
                <span className="text-xs text-muted-foreground">
                  {group.type === 'experimental' ? 'eksp.' : 'nazorat'}
                </span>
              </label>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assign-from">Ochilish</Label>
              <Input
                id="assign-from"
                type="datetime-local"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-to">Yopilish</Label>
              <Input
                id="assign-to"
                type="datetime-local"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>

          {kind === 'survey' ? (
            <div className="flex items-center gap-2">
              <Switch id="survey-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="survey-active">So‘rovnoma faol</Label>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              Saqlash
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
