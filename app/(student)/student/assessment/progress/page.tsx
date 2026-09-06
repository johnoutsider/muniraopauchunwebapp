import Link from 'next/link'
import type { Metadata } from 'next'
import { ClipboardCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { listTests } from '@/features/shared/queries'
import {
  getAssessmentOverview,
  getInProgressAttempt,
  getRunnerTest,
  testAvailability,
} from '@/features/assessment/queries'
import { TestRunner } from '@/features/assessment/test-runner'
import { TestStatusCard, availabilityMessage } from '@/features/assessment/test-card'
import { estimatedMinutes } from '@/features/assessment/estimate'

export const metadata: Metadata = { title: 'Progress test' }
export const dynamic = 'force-dynamic'

const DESCRIPTION =
  'Progress test — o‘zlashtirishni oraliq o‘lchash. Natijasi o‘quv yo‘lingizni qayta sozlaydi: qaysi mavzular mustahkamlanganini va qayerga qaytish kerakligini ko‘rsatadi.'

export default async function ProgressTestPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>
}) {
  const { test: testId } = await searchParams
  const user = await requireStudent()

  const header = (
    <PageHeader
      title="Progress test"
      description={DESCRIPTION}
      breadcrumbs={[
        { label: 'Baholash markazi', href: '/student/assessment' },
        { label: 'Progress test' },
      ]}
    />
  )

  /* --- Bitta test tanlangan ------------------------------------- */
  if (testId) {
    const [loaded, inProgress] = await Promise.all([
      getRunnerTest(testId),
      getInProgressAttempt(user.uid, testId),
    ])

    if (!loaded) {
      return (
        <div className="space-y-6">
          {header}
          <EmptyState
            icon={<ClipboardCheck />}
            title="Test topilmadi"
            description="Bu test o‘chirilgan yoki nashrdan olingan bo‘lishi mumkin."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/student/assessment/progress">Barcha progress testlar</Link>
              </Button>
            }
          />
        </div>
      )
    }

    const availability = testAvailability(loaded.test, user.groupId)
    if (availability.state !== 'available') {
      return (
        <div className="space-y-6">
          {header}
          <EmptyState
            icon={<ClipboardCheck />}
            title="Bu test hozir ochiq emas"
            description={availabilityMessage(availability) ?? 'Test siz uchun mavjud emas.'}
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/student/assessment">Baholash markaziga qaytish</Link>
              </Button>
            }
          />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {header}
        <TestRunner
          test={loaded.runner}
          uid={user.uid}
          existingAttemptId={inProgress?.id ?? null}
          intro={{
            lead: `«${loaded.runner.title}» — oraliq nazorat. Bu test o‘tilgan mavzular bo‘yicha bilimingizni o‘lchaydi va natijaga qarab o‘quv yo‘lingiz yangilanadi.`,
            estimatedMin: estimatedMinutes(loaded.runner),
            bullets: [
              'Savollar birma-bir ko‘rsatiladi; bo‘lim ichida oldinga-orqaga yura olasiz.',
              'Javoblaringiz avtomatik saqlanadi — ulanish uzilsa ham yo‘qolmaydi.',
              'Vaqt cheklovi belgilangan bo‘limlarda taymer bo‘limga kirganda boshlanadi.',
              'Topshirgandan keyin har bir savol bo‘yicha to‘g‘ri javob va tushuntirishni ko‘rasiz.',
            ],
            note: 'Natija o‘quv yo‘lingizni qayta sozlash uchun ishlatiladi — mustaqil ishlang, shunda tavsiyalar to‘g‘ri bo‘ladi.',
          }}
        />
      </div>
    )
  }

  /* --- Ro'yxat --------------------------------------------------- */
  const overview = await getAssessmentOverview(user.uid, user.groupId)
  const tests = await listTests('progress', user.groupId)

  if (!overview.progressTests.length || !tests.length) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<ClipboardCheck />}
          title="Hozircha progress test yo‘q"
          description="Modullarni tugatganingizdan keyin o‘qituvchi progress test tayinlaydi. Shu paytgacha mashqlar bilan shug‘ullaning."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/student/practice">Mashq maydoniga o‘tish</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {header}
      <div className="grid gap-4 md:grid-cols-2">
        {overview.progressTests.map((card) => (
          <TestStatusCard
            key={card.test.id}
            card={card}
            href={`/student/assessment/progress?test=${card.test.id}`}
            icon={<ClipboardCheck />}
            description={DESCRIPTION}
          />
        ))}
      </div>
    </div>
  )
}
