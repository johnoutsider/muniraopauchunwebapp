'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PenLine } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/cn'
import type { CefrLevel } from '@/config/constants'

import { GENRE_LABELS, GENRE_ORDER, type WritingGenre, type WritingTask } from '../genres'
import type { SubmissionSummary } from '../types'
import { WritingWorkspace } from './writing-workspace'

export interface WritingLabClientProps {
  tasks: WritingTask[]
  submissions: SubmissionSummary[]
  initialTaskId?: string
  cefr: CefrLevel
  knownWeaknesses: string[]
  aiEnabled: boolean
}

export function WritingLabClient({
  tasks,
  submissions,
  initialTaskId,
  cefr,
  knownWeaknesses,
  aiEnabled,
}: WritingLabClientProps) {
  const router = useRouter()

  const initialTask = tasks.find((task) => task.id === initialTaskId) ?? null
  const [task, setTask] = React.useState<WritingTask | null>(initialTask)
  const [genre, setGenre] = React.useState<WritingGenre>(initialTask?.genre ?? 'email')

  function handlePick(next: WritingTask) {
    // Shu topshiriq bo'yicha tugallanmagan ish bo'lsa — davom ettiramiz
    const existing = submissions.find(
      (submission) => submission.taskId === next.id && submission.status === 'draft'
    )
    if (existing) {
      router.push(`/student/writing-lab/${existing.id}`)
      return
    }
    setTask(next)
  }

  if (task) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setTask(null)}>
          <ArrowLeft />
          Boshqa topshiriq tanlash
        </Button>
        <WritingWorkspace
          task={task}
          submission={null}
          cefr={cefr}
          knownWeaknesses={knownWeaknesses}
          aiEnabled={aiEnabled}
        />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="size-4 text-primary" />
          Janr va topshiriqni tanlang
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={genre} onValueChange={(value) => setGenre(value as WritingGenre)}>
          <TabsList className="flex w-full flex-wrap">
            {GENRE_ORDER.map((item) => (
              <TabsTrigger key={item} value={item} className="text-xs">
                {GENRE_LABELS[item].uz}
              </TabsTrigger>
            ))}
          </TabsList>

          {GENRE_ORDER.map((item) => {
            const meta = GENRE_LABELS[item]
            const genreTasks = tasks.filter((entry) => entry.genre === item)
            return (
              <TabsContent key={item} value={item} className="space-y-3">
                <p className="text-sm text-muted-foreground">{meta.description}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {genreTasks.map((entry) => {
                    const existing = submissions.find(
                      (submission) => submission.taskId === entry.id
                    )
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => handlePick(entry)}
                        className={cn(
                          'rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40'
                        )}
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{entry.title}</span>
                          {existing && (
                            <Badge
                              variant={existing.status === 'draft' ? 'secondary' : 'success'}
                              className="shrink-0 text-[10px]"
                            >
                              {existing.status === 'draft' ? 'qoralama bor' : 'yuborilgan'}
                            </Badge>
                          )}
                        </span>
                        <span className="mt-1 block line-clamp-3 text-xs text-muted-foreground">
                          {entry.prompt}
                        </span>
                        <span className="mt-2 block text-[11px] text-muted-foreground">
                          Tavsiya etilgan hajm: {entry.minWords}–{entry.maxWords} so‘z
                        </span>
                      </button>
                    )
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}
