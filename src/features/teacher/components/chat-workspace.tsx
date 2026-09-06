'use client'

import * as React from 'react'
import { MessagesSquare, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { SearchInput } from '@/components/shared/search-input'
import { cn } from '@/lib/utils/cn'
import { relativeTime, truncate } from '@/lib/utils/format'

import { TeacherChat } from './teacher-chat'

export interface ChatThread {
  id: string
  title: string
  studentUid: string
  participantCode: string
  groupName: string
  lastText: string
  lastAt: number
  lastSenderUid: string
}

export interface ChatCandidate {
  uid: string
  name: string
  groupName: string
}

export interface ChatWorkspaceProps {
  teacherUid: string
  threads: ChatThread[]
  candidates: ChatCandidate[]
  /** Sahifa ochilganda tanlangan talaba (?student=uid) */
  initialStudentUid?: string
}

export function ChatWorkspace({
  teacherUid,
  threads,
  candidates,
  initialStudentUid,
}: ChatWorkspaceProps) {
  const [selected, setSelected] = React.useState<string | null>(
    initialStudentUid ?? threads[0]?.studentUid ?? null
  )
  const [search, setSearch] = React.useState('')
  const [showAll, setShowAll] = React.useState(false)

  const threadByStudent = React.useMemo(
    () => new Map(threads.map((thread) => [thread.studentUid, thread])),
    [threads]
  )

  const list = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    const source = showAll
      ? candidates.map((candidate) => {
          const thread = threadByStudent.get(candidate.uid)
          return {
            studentUid: candidate.uid,
            title: candidate.name,
            groupName: candidate.groupName,
            participantCode: thread?.participantCode ?? '',
            lastText: thread?.lastText ?? '',
            lastAt: thread?.lastAt ?? 0,
          }
        })
      : threads.map((thread) => ({
          studentUid: thread.studentUid,
          title: thread.title,
          groupName: thread.groupName,
          participantCode: thread.participantCode,
          lastText: thread.lastText,
          lastAt: thread.lastAt,
        }))

    return source
      .filter(
        (row) =>
          !term ||
          row.title.toLowerCase().includes(term) ||
          row.groupName.toLowerCase().includes(term)
      )
      .sort((a, b) => b.lastAt - a.lastAt || a.title.localeCompare(b.title))
  }, [candidates, search, showAll, threadByStudent, threads])

  const selectedName =
    candidates.find((candidate) => candidate.uid === selected)?.name ??
    threadByStudent.get(selected ?? '')?.title ??
    'Talaba'

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput onChange={setSearch} placeholder="Talaba yoki guruh…" />
          <Button
            type="button"
            variant={showAll ? 'default' : 'outline'}
            size="icon"
            aria-label="Barcha talabalarni ko‘rsatish"
            title="Barcha talabalar"
            onClick={() => setShowAll((prev) => !prev)}
          >
            <Plus />
          </Button>
        </div>

        <div className="max-h-[28rem] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-1">
          {list.length === 0 ? (
            <div className="p-3">
              <EmptyState
                icon={<MessagesSquare />}
                title="Suhbat yo‘q"
                description="Yangi suhbat boshlash uchun «+» tugmasini bosing."
              />
            </div>
          ) : (
            list.map((row) => (
              <button
                key={row.studentUid}
                type="button"
                onClick={() => setSelected(row.studentUid)}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected === row.studentUid ? 'bg-muted' : 'hover:bg-muted/60'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.title}</span>
                  {row.lastAt ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {relativeTime(row.lastAt)}
                    </span>
                  ) : (
                    <Badge variant="outline">Yangi</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {row.lastText ? truncate(row.lastText, 48) : row.groupName}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {selected ? (
        <TeacherChat
          key={selected}
          chatId={`teacher_${teacherUid}_${selected}`}
          teacherUid={teacherUid}
          studentUid={selected}
          studentName={selectedName}
        />
      ) : (
        <EmptyState
          icon={<MessagesSquare />}
          title="Suhbatni tanlang"
          description="Chapdagi ro‘yxatdan talabani tanlang yoki «+» orqali yangi suhbat boshlang."
        />
      )}
    </div>
  )
}
