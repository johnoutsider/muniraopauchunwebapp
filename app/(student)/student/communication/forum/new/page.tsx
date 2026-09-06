import type { Metadata } from 'next'

import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { resolveFlags } from '@/lib/flags'
import { ThreadForm } from '@/features/forum/thread-form'

export const metadata: Metadata = { title: 'Yangi mavzu' }
export const dynamic = 'force-dynamic'

export default async function NewThreadPage() {
  const user = await requireStudent()
  const flags = await resolveFlags(user)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yangi mavzu"
        description="Savolingizni aniq shakllantiring va iqtisodiy kontekstdan misol keltiring."
        breadcrumbs={[
          { label: 'Muloqot markazi', href: '/student/communication' },
          { label: 'Forum', href: '/student/communication/forum' },
          { label: 'Yangi mavzu' },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          {flags.forum ? (
            <ThreadForm hasGroup={Boolean(user.groupId)} />
          ) : (
            <EmptyState
              title="Forum yoqilmagan"
              description="Bu imkoniyat sizning guruhingiz uchun o‘chirilgan."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
