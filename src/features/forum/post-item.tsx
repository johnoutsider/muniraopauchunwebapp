'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { initials, relativeTime } from '@/lib/utils/format'
import type { TimeValue } from '@/types'

import { deletePostAction, updatePostAction } from './actions'
import { LikeButton } from './like-button'

export interface PostItemProps {
  threadId: string
  post: {
    id: string
    authorUid: string
    authorName: string
    text: string
    likes: string[]
    ts: TimeValue
  }
  myUid: string
}

/** Forum javobi. Tahrirlash/o'chirish faqat o'z javobi uchun ko'rsatiladi va serverda tekshiriladi. */
export function PostItem({ threadId, post, myUid }: PostItemProps) {
  const router = useRouter()
  const mine = post.authorUid === myUid
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState(post.text)
  const [loading, setLoading] = React.useState(false)

  async function save() {
    setLoading(true)
    const result = await updatePostAction({ threadId, postId: post.id, text })
    setLoading(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setEditing(false)
    toast.success('Javob yangilandi.')
    router.refresh()
  }

  async function remove() {
    const result = await deletePostAction({ threadId, postId: post.id })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Javob o‘chirildi.')
    router.refresh()
  }

  return (
    <article className="rounded-lg border border-border p-4">
      <header className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials(post.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{post.authorName}</p>
          <p className="text-xs text-muted-foreground">{relativeTime(post.ts)}</p>
        </div>
        {mine && !editing ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Tahrirlash"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive"
                  aria-label="O‘chirish"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
              title="Javobni o‘chirish"
              description="Bu amalni ortga qaytarib bo‘lmaydi. Javob butunlay o‘chiriladi."
              confirmLabel="O‘chirish"
              destructive
              onConfirm={remove}
            />
          </div>
        ) : null}
      </header>

      {editing ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={text}
            rows={5}
            maxLength={8000}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" loading={loading} onClick={() => void save()}>
              Saqlash
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setText(post.text)
                setEditing(false)
              }}
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm">{post.text}</p>
      )}

      <footer className="mt-2">
        <LikeButton threadId={threadId} postId={post.id} likes={post.likes ?? []} myUid={myUid} />
      </footer>
    </article>
  )
}
