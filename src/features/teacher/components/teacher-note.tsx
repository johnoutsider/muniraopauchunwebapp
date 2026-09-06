'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { NotebookPen, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/utils/format'

import { saveTeacherNoteAction } from '../actions'

export interface TeacherNoteCardProps {
  uid: string
  initialText: string
  savedAt?: string | number | null
}

/** Talaba haqida o'qituvchi izohi — faqat shu o'qituvchiga ko'rinadi. */
export function TeacherNoteCard({ uid, initialText, savedAt }: TeacherNoteCardProps) {
  const router = useRouter()
  const [text, setText] = React.useState(initialText)
  const [pending, setPending] = React.useState(false)
  const dirty = text !== initialText

  async function save() {
    setPending(true)
    try {
      const result = await saveTeacherNoteAction({ uid, text })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Izoh saqlandi')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="size-4 text-muted-foreground" />
          Pedagogik izoh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Kuzatuvlaringiz, tavsiyalar, individual ish rejasi…"
          rows={5}
          maxLength={4000}
          disabled={pending}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {savedAt ? `Oxirgi saqlash: ${formatDateTime(savedAt)}` : 'Hali saqlanmagan'} · faqat
            sizga ko‘rinadi
          </p>
          <Button type="button" size="sm" onClick={save} loading={pending} disabled={!dirty}>
            <Save />
            Saqlash
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
