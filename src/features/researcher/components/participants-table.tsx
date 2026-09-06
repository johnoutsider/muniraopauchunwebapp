'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { RotateCcw, UserMinus } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/shared/data-table'
import { formatDate } from '@/lib/utils/format'

import { restoreParticipantAction, withdrawParticipantAction } from '../actions'
import type { ParticipantMappingRow } from '../queries'

export interface ParticipantsTableProps {
  rows: ParticipantMappingRow[]
}

/**
 * MAXFIY jadval: ishtirokchi kodi ↔ talaba. Faqat shu sahifada ochiladi va
 * hech qachon eksport qilinmaydi (PLAN 9.3, 9.4 — informed consent sharti).
 */
export function ParticipantsTable({ rows }: ParticipantsTableProps) {
  const router = useRouter()
  const [target, setTarget] = React.useState<ParticipantMappingRow | null>(null)
  const [reason, setReason] = React.useState('')
  const [pending, setPending] = React.useState(false)

  async function withdraw() {
    if (!target) return
    setPending(true)
    try {
      const result = await withdrawParticipantAction({ uid: target.uid, reason })
      if (result.ok) {
        toast.success('Ishtirokchi tadqiqotdan chiqarildi — ma’lumoti eksportga kirmaydi')
        setTarget(null)
        setReason('')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  async function restore(uid: string) {
    const result = await restoreParticipantAction(uid)
    if (result.ok) {
      toast.success('Ishtirokchi tadqiqotga qaytarildi')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const columns = React.useMemo<ColumnDef<ParticipantMappingRow, unknown>[]>(
    () => [
      {
        accessorKey: 'participantCode',
        header: 'Kod',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.participantCode}</span>
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
      { accessorKey: 'groupName', header: 'Guruh' },
      {
        accessorKey: 'expGroup',
        header: 'Tur',
        cell: ({ row }) =>
          row.original.expGroup ? (
            <Badge variant={row.original.expGroup === 'experimental' ? 'default' : 'secondary'}>
              {row.original.expGroup === 'experimental' ? 'Eksperimental' : 'Nazorat'}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'consentGiven',
        header: 'Rozilik',
        cell: ({ row }) =>
          row.original.consentGiven ? (
            <Badge variant="success">Berilgan</Badge>
          ) : (
            <Badge variant="warning">Yo‘q</Badge>
          ),
      },
      {
        accessorKey: 'withdrawn',
        header: 'Holat',
        cell: ({ row }) =>
          row.original.withdrawn ? (
            <Badge variant="danger">Chiqarilgan</Badge>
          ) : (
            <Badge variant="outline">Tadqiqotda</Badge>
          ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: 'Oxirgi faollik',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.lastActiveAt ? formatDate(row.original.lastActiveAt) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.withdrawn ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void restore(row.original.uid)}
            >
              <RotateCcw />
              Qaytarish
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTarget(row.original)}
            >
              <UserMinus />
              Chiqarish
            </Button>
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
        searchPlaceholder="Kod, ism yoki email bo‘yicha qidirish…"
        emptyMessage="Ishtirokchi topilmadi"
      />

      <Dialog open={target !== null} onOpenChange={(open) => (open ? null : setTarget(null))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tadqiqotdan chiqarish</DialogTitle>
            <DialogDescription>
              {target?.displayName} ({target?.participantCode}) platformadan foydalanishda davom
              etadi, lekin uning ma’lumotlari BARCHA eksport fayllaridan chiqarib tashlanadi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Sabab (ixtiyoriy, jurnalda saqlanadi)</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Masalan: ishtirokchi rozilikni qaytarib oldi"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button variant="destructive" loading={pending} onClick={() => void withdraw()}>
              Chiqarish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
