'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { ExperimentDoc } from '@/types'

import { saveExperimentAction, type ExperimentInput } from '../actions'

export interface ExperimentFormProps {
  experiment: (ExperimentDoc & { id: string }) | null
  tests: Array<{ id: string; title: string; type: string }>
  surveys: Array<{ id: string; title: string; type: string }>
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
}

const NONE = '__none__'

function dateInputValue(value: unknown): string {
  if (!value) return ''
  const date = new Date(
    typeof value === 'object' && value !== null && 'seconds' in (value as { seconds: number })
      ? (value as { seconds: number }).seconds * 1000
      : (value as string | number)
  )
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function ExperimentForm({ experiment, tests, surveys, groups }: ExperimentFormProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  const [form, setForm] = React.useState<ExperimentInput>({
    id: experiment?.id,
    title: experiment?.title ?? '',
    hypothesis: experiment?.hypothesis ?? '',
    design: experiment?.design ?? '',
    preTestId: experiment?.preTestId ?? '',
    postTestId: experiment?.postTestId ?? '',
    surveyIds: experiment?.surveyIds ?? [],
    experimentalGroupIds: experiment?.groupIds?.experimental ?? [],
    controlGroupIds: experiment?.groupIds?.control ?? [],
    start: dateInputValue(experiment?.timeline?.start),
    midpoint: dateInputValue(experiment?.timeline?.midpoint),
    end: dateInputValue(experiment?.timeline?.end),
    status: experiment?.status ?? 'planned',
  })

  function update<K extends keyof ExperimentInput>(key: K, value: ExperimentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveExperimentAction({
        ...form,
        preTestId: form.preTestId || undefined,
        postTestId: form.postTestId || undefined,
        midpoint: form.midpoint || undefined,
      })
      if (result.ok) {
        toast.success('Eksperiment saqlandi')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  const experimentalGroups = groups.filter((group) => group.type === 'experimental')
  const controlGroups = groups.filter((group) => group.type === 'control')

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Umumiy ma’lumot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Eksperiment nomi</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Masalan: AI asosidagi ESP metodikasi samaradorligi"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hypothesis">Gipoteza</Label>
            <Textarea
              id="hypothesis"
              rows={3}
              value={form.hypothesis}
              onChange={(event) => update('hypothesis', event.target.value)}
              placeholder="Agar talabalar AI asosidagi platformada 12 hafta shug‘ullansa, ularning professional ingliz tili ko‘rsatkichlari nazorat guruhiga nisbatan sezilarli darajada yuqori bo‘ladi."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="design">Dizayn</Label>
            <Textarea
              id="design"
              rows={3}
              value={form.design}
              onChange={(event) => update('design', event.target.value)}
              placeholder="Kvazi-eksperimental, pre-test / post-test, ikki guruhli (eksperimental va nazorat), 150–200 ishtirokchi."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Holat</Label>
              <Select
                value={form.status}
                onValueChange={(value) => update('status', value as ExperimentDoc['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                  <SelectItem value="running">Davom etmoqda</SelectItem>
                  <SelectItem value="finished">Yakunlangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testlar va so‘rovnomalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tests.length === 0 ? (
            <EmptyState
              title="Test topilmadi"
              description="Avval admin bo‘limida test yarating, so‘ng pre/post sifatida biriktiring."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Pre-test (boshlang‘ich kesim)</Label>
                <Select
                  value={form.preTestId || NONE}
                  onValueChange={(value) => update('preTestId', value === NONE ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlanmagan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title} ({test.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Post-test (yakuniy kesim)</Label>
                <Select
                  value={form.postTestId || NONE}
                  onValueChange={(value) => update('postTestId', value === NONE ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tanlanmagan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Tanlanmagan</SelectItem>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title} ({test.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Biriktirilgan so‘rovnomalar</Label>
            {surveys.length === 0 ? (
              <p className="text-sm text-muted-foreground">So‘rovnoma hali yaratilmagan.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {surveys.map((survey) => (
                  <label
                    key={survey.id}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <Checkbox
                      checked={form.surveyIds.includes(survey.id)}
                      onCheckedChange={() => update('surveyIds', toggle(form.surveyIds, survey.id))}
                    />
                    <span className="min-w-0 flex-1 truncate">{survey.title}</span>
                    <Badge variant="outline">{survey.type}</Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guruhlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Eksperimental guruhlar</Label>
            {experimentalGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Eksperimental guruh yaratilmagan.</p>
            ) : (
              experimentalGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <Checkbox
                    checked={form.experimentalGroupIds.includes(group.id)}
                    onCheckedChange={() =>
                      update('experimentalGroupIds', toggle(form.experimentalGroupIds, group.id))
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                </label>
              ))
            )}
          </div>
          <div className="space-y-2">
            <Label>Nazorat guruhlari</Label>
            {controlGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nazorat guruhi yaratilmagan.</p>
            ) : (
              controlGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                >
                  <Checkbox
                    checked={form.controlGroupIds.includes(group.id)}
                    onCheckedChange={() =>
                      update('controlGroupIds', toggle(form.controlGroupIds, group.id))
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                </label>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Muddatlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="start">Boshlanish</Label>
            <Input
              id="start"
              type="date"
              value={form.start}
              onChange={(event) => update('start', event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="midpoint">Oraliq kesim</Label>
            <Input
              id="midpoint"
              type="date"
              value={form.midpoint ?? ''}
              onChange={(event) => update('midpoint', event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              So‘rovnoma javoblari shu sanaga qarab «pre» va «post» ga ajratiladi.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">Tugash</Label>
            <Input
              id="end"
              type="date"
              value={form.end}
              onChange={(event) => update('end', event.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          <Save />
          Saqlash
        </Button>
      </div>
    </form>
  )
}
