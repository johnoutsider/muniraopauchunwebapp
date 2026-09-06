'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ThumbsUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

import { toggleLikeAction } from './actions'

/** Like tugmasi — mavzu yoki javob uchun (optimistik). */
export function LikeButton({
  threadId,
  postId,
  likes,
  myUid,
}: {
  threadId: string
  postId?: string
  likes: string[]
  myUid: string
}) {
  const router = useRouter()
  const [liked, setLiked] = React.useState(likes.includes(myUid))
  const [count, setCount] = React.useState(likes.length)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    setLiked(likes.includes(myUid))
    setCount(likes.length)
  }, [likes, myUid])

  async function toggle() {
    setPending(true)
    setLiked((prev) => !prev)
    setCount((prev) => prev + (liked ? -1 : 1))

    const result = await toggleLikeAction({ threadId, postId })
    setPending(false)

    if (!result.ok) {
      setLiked(likes.includes(myUid))
      setCount(likes.length)
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => void toggle()}
      aria-pressed={liked}
      aria-label={liked ? 'Like’ni olib tashlash' : 'Like bosish'}
      className={cn('h-7 gap-1 px-2 text-xs', liked && 'text-primary')}
    >
      <ThumbsUp className={cn('size-3.5', liked && 'fill-current')} />
      {count}
    </Button>
  )
}
