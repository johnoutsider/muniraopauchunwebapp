'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { CheckCircle2, KeyRound, Lock, Pencil, Unlock } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/data-table'
import { ROLES, type Role } from '@/config/constants'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { relativeTime } from '@/lib/utils/format'

import { bulkUsersAction, logPasswordResetAction, setUserStatusAction } from '../actions'
import type { AdminUserRow } from '../queries'
import { UserFormDialog } from './user-form-dialog'

const ROLE_LABELS: Record<Role, string> = {
  student: 'Talaba',
  teacher: 'O‘qituvchi',
  researcher: 'Tadqiqotchi',
  admin: 'Administrator',
}

const STATUS_META: Record<
  AdminUserRow['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  active: { label: 'Faol', variant: 'success' },
  pending: { label: 'Tasdiq kutmoqda', variant: 'warning' },
  disabled: { label: 'Bloklangan', variant: 'danger' },
}

export interface UsersTableProps {
  rows: AdminUserRow[]
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
  cohorts: Array<{ id: string; name: string }>
}

export function UsersTable({ rows, groups, cohorts }: UsersTableProps) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [operation, setOperation] = React.useState<'approve' | 'disable' | 'enable' | 'setRole' | 'setGroup'>(
    'approve'
  )
  const [bulkRole, setBulkRole] = React.useState<Role>('student')
  const [bulkGroup, setBulkGroup] = React.useState(groups[0]?.id ?? '')
  const [pending, setPending] = React.useState(false)

  const toggleOne = React.useCallback((uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }, [])

  const allSelected = rows.length > 0 && selected.size === rows.length

  async function sendReset(row: AdminUserRow) {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), row.email)
      await logPasswordResetAction({ uid: row.uid, email: row.email })
      toast.success(`Parolni tiklash xati yuborildi: ${row.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xat yuborilmadi')
    }
  }

  async function changeStatus(row: AdminUserRow, status: AdminUserRow['status']) {
    const result = await setUserStatusAction(row.uid, status)
    if (result.ok) {
      toast.success(status === 'active' ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function runBulk() {
    setPending(true)
    try {
      const result = await bulkUsersAction({
        uids: [...selected],
        operation,
        role: operation === 'setRole' ? bulkRole : undefined,
        groupId: operation === 'setGroup' ? bulkGroup : undefined,
      })
      if (result.ok) {
        toast.success(`${result.data.affected} ta foydalanuvchi yangilandi`)
        setSelected(new Set())
        setBulkOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  const columns = React.useMemo<ColumnDef<AdminUserRow, unknown>[]>(
    () => [
      {
        id: 'select',
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(value) =>
              setSelected(value === true ? new Set(rows.map((row) => row.uid)) : new Set())
            }
            aria-label="Hammasini tanlash"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selected.has(row.original.uid)}
            onCheckedChange={() => toggleOne(row.original.uid)}
            aria-label="Tanlash"
          />
        ),
      },
      { accessorKey: 'displayName', header: 'F.I.Sh.' },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>,
      },
      {
        accessorKey: 'groupName',
        header: 'Guruh',
        cell: ({ row }) => (
          <span className="flex items-center gap-2 text-sm">
            {row.original.groupName}
            {row.original.expGroup ? (
              <Badge variant={row.original.expGroup === 'experimental' ? 'default' : 'secondary'}>
                {row.original.expGroup === 'experimental' ? 'eksp.' : 'nazorat'}
              </Badge>
            ) : null}
          </span>
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
        accessorKey: 'lastActiveAt',
        header: 'Oxirgi faollik',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.lastActiveAt ? relativeTime(row.original.lastActiveAt) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <UserFormDialog
              user={row.original}
              groups={groups}
              cohorts={cohorts}
              trigger={
                <Button variant="ghost" size="icon" title="Tahrirlash">
                  <Pencil />
                </Button>
              }
            />
            {row.original.status === 'pending' ? (
              <Button
                variant="ghost"
                size="icon"
                title="Tasdiqlash"
                onClick={() => void changeStatus(row.original, 'active')}
              >
                <CheckCircle2 />
              </Button>
            ) : null}
            {row.original.status === 'disabled' ? (
              <Button
                variant="ghost"
                size="icon"
                title="Blokdan chiqarish"
                onClick={() => void changeStatus(row.original, 'active')}
              >
                <Unlock />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                title="Bloklash"
                onClick={() => void changeStatus(row.original, 'disabled')}
              >
                <Lock />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              title="Parolni tiklash xatini yuborish"
              onClick={() => void sendReset(row.original)}
            >
              <KeyRound />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, selected, allSelected, groups, cohorts]
  )

  return (
    <div className="space-y-3">
      {selected.size > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <span className="font-medium">{selected.size}</span> ta foydalanuvchi tanlandi
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
                Tanlovni bekor qilish
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)}>
                Ommaviy amal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        pageSize={20}
        searchPlaceholder="Ism, email yoki guruh bo‘yicha qidirish…"
        emptyMessage="Foydalanuvchi topilmadi"
      />

      <Dialog open={bulkOpen} onOpenChange={(next) => (pending ? null : setBulkOpen(next))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ommaviy amal</DialogTitle>
            <DialogDescription>
              {selected.size} ta foydalanuvchiga qo‘llaniladi. Amal audit jurnaliga yoziladi va
              bekor qilinmaydi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amal</Label>
              <Select
                value={operation}
                onValueChange={(value) => setOperation(value as typeof operation)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Tasdiqlash (faollashtirish)</SelectItem>
                  <SelectItem value="enable">Blokdan chiqarish</SelectItem>
                  <SelectItem value="disable">Bloklash</SelectItem>
                  <SelectItem value="setRole">Rolni o‘zgartirish</SelectItem>
                  <SelectItem value="setGroup">Guruhga ko‘chirish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operation === 'setRole' ? (
              <div className="space-y-1.5">
                <Label>Yangi rol</Label>
                <Select value={bulkRole} onValueChange={(value) => setBulkRole(value as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ROLE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {operation === 'setGroup' ? (
              <div className="space-y-1.5">
                <Label>Guruh</Label>
                <Select value={bulkGroup} onValueChange={setBulkGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Guruhni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.type === 'experimental' ? 'eksp.' : 'nazorat'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button
              variant={operation === 'disable' ? 'destructive' : 'default'}
              loading={pending}
              onClick={() => void runBulk()}
            >
              Bajarish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
