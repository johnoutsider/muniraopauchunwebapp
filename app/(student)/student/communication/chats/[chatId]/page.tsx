import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { requireStudent } from '@/lib/firebase/session'
import { getChatForUser, listMyChats } from '@/features/chat/queries'
import { ChatList } from '@/features/chat/chat-list'
import { ChatWindow } from '@/features/chat/chat-window'

export const metadata: Metadata = { title: 'Suhbat' }
export const dynamic = 'force-dynamic'

const TYPE_LABEL = {
  dm: 'Shaxsiy suhbat',
  teacher: 'O‘qituvchi bilan suhbat',
  group: 'Guruh kanali',
  project: 'Loyiha kanali',
} as const

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params
  const user = await requireStudent()

  const chat = await getChatForUser(chatId, user.uid)
  if (!chat) notFound()

  const chats = await listMyChats(user.uid)
  const otherUid =
    chat.type === 'dm' || chat.type === 'teacher'
      ? chat.memberUids.find((uid) => uid !== user.uid)
      : undefined
  const title =
    (otherUid && chat.memberNames?.[otherUid]) || chat.title || TYPE_LABEL[chat.type] || 'Suhbat'

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={TYPE_LABEL[chat.type]}
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Suhbatlar', href: '/student/communication/chats' },
          { label: title },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/student/communication/chats">
              <ArrowLeft />
              Ro‘yxatga qaytish
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChatWindow
            chatId={chat.id}
            me={{ uid: user.uid, displayName: user.displayName }}
            otherUid={otherUid}
            showSenderNames={chat.type === 'group' || chat.type === 'project'}
            emptyTitle="Suhbat hali boshlanmagan"
            emptyDescription="Birinchi xabarni yozing. Ingliz tilida yozishga harakat qiling — bu 6-bosqich mashqi."
          />
        </div>

        <aside className="hidden space-y-3 lg:block">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Boshqa suhbatlar</p>
            <Badge variant="secondary">{chats.length}</Badge>
          </div>
          <ChatList chats={chats} activeChatId={chat.id} myUid={user.uid} />
        </aside>
      </div>
    </div>
  )
}
