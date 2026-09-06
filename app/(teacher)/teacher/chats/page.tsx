import type { Metadata } from 'next'
import { Users } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireTeacher } from '@/features/teacher/guards'
import { listChatCandidates, listTeacherChats } from '@/features/teacher/queries'
import { ChatWorkspace } from '@/features/teacher/components/chat-workspace'

export const metadata: Metadata = { title: 'Suhbatlar' }
export const dynamic = 'force-dynamic'

export default async function TeacherChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>
}) {
  const { student } = await searchParams
  const user = await requireTeacher()

  const [threads, candidates] = await Promise.all([
    listTeacherChats(user),
    listChatCandidates(user),
  ])

  // ?student=uid faqat o'z guruhlaridagi talaba bo'lsa qabul qilinadi
  const initialStudentUid =
    student && candidates.some((candidate) => candidate.uid === student) ? student : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suhbatlar"
        description="O‘z guruhlaringizdagi talabalar bilan shaxsiy yozishmalar. Xabarlar real vaqtda yangilanadi."
      />

      {candidates.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Yozishadigan talaba yo‘q"
          description="Sizga guruh biriktirilgach, talabalar ro‘yxati shu yerda paydo bo‘ladi."
        />
      ) : (
        <ChatWorkspace
          teacherUid={user.uid}
          threads={threads}
          candidates={candidates}
          initialStudentUid={initialStudentUid}
        />
      )}
    </div>
  )
}
