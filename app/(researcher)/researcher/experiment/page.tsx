import type { Metadata } from 'next'
import { CheckCircle2, Circle, FlaskConical, Play, Square } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { requireUser } from '@/lib/firebase/session'

import { setExperimentStatusAction } from '@/features/researcher/actions'
import { ActionButton } from '@/features/researcher/components/action-button'
import { ExperimentForm } from '@/features/researcher/components/experiment-form'
import { getDashboardSummary } from '@/features/researcher/dashboard'
import {
  getExperiment,
  listAllGroups,
  listAllSurveys,
  listAllTests,
} from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Eksperiment' }
export const dynamic = 'force-dynamic'

export default async function ExperimentPage() {
  await requireUser(['researcher', 'admin'])

  const [experiment, tests, surveys, groups, summary] = await Promise.all([
    getExperiment(),
    listAllTests(),
    listAllSurveys(),
    listAllGroups(),
    getDashboardSummary(),
  ])

  const pending = summary.checklist.filter((item) => !item.done)
  const canStart = pending.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eksperiment sozlamalari"
        description="Gipoteza, dizayn, pre/post testlar, so‘rovnomalar, guruhlar va muddatlar. Bu sahifadagi ma’lumot dissertatsiyaning metodologiya bo‘limiga asos bo‘ladi."
        actions={
          experiment ? (
            <div className="flex flex-wrap gap-2">
              {experiment.status !== 'running' ? (
                <ActionButton
                  action={() => setExperimentStatusAction(experiment.id, 'running')}
                  successMessage="Eksperiment boshlandi"
                  confirmTitle="Eksperimentni boshlashni tasdiqlaysizmi?"
                  confirmDescription="Boshlangandan keyin guruh flaglarini o‘zgartirish dizaynni buzadi. Barcha sozlamalar to‘g‘riligiga ishonch hosil qiling."
                  disabled={!canStart}
                >
                  <Play />
                  Boshlash
                </ActionButton>
              ) : null}
              {experiment.status === 'running' ? (
                <ActionButton
                  variant="outline"
                  action={() => setExperimentStatusAction(experiment.id, 'finished')}
                  successMessage="Eksperiment yakunlandi"
                  confirmTitle="Eksperimentni yakunlashni tasdiqlaysizmi?"
                  confirmDescription="Yakunlangandan keyin post-test natijalari to‘liq yig‘ilgan bo‘lishi kerak."
                >
                  <Square />
                  Yakunlash
                </ActionButton>
              ) : null}
            </div>
          ) : null
        }
      />

      {experiment && !canStart && experiment.status === 'planned' ? (
        <Alert variant="warning">
          <AlertTitle>Eksperimentni boshlash uchun {pending.length} ta band qoldi</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {pending.map((item) => (
                <li key={item.key}>
                  • {item.label} — <span className="opacity-80">{item.hint}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExperimentForm
            experiment={experiment}
            tests={tests.map((test) => ({ id: test.id, title: test.title, type: test.type }))}
            surveys={surveys.map((survey) => ({
              id: survey.id,
              title: survey.titleUz ?? survey.title,
              type: survey.type,
            }))}
            groups={groups.map((group) => ({
              id: group.id,
              name: group.name,
              type: group.type,
            }))}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="size-4 text-primary" />
                Tayyorgarlik
              </CardTitle>
              <CardDescription>
                {canStart
                  ? 'Barcha shartlar bajarilgan.'
                  : 'Quyidagi bandlar bajarilgach eksperimentni boshlash mumkin.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.checklist.map((item) => (
                <div key={item.key} className="flex items-start gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                      {item.label}
                    </p>
                    {!item.done ? (
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dizayn eslatmasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Mustaqil o‘zgaruvchi — AI imkoniyatlari (aiTutor, aiFeedback, adaptive,
                pronunciationAI, aiRolePlay, promptLab, corpusVerification, semanticNetwork).
                Nazorat guruhida ular serverda o‘chirilgan.
              </p>
              <p>
                Bog‘liq o‘zgaruvchilar — 8 ta ko‘nikma bo‘yicha pre/post ballari, motivatsiya va AI
                savodxonligi so‘rovnomalari, xatolar taksonomiyasi.
              </p>
              <Alert variant="warning">
                <AlertDescription className="text-xs">
                  Eksperiment davomida guruh flaglarini o‘zgartirmang — bu ichki validlikni buzadi
                  va natijalarni e’lon qilib bo‘lmaydi.
                </AlertDescription>
              </Alert>
              {experiment ? (
                <p className="text-xs">
                  Holat:{' '}
                  <Badge variant="outline">
                    {experiment.status === 'planned'
                      ? 'Rejalashtirilgan'
                      : experiment.status === 'running'
                        ? 'Davom etmoqda'
                        : 'Yakunlangan'}
                  </Badge>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
