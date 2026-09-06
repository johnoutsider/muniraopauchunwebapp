'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'

import { saveCohortAction } from '../actions'

export interface CohortFormDialogProps {
  trigger: React.ReactNode
  teachers: Array<{ id: string; displayName: string }>
  cohort?: {
    id: string
    name: string
    university: string
    faculty?: string
    startDate?: string
    endDate?: string
    teacherIds: string[]
  }
}

function dateValue(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function CohortFormDialog({ trigger, teachers, cohort }: CohortFormDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [name, setName] = React.useState(cohort?.name ?? '')
  const [university, setUniversity] = React.useState(cohort?.university ?? '')
  const [faculty, setFaculty] = React.useState(cohort?.faculty ?? '')
  const [startDate, setStartDate] = React.useState(dateValue(cohort?.startDate))
  const [endDate, setEndDate] = React.useState(dateValue(cohort?.endDate))
  const [teacherIds, setTeacherIds] = React.useState<string[]>(cohort?.teacherIds ?? [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      const result = await saveCohortAction({
        id: cohort?.id,
        name,
        university,
        faculty,
        startDate,
        endDate: endDate || undefined,
        teacherIds,
      })
      if (result.ok) {
        toast.success(cohort ? 'Kohort yangilandi' : 'Kohort yaratildi')
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cohort ? 'Kohortni tahrirlash' : 'Yangi kohort'}</DialogTitle>
          <DialogDescription>
            Kohort — bitta o‘quv yilidagi talabalar to‘plami. Guruhlar kohort ichida tuziladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cohort-name">Nomi</Label>
            <Input
              id="cohort-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Masalan: 2027 — Iqtisodiyot fakulteti"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cohort-university">Universitet</Label>
              <Input
                id="cohort-university"
                value={university}
                onChange={(event) => setUniversity(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cohort-faculty">Fakultet</Label>
              <Input
                id="cohort-faculty"
                value={faculty}
                onChange={(event) => setFaculty(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cohort-start">Boshlanish</Label>
              <Input
                id="cohort-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cohort-end">Tugash</Label>
              <Input
                id="cohort-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>O‘qituvchilar</Label>
            <ScrollArea className="h-40 rounded-lg border border-border">
              <div className="divide-y divide-border">
                {teachers.map((teacher) => (
                  <label
                    key={teacher.id}
                    className="flex items-center gap-3 p-3 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={teacherIds.includes(teacher.id)}
                      onCheckedChange={() =>
                        setTeacherIds((prev) =>
                          prev.includes(teacher.id)
                            ? prev.filter((id) => id !== teacher.id)
                            : [...prev, teacher.id]
                        )
                      }
                    />
                    <span>{teacher.displayName}</span>
                  </label>
                ))}
                {teachers.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    O‘qituvchi topilmadi
                  </p>
                ) : null}
              </div>
            </ScrollArea>
          </div>

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
