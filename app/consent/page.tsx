import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Database, Eye, Lock, UserX } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { COL } from '@/config/constants'
import { adminDb } from '@/lib/firebase/admin'
import { requireUser } from '@/lib/firebase/session'
import type { UserDoc } from '@/types'
import { ConsentForm } from './consent-form'

export const metadata: Metadata = { title: 'Tadqiqotda ishtirok' }

const POINTS = [
  {
    icon: Database,
    title: 'Qanday ma‘lumot yig‘iladi',
    text: 'Test va mashq natijalari, bajarish vaqti, xatolar turlari, AI bilan muloqot statistikasi, talaffuz va yozma ish ballari, so‘rovnoma javoblari.',
  },
  {
    icon: UserX,
    title: 'Anonimlik',
    text: 'Tahlilga faqat ishtirokchi kodi (masalan E-042) chiqadi. Ismingiz, emailingiz va telefon raqamingiz hech qanday eksportga kirmaydi.',
  },
  {
    icon: Eye,
    title: 'Kim ko‘radi',
    text: 'Shaxsiy natijalaringizni siz va o‘qituvchingiz ko‘radi. Tadqiqotchi faqat anonim, umumlashtirilgan ma‘lumot bilan ishlaydi.',
  },
  {
    icon: Lock,
    title: 'Huquqlaringiz',
    text: 'Istalgan vaqtda ishtirokdan voz kechishingiz yoki ma‘lumotlaringizni o‘chirishni so‘rashingiz mumkin. Bu baholaringizga ta‘sir qilmaydi.',
  },
]

export default async function ConsentPage() {
  const user = await requireUser(['student'])
  const snap = await adminDb().collection(COL.users).doc(user.uid).get()
  const data = snap.data() as UserDoc | undefined

  if (data?.consentGiven) redirect('/onboarding')

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ilmiy tadqiqotda ishtirok etish roziligi</CardTitle>
          <CardDescription>
            Bu platforma dissertatsiya tadqiqoti doirasida ishlab chiqilgan. Boshlashdan oldin
            quyidagilar bilan tanishing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {POINTS.map((point) => (
              <div key={point.title} className="rounded-lg border border-border p-4">
                <point.icon className="mb-2 size-5 text-primary" />
                <h3 className="mb-1 text-sm font-semibold">{point.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{point.text}</p>
              </div>
            ))}
          </div>

          <ConsentForm />

          <p className="text-center text-xs text-muted-foreground">
            Savollar bo‘lsa, tadqiqot rahbariga yoki o‘qituvchingizga murojaat qiling.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
