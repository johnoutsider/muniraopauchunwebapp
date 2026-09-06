'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ChevronUp, Loader2, Paperclip, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Spinner } from '@/components/shared/loading-state'
import { cn } from '@/lib/utils/cn'
import { relativeTime, toMillis } from '@/lib/utils/format'
import type { TimeValue } from '@/types'

import { markChatReadAction, sendChatMessageAction, setTypingAction } from './actions'
import { MessageAttachment } from './message-attachment'
import {
  useChatDoc,
  useChatMessages,
  usePresenceHeartbeat,
  useTypingNames,
  useUserPresence,
} from './use-realtime'
import { uploadChatAttachment } from './upload'
import {
  MAX_MESSAGE_LENGTH,
  TYPING_THROTTLE_MS,
  type ChatAttachment,
  type PendingChatMessage,
} from './types'

export interface ChatWindowProps {
  chatId: string
  me: { uid: string; displayName: string }
  /** DM/o'qituvchi suhbatida — suhbatdoshning presence holati ko'rsatiladi */
  otherUid?: string
  /** Guruh/loyiha kanalida yuboruvchining ismi har xabarda ko'rsatiladi */
  showSenderNames?: boolean
  heightClass?: string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

/**
 * Realtime chat oynasi (PLAN 8.9).
 * O'qish — `onSnapshot`, yozish — Server Action (analitika + `lastMessage`).
 */
export function ChatWindow({
  chatId,
  me,
  otherUid,
  showSenderNames = false,
  heightClass = 'h-[62vh]',
  emptyTitle = 'Hali xabar yo‘q',
  emptyDescription = 'Birinchi xabarni yozing — suhbat shu yerda ko‘rinadi.',
  className,
}: ChatWindowProps) {
  const { messages, status, error, hasMore, loadingMore, loadOlder } = useChatMessages(chatId)
  const { chat } = useChatDoc(chatId)
  const typingNames = useTypingNames(chat, me.uid)
  const presence = useUserPresence(otherUid)
  usePresenceHeartbeat(me.uid)

  const [pending, setPending] = React.useState<PendingChatMessage[]>([])
  const [text, setText] = React.useState('')
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [uploading, setUploading] = React.useState<number | null>(null)
  const [sending, setSending] = React.useState(false)

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const lastTypingSentRef = React.useRef(0)
  const stickToBottomRef = React.useRef(true)

  /* --- avtomatik pastga aylantirish --- */
  React.useEffect(() => {
    const node = scrollRef.current
    if (!node || !stickToBottomRef.current) return
    node.scrollTop = node.scrollHeight
  }, [messages.length, pending.length, typingNames.length])

  /* --- server tomonda kelgan xabar optimistik nusxani almashtiradi --- */
  React.useEffect(() => {
    if (!pending.length) return
    const arrived = new Set(messages.map((message) => message.clientId).filter(Boolean))
    if (!arrived.size) return
    setPending((prev) => prev.filter((item) => item.failed || !arrived.has(item.clientId)))
  }, [messages, pending.length])

  /* --- o'qildi belgisi (faqat begona xabar kelganda) --- */
  const lastMessage = messages.at(-1)
  const lastForeignMessageId =
    lastMessage && lastMessage.senderUid !== me.uid ? lastMessage.id : null
  React.useEffect(() => {
    if (status !== 'ready') return
    const timer = setTimeout(() => void markChatReadAction(chatId), 400)
    return () => clearTimeout(timer)
  }, [chatId, status, lastForeignMessageId])

  function autoGrow() {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 160)}px`
  }

  function notifyTyping() {
    const now = Date.now()
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
    lastTypingSentRef.current = now
    void setTypingAction(chatId, true)
  }

  async function handleSend() {
    const trimmed = text.trim()
    if ((!trimmed && !attachments.length) || sending) return
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Xabar ${MAX_MESSAGE_LENGTH} belgidan oshmasligi kerak.`)
      return
    }

    const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimistic: PendingChatMessage = { clientId, text: trimmed, attachments }

    setPending((prev) => [...prev, optimistic])
    setText('')
    setAttachments([])
    stickToBottomRef.current = true
    requestAnimationFrame(autoGrow)
    setSending(true)

    const result = await sendChatMessageAction({
      chatId,
      text: trimmed,
      clientId,
      attachments: optimistic.attachments,
    })
    setSending(false)
    lastTypingSentRef.current = 0
    void setTypingAction(chatId, false)

    if (!result.ok) {
      setPending((prev) =>
        prev.map((item) => (item.clientId === clientId ? { ...item, failed: true } : item))
      )
      toast.error(result.error)
    }
  }

  async function handleFile(file: File) {
    setUploading(0)
    const result = await uploadChatAttachment(chatId, file, (percent) => setUploading(percent))
    setUploading(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setAttachments((prev) => [...prev, result.data])
  }

  const disabled = status === 'error'

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border', className)}>
      {/* Holat qatori: presence + typing */}
      <div className="flex min-h-9 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-xs">
        <span className="flex items-center gap-2 text-muted-foreground">
          {otherUid ? (
            presence?.online ? (
              <>
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                online
              </>
            ) : (
              <>
                <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden="true" />
                oxirgi faollik: {relativeTime(presence?.lastSeen)}
              </>
            )
          ) : (
            <span>{chat?.memberUids?.length ?? 0} ta ishtirokchi</span>
          )}
        </span>
        <span className="truncate text-muted-foreground">
          {typingNames.length
            ? `${typingNames.slice(0, 2).join(', ')} yozmoqda…`
            : sending
              ? 'yuborilmoqda…'
              : ''}
        </span>
      </div>

      {/* Xabarlar */}
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const node = event.currentTarget
          stickToBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80
        }}
        className={cn('flex-1 space-y-2 overflow-y-auto bg-background p-3', heightClass)}
      >
        {status === 'error' ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex max-w-md flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium">Xabarlarni ko‘rsatib bo‘lmadi</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Sahifani yangilash
              </Button>
            </div>
          </div>
        ) : status === 'loading' ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 && pending.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} className="h-full" />
        ) : (
          <>
            {hasMore ? (
              <div className="flex justify-center pb-1">
                <Button size="sm" variant="ghost" onClick={loadOlder} disabled={loadingMore}>
                  {loadingMore ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ChevronUp className="size-4" />
                  )}
                  Eski xabarlarni yuklash
                </Button>
              </div>
            ) : null}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                mine={message.senderUid === me.uid}
                senderName={message.senderName}
                showSenderName={showSenderNames}
                text={message.deleted ? 'Xabar o‘chirilgan' : message.text}
                muted={Boolean(message.deleted)}
                ts={message.ts}
                attachments={
                  message.deleted ? [] : ((message.attachments ?? []) as ChatAttachment[])
                }
              />
            ))}

            {pending.map((item) => (
              <MessageBubble
                key={item.clientId}
                mine
                senderName={me.displayName}
                showSenderName={showSenderNames}
                text={item.text}
                attachments={item.attachments}
                pending={!item.failed}
                failed={item.failed}
              />
            ))}
          </>
        )}
      </div>

      {/* Kiritish maydoni */}
      <div className="border-t border-border bg-muted/30 p-2">
        {attachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((attachment) => (
              <Badge key={attachment.path} variant="secondary" className="max-w-full gap-1">
                <span className="truncate">{attachment.name}</span>
                <button
                  type="button"
                  aria-label="Biriktirmani olib tashlash"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((item) => item.path !== attachment.path))
                  }
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        {uploading !== null ? (
          <p className="mb-2 text-xs text-muted-foreground">Fayl yuklanmoqda… {uploading}%</p>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void handleFile(file)
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Fayl biriktirish (rasm yoki PDF, 10 MB gacha)"
            disabled={disabled || uploading !== null}
            onClick={() => fileRef.current?.click()}
          >
            {uploading !== null ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Paperclip className="size-4" />
            )}
          </Button>

          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            disabled={disabled}
            placeholder="Xabar yozing… (Enter — yuborish, Shift+Enter — yangi qator)"
            aria-label="Xabar matni"
            onChange={(event) => {
              setText(event.target.value)
              autoGrow()
              notifyTyping()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void handleSend()
              }
            }}
            className="max-h-40 min-h-9 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />

          <Button
            type="button"
            size="icon"
            aria-label="Yuborish"
            disabled={disabled || sending || (!text.trim() && !attachments.length)}
            onClick={() => void handleSend()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  mine,
  senderName,
  showSenderName,
  text,
  ts,
  attachments = [],
  pending,
  failed,
  muted,
}: {
  mine: boolean
  senderName: string
  showSenderName?: boolean
  text: string
  ts?: TimeValue
  attachments?: ChatAttachment[]
  pending?: boolean
  failed?: boolean
  muted?: boolean
}) {
  const time = toMillis(ts)
  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm sm:max-w-[70%]',
          mine
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
          failed && 'border border-destructive/60 opacity-80',
          pending && 'opacity-70'
        )}
      >
        {showSenderName && !mine ? (
          <p className="mb-0.5 text-xs font-medium opacity-80">{senderName}</p>
        ) : null}
        {text ? (
          <p className={cn('whitespace-pre-wrap break-words', muted && 'italic opacity-70')}>
            {text}
          </p>
        ) : null}
        {attachments.map((attachment) => (
          <MessageAttachment key={attachment.path} attachment={attachment} />
        ))}
        <p
          className={cn(
            'mt-1 text-right text-[10px]',
            mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {failed
            ? 'yuborilmadi'
            : pending
              ? 'yuborilmoqda…'
              : time
                ? new Date(time).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
        </p>
      </div>
    </div>
  )
}
