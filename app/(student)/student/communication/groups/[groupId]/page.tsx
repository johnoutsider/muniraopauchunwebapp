import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarClock, Pin, UsersRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { getGroup } from '@/features/shared/queries'
import { getGroupChat, listGroupAssignments } from '@/features/chat/queries'
import { ChatWindow } from '@/features/chat/chat-window'
import { OpenGroupChannelButton } from '@/features/chat/open-group-channel-button'
import { formatDate, toMillis } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Guruh kanali' }
export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<string, string> = {
  lesson: 'Dars',
  practice: 'Mashq',
  writing: 'Yozma ish',
  speaking: 'Og‘zaki ish',
  test: 'Test',
  project: 'Loyiha',
}

export default async function GroupChannelPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const user = await requireStudent()

  // Faqat o'z guruhining kanali (server tekshiruvi — UI'ga tayanilmaydi)
  if (user.groupId !== groupId) notFound()

  const [group, chat, assignments] = await Promise.all([
    getGroup(groupId),
    getGroupChat(groupId, user.uid),
    listGroupAssignments(groupId),
  ])
  if (!group) notFound()

  const now = Date.now()

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description="Guruhning umumiy kanali: e’lonlar, topshiriqlar va jamoaviy muhokama."
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Guruh kanali' },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/student/communication/chats">Barcha suhbatlar</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {chat ? (
            <ChatWindow
              chatId={chat.id}
              me={{ uid: user.uid, displayName: user.displayName }}
              showSenderNames
              heightClass="h-[60vh]"
              emptyTitle="Kanalda hali xabar yo‘q"
              emptyDescription="Guruhdoshlaringizga birinchi xabarni yozing."
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={<UsersRound />}
                  title="Guruh kanali hali ochilmagan"
                  description="Kanalni oching — guruhdagi barcha talabalar va o‘qituvchi unga qo‘shiladi."
                  action={<OpenGroupChannelButton groupId={groupId} />}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Qadalgan panel: guruh topshiriqlari */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pin className="size-4 text-primary" />
              Guruh topshiriqlari
            </CardTitle>
            <Badge variant="secondary">{assignments.length}</Badge>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <EmptyState
                title="Topshiriq yo‘q"
                description="O‘qituvchi topshiriq bergach, u shu yerda ko‘rinadi."
              />
            ) : (
              <ul className="space-y-2">
                {assignments.map((assignment) => {
                  const due = toMillis(assignment.dueAt)
                  const overdue = due > 0 && due < now
                  return (
                    <li key={assignment.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-medium">{assignment.title}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {KIND_LABEL[assignment.kind] ?? assignment.kind}
                        </Badge>
                      </div>
                      {assignment.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {assignment.description}
                        </p>
                      ) : null}
                      <p
                        className={`mt-1.5 flex items-center gap-1 text-xs ${
                          overdue ? 'text-destructive' : 'text-muted-foreground'
                        }`}
                      >
                        <CalendarClock className="size-3.5" />
                        {formatDate(assignment.dueAt)}
                        {overdue ? ' · muddati o‘tdi' : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
