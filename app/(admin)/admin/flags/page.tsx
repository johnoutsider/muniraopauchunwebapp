import type { Metadata } from 'next'
import { Info } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/layout/page-header'
import { requireUser } from '@/lib/firebase/session'

import { SettingsForm } from '@/features/admin/components/settings-form'
import { getSettings } from '@/features/admin/queries'
import { getExperiment } from '@/features/researcher/queries'

export const metadata: Metadata = { title: 'Feature flaglar' }
export const dynamic = 'force-dynamic'

export default async function AdminFlagsPage() {
  await requireUser(['admin'])

  const [settings, experiment] = await Promise.all([getSettings(), getExperiment()])
  const experimentRunning = experiment?.status === 'running'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature flaglar va tizim sozlamalari"
        description="Global imkoniyatlar, model identifikatorlari, kunlik limitlar, e’lon va texnik xizmat rejimi."
      />

      <Alert variant="info">
        <Info />
        <AlertTitle>Flaglar qanday ishlaydi</AlertTitle>
        <AlertDescription>
          Yakuniy qiymat uch qatlamdan yig‘iladi: (1) guruh turiga qarab standart — nazorat
          guruhida barcha AI imkoniyatlari o‘chirilgan; (2) guruhning o‘z sozlamasi; (3) shu
          sahifadagi global sozlama, u eng ustun turadi. Flag o‘chirilgan bo‘lsa mos komponent
          serverda umuman render qilinmaydi va API 403 qaytaradi — ya’ni nazorat guruhi AI
          funksiyasini hech qanday yo‘l bilan ocha olmaydi.
        </AlertDescription>
      </Alert>

      <SettingsForm settings={settings} experimentRunning={experimentRunning} />
    </div>
  )
}
