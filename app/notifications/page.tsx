import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, CheckCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { RoleShell } from '@/features/shell/role-shell'
import { requireUser } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { listNotifications } from '@/features/student/queries'
import { relativeTime } from '@/lib/utils/format'
import { MarkAllReadButton } from './mark-all-read'

export const metadata: Metadata = { title: 'Bildirishnomalar' }
export const dynamic = 'force-dynamic'

/**
 * Bildirishnomalar — barcha rollar uchun umumiy sahifa.
 * Topbar dagi qo'ng'iroq ikonkasi shu yerga olib keladi.
 */
export default async function NotificationsPage() {
  const user = await requireUser()
  const flags = await resolveFlags(user)
  const items = await listNotifications(user.uid, 50)
  const unread = items.filter((item) => !item.read).length

  return (
    <RoleShell user={user} flags={flags} unreadCount={unread}>
      <div className="space-y-6">
        <PageHeader
          title="Bildirishnomalar"
          description={
            unread ? `${unread} ta o‘qilmagan xabar` : 'Barcha xabarlar o‘qilgan'
          }
          actions={unread > 0 ? <MarkAllReadButton /> : undefined}
        />

        {items.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-8" />}
            title="Bildirishnoma yo‘q"
            description="O‘qituvchi ishingizni baholaganda yoki yangi topshiriq berilganda shu yerda ko‘rinadi."
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const body = (
                <Card className={item.read ? 'opacity-70' : 'border-primary/40'}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <span
                      className={
                        item.read
                          ? 'mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40'
                          : 'mt-1.5 size-2 shrink-0 rounded-full bg-primary'
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">{item.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {relativeTime(item.ts)}
                      </p>
                    </div>
                    {!item.read && (
                      <Badge variant="default" className="shrink-0">
                        Yangi
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )

              return item.link ? (
                <Link key={item.id} href={item.link} className="block">
                  {body}
                </Link>
              ) : (
                <div key={item.id}>{body}</div>
              )
            })}
          </div>
        )}

        {items.length > 0 && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCheck className="size-3.5" />
            Oxirgi {items.length} ta xabar ko‘rsatilmoqda.
          </p>
        )}
      </div>
    </RoleShell>
  )
}
