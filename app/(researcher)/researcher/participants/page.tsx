import type { Metadata } from 'next'
import { EyeOff, KeyRound, ShieldAlert, Users } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { requireUser } from '@/lib/firebase/session'

import { assignParticipantCodesAction } from '@/features/researcher/actions'
import { ActionButton } from '@/features/researcher/components/action-button'
import { ParticipantsTable } from '@/features/researcher/components/participants-table'
import { listParticipantsConfidential } from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Ishtirokchilar (maxfiy)' }
export const dynamic = 'force-dynamic'

export default async function ParticipantsPage() {
  await requireUser(['researcher', 'admin'])
  const rows = await listParticipantsConfidential()

  const consented = rows.filter((row) => row.consentGiven).length
  const withdrawn = rows.filter((row) => row.withdrawn).length
  const withoutCode = rows.filter((row) => row.participantCode === '—').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ishtirokchilar — maxfiy xarita"
        description="Ishtirokchi kodi bilan talaba o‘rtasidagi bog‘lanish. Bu sahifa tadqiqotning yagona deanonimlashtirish nuqtasi."
        actions={
          <ActionButton
            variant="outline"
            action={() => assignParticipantCodesAction()}
            successMessage="Yetishmayotgan kodlar berildi"
            confirmTitle="Ishtirokchi kodlarini berish"
            confirmDescription="Kodi yo‘q barcha talabalarga LE-0001 ko‘rinishidagi navbatdagi kod beriladi. Mavjud kodlar o‘zgarmaydi."
          >
            <KeyRound />
            Yetishmayotgan kodlarni berish
          </ActionButton>
        }
      />

      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>MAXFIY — eksport qilinmaydi, skrinshot olinmaydi</AlertTitle>
        <AlertDescription>
          <p>
            Bu jadval ishtirokchining haqiqiy ism-familiyasi va elektron pochtasini ko‘rsatadigan
            YAGONA joy. Uni dissertatsiyaga, taqdimotga, hisobotga yoki ilovaga
            <strong> hech qanday ko‘rinishda kiritish mumkin emas</strong> — na jadval sifatida, na
            skrinshot sifatida.
          </p>
          <p className="mt-2">
            Ilmiy ishda va barcha eksport fayllarida talaba faqat{' '}
            <code className="font-mono">participant_code</code> bilan keltiriladi. Ushbu sahifaga
            kirish auditda qayd etiladi.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami ishtirokchilar"
          value={rows.length}
          sublabel="ro‘yxatga olingan talabalar"
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Rozilik bergan"
          value={consented}
          sublabel={rows.length ? `${Math.round((consented / rows.length) * 100)}%` : '—'}
          icon={<Users className="size-4" />}
          tone={rows.length && consented / rows.length >= 0.8 ? 'success' : 'warning'}
        />
        <StatCard
          label="Tadqiqotdan chiqqan"
          value={withdrawn}
          sublabel="ma’lumoti eksportga kirmaydi"
          icon={<EyeOff className="size-4" />}
          tone={withdrawn ? 'warning' : 'default'}
        />
        <StatCard
          label="Kodsiz talabalar"
          value={withoutCode}
          sublabel={withoutCode ? 'kod berilishi kerak' : 'hammasida kod bor'}
          icon={<KeyRound className="size-4" />}
          tone={withoutCode ? 'danger' : 'success'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kod ↔ talaba xaritasi</CardTitle>
          <CardDescription>
            Tadqiqotdan chiqarilgan ishtirokchi platformadan foydalanishda davom etadi, lekin uning
            ma’lumotlari analitika va eksportdan butunlay chiqariladi (PLAN 9.4 — etika).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParticipantsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  )
}
