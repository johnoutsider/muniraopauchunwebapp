'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { giveConsentAction } from '@/features/auth/actions'

export function ConsentForm() {
  const router = useRouter()
  const [participation, setParticipation] = useState(false)
  const [dataUse, setDataUse] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    if (!participation) {
      toast.error('Davom etish uchun birinchi bandni tasdiqlang.')
      return
    }
    setLoading(true)
    const result = await giveConsentAction({
      agreeParticipation: participation,
      agreeDataUse: dataUse,
    })
    setLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <Checkbox
          id="participation"
          checked={participation}
          onCheckedChange={(v) => setParticipation(Boolean(v))}
          className="mt-0.5"
        />
        <Label
          htmlFor="participation"
          className="cursor-pointer text-sm font-normal leading-relaxed"
        >
          Men platformadan foydalanish shartlari bilan tanishdim va ilmiy tadqiqotda ishtirok
          etishga roziman. Ishtirok ixtiyoriy ekanini, istalgan vaqtda voz kechishim mumkinligini
          bilaman.
        </Label>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border p-4">
        <Checkbox
          id="dataUse"
          checked={dataUse}
          onCheckedChange={(v) => setDataUse(Boolean(v))}
          className="mt-0.5"
        />
        <Label htmlFor="dataUse" className="cursor-pointer text-sm font-normal leading-relaxed">
          Anonimlashtirilgan o‘quv natijalarim (test ballari, mashq statistikasi, so‘rovnoma
          javoblari) dissertatsiya tahlilida va ilmiy nashrlarda ishlatilishiga roziman.
          <span className="mt-1 block text-xs text-muted-foreground">
            Ixtiyoriy. Rad etsangiz ham platformadan to‘liq foydalanasiz — ma‘lumotlaringiz faqat
            eksportga kirmaydi.
          </span>
        </Label>
      </div>

      <Button onClick={onSubmit} size="lg" className="w-full" loading={loading}>
        <ShieldCheck />
        Tasdiqlash va davom etish
      </Button>
    </div>
  )
}
