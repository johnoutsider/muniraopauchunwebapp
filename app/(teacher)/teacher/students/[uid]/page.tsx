import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Bot,
  BookOpen,
  CheckCircle2,
  Circle,
  CircleDot,
  Flame,
  Lock,
  MessageSquarePlus,
  Mic,
  NotebookPen,
  PenLine,
  Target,
  Trophy,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { ProficiencyBadge } from '@/components/shared/proficiency-badge'
import { ScoreBadge } from '@/components/shared/score-badge'
import { SkillIcon } from '@/components/shared/skill-icon'
import { StageBadge } from '@/components/shared/stage-badge'
import { ChartCard } from '@/components/charts/chart-card'
import { SkillRadarChart } from '@/components/charts/skill-radar-chart'
import {
  ERROR_TAG_LABELS,
  SKILLS,
  SKILL_LABELS,
  scoreToLabel,
  type ErrorTag,
  type Skill,
} from '@/config/constants'
import { requireTeacher } from '@/features/teacher/guards'
import { getStudentDetail } from '@/features/teacher/queries'
import { TeacherNoteCard } from '@/features/teacher/components/teacher-note'
import { formatDate, formatDateTime, relativeTime } from '@/lib/utils/format'
import type { PathStep } from '@/types'

export const metadata: Metadata = { title: 'Talaba' }
export const dynamic = 'force-dynamic'

const STEP_STATUS: Record<PathStep['status'], { label: string; icon: React.ReactNode }> = {
  locked: { label: 'Yopiq', icon: <Lock className="size-3.5" /> },
  available: { label: 'Ochiq', icon: <Circle className="size-3.5" /> },
  in_progress: { label: 'Jarayonda', icon: <CircleDot className="size-3.5" /> },
  done: { label: 'Bajarilgan', icon: <CheckCircle2 className="size-3.5" /> },
}

export default async function TeacherStudentPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params
  const user = await requireTeacher()

  // assertTeachesStudent getStudentDetail ichida — route parametriga ishonilmaydi
  const data = await getStudentDetail(user, uid)
  const { student, group, row, path } = data

  const radarData = SKILLS.filter((skill) => typeof row.skillScores[skill] === 'number').map(
    (skill) => ({
      skill: SKILL_LABELS[skill].uz,
      score: row.skillScores[skill] as number,
    })
  )

  const steps = path?.steps ?? []
  const doneSteps = steps.filter((step) => step.status === 'done').length
  const topTags = (data.errorProfile?.topTags ?? []).slice(0, 8)
  const tagCounts = data.errorProfile?.counts ?? {}
  const recentErrors = data.errorProfile?.recent ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Guruhlarim', href: '/teacher/groups' },
          { label: group.name, href: `/teacher/groups/${group.id}` },
          { label: student.displayName },
        ]}
        title={student.displayName}
        description={`${group.name} · ${student.participantCode ?? '—'} · ${
          row.lastActiveAt
            ? `oxirgi faollik ${relativeTime(row.lastActiveAt)}`
            : 'hech qachon kirmagan'
        }`}
        actions={
          <>
            {row.riskLevel ? (
              <Badge
                variant={
                  row.riskLevel === 'high'
                    ? 'danger'
                    : row.riskLevel === 'medium'
                      ? 'warning'
                      : 'success'
                }
              >
                Xavf:{' '}
                {row.riskLevel === 'high'
                  ? 'yuqori'
                  : row.riskLevel === 'medium'
                    ? 'o‘rta'
                    : 'past'}
              </Badge>
            ) : null}
            <Button asChild>
              <Link href={`/teacher/chats?student=${student.id}`}>
                <MessageSquarePlus />
                Shaxsiy xabar yozish
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Urinishlar (30 kun)"
          value={row.attempts}
          sublabel={row.attempts ? `${row.correctRate}% to‘g‘ri` : 'Mashq yo‘q'}
          icon={<Target className="size-4" />}
          trend={row.trend || undefined}
        />
        <StatCard
          label="Vaqt sarfi"
          value={`${row.timeOnTaskMin} daq`}
          sublabel="Oxirgi 30 kun"
          icon={<Target className="size-4" />}
        />
        <StatCard
          label="XP"
          value={row.totalXp.toLocaleString('uz-UZ')}
          icon={<Trophy className="size-4" />}
        />
        <StatCard
          label="Seriya"
          value={`${row.streak} kun`}
          icon={<Flame className="size-4" />}
          tone={row.streak >= 3 ? 'success' : 'default'}
        />
        <StatCard
          label="AI muloqot hajmi"
          value={data.aiUsage.messages}
          sublabel={`${data.aiUsage.sessions} seans · matn ko‘rsatilmaydi`}
          icon={<Bot className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Individual lingvistik profil"
          description={
            radarData.length
              ? 'Diagnostika va o‘quv yo‘nalishi asosida'
              : 'Diagnostikadan keyin shakllanadi'
          }
          height={300}
        >
          {radarData.length >= 3 ? (
            <SkillRadarChart data={radarData} />
          ) : (
            <EmptyState
              title="Profil yo‘q"
              description="Talaba 8 bo‘limli diagnostika testidan o‘tmagan."
            />
          )}
        </ChartCard>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">O‘quv yo‘nalishi</CardTitle>
            {steps.length ? (
              <Badge variant="secondary">
                {doneSteps} / {steps.length} bajarilgan
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {!path ? (
              <EmptyState
                title="Yo‘nalish tuzilmagan"
                description="Diagnostika testidan keyin platforma individual yo‘nalish generatsiya qiladi."
              />
            ) : (
              <>
                <Progress value={steps.length ? (doneSteps / steps.length) * 100 : 0} />
                <p className="text-xs text-muted-foreground">
                  v{path.version} · {formatDate(path.generatedAt)} ·{' '}
                  {path.generatedBy === 'ai' ? 'AI generatsiya' : 'Qoidalar asosida'}
                </p>
                <ol className="space-y-2">
                  {steps.slice(0, 12).map((step) => (
                    <li
                      key={step.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{STEP_STATUS[step.status].icon}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{step.title}</span>
                      <StageBadge stage={step.stage} />
                      <Badge variant="outline">
                        <SkillIcon skill={step.skill} />
                        {SKILL_LABELS[step.skill].uz}
                      </Badge>
                      <Badge
                        variant={
                          step.status === 'done'
                            ? 'success'
                            : step.status === 'in_progress'
                              ? 'info'
                              : 'outline'
                        }
                      >
                        {STEP_STATUS[step.status].label}
                      </Badge>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ko‘nikma va mavzular bo‘yicha o‘zlashtirish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data.mastery.length ? (
              <EmptyState
                title="Ma’lumot yo‘q"
                description="Talaba mashq bajarganidan keyin o‘zlashtirish darajasi hisoblanadi."
              />
            ) : (
              data.mastery
                .slice()
                .sort((a, b) => (b.pMastery ?? 0) - (a.pMastery ?? 0))
                .map((mastery) => {
                  const percent = Math.round((mastery.pMastery ?? 0) * 100)
                  return (
                    <div key={mastery.id} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5">
                          <SkillIcon
                            skill={mastery.skill as Skill}
                            className="text-muted-foreground"
                          />
                          {SKILL_LABELS[mastery.skill as Skill]?.uz ?? mastery.skill}
                          {mastery.topic ? (
                            <span className="text-xs text-muted-foreground">· {mastery.topic}</span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">Daraja {mastery.currentDifficulty}</Badge>
                          <span className="w-9 text-right font-medium tabular-nums">
                            {percent}%
                          </span>
                        </span>
                      </div>
                      <Progress value={percent} />
                      <p className="text-xs text-muted-foreground">
                        {mastery.correct ?? 0} / {mastery.attempts ?? 0} to‘g‘ri ·{' '}
                        {relativeTime(mastery.lastPracticedAt)}
                      </p>
                    </div>
                  )
                })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tipik xatolar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!topTags.length && !recentErrors.length ? (
              <EmptyState
                title="Xatolar profili bo‘sh"
                description="Mashq bajarilgach xatolar taksonomiyasi bo‘yicha hisob yuritiladi."
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((tag) => (
                    <Badge key={tag} variant="danger">
                      {ERROR_TAG_LABELS[tag as ErrorTag]?.uz ?? tag}
                      <span className="tabular-nums">· {tagCounts[tag as ErrorTag] ?? 0}</span>
                    </Badge>
                  ))}
                </div>

                {recentErrors.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Oxirgi xato misollari
                    </p>
                    {recentErrors.slice(0, 6).map((entry, index) => (
                      <div key={index} className="rounded-lg border border-border p-2.5 text-sm">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <Badge variant="outline">
                            {ERROR_TAG_LABELS[entry.tag]?.uz ?? entry.tag}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {relativeTime(entry.ts)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{entry.example}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {data.errorProfile?.aiAnalysis ? (
                  <div className="rounded-lg border border-dashed border-border p-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      AI tahlili
                    </p>
                    <p className="text-sm">{data.errorProfile.aiAnalysis.summary}</p>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PenLine className="size-4 text-muted-foreground" />
              Yozma ishlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data.writing.length ? (
              <p className="text-sm text-muted-foreground">Yozma ish yuborilmagan.</p>
            ) : (
              data.writing.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/teacher/review?tab=writing&id=${submission.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {submission.taskTitle}
                  </span>
                  <Badge variant="outline">{submission.genre}</Badge>
                  <Badge
                    variant={
                      submission.status === 'reviewed'
                        ? 'success'
                        : submission.status === 'submitted'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {submission.status === 'reviewed'
                      ? 'Baholangan'
                      : submission.status === 'submitted'
                        ? 'Kutmoqda'
                        : 'Qoralama'}
                  </Badge>
                  {typeof submission.teacherFeedback?.score === 'number' ? (
                    <ScoreBadge score={submission.teacherFeedback.score} />
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(submission.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mic className="size-4 text-muted-foreground" />
              Og‘zaki ishlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data.speaking.length ? (
              <p className="text-sm text-muted-foreground">Audio topshiriq yuborilmagan.</p>
            ) : (
              data.speaking.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/teacher/review?tab=speaking&id=${submission.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {submission.taskTitle}
                  </span>
                  <Badge variant="outline">{submission.type}</Badge>
                  {typeof submission.azure?.pronScore === 'number' ? (
                    <ScoreBadge score={submission.azure.pronScore} />
                  ) : null}
                  <Badge variant={submission.teacherFeedback ? 'success' : 'warning'}>
                    {submission.teacherFeedback ? 'Baholangan' : 'Kutmoqda'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(submission.ts)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-muted-foreground" />
              Oxirgi urinishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.recentAttempts.length ? (
              <p className="text-sm text-muted-foreground">Hali mashq bajarilmagan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentAttempts.slice(0, 12).map((attempt) => (
                  <li key={attempt.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                    <Badge variant={attempt.isCorrect ? 'success' : 'danger'}>
                      {attempt.isCorrect ? 'To‘g‘ri' : 'Xato'}
                    </Badge>
                    <span className="min-w-0 flex-1 truncate">
                      {SKILL_LABELS[attempt.skill]?.uz ?? attempt.skill}
                      {attempt.topic ? ` · ${attempt.topic}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      D{attempt.difficultyAtTime} · {Math.round((attempt.timeMs ?? 0) / 1000)}s
                    </span>
                    {(attempt.errorTags ?? []).slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {ERROR_TAG_LABELS[tag]?.uz ?? tag}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(attempt.ts)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <NotebookPen className="size-4 text-muted-foreground" />
                Refleksiyalar (faqat o‘qish uchun)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!data.reflections.length ? (
                <p className="text-sm text-muted-foreground">Refleksiya yozuvi yo‘q.</p>
              ) : (
                data.reflections.slice(0, 4).map((reflection) => (
                  <div key={reflection.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <StageBadge stage={reflection.stage} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(reflection.ts)}
                      </span>
                    </div>
                    <p>
                      <span className="text-muted-foreground">Yaxshi bo‘ldi: </span>
                      {reflection.answers?.didWell || '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Takrorlangan xatolar: </span>
                      {reflection.answers?.repeatedMistakes || '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Yaxshilayman: </span>
                      {reflection.answers?.improveNext || '—'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {data.prediction ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Progress prognozi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={data.prediction.predictedTotal ?? 0} />
                  <ProficiencyBadge label={scoreToLabel(data.prediction.predictedTotal ?? 0)} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(data.prediction.generatedAt)}
                  </span>
                </div>
                {data.prediction.note ? (
                  <p className="text-muted-foreground">{data.prediction.note}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <TeacherNoteCard
            uid={student.id}
            initialText={data.teacherNote?.text ?? ''}
            savedAt={data.teacherNote?.at ?? null}
          />
        </div>
      </div>
    </div>
  )
}
