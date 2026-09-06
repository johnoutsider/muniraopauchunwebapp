'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { createThreadAction, updateThreadAction } from './actions'

export interface ThreadFormProps {
  hasGroup: boolean
  /** Tahrirlash rejimi */
  thread?: { id: string; title: string; body: string; tags: string[] }
}

/** Yangi mavzu ochish yoki o'z mavzusini tahrirlash. */
export function ThreadForm({ hasGroup, thread }: ThreadFormProps) {
  const router = useRouter()
  const [title, setTitle] = React.useState(thread?.title ?? '')
  const [body, setBody] = React.useState(thread?.body ?? '')
  const [tags, setTags] = React.useState((thread?.tags ?? []).join(', '))
  const [scope, setScope] = React.useState<'global' | 'group'>('global')
  const [loading, setLoading] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (thread) {
      const result = await updateThreadAction({ threadId: thread.id, title, body, tags: tagList })
      setLoading(false)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Mavzu yangilandi.')
      router.push(`/student/communication/forum/${thread.id}`)
      router.refresh()
      return
    }

    const result = await createThreadAction({ title, body, tags: tagList, scope })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Mavzu ochildi.')
    router.push(`/student/communication/forum/${result.data.threadId}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="thread-title">Sarlavha</Label>
        <Input
          id="thread-title"
          value={title}
          maxLength={200}
          required
          placeholder="Masalan: Present Perfect'ni hisobotlarda qanday ishlatamiz?"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thread-body">Matn</Label>
        <Textarea
          id="thread-body"
          value={body}
          rows={8}
          maxLength={8000}
          required
          placeholder="Savolingizni yoki fikringizni batafsil yozing. Iqtisodiy kontekstdagi misol keltiring."
          onChange={(event) => setBody(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{body.length} / 8000 belgi</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="thread-tags">Teglar (vergul bilan)</Label>
        <Input
          id="thread-tags"
          value={tags}
          placeholder="grammar, finance, presentation"
          onChange={(event) => setTags(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Ko‘pi bilan 5 ta teg.</p>
      </div>

      {!thread ? (
        <div className="space-y-2">
          <Label>Kim ko‘radi?</Label>
          <RadioGroup
            value={scope}
            onValueChange={(value) => setScope(value as 'global' | 'group')}
            className="gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="global" id="scope-global" />
              <Label htmlFor="scope-global" className="font-normal">
                Barcha talabalar (global forum)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="group" id="scope-group" disabled={!hasGroup} />
              <Label htmlFor="scope-group" className="font-normal">
                Faqat mening guruhim
                {!hasGroup ? ' (siz guruhga biriktirilmagansiz)' : ''}
              </Label>
            </div>
          </RadioGroup>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" loading={loading}>
          <Send />
          {thread ? 'Saqlash' : 'Mavzuni ochish'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Bekor qilish
        </Button>
      </div>
    </form>
  )
}
