'use client'

import * as React from 'react'
import { Check, Circle, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { CaseStudyTask, ProjectMemberRole } from '@/types'

import { PROJECT_ROLE_LABELS, TASK_KIND_META } from './types'

export interface TaskStepperProps {
  tasks: CaseStudyTask[]
  taskStatus: Record<string, 'todo' | 'doing' | 'done'>
  activeTaskId: string
  members: ProjectMemberRole[]
  onSelect: (taskId: string) => void
}

/** 9 bosqichli keys jarayoni (PLAN 8.10) — jamoa qayerda turganini ko'rsatadi. */
export function TaskStepper({
  tasks,
  taskStatus,
  activeTaskId,
  members,
  onSelect,
}: TaskStepperProps) {
  const doneCount = tasks.filter((task) => taskStatus[task.id] === 'done').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Bosqichlar: {doneCount} / {tasks.length} bajarildi
        </p>
        <Badge variant="secondary">{Math.round((doneCount / (tasks.length || 1)) * 100)}%</Badge>
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-2">
        {tasks.map((task, index) => {
          const status = taskStatus[task.id] ?? 'todo'
          const active = task.id === activeTaskId
          return (
            <li key={task.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(task.id)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex w-40 flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40'
                )}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border text-[10px]',
                      status === 'done'
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : status === 'doing'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-border'
                    )}
                  >
                    {status === 'done' ? (
                      <Check className="size-3" />
                    ) : status === 'doing' ? (
                      <Loader2 className="size-3" />
                    ) : (
                      <Circle className="size-2 fill-current" />
                    )}
                  </span>
                  {index + 1}-qadam
                </span>
                <span className="line-clamp-2 text-xs font-medium">
                  {TASK_KIND_META[task.kind].uz}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {members.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <Badge key={member.uid} variant="outline" className="gap-1">
              <span className="font-medium">{member.name}</span>
              <span className="text-muted-foreground">
                · {PROJECT_ROLE_LABELS[member.role] ?? member.role}
              </span>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
