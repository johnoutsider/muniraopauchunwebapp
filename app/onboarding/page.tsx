import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { COL } from '@/config/constants'
import { adminDb } from '@/lib/firebase/admin'
import { requireUser } from '@/lib/firebase/session'
import type { UserDoc } from '@/types'
import { OnboardingWizard } from './onboarding-wizard'

export const metadata: Metadata = { title: 'Boshlash' }

export default async function OnboardingPage() {
  const user = await requireUser(['student'])
  const snap = await adminDb().collection(COL.users).doc(user.uid).get()
  const data = snap.data() as UserDoc | undefined

  if (!data?.consentGiven) redirect('/consent')
  if (data?.onboarding?.completedAt) redirect('/student/dashboard')

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-10">
      <OnboardingWizard displayName={data?.displayName ?? user.displayName} />
    </div>
  )
}
