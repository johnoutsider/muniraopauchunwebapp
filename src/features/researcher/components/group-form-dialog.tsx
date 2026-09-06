'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ExperimentGroup } from '@/config/constants'

import { saveGroupAction } from '../actions'

export interface GroupFormDialogProps {
  trigger: React.ReactNode
  cohorts: Array<{ id: string; name: string }>
  teachers: Array<{ id: string; displayName: string }>
  group?: {
    id: string
    name: string
    cohortId: string
    type: ExperimentGroup
    teacherId?: string
  }
}

const NONE = '__none__'

export function GroupFormDialog({ trigger, cohorts, teachers, group }: GroupFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState(group?.name ?? '')
  const [cohortId, setCohortId] = React.useState(group?.cohortId ?? cohorts[0]?.id ?? '')
  const [type, setType] = React.useState<ExperimentGroup>(group?.type ?? 'experimental')
  const [teacherId, setTeacherId] = React.useState(group?.teacherId ?? NONE)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveGroupAction({
        id: group?.id,
        name,
        cohortId,
        type,
        teacherId: teacherId === NONE ? undefined : teacherId,
      })
      if (result.ok) {
        toast.success(group ? 'Guruh yangilandi' : 'Guruh yaratildi')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{group ? 'Guruhni tahrirlash' : 'Yangi guruh'}</DialogTitle>
          <DialogDescription>
            Guruh turi eksperimentning mustaqil o‘zgaruvchisini belgilaydi — nazorat guruhida AI
            imkoniyatlari avtomatik o‘chiriladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Nomi</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Masalan: 3-A (eksperimental)"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kohort</Label>
            <Select value={cohortId} onValueChange={setCohortId}>
              <SelectTrigger>
                <SelectValue placeholder="Kohortni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Turi</Label>
            <Select value={type} onValueChange={(value) => setType(value as ExperimentGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="experimental">Eksperimental (AI yoqilgan)</SelectItem>
                <SelectItem value="control">Nazorat (AI o‘chirilgan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>O‘qituvchi</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Tayinlanmagan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Tayinlanmagan</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'control' ? (
            <Alert variant="warning">
              <AlertDescription>
                Nazorat guruhida aiTutor, aiFeedback, adaptive, pronunciationAI, aiRolePlay,
                promptLab, corpusVerification va semanticNetwork o‘chiriladi. Bu — eksperimentning
                mustaqil o‘zgaruvchisi.
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
