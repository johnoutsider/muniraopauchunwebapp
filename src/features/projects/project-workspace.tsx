'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Circle, PlayCircle, Send } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { RUBRIC_LABELS } from '@/config/constants'

import { setTaskStatusAction, submitProjectAction } from './actions'
import { ContributionPanel } from './contribution-panel'
import { SharedDocEditor } from './shared-doc-editor'
import { TaskStepper } from './task-stepper'
import {
  ChartPanel,
  DiscussPanel,
  GrammarPanel,
  PresentationPanel,
  ReadPanel,
  SpeakingTaskPanel,
  VocabPanel,
} from './task-panels'
import { PROJECT_STATUS_LABELS, TASK_KIND_META, type ProjectWorkspaceData } from './types'

export interface ProjectWorkspaceProps {
  data: ProjectWorkspaceData
  me: { uid: string; displayName: string }
  /** Peer assessment paneli (server tomonda render qilinadi, flag bo'yicha) */
  peerSlot?: React.ReactNode
}

/**
 * Loyiha ish zonasi (PLAN 8.10, 7-bosqich).
 * 9 bosqichli keys jarayoni: har bir bosqich uchun alohida panel.
 */
export function ProjectWorkspace({ data, me, peerSlot }: ProjectWorkspaceProps) {
  const router = useRouter()
  const { project, caseStudy, contributions, taskWork, shared, chatId } = data
  const tasks = caseStudy?.tasks ?? []

  const firstUnfinished = tasks.find((task) => (project.taskStatus?.[task.id] ?? 'todo') !== 'done')
  const [activeTaskId, setActiveTaskId] = React.useState(firstUnfinished?.id ?? tasks[0]?.id ?? '')
  const [statusPending, setStatusPending] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0]
  const locked = project.status !== 'active'
  const activeStatus = activeTask ? (project.taskStatus?.[activeTask.id] ?? 'todo') : 'todo'
  const work = taskWork.find((row) => row.id === activeTask?.id)

  async function changeStatus(status: 'todo' | 'doing' | 'done') {
    if (!activeTask) return
    setStatusPending(true)
    const result = await setTaskStatusAction({
      projectId: project.id,
      taskId: activeTask.id,
      status,
    })
    setStatusPending(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.refresh()
  }

  async function submit() {
    setSubmitting(true)
    const result = await submitProjectAction(project.id)
    setSubmitting(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Loyiha topshirildi. O‘qituvchiga xabar yuborildi.')
    router.refresh()
  }

  if (!caseStudy) {
    return (
      <EmptyState
        title="Keys topilmadi"
        description="Bu loyihaga biriktirilgan keys-stadi o‘chirilgan yoki hali chop etilmagan. O‘qituvchingizga murojaat qiling."
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="pt-6">
            <TaskStepper
              tasks={tasks}
              taskStatus={project.taskStatus ?? {}}
              activeTaskId={activeTask?.id ?? ''}
              members={project.members ?? []}
              onSelect={setActiveTaskId}
            />
          </CardContent>
        </Card>

        {activeTask ? (
          <Card>
            <CardHeader className="gap-2 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <Badge variant="secondary">{TASK_KIND_META[activeTask.kind].uz}</Badge>
                  <CardTitle className="text-base">{activeTask.title}</CardTitle>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant={activeStatus === 'doing' ? 'default' : 'outline'}
                    disabled={locked || statusPending}
                    onClick={() => void changeStatus('doing')}
                  >
                    <PlayCircle className="size-3.5" />
                    Boshlandi
                  </Button>
                  <Button
                    size="sm"
                    variant={activeStatus === 'done' ? 'success' : 'outline'}
                    disabled={locked || statusPending}
                    onClick={() => void changeStatus(activeStatus === 'done' ? 'todo' : 'done')}
                  >
                    {activeStatus === 'done' ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Circle className="size-3.5" />
                    )}
                    Bajarildi
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{activeTask.instruction}</p>
            </CardHeader>

            <CardContent>
              {activeTask.kind === 'read' ? (
                <ReadPanel
                  projectId={project.id}
                  task={activeTask}
                  scenario={caseStudy.scenario}
                  work={work}
                  disabled={locked}
                />
              ) : activeTask.kind === 'analyze_chart' ? (
                <ChartPanel
                  projectId={project.id}
                  task={activeTask}
                  chartData={caseStudy.chartData}
                  chartType={caseStudy.chartType}
                  chartCaption={caseStudy.chartCaption}
                  work={work}
                  disabled={locked}
                />
              ) : activeTask.kind === 'select_vocab' ? (
                <VocabPanel
                  projectId={project.id}
                  task={activeTask}
                  requiredVocab={caseStudy.requiredVocab}
                  work={work}
                  disabled={locked}
                />
              ) : activeTask.kind === 'use_grammar' ? (
                <GrammarPanel
                  projectId={project.id}
                  task={activeTask}
                  requiredGrammar={caseStudy.requiredGrammar}
                  work={work}
                  disabled={locked}
                />
              ) : activeTask.kind === 'explain_problem' ? (
                <SpeakingTaskPanel
                  projectId={project.id}
                  caseStudyId={caseStudy.id}
                  task={activeTask}
                />
              ) : activeTask.kind === 'group_discuss' ? (
                <DiscussPanel projectId={project.id} chatId={chatId} me={me} />
              ) : activeTask.kind === 'propose_solution' ? (
                <SharedDocEditor
                  projectId={project.id}
                  field="solution"
                  initialText={shared.solution}
                  initialVersion={shared.version}
                  lastEditedByName={shared.lastEditedByName}
                  lastEditedAt={shared.lastEditedAt}
                  minWords={activeTask.minWords}
                  disabled={locked}
                  placeholder="Propose three measures that can be implemented within two quarters…"
                />
              ) : activeTask.kind === 'write_report' ? (
                <SharedDocEditor
                  projectId={project.id}
                  field="report"
                  initialText={shared.report}
                  initialVersion={shared.version}
                  lastEditedByName={shared.lastEditedByName}
                  lastEditedAt={shared.lastEditedAt}
                  minWords={activeTask.minWords}
                  disabled={locked}
                  placeholder="Situation — Analysis of causes — Recommendations — Expected results…"
                />
              ) : (
                <PresentationPanel
                  projectId={project.id}
                  caseStudyId={caseStudy.id}
                  task={activeTask}
                  files={project.presentationFiles ?? []}
                  disabled={locked}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Bosqichlar topilmadi"
            description="Keys-stadida topshiriqlar ko‘rsatilmagan."
          />
        )}

        {peerSlot}
      </div>

      {/* O'ng ustun */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Loyiha holati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Holat</span>
              <Badge variant={project.status === 'active' ? 'info' : 'success'}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Keys</span>
              <span className="min-w-0 truncate text-right font-medium">{caseStudy.title}</span>
            </div>

            {project.status === 'active' ? (
              <ConfirmDialog
                trigger={
                  <Button className="w-full" loading={submitting}>
                    <Send />
                    Loyihani topshirish
                  </Button>
                }
                title="Loyihani topshirasizmi?"
                description="Topshirilgandan keyin matnlarni tahrirlab bo‘lmaydi. O‘qituvchi baholash uchun xabar oladi."
                confirmLabel="Ha, topshiraman"
                onConfirm={submit}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Loyiha topshirilgan. O‘qituvchi bahosi va peer baholar tayyor bo‘lgach shu yerda
                ko‘rinadi.
              </p>
            )}
          </CardContent>
        </Card>

        <ContributionPanel
          members={project.members ?? []}
          contributions={contributions}
          myUid={me.uid}
        />

        {caseStudy.rubric.length ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Baholash rubrikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {caseStudy.rubric.map((criterion) => (
                  <li key={criterion} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {RUBRIC_LABELS[criterion]?.uz ?? criterion}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
