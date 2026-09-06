import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  Bot,
  GraduationCap,
  MessageSquare,
  MessagesSquare,
  UsersRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { StatCard } from '@/components/shared/stat-card'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { getCommunicationOverview, listChatCandidates } from '@/features/chat/queries'
import { ChatList } from '@/features/chat/chat-list'
import { NewChatDialog } from '@/features/chat/new-chat-dialog'
import { OpenGroupChannelButton } from '@/features/chat/open-group-channel-button'
import { StartChatButton } from '@/features/chat/start-chat-button'

export const metadata: Metadata = { title: 'Muloqot markazi' }
export const dynamic = 'force-dynamic'

export default async function CommunicationHubPage() {
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  const [overview, candidates] = await Promise.all([
    getCommunicationOverview(user.uid, user.groupId),
    listChatCandidates(user.uid, user.groupId),
  ])

  const teacher = candidates.find((candidate) => candidate.role === 'teacher')
  const teacherChat = overview.chats.find((chat) => chat.type === 'teacher')
  const recentChats = overview.chats.slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Muloqot markazi"
        description="6-bosqich: produktiv-kommunikativ ish — sinfdoshlar, o‘qituvchi va guruh bilan ingliz tilida yozishing."
        actions={<NewChatDialog candidates={candidates} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="O‘qilmagan xabarlar"
          value={overview.totalUnread}
          sublabel={overview.totalUnread ? 'Javob berishni unutmang' : 'Hammasi o‘qilgan'}
          icon={<MessagesSquare className="size-4" />}
          tone={overview.totalUnread ? 'warning' : 'default'}
        />
        <StatCard
          label="Shaxsiy suhbatlar"
          value={overview.chats.filter((chat) => chat.type === 'dm').length}
          sublabel={overview.dmUnread ? `${overview.dmUnread} ta yangi` : 'Yangi xabar yo‘q'}
          icon={<MessageSquare className="size-4" />}
        />
        <StatCard
          label="Guruh kanali"
          value={overview.groupChatId ? 'Ochiq' : 'Yopiq'}
          sublabel={overview.groupUnread ? `${overview.groupUnread} ta yangi` : 'Yangi xabar yo‘q'}
          icon={<UsersRound className="size-4" />}
        />
        <StatCard
          label="Forumda yangi mavzular"
          value={overview.forumNewThreads}
          sublabel="Oxirgi 7 kun"
          icon={<MessagesSquare className="size-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {flags.aiTutor ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-primary" />
                AI o‘qituvchi bilan chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                24/7 ochiq: grammatikani tushuntirish, so‘z o‘rgatish, role-play mashqlari.
              </p>
              <Button asChild className="w-full">
                <Link href="/student/ai-teacher">
                  Suhbatni boshlash
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-primary" />
              Sinfdoshlar bilan yozishmalar
              {overview.dmUnread ? <Badge className="ml-auto">{overview.dmUnread}</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Shaxsiy suhbatlar: topshiriqni muhokama qiling, matn almashing, fikr so‘rang.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/student/communication/chats">
                Barcha suhbatlar
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="size-4 text-primary" />
              O‘qituvchi bilan suhbat
              {overview.teacherUnread ? (
                <Badge className="ml-auto">{overview.teacherUnread}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Topshiriq, baho yoki deadline bo‘yicha savolingizni bevosita o‘qituvchingizga yozing.
            </p>
            {teacherChat ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/student/communication/chats/${teacherChat.id}`}>
                  Suhbatni ochish
                  <ArrowRight />
                </Link>
              </Button>
            ) : teacher ? (
              <StartChatButton
                targetUid={teacher.uid}
                label={`${teacher.name} bilan yozish`}
                className="w-full"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Guruhingizga hali o‘qituvchi biriktirilmagan.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="size-4 text-primary" />
              Guruh kanali
              {overview.groupUnread ? (
                <Badge className="ml-auto">{overview.groupUnread}</Badge>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Guruhning umumiy kanali: e’lonlar, topshiriqlar va jamoaviy muhokama.
            </p>
            {!user.groupId ? (
              <p className="text-sm text-muted-foreground">Siz hali guruhga biriktirilmagansiz.</p>
            ) : overview.groupChatId ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/student/communication/groups/${user.groupId}`}>
                  Kanalga o‘tish
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <OpenGroupChannelButton groupId={user.groupId} />
            )}
          </CardContent>
        </Card>

        {flags.forum ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessagesSquare className="size-4 text-primary" />
                Muhokama forumi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Mavzuli muhokamalar, teglar va like’lar — global yoki faqat guruhingiz ichida.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/student/communication/forum">
                  Forumga o‘tish
                  <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Oxirgi suhbatlar</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/student/communication/chats">Barchasi</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentChats.length === 0 ? (
            <EmptyState
              title="Hali suhbat yo‘q"
              description="Sinfdoshingiz yoki o‘qituvchingiz bilan birinchi suhbatni boshlang."
              action={<NewChatDialog candidates={candidates} />}
            />
          ) : (
            <ChatList chats={recentChats} myUid={user.uid} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
