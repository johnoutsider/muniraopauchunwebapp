'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, FilterX, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { DataTable } from '@/components/shared/data-table'
import {
  CEFR_LEVELS,
  DOMAINS,
  DOMAIN_LABELS,
  SKILLS,
  SKILL_LABELS,
  type CefrLevel,
  type Domain,
  type Skill,
} from '@/config/constants'
import type { ItemDoc } from '@/types'

import { saveItemAction, setItemStatusAction } from '../actions'

const ALL = '__all__'

export type ItemRow = ItemDoc & { id: string }

/* ------------------------------------------------------------------ */
/* Filtrlar                                                            */
/* ------------------------------------------------------------------ */

export function ItemFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = React.useTransition()

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (!value || value === ALL) next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1.5">
          <Label>Ko‘nikma</Label>
          <Select value={params.get('skill') ?? ALL} onValueChange={(value) => set('skill', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {SKILLS.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  {SKILL_LABELS[skill].uz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Holat</Label>
          <Select
            value={params.get('status') ?? ALL}
            onValueChange={(value) => set('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              <SelectItem value="draft">Qoralama</SelectItem>
              <SelectItem value="approved">Tasdiqlangan</SelectItem>
              <SelectItem value="rejected">Rad etilgan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Manba</Label>
          <Select
            value={params.get('source') ?? ALL}
            onValueChange={(value) => set('source', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              <SelectItem value="human">Inson</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Qiyinlik</Label>
          <Select
            value={params.get('difficulty') ?? ALL}
            onValueChange={(value) => set('difficulty', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {[1, 2, 3, 4, 5].map((level) => (
                <SelectItem key={level} value={String(level)}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Soha</Label>
          <Select
            value={params.get('domain') ?? ALL}
            onValueChange={(value) => set('domain', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barchasi</SelectItem>
              {DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {DOMAIN_LABELS[domain].uz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end gap-2">
          <Label htmlFor="topic-filter">Mavzu</Label>
          <div className="flex gap-2">
            <Input
              id="topic-filter"
              defaultValue={params.get('topic') ?? ''}
              placeholder="mavzu…"
              onKeyDown={(event) => {
                if (event.key === 'Enter') set('topic', (event.target as HTMLInputElement).value)
              }}
            />
            <Button
              variant="ghost"
              size="icon"
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

/* ------------------------------------------------------------------ */
/* Tahrirlash dialogi                                                  */
/* ------------------------------------------------------------------ */

function ItemEditDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ItemRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [stem, setStem] = React.useState('')
  const [instruction, setInstruction] = React.useState('')
  const [topic, setTopic] = React.useState('')
  const [difficulty, setDifficulty] = React.useState(3)
  const [cefr, setCefr] = React.useState<CefrLevel>('B1')
  const [domain, setDomain] = React.useState<Domain>('economics')
  const [skill, setSkill] = React.useState<Skill>('grammar')
  const [answerKey, setAnswerKey] = React.useState('')
  const [why, setWhy] = React.useState('')
  const [how, setHow] = React.useState('')
  const [whereElse, setWhereElse] = React.useState('')

  React.useEffect(() => {
    if (!item) return
    setStem(item.stem ?? '')
    setInstruction(item.instruction ?? '')
    setTopic(item.topic ?? '')
    setDifficulty(item.difficulty ?? 3)
    setCefr(item.cefr ?? 'B1')
    setDomain(item.domain ?? 'economics')
    setSkill(item.skill ?? 'grammar')
    setAnswerKey((item.answerKey ?? []).join('\n'))
    setWhy(item.explanation?.why ?? '')
    setHow(item.explanation?.how ?? '')
    setWhereElse(item.explanation?.whereElse ?? '')
  }, [item])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!item) return
    setPending(true)
    try {
      const result = await saveItemAction({
        id: item.id,
        stem,
        instruction,
        topic,
        difficulty,
        cefr,
        domain,
        skill,
        answerKey: answerKey
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        explanation: { why, how, whereElse },
      })
      if (result.ok) {
        toast.success('Mashq saqlandi')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : onOpenChange(next))}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mashqni tahrirlash</DialogTitle>
          <DialogDescription>
            Tushuntirish uch qismdan iborat bo‘lishi shart: nima uchun xato, qanday to‘g‘rilash va
            yana qayerda uchraydi (metodika talabi).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item-stem">Savol matni</Label>
            <Textarea
              id="item-stem"
              rows={3}
              value={stem}
              onChange={(event) => setStem(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-instruction">Ko‘rsatma</Label>
            <Input
              id="item-instruction"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-topic">Mavzu</Label>
              <Input
                id="item-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ko‘nikma</Label>
              <Select value={skill} onValueChange={(value) => setSkill(value as Skill)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map((item2) => (
                    <SelectItem key={item2} value={item2}>
                      {SKILL_LABELS[item2].uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Qiyinlik</Label>
              <Select
                value={String(difficulty)}
                onValueChange={(value) => setDifficulty(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={String(level)}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CEFR</Label>
              <Select value={cefr} onValueChange={(value) => setCefr(value as CefrLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Soha</Label>
            <Select value={domain} onValueChange={(value) => setDomain(value as Domain)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map((item2) => (
                  <SelectItem key={item2} value={item2}>
                    {DOMAIN_LABELS[item2].uz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-answers">To‘g‘ri javoblar (har qatorda bittadan)</Label>
            <Textarea
              id="item-answers"
              rows={2}
              value={answerKey}
              onChange={(event) => setAnswerKey(event.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-why">Nima uchun (why)</Label>
              <Textarea
                id="item-why"
                rows={2}
                value={why}
                onChange={(event) => setWhy(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-how">Qanday to‘g‘rilash (how)</Label>
              <Textarea
                id="item-how"
                rows={2}
                value={how}
                onChange={(event) => setHow(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-where">Yana qayerda (whereElse)</Label>
              <Textarea
                id="item-where"
                rows={2}
                value={whereElse}
                onChange={(event) => setWhereElse(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" loading={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Jadval                                                              */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<ItemDoc['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> =
  {
    approved: { label: 'Tasdiqlangan', variant: 'success' },
    draft: { label: 'Qoralama', variant: 'warning' },
    rejected: { label: 'Rad etilgan', variant: 'danger' },
  }

export function ItemsTable({ rows }: { rows: ItemRow[] }) {
  const router = useRouter()
  const [editing, setEditing] = React.useState<ItemRow | null>(null)

  async function setStatus(id: string, status: ItemDoc['status']) {
    const result = await setItemStatusAction({ id, status })
    if (result.ok) {
      toast.success(status === 'approved' ? 'Mashq tasdiqlandi' : 'Mashq rad etildi')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const columns = React.useMemo<ColumnDef<ItemRow, unknown>[]>(
    () => [
      {
        accessorKey: 'stem',
        header: 'Savol',
        cell: ({ row }) => (
          <div className="max-w-md space-y-1">
            <p className="truncate text-sm">{row.original.stem}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.topic}</p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Tur',
        cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
      },
      {
        accessorKey: 'skill',
        header: 'Ko‘nikma',
        cell: ({ row }) => SKILL_LABELS[row.original.skill]?.uz ?? row.original.skill,
      },
      {
        accessorKey: 'difficulty',
        header: 'Qiyinlik',
        cell: ({ row }) => <span className="tabular-nums">{row.original.difficulty}</span>,
      },
      {
        accessorKey: 'cefr',
        header: 'CEFR',
        cell: ({ row }) => <Badge variant="secondary">{row.original.cefr}</Badge>,
      },
      {
        accessorKey: 'source',
        header: 'Manba',
        cell: ({ row }) => (
          <Badge variant={row.original.source === 'ai' ? 'info' : 'outline'}>
            {row.original.source === 'ai' ? 'AI' : 'Inson'}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Holat',
        cell: ({ row }) => {
          const meta = STATUS_META[row.original.status]
          return <Badge variant={meta.variant}>{meta.label}</Badge>
        },
      },
      {
        id: 'stats',
        header: 'Statistika',
        enableSorting: false,
        cell: ({ row }) => {
          const stats = row.original.stats
          if (!stats?.attempts) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round((stats.correct / stats.attempts) * 100)}% ({stats.attempts})
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Tahrirlash"
              onClick={() => setEditing(row.original)}
            >
              <Pencil />
            </Button>
            {row.original.status !== 'approved' ? (
              <Button
                variant="ghost"
                size="icon"
                title="Tasdiqlash"
                onClick={() => void setStatus(row.original.id, 'approved')}
              >
                <Check />
              </Button>
            ) : null}
            {row.original.status !== 'rejected' ? (
              <Button
                variant="ghost"
                size="icon"
                title="Rad etish"
                onClick={() => void setStatus(row.original.id, 'rejected')}
              >
                <X />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        pageSize={20}
        searchPlaceholder="Savol matni yoki mavzu bo‘yicha qidirish…"
        emptyMessage="Mashq topilmadi"
      />
      <ItemEditDialog
        item={editing}
        open={editing !== null}
        onOpenChange={(open) => (open ? null : setEditing(null))}
      />
    </>
  )
}
