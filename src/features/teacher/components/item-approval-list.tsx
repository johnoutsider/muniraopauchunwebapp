'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Pencil, Save, ShieldCheck, Terminal, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/shared/ai-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import {
  CEFR_LEVELS,
  DOMAIN_LABELS,
  ITEM_TYPE_LABELS,
  SKILL_LABELS,
  type CefrLevel,
} from '@/config/constants'
import { relativeTime } from '@/lib/utils/format'
import type { ItemDoc } from '@/types'

import { decideItemsAction, updateItemAction } from '../actions'

type Item = ItemDoc & { id: string }

export interface ItemApprovalListProps {
  items: Item[]
}

export function ItemApprovalList({ items }: ItemApprovalListProps) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending] = React.useState(false)

  const toggle = React.useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  async function bulkApprove() {
    if (!selected.size) return
    setBulkPending(true)
    try {
      const result = await decideItemsAction({
        itemIds: [...selected],
        decision: 'approved',
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(
        `${result.data.changed} ta mashq tasdiqlandi${
          result.data.skipped ? `, ${result.data.skipped} ta o‘zgarmadi` : ''
        }`
      )
      setSelected(new Set())
      router.refresh()
    } finally {
      setBulkPending(false)
    }
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShieldCheck />}
        title="Tasdiqlashni kutayotgan mashq yo‘q"
        description="AI generatsiya qilgan yangi mashqlar shu yerda paydo bo‘ladi. Tasdiqlangan mashq item bankka tushadi va qayta ishlatiladi."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.size === items.length && items.length > 0}
            onCheckedChange={(checked) =>
              setSelected(checked ? new Set(items.map((i) => i.id)) : new Set())
            }
            aria-label="Hammasini belgilash"
          />
          Hammasini belgilash ({items.length})
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {selected.size} ta tanlandi
          </span>
          <ConfirmDialog
            trigger={
              <Button size="sm" disabled={!selected.size || bulkPending} loading={bulkPending}>
                <Check />
                Tanlanganlarni tasdiqlash
              </Button>
            }
            title="Ommaviy tasdiqlash"
            description={`${selected.size} ta mashq tasdiqlanadi va item bankka tushadi. Tasdiqlangan mashqlar talabalarga darhol ko‘rina boshlaydi. Davom etasizmi?`}
            confirmLabel="Ha, tasdiqlansin"
            onConfirm={bulkApprove}
          />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <ItemApprovalCard
            key={item.id}
            item={item}
            selected={selected.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ItemApprovalCard({
  item,
  selected,
  onToggle,
}: {
  item: Item
  selected: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState('')

  const [stem, setStem] = React.useState(item.stem ?? '')
  const [instruction, setInstruction] = React.useState(item.instruction ?? '')
  const [options, setOptions] = React.useState(() =>
    (item.options ?? []).map((option) => ({ ...option }))
  )
  const [answerKey, setAnswerKey] = React.useState((item.answerKey ?? []).join(' | '))
  const [why, setWhy] = React.useState(item.explanation?.why ?? '')
  const [how, setHow] = React.useState(item.explanation?.how ?? '')
  const [whereElse, setWhereElse] = React.useState(item.explanation?.whereElse ?? '')
  const [difficulty, setDifficulty] = React.useState(String(item.difficulty ?? 1))
  const [cefr, setCefr] = React.useState<string>(item.cefr ?? 'B1')

  async function save() {
    setPending(true)
    try {
      const result = await updateItemAction({
        itemId: item.id,
        stem: stem.trim(),
        instruction: instruction.trim(),
        options: options
          .filter((o) => o.text.trim())
          .map((o) => ({ id: o.id, text: o.text.trim() })),
        answerKey: answerKey
          .split('|')
          .map((value) => value.trim())
          .filter(Boolean),
        explanation: { why: why.trim(), how: how.trim(), whereElse: whereElse.trim() },
        difficulty: Number(difficulty),
        cefr: cefr as CefrLevel,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Mashq yangilandi')
      setEditing(false)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  async function decide(decision: 'approved' | 'rejected') {
    if (decision === 'rejected' && !reason.trim()) {
      toast.error('Rad etish sababini yozing.')
      return
    }
    setPending(true)
    try {
      const result = await decideItemsAction({
        itemIds: [item.id],
        decision,
        reason: reason.trim() || undefined,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(decision === 'approved' ? 'Tasdiqlandi' : 'Rad etildi')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 pb-3">
        <div className="flex min-w-0 items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`${item.stem?.slice(0, 40)} — tanlash`}
            className="mt-1"
          />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">
              {ITEM_TYPE_LABELS[item.type]?.uz ?? item.type}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.source === 'ai' ? <AiBadge /> : <Badge variant="outline">Qo‘lda</Badge>}
              <Badge variant="secondary">{SKILL_LABELS[item.skill]?.uz ?? item.skill}</Badge>
              <Badge variant="outline">{DOMAIN_LABELS[item.domain]?.uz ?? item.domain}</Badge>
              <Badge variant="outline">{item.cefr}</Badge>
              <Badge variant="outline">Daraja {item.difficulty}</Badge>
              {item.topic ? <Badge variant="outline">{item.topic}</Badge> : null}
              <span className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing((prev) => !prev)}
          disabled={pending}
        >
          {editing ? <X /> : <Pencil />}
          {editing ? 'Bekor qilish' : 'Tahrirlash'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`stem-${item.id}`}>Savol matni</Label>
              <Textarea
                id={`stem-${item.id}`}
                value={stem}
                onChange={(event) => setStem(event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`instruction-${item.id}`}>Ko‘rsatma</Label>
              <Input
                id={`instruction-${item.id}`}
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
              />
            </div>

            {options.length ? (
              <div className="space-y-1.5">
                <Label>Variantlar</Label>
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                      {option.id}
                    </span>
                    <Input
                      value={option.text}
                      onChange={(event) =>
                        setOptions((prev) =>
                          prev.map((o, i) => (i === index ? { ...o, text: event.target.value } : o))
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor={`answer-${item.id}`}>
                  To‘g‘ri javob(lar) — « | » bilan ajrating
                </Label>
                <Input
                  id={`answer-${item.id}`}
                  value={answerKey}
                  onChange={(event) => setAnswerKey(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`difficulty-${item.id}`}>Qiyinlik (1–5)</Label>
                <Input
                  id={`difficulty-${item.id}`}
                  type="number"
                  min={1}
                  max={5}
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cefr-${item.id}`}>CEFR</Label>
                <select
                  id={`cefr-${item.id}`}
                  value={cefr}
                  onChange={(event) => setCefr(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`why-${item.id}`}>Nima uchun</Label>
                <Textarea
                  id={`why-${item.id}`}
                  value={why}
                  onChange={(event) => setWhy(event.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`how-${item.id}`}>Qanday tuzatish</Label>
                <Textarea
                  id={`how-${item.id}`}
                  value={how}
                  onChange={(event) => setHow(event.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`where-${item.id}`}>Yana qayerda</Label>
                <Textarea
                  id={`where-${item.id}`}
                  value={whereElse}
                  onChange={(event) => setWhereElse(event.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Button type="button" onClick={save} loading={pending} size="sm">
              <Save />
              O‘zgarishlarni saqlash
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm">{item.stem}</p>
            {item.instruction ? (
              <p className="text-xs text-muted-foreground">{item.instruction}</p>
            ) : null}

            {item.options?.length ? (
              <ul className="space-y-1 text-sm">
                {item.options.map((option) => {
                  const correct = (item.answerKey ?? []).includes(option.id)
                  return (
                    <li
                      key={option.id}
                      className={
                        correct
                          ? 'flex items-center gap-2 rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300'
                          : 'flex items-center gap-2 px-2 py-1'
                      }
                    >
                      <span className="font-mono text-xs text-muted-foreground">{option.id}</span>
                      {option.text}
                      {correct ? <Check className="size-3.5" /> : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm">
                <span className="text-muted-foreground">Javob kaliti: </span>
                <span className="font-medium">{(item.answerKey ?? []).join(' | ') || '—'}</span>
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { label: 'Nima uchun', value: item.explanation?.why },
                { label: 'Qanday tuzatish', value: item.explanation?.how },
                { label: 'Yana qayerda', value: item.explanation?.whereElse },
              ].map((entry) => (
                <div key={entry.label} className="rounded-lg border border-border p-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {entry.label}
                  </p>
                  <p className="text-sm">{entry.value || '—'}</p>
                </div>
              ))}
            </div>

            {item.generatedFromPrompt ? (
              <details className="rounded-lg border border-dashed border-border p-2.5">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Terminal className="size-3.5" />
                  Generatsiya manbasi (prompt)
                </summary>
                <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {item.generatedFromPrompt}
                </p>
              </details>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="success"
            size="sm"
            loading={pending}
            onClick={() => void decide('approved')}
          >
            <Check />
            Tasdiqlash
          </Button>

          {rejecting ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1">
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Rad etish sababi…"
                className="sm:flex-1"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                loading={pending}
                onClick={() => void decide('rejected')}
              >
                Rad etish
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejecting(false)}
                disabled={pending}
              >
                Bekor
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejecting(true)}
              disabled={pending}
            >
              <X />
              Rad etish
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
