'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { moveStudentsAction } from '../actions'

export interface MoveStudentsDialogProps {
  students: Array<{ uid: string; displayName: string; groupName: string }>
  groups: Array<{ id: string; name: string; type: 'experimental' | 'control' }>
}

export function MoveStudentsDialog({ students, groups }: MoveStudentsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [targetGroup, setTargetGroup] = React.useState(groups[0]?.id ?? '')

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return students
    return students.filter(
      (student) =>
        student.displayName.toLowerCase().includes(needle) ||
        student.groupName.toLowerCase().includes(needle)
    )
  }, [students, query])

  const target = groups.find((group) => group.id === targetGroup)

  async function submit() {
    setPending(true)
    try {
      const result = await moveStudentsAction({ uids: [...selected], groupId: targetGroup })
      if (result.ok) {
        toast.success(`${result.data.moved} ta talaba ko‘chirildi`)
        setSelected(new Set())
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
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowRightLeft />
          Talabalarni ko‘chirish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Talabalarni guruhga ko‘chirish</DialogTitle>
          <DialogDescription>
            Ko‘chirish talabaning `expGroup` qiymatini ham o‘zgartiradi — bu eksperiment guruhini
            almashtirish demakdir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Qaysi guruhga</Label>
            <Select value={targetGroup} onValueChange={setTargetGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Guruhni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({group.type === 'experimental' ? 'eksperimental' : 'nazorat'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {target ? (
            <Alert variant="warning">
              <AlertDescription className="text-xs">
                Tanlangan talabalar «{target.name}» guruhiga o‘tadi va{' '}
                {target.type === 'experimental'
                  ? 'AI imkoniyatlari yoqiladi'
                  : 'AI imkoniyatlari o‘chiriladi'}
                . Eksperiment boshlangandan keyin bunday ko‘chirish tahlilga ta’sir qiladi.
              </AlertDescription>
            </Alert>
          ) : null}

          <Input
            placeholder="Talaba yoki guruh bo‘yicha qidirish…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <ScrollArea className="h-64 rounded-lg border border-border">
            <div className="divide-y divide-border">
              {filtered.map((student) => (
                <label
                  key={student.uid}
                  className="flex items-center gap-3 p-3 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selected.has(student.uid)}
                    onCheckedChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(student.uid)) next.delete(student.uid)
                        else next.add(student.uid)
                        return next
                      })
                    }
                  />
                  <span className="min-w-0 flex-1 truncate">{student.displayName}</span>
                  <span className="text-xs text-muted-foreground">{student.groupName}</span>
                </label>
              ))}
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Talaba topilmadi</p>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <p className="mr-auto text-xs text-muted-foreground">{selected.size} ta tanlandi</p>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Bekor qilish
          </Button>
          <Button
            loading={pending}
            disabled={!selected.size || !targetGroup}
            onClick={() => void submit()}
          >
            Ko‘chirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
