'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarPlus, CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDateTime, toDate } from '@/lib/utils/format'
import type { TimeValue } from '@/types'

import { createAssignmentAction, deleteAssignmentAction, updateAssignmentAction } from '../actions'

export const ASSIGNMENT_KINDS = [
  { value: 'lesson', label: 'Dars' },
  { value: 'practice', label: 'Mashq' },
  { value: 'writing', label: 'Yozma ish' },
  { value: 'speaking', label: 'Og‘zaki ish' },
  { value: 'test', label: 'Test' },
  { value: 'project', label: 'Loyiha' },
] as const

export type AssignmentKind = (typeof ASSIGNMENT_KINDS)[number]['value']

export interface AssignmentGroupOption {
  id: string
  name: string
  type: 'experimental' | 'control'
}

export interface AssignmentCompletionRow {
  uid: string
  name: string
  participantCode: string
  done: boolean
  detail?: string
}

export interface AssignmentItem {
  id: string
  groupId: string
  groupName: string
  title: string
  description: string
  kind: AssignmentKind
  refId?: string | null
  dueAt: TimeValue
  completion: AssignmentCompletionRow[]
  doneCount: number
  totalCount: number
}

function toLocalInput(value: TimeValue | null | undefined): string {
  const date = toDate(value)
  if (!date) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function defaultDue(): string {
  const date = new Date(Date.now() + 7 * 86400000)
  date.setHours(23, 59, 0, 0)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export interface AssignmentDialogProps {
  groups: AssignmentGroupOption[]
  /** Berilsa — tahrirlash rejimi */
  assignment?: AssignmentItem
  /** Guruh oldindan tanlangan (guruh sahifasidan chaqirilganda) */
  fixedGroupId?: string
  trigger?: React.ReactNode
}

export function AssignmentDialog({
  groups,
  assignment,
  fixedGroupId,
  trigger,
}: AssignmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const [groupId, setGroupId] = React.useState(
    assignment?.groupId ?? fixedGroupId ?? groups[0]?.id ?? ''
  )
  const [title, setTitle] = React.useState(assignment?.title ?? '')
  const [description, setDescription] = React.useState(assignment?.description ?? '')
  const [kind, setKind] = React.useState<AssignmentKind>(assignment?.kind ?? 'practice')
  const [refId, setRefId] = React.useState(assignment?.refId ?? '')
  const [dueAt, setDueAt] = React.useState(
    assignment ? toLocalInput(assignment.dueAt) : defaultDue()
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!groupId) {
      toast.error('Guruhni tanlang.')
      return
    }

    setPending(true)
    try {
      const payload = {
        groupId,
        title,
        description,
        kind,
        refId: refId.trim() || undefined,
        dueAt,
      }
      const result = assignment
        ? await updateAssignmentAction({ ...payload, assignmentId: assignment.id })
        : await createAssignmentAction(payload)

      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(assignment ? 'Topshiriq yangilandi' : 'Topshiriq guruhga berildi')
      setOpen(false)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <CalendarPlus />
            Guruhga topshiriq berish
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Topshiriqni tahrirlash' : 'Yangi topshiriq'}</DialogTitle>
          <DialogDescription>
            Topshiriq berilgach guruhdagi barcha talabalarga bildirishnoma yuboriladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="assignment-group">Guruh</Label>
            <select
              id="assignment-group"
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
              disabled={pending || Boolean(fixedGroupId)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.type === 'control' ? 'nazorat' : 'eksperimental'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-title">Sarlavha</Label>
            <Input
              id="assignment-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Masalan: Present Perfect — kompaniya natijalari"
              required
              minLength={3}
              maxLength={160}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-description">Tavsif</Label>
            <Textarea
              id="assignment-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={2000}
              disabled={pending}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignment-kind">Turi</Label>
              <select
                id="assignment-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as AssignmentKind)}
                disabled={pending}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ASSIGNMENT_KINDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignment-due">Muddat</Label>
              <Input
                id="assignment-due"
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                required
                disabled={pending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignment-ref">Bog‘langan kontent ID (ixtiyoriy)</Label>
            <Input
              id="assignment-ref"
              value={refId}
              onChange={(event) => setRefId(event.target.value)}
              placeholder="lessonId, testId, taskId…"
              maxLength={160}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              ID berilsa, bajarilganlik shu kontent bo‘yicha aniq hisoblanadi.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button type="submit" loading={pending}>
              {assignment ? 'Saqlash' : 'Topshiriq berish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AssignmentList({
  assignments,
  groups,
}: {
  assignments: AssignmentItem[]
  groups: AssignmentGroupOption[]
}) {
  const router = useRouter()

  if (!assignments.length) {
    return (
      <EmptyState
        icon={<CalendarPlus />}
        title="Hali topshiriq berilmagan"
        description="Guruhga topshiriq bering — talabalar uni «Bugungi vazifalar» ro‘yxatida ko‘radi."
        action={<AssignmentDialog groups={groups} />}
      />
    )
  }

  return (
    <div className="space-y-3">
      {assignments.map((assignment) => {
        const overdue = (toDate(assignment.dueAt)?.getTime() ?? 0) < Date.now()
        const percent = assignment.totalCount
          ? Math.round((assignment.doneCount / assignment.totalCount) * 100)
          : 0

        return (
          <Card key={assignment.id}>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 pb-3">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">{assignment.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {ASSIGNMENT_KINDS.find((k) => k.value === assignment.kind)?.label ??
                      assignment.kind}
                  </Badge>
                  <Link
                    href={`/teacher/groups/${assignment.groupId}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {assignment.groupName}
                  </Link>
                  <Badge variant={overdue ? 'danger' : 'outline'}>
                    Muddat: {formatDateTime(assignment.dueAt)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <AssignmentDialog
                  groups={groups}
                  assignment={assignment}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Pencil />
                      Tahrirlash
                    </Button>
                  }
                />
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="ghost" size="sm">
                      <Trash2 />
                      <span className="sr-only">O‘chirish</span>
                    </Button>
                  }
                  title="Topshiriqni o‘chirish"
                  description={`«${assignment.title}» topshirig‘i o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.`}
                  confirmLabel="O‘chirish"
                  destructive
                  onConfirm={async () => {
                    const result = await deleteAssignmentAction(assignment.id)
                    if (!result.ok) {
                      toast.error(result.error)
                      return
                    }
                    toast.success('Topshiriq o‘chirildi')
                    router.refresh()
                  }}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {assignment.description ? (
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
              ) : null}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bajarilganlik</span>
                  <span className="font-medium tabular-nums">
                    {assignment.doneCount} / {assignment.totalCount} ({percent}%)
                  </span>
                </div>
                <Progress value={percent} />
              </div>

              {assignment.completion.length ? (
                <details className="rounded-lg border border-border">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                    Talabalar bo‘yicha ({assignment.completion.length})
                  </summary>
                  <ul className="divide-y divide-border border-t border-border">
                    {assignment.completion.map((row) => (
                      <li
                        key={row.uid}
                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <Link
                          href={`/teacher/students/${row.uid}`}
                          className="min-w-0 flex-1 truncate hover:underline"
                        >
                          {row.name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {row.participantCode}
                          </span>
                        </Link>
                        {row.detail ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {row.detail}
                          </span>
                        ) : null}
                        {row.done ? (
                          <CheckCircle2
                            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-label="Bajarilgan"
                          />
                        ) : (
                          <Circle
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-label="Bajarilmagan"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p className="text-sm text-muted-foreground">Guruhda talaba yo‘q.</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
