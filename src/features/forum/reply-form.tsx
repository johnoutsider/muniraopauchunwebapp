'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CornerDownLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { createPostAction } from './actions'

/** Mavzuga javob yozish. */
export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter()
  const [text, setText] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const result = await createPostAction({ threadId, text })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setText('')
    toast.success('Javob qo‘shildi.')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Textarea
        value={text}
        rows={4}
        maxLength={8000}
        required
        aria-label="Javob matni"
        placeholder="Javobingizni yozing… Ingliz tilidagi misol yoki manba keltirsangiz, muhokama foydaliroq bo‘ladi."
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{text.length} / 8000 belgi</p>
        <Button type="submit" size="sm" loading={loading} disabled={text.trim().length < 2}>
          <CornerDownLeft />
          Javob yuborish
        </Button>
      </div>
    </form>
  )
}
