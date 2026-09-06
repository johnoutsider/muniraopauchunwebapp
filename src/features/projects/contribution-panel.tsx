'use client'

import * as React from 'react'
import { MessageSquare, PenLine, ListChecks } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { relativeTime } from '@/lib/utils/format'
import type { ContributionDoc, ProjectMemberRole } from '@/types'

import { PROJECT_ROLE_LABELS } from './types'

/**
 * Individual hissa hisobi (PLAN 8.10 + 9.1 — guruh ishi bo'yicha ilmiy ma'lumot).
 * Ma'lumot `projects/{id}/contributions/{uid}` hujjatlaridan olinadi va har bir
 * saqlash/xabardan keyin serverda yangilanadi.
 */
export function ContributionPanel({
  members,
  contributions,
  myUid,
}: {
  members: ProjectMemberRole[]
  contributions: Array<ContributionDoc & { id: string }>
  myUid: string
}) {
  const rows = members.map((member) => {
    const found = contributions.find((item) => item.id === member.uid || item.uid === member.uid)
    return {
      uid: member.uid,
      name: member.name,
      role: member.role,
      wordsWritten: found?.wordsWritten ?? 0,
      messages: found?.messages ?? 0,
      tasksDone: found?.tasksDone ?? 0,
      lastActiveAt: found?.lastActiveAt,
    }
  })

  const maxWords = Math.max(1, ...rows.map((row) => row.wordsWritten))
  const totalWords = rows.reduce((sum, row) => sum + row.wordsWritten, 0)
  const totalMessages = rows.reduce((sum, row) => sum + row.messages, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Jamoa hissasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <EmptyState
            title="Jamoa a’zolari ko‘rsatilmagan"
            description="O‘qituvchi jamoani shakllantirgach, bu yerda har bir a’zoning hissasi ko‘rinadi."
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PenLine className="size-3.5" /> {totalWords} so‘z
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3.5" /> {totalMessages} xabar
              </span>
            </div>

            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.uid} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{row.name}</span>
                      {row.uid === myUid ? (
                        <span className="text-muted-foreground"> (siz)</span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {' · '}
                        {PROJECT_ROLE_LABELS[row.role] ?? row.role}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {row.wordsWritten} so‘z
                    </span>
                  </div>
                  <Progress value={Math.round((row.wordsWritten / maxWords) * 100)} />
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="size-3" /> {row.messages} xabar
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="size-3" /> {row.tasksDone} bosqich
                    </span>
                    {row.lastActiveAt ? <span>{relativeTime(row.lastActiveAt)}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
