import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Target } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { requireStudent } from '@/lib/firebase/session'
import { listTests } from '@/features/shared/queries'
import {
  getInProgressAttempt,
  getLatestAttemptOfType,
  getRunnerTest,
  testAvailability,
} from '@/features/assessment/queries'
import { TestRunner } from '@/features/assessment/test-runner'
import { estimatedMinutes } from '@/features/assessment/estimate'
import { formatDate } from '@/lib/utils/format'

export const metadata: Metadata = { title: 'Diagnostika testi' }
export const dynamic = 'force-dynamic'

/**
 * Metodikaning 2-bosqichi: 8 bo'limli diagnostika (PLAN 5, 8.11).
 * Natijasi — Individual Linguistic Profile va Learning Path v1.
 */
export default async function DiagnosticPage() {
  const user = await requireStudent()

  const tests = await listTests('diagnostic', user.groupId)
  const available = tests.find(
    (test) => testAvailability(test, user.groupId).state === 'available'
  )

  if (!available) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Diagnostika testi"
          description="8 bo‘limli kirish testi — o‘quv yo‘lingiz shu natija asosida tuziladi."
          breadcrumbs={[
            { label: 'Baholash markazi', href: '/student/assessment' },
            { label: 'Diagnostika' },
          ]}
        />
        <EmptyState
          icon={<Target />}
          title="Diagnostika testi hali mavjud emas"
          description="Test nashr qilinganidan keyin bu sahifada avtomatik paydo bo‘ladi. Shu paytgacha darslar va mashqlar bilan tanishishingiz mumkin."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/student/learn">Darslarga o‘tish</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const [loaded, inProgress, lastAttempt] = await Promise.all([
    getRunnerTest(available.id),
    getInProgressAttempt(user.uid, available.id),
    getLatestAttemptOfType(user.uid, 'diagnostic'),
  ])

  if (!loaded || loaded.runner.sections.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Diagnostika testi"
          breadcrumbs={[
            { label: 'Baholash markazi', href: '/student/assessment' },
            { label: 'Diagnostika' },
          ]}
        />
        <EmptyState
          icon={<Target />}
          title="Testda hali savollar yo‘q"
          description="Test tuzilgan, lekin bo‘limlarga topshiriqlar qo‘shilmagan. Iltimos, o‘qituvchingizga xabar bering."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostika testi"
        description="Bu test bilim darajangizni o‘lchaydi va shu asosda sizga shaxsiy o‘quv yo‘nalishi tuziladi."
        breadcrumbs={[
          { label: 'Baholash markazi', href: '/student/assessment' },
          { label: 'Diagnostika' },
        ]}
      />

      {lastAttempt ? (
        <Alert variant="info">
          <Target />
          <AlertTitle>Siz diagnostikadan allaqachon o‘tgansiz</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              Oxirgi natija: {Math.round(lastAttempt.percent ?? 0)}% ·{' '}
              {formatDate(lastAttempt.finishedAt)}. Qayta topshirsangiz, o‘quv yo‘lingiz yangi
              natija asosida qayta tuziladi.
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/student/assessment/results/${lastAttempt.id}`}>
                Natijani ko‘rish
                <ArrowRight />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <TestRunner
        test={loaded.runner}
        uid={user.uid}
        existingAttemptId={inProgress?.id ?? null}
        intro={{
          lead: 'Diagnostika — o‘qishning boshlanish nuqtasi. U sakkiz bo‘limdan iborat va har bir ko‘nikmangizni alohida o‘lchaydi: lug‘at, grammatika, tinglash, o‘qish, yozish, gapirish, talaffuz hamda kasbiy ingliz tili. Natija asosida platforma sizga Individual lingvistik profil va shaxsiy o‘quv yo‘lini tuzadi.',
          estimatedMin: estimatedMinutes(loaded.runner),
          note: 'Bu test baholanmaydi va reytingingizga ta’sir qilmaydi. Maqsad — hozirgi darajangizni to‘g‘ri aniqlash, shuning uchun bilmagan savolingizni taxmin qilmasdan tashlab ketishingiz ham mumkin.',
          bullets: [
            'Har bir bo‘limda savollar birma-bir ko‘rsatiladi; bo‘lim ichida oldinga-orqaga erkin yurishingiz mumkin.',
            'Javoblaringiz avtomatik saqlanadi — internet uzilsa ham, sahifani yopsangiz ham yo‘qolmaydi.',
            'Ba’zi bo‘limlarda vaqt cheklovi bor; taymer bo‘limga birinchi kirganingizda boshlanadi.',
            'Gapirish va talaffuz bo‘limlarida mikrofon kerak bo‘ladi — brauzerdan ruxsat so‘raladi.',
            'Yozish, gapirish va talaffuz javoblarini o‘qituvchi (yoki AI) keyinroq baholaydi.',
          ],
        }}
      />
    </div>
  )
}
