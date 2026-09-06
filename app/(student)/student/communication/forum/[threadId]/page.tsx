import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, MessagesSquare } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { getThread, listPosts } from '@/features/forum/queries'
import { LikeButton } from '@/features/forum/like-button'
import { PostItem } from '@/features/forum/post-item'
import { ReplyForm } from '@/features/forum/reply-form'
import { initials, relativeTime } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Mavzu' }
export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params
  const user = await requireStudent()

  const thread = await getThread(threadId, user.groupId)
  if (!thread) notFound()

  const posts = await listPosts(thread.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title={thread.title}
        description={`${thread.authorName} · ${relativeTime(thread.createdAt)}`}
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Forum', href: '/student/communication/forum' },
          { label: thread.title },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/student/communication/forum">
              <ArrowLeft />
              Forumga qaytish
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(thread.authorName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{thread.authorName}</p>
              <p className="text-xs text-muted-foreground">{relativeTime(thread.createdAt)}</p>
            </div>
            {thread.groupId ? <Badge variant="secondary">Guruh ichida</Badge> : null}
          </div>

          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{thread.body}</p>

          <div className="flex flex-wrap items-center gap-2">
            {(thread.tags ?? []).map((tag) => (
              <Link
                key={tag}
                href={`/student/communication/forum?tag=${encodeURIComponent(tag)}`}
                className="rounded-full"
              >
                <Badge variant="outline">#{tag}</Badge>
              </Link>
            ))}
            <div className="ml-auto">
              <LikeButton threadId={thread.id} likes={thread.likes ?? []} myUid={user.uid} />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Javoblar ({posts.length})</h2>
        {posts.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="Hali javob yo‘q"
            description="Birinchi bo‘lib javob yozing — muallif javobingizni kutmoqda."
          />
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <PostItem key={post.id} threadId={thread.id} post={post} myUid={user.uid} />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardContent className="pt-6">
          <ReplyForm threadId={thread.id} />
        </CardContent>
      </Card>
    </div>
  )
}
