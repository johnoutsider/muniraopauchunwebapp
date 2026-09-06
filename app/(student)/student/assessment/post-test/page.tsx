import Link from 'next/link'
import type { Metadata } from 'next'
import { FlaskConical, Lock } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import {
  getAssessmentOverview,
  getInProgressAttempt,
  getRunnerTest,
  testAvailability,
} from '@/features/assessment/queries'
import { TestRunner } from '@/features/assessment/test-runner'
import { TestStatusCard, availabilityMessage } from '@/features/assessment/test-card'
import { estimatedMinutes } from '@/features/assessment/estimate'

export const metadata: Metadata = { title: 'Pre / Post test' }
export const dynamic = 'force-dynamic'

const PRE_DESCRIPTION =
  'Pre-test — tadqiqot boshlanishidagi o‘lchov. U bilan post-test natijasi taqqoslanadi, shuning uchun mustaqil va halol ishlash muhim.'
const POST_DESCRIPTION =
  'Post-test — tadqiqot yakunidagi o‘lchov. Pre-test bilan solishtirilib, har bir ko‘nikma bo‘yicha o‘sishingiz hisoblanadi.'

/**
 * Tadqiqot testlari (PLAN 9). Bu sahifa faqat tadqiqotchi guruhga TAYINLAGAN
 * va muddat oynasi OCHIQ testlarni topshirishga ruxsat beradi; aks holda
 * nima uchun ochiq emasligi tushuntiriladi.
 */
export default async function PostTestPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>
}) {
  const { test: testId } = await searchParams
  const user = await requireStudent()

  const header = (
    <PageHeader
      title="Tadqiqot testlari"
      description="Pre-test va post-test — dissertatsiya eksperimentining asosiy o‘lchovlari. Ular faqat tadqiqotchi belgilagan muddatda ochiladi."
      breadcrumbs={[
        { label: 'Baholash markazi', href: '/student/assessment' },
        { label: 'Pre / Post test' },
      ]}
    />
  )

  /* --- Bitta test tanlangan ------------------------------------- */
  if (testId) {
    const [loaded, inProgress] = await Promise.all([
      getRunnerTest(testId),
      getInProgressAttempt(user.uid, testId),
    ])

    if (!loaded || (loaded.test.type !== 'pre' && loaded.test.type !== 'post')) {
      return (
        <div className="space-y-6">
          {header}
          <EmptyState
            icon={<FlaskConical />}
            title="Test topilmadi"
            description="Bu manzil bo‘yicha tadqiqot testi mavjud emas."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/student/assessment">Baholash markaziga qaytish</Link>
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
          <Alert variant="warning">
            <Lock />
            <AlertTitle>Bu test hozir topshirilmaydi</AlertTitle>
            <AlertDescription>
              {availabilityMessage(availability) ??
                'Test siz uchun ochiq emas. Savollar bo‘lsa, o‘qituvchingizga murojaat qiling.'}
            </AlertDescription>
          </Alert>
          <div>
            <Button asChild variant="outline">
              <Link href="/student/assessment">Baholash markaziga qaytish</Link>
            </Button>
          </div>
        </div>
      )
    }

    const isPost = loaded.test.type === 'post'

    return (
      <div className="space-y-6">
        {header}
        <TestRunner
          test={loaded.runner}
          uid={user.uid}
          existingAttemptId={inProgress?.id ?? null}
          intro={{
            lead: isPost ? POST_DESCRIPTION : PRE_DESCRIPTION,
            estimatedMin: estimatedMinutes(loaded.runner),
            bullets: [
              'Test pre/post bilan bir xil tuzilishga ega — bo‘limlar va topshiriqlar soni bir xil.',
              'Javoblaringiz avtomatik saqlanadi; sahifani yopib, keyinroq davom ettirishingiz mumkin.',
              'Vaqt cheklovi bo‘lgan bo‘limlarda taymer bo‘limga kirganingizda boshlanadi.',
              'Tadqiqot yaxlitligi uchun bu testda to‘g‘ri javoblar ko‘rsatilmaydi.',
            ],
            note: 'Natijangiz ilmiy tahlilda faqat ishtirokchi kodi bilan ishlatiladi — ismingiz eksportga tushmaydi.',
          }}
        />
      </div>
    )
  }

  /* --- Ro'yxat --------------------------------------------------- */
  const overview = await getAssessmentOverview(user.uid, user.groupId)
  const cards = [...overview.preTests, ...overview.postTests]

  if (!cards.length) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<FlaskConical />}
          title="Sizga tadqiqot testi tayinlanmagan"
          description="Tadqiqotchi guruhingizga pre yoki post testni tayinlaganda va muddat ochilganda u shu yerda paydo bo‘ladi. Shu paytgacha diagnostika va progress testlar bilan ishlashingiz mumkin."
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
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <TestStatusCard
            key={card.test.id}
            card={card}
            href={`/student/assessment/post-test?test=${card.test.id}`}
            icon={<FlaskConical />}
            description={card.test.type === 'pre' ? PRE_DESCRIPTION : POST_DESCRIPTION}
          />
        ))}
      </div>
    </div>
  )
}
