'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, FileText, Paperclip, Send, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { AiBadge } from '@/components/shared/ai-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { PROJECT_RUBRIC, RUBRIC_LABELS } from '@/config/constants'
import { formatDate, formatDateTime, relativeTime } from '@/lib/utils/format'
import type { ContributionDoc, ProjectDoc } from '@/types'

import { reviewProjectAction } from '../actions'
import { RubricScorer } from './rubric-scorer'

export interface ProjectReviewPanelProps {
  project: ProjectDoc & { id: string }
  contributions: Array<ContributionDoc & { id: string }>
  groupName: string
}

export function ProjectReviewPanel({ project, contributions, groupName }: ProjectReviewPanelProps) {
  const router = useRouter()
  const [scores, setScores] = React.useState<Record<string, number>>(
    () => (project.teacherScores as Record<string, number> | undefined) ?? {}
  )
  const [comment, setComment] = React.useState(project.teacherComment ?? '')
  const [adjustments, setAdjustments] = React.useState<Record<string, number>>({})
  const [pending, setPending] = React.useState(false)

  const members = project.members ?? []
  const memberUids = project.memberUids ?? []
  const teamScore = PROJECT_RUBRIC.length
    ? Math.round(
        (PROJECT_RUBRIC.reduce((sum, key) => sum + (scores[key] ?? 0), 0) /
          (PROJECT_RUBRIC.length * 5)) *
          100
      )
    : 0

  const totalWords = contributions.reduce((sum, c) => sum + (c.wordsWritten ?? 0), 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const missing = PROJECT_RUBRIC.filter((key) => typeof scores[key] !== 'number')
    if (missing.length) {
      toast.error(`Baholanmagan mezon: ${missing.map((k) => RUBRIC_LABELS[k]?.uz ?? k).join(', ')}`)
      return
    }
    if (!comment.trim()) {
      toast.error('Jamoaga izoh yozing.')
      return
    }

    setPending(true)
    try {
      const result = await reviewProjectAction({
        projectId: project.id,
        rubricScores: scores,
        comment,
        memberAdjustments: Object.fromEntries(
          Object.entries(adjustments).filter(([, value]) => value !== 0)
        ),
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(
        result.data.alreadyReviewed
          ? `Baho yangilandi: ${result.data.teamScore}/100`
          : `Loyiha baholandi: ${result.data.teamScore}/100`
      )
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{project.title}</h2>
          <p className="text-sm text-muted-foreground">
            {groupName} · {memberUids.length} a’zo ·{' '}
            {project.deadline ? `Muddat: ${formatDate(project.deadline)}` : 'Muddat belgilanmagan'}
          </p>
        </div>
        {project.status === 'graded' ? (
          <Badge variant="success">
            <CheckCircle2 />
            Baholangan
          </Badge>
        ) : (
          <Badge variant="warning">Kutmoqda</Badge>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-muted-foreground" />
                Umumiy hujjat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.sharedDoc ? (
                <article className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                  {project.sharedDoc}
                </article>
              ) : (
                <EmptyState title="Hujjat bo‘sh" description="Jamoa hali matn yozmagan." />
              )}
            </CardContent>
          </Card>

          {project.solution ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yechim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-sm">
                  {project.solution}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hisobot</CardTitle>
            </CardHeader>
            <CardContent>
              {project.report ? (
                <article className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
                  {project.report}
                </article>
              ) : (
                <p className="text-sm text-muted-foreground">Hisobot yuklanmagan.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="size-4 text-muted-foreground" />
                Prezentatsiya fayllari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.presentationFiles?.length ? (
                project.presentationFiles.map((file, index) => (
                  <div
                    key={`${file.path}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(file.at)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Fayl yuklanmagan.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-muted-foreground" />
                A’zolar hissasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {memberUids.length === 0 ? (
                <p className="text-sm text-muted-foreground">A’zolar ro‘yxati bo‘sh.</p>
              ) : (
                memberUids.map((uid) => {
                  const member = members.find((m) => m.uid === uid)
                  const contribution = contributions.find((c) => c.id === uid || c.uid === uid)
                  const share = totalWords
                    ? Math.round(((contribution?.wordsWritten ?? 0) / totalWords) * 100)
                    : 0
                  const adjustment = adjustments[uid] ?? 0

                  return (
                    <div key={uid} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/teacher/students/${uid}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {member?.name ?? contribution?.name ?? uid}
                        </Link>
                        {member?.role ? <Badge variant="outline">{member.role}</Badge> : null}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {contribution?.wordsWritten ?? 0} so‘z · {contribution?.messages ?? 0}{' '}
                            xabar · {contribution?.tasksDone ?? 0} vazifa
                          </span>
                          <span className="tabular-nums">{share}%</span>
                        </div>
                        <Progress value={share} className="h-1.5" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`adjust-${uid}`} className="text-xs text-muted-foreground">
                          Shaxsiy tuzatish (−20…+20)
                        </Label>
                        <input
                          id={`adjust-${uid}`}
                          type="number"
                          min={-20}
                          max={20}
                          step={1}
                          value={adjustment}
                          disabled={pending}
                          onChange={(event) => {
                            const raw = Number(event.target.value)
                            const clamped = Number.isFinite(raw)
                              ? Math.max(-20, Math.min(20, Math.round(raw)))
                              : 0
                            setAdjustments((prev) => ({ ...prev, [uid]: clamped }))
                          }}
                          className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Badge variant="secondary">
                          Yakuniy: {Math.max(0, Math.min(100, teamScore + adjustment))}
                        </Badge>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {project.aiRubricScores && Object.keys(project.aiRubricScores).length ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  AI dastlabki baho
                  <AiBadge label="AI yaratgan — yakuniy baho o‘qituvchida" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {Object.entries(project.aiRubricScores).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {RUBRIC_LABELS[key]?.uz ?? key}: {value}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Jamoa bahosi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <RubricScorer
                  keys={PROJECT_RUBRIC}
                  value={scores}
                  onChange={setScores}
                  aiScores={project.aiRubricScores as Record<string, number> | undefined}
                  disabled={pending}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="project-comment">Jamoaga izoh</Label>
                  <Textarea
                    id="project-comment"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Mazmun, til, jamoa ishi bo‘yicha izoh…"
                    rows={5}
                    maxLength={4000}
                    disabled={pending}
                  />
                </div>

                {project.status === 'graded' ? (
                  <p className="text-xs text-muted-foreground">
                    Oxirgi baholash: {formatDateTime(project.createdAt)} — qayta yuborilsa baho
                    yangilanadi, takroriy bildirishnoma yuborilmaydi.
                  </p>
                ) : null}

                <Button type="submit" loading={pending} className="w-full sm:w-auto">
                  <Send />
                  Jamoa bahosini saqlash
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
