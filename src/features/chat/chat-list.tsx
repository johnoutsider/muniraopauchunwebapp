import Link from 'next/link'
import { GraduationCap, MessageSquare, UsersRound, Briefcase } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { relativeTime } from '@/lib/utils/format'

import type { ChatSummary } from './types'

const TYPE_ICON = {
  dm: MessageSquare,
  teacher: GraduationCap,
  group: UsersRound,
  project: Briefcase,
} as const

const TYPE_LABEL = {
  dm: 'Shaxsiy',
  teacher: 'O‘qituvchi',
  group: 'Guruh',
  project: 'Loyiha',
} as const

/** Suhbatlar ro'yxati (server komponent — realtime kerak emas). */
export function ChatList({
  chats,
  activeChatId,
  myUid,
  className,
}: {
  chats: ChatSummary[]
  activeChatId?: string
  myUid: string
  className?: string
}) {
  return (
    <ul className={cn('space-y-1.5', className)}>
      {chats.map((chat) => {
        const Icon = TYPE_ICON[chat.type]
        const href =
          chat.type === 'group' && chat.groupId
            ? `/student/communication/groups/${chat.groupId}`
            : `/student/communication/chats/${chat.id}`

        return (
          <li key={chat.id}>
            <Link
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-muted/40',
                activeChatId === chat.id && 'border-primary/60 bg-muted/60'
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{chat.title}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {TYPE_LABEL[chat.type]}
                  </Badge>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {chat.lastMessageText
                    ? `${chat.lastMessageSenderUid === myUid ? 'Siz: ' : ''}${chat.lastMessageText}`
                    : 'Suhbat ochildi — birinchi xabarni yozing'}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[11px] text-muted-foreground">
                  {chat.lastMessageTs ? relativeTime(chat.lastMessageTs) : ''}
                </span>
                {chat.unread > 0 ? (
                  <Badge className="min-w-5 justify-center px-1.5">{chat.unread}</Badge>
                ) : null}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
