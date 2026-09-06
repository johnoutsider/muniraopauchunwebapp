'use client'

import * as React from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { toast } from 'sonner'
import { MessagesSquare, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/loading-state'
import { COL } from '@/config/constants'
import { getDb } from '@/lib/firebase/client'
import { cn } from '@/lib/utils/cn'
import { relativeTime } from '@/lib/utils/format'

import { sendTeacherMessageAction } from '../actions'

interface ChatMessage {
  id: string
  senderUid: string
  senderName: string
  text: string
  deleted?: boolean
  ts: number
}

export interface TeacherChatProps {
  chatId: string
  teacherUid: string
  studentUid: string
  studentName: string
}

/**
 * O'qituvchi ↔ talaba suhbati.
 * O'qish — realtime (`onSnapshot`, klient SDK), yozish — Server Action
 * (avtorizatsiya va bildirishnoma serverda bajariladi).
 */
export function TeacherChat({ chatId, teacherUid, studentUid, studentName }: TeacherChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[] | null>(null)
  const [text, setText] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMessages(null)
    setError(null)

    const messagesQuery = query(
      collection(getDb(), COL.chats, chatId, 'messages'),
      orderBy('ts', 'asc'),
      limit(200)
    )

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((doc) => {
            const data = doc.data() as {
              senderUid?: string
              senderName?: string
              text?: string
              deleted?: boolean
              ts?: { toDate?: () => Date }
            }
            return {
              id: doc.id,
              senderUid: data.senderUid ?? '',
              senderName: data.senderName ?? '',
              text: data.text ?? '',
              deleted: data.deleted,
              ts: data.ts?.toDate?.()?.getTime() ?? Date.now(),
            }
          })
        )
      },
      (err) => {
        console.error('[teacher-chat] snapshot error', err)
        setError('Suhbatni real vaqtda yuklab bo‘lmadi.')
        setMessages([])
      }
    )

    return () => unsubscribe()
  }, [chatId])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  async function submit() {
    const value = text.trim()
    if (!value || pending) return

    setPending(true)
    try {
      const result = await sendTeacherMessageAction({ studentUid, text: value })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setText('')
    } finally {
      setPending(false)
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    void submit()
  }

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">{studentName}</p>
        <p className="text-xs text-muted-foreground">Shaxsiy suhbat · real vaqtda</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages === null ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="Suhbat hali boshlanmagan"
            description={error ?? 'Birinchi xabarni yozing — talabaga bildirishnoma boradi.'}
          />
        ) : (
          messages
            .filter((message) => !message.deleted)
            .map((message) => {
              const mine = message.senderUid === teacherUid
              return (
                <div
                  key={message.id}
                  className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                      mine
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-muted/50'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px]',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {mine ? 'Siz' : message.senderName} · {relativeTime(message.ts)}
                    </p>
                  </div>
                </div>
              )
            })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
          placeholder="Xabar yozing… (Enter — yuborish, Shift+Enter — yangi satr)"
          rows={2}
          maxLength={2000}
          disabled={pending}
          className="min-h-0 flex-1 resize-none"
        />
        <Button type="submit" loading={pending} disabled={!text.trim()} size="icon">
          <Send />
          <span className="sr-only">Yuborish</span>
        </Button>
      </form>
    </div>
  )
}
