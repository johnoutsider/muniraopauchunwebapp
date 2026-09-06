import Link from 'next/link'
import type { Metadata } from 'next'
import { MessageSquarePlus, MessagesSquare, Pin, ThumbsUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { collectTags, listThreads, type ForumSort } from '@/features/forum/queries'
import { ThreadFilters } from '@/features/forum/thread-filters'
import { relativeTime, truncate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Muhokama forumi' }
export const dynamic = 'force-dynamic'

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string; q?: string }>
}) {
  const user = await requireStudent()
  const flags = await resolveFlags(user)
  const { sort: sortParam, tag, q } = await searchParams
  const sort: ForumSort = sortParam === 'new' ? 'new' : 'active'

  if (!flags.forum) {
    return (
      <div className="space-y-6">
        <PageHeader title="Muhokama forumi" />
        <EmptyState
          title="Forum yoqilmagan"
          description="Bu imkoniyat sizning guruhingiz uchun o‘chirilgan. O‘qituvchingizga murojaat qiling."
        />
      </div>
    )
  }

  const [threads, allThreads] = await Promise.all([
    listThreads({ groupId: user.groupId, sort, tag, search: q }),
    listThreads({ groupId: user.groupId, sort }),
  ])
  const tags = collectTags(allThreads)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Muhokama forumi"
        description="Savol bering, javob yozing va sinfdoshlaringiz bilan kasbiy ingliz tilida muhokama qiling."
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Forum' },
        ]}
        actions={
          <Button asChild>
            <Link href="/student/communication/forum/new">
              <MessageSquarePlus />
              Yangi mavzu
            </Link>
          </Button>
        }
      />

      <ThreadFilters tags={tags} sort={sort} tag={tag} search={q} />

      {threads.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<MessagesSquare />}
              title={q || tag ? 'Mos mavzu topilmadi' : 'Forumda hali mavzu yo‘q'}
              description={
                q || tag
                  ? 'Qidiruv shartini o‘zgartiring yoki filtrni tozalang.'
                  : 'Birinchi mavzuni siz oching — savolingizni yozing yoki muhokama boshlang.'
              }
              action={
                <Button asChild size="sm">
                  <Link href="/student/communication/forum/new">Yangi mavzu ochish</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/student/communication/forum/${thread.id}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {thread.pinned ? (
                        <Pin className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                      ) : null}
                      <span className="truncate">{thread.title}</span>
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {truncate(thread.body.replace(/\s+/g, ' '), 180)}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {thread.groupId ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Guruh ichida
                        </Badge>
                      ) : null}
                      {(thread.tags ?? []).map((item) => (
                        <Badge key={item} variant="outline" className="text-[10px]">
                          #{item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="size-3.5" />
                      {thread.postCount ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="size-3.5" />
                      {thread.likes?.length ?? 0}
                    </span>
                    <span>{relativeTime(thread.lastPostAt)}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{thread.authorName}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
