import type { Metadata } from 'next'
import { MessagesSquare } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { listChatCandidates, listMyChats } from '@/features/chat/queries'
import { ChatList } from '@/features/chat/chat-list'
import { NewChatDialog } from '@/features/chat/new-chat-dialog'

export const metadata: Metadata = { title: 'Suhbatlar' }
export const dynamic = 'force-dynamic'

export default async function ChatsPage() {
  const user = await requireStudent()
  const [chats, candidates] = await Promise.all([
    listMyChats(user.uid),
    listChatCandidates(user.uid, user.groupId),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suhbatlar"
        description="Sinfdoshlar, o‘qituvchi, guruh va loyiha kanallari."
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Suhbatlar' },
        ]}
        actions={<NewChatDialog candidates={candidates} />}
      />

      <Card>
        <CardContent className="pt-6">
          {chats.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare />}
              title="Hali suhbat yo‘q"
              description="«Yangi suhbat» tugmasi orqali sinfdoshingiz yoki o‘qituvchingiz bilan yozishishni boshlang."
              action={<NewChatDialog candidates={candidates} />}
            />
          ) : (
            <ChatList chats={chats} myUid={user.uid} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
