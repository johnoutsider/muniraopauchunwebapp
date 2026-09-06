'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ExperimentGroup } from '@/config/constants'
import type { FeatureFlags } from '@/types'

import { updateGroupFlagsAction } from '../actions'

/** Flaglar va ularning o'zbekcha izohi (PLAN 1.5). */
export const FLAG_META: Array<{
  key: keyof FeatureFlags
  label: string
  description: string
  ai: boolean
}> = [
  {
    key: 'aiTutor',
    label: 'AI o‘qituvchi (24/7 chat)',
    description: 'Talaba istalgan vaqtda AI bilan suhbatlashadi, savol beradi, tushuntirish oladi.',
    ai: true,
  },
  {
    key: 'aiFeedback',
    label: 'AI feedback (writing/speaking)',
    description: 'Yozma va og‘zaki ishlarga xatolarni tushuntiruvchi batafsil izoh.',
    ai: true,
  },
  {
    key: 'adaptive',
    label: 'Adaptiv dvigatel',
    description: 'Mashq qiyinligi BKT modeli asosida avtomatik moslashadi.',
    ai: true,
  },
  {
    key: 'pronunciationAI',
    label: 'Talaffuz tahlili (Azure)',
    description: 'Fonema darajasidagi talaffuz bahosi va AI tavsiyalari.',
    ai: true,
  },
  {
    key: 'aiRolePlay',
    label: 'AI role-play',
    description: 'Mijoz, menejer, investor rolidagi AI bilan kasbiy muloqot mashqi.',
    ai: true,
  },
  {
    key: 'promptLab',
    label: 'Prompt Lab',
    description: 'AI bilan ishlash ko‘nikmasini o‘rgatuvchi 3-bosqich mashqlari.',
    ai: true,
  },
  {
    key: 'corpusVerification',
    label: 'Korpus tekshiruvi',
    description: 'Kollokatsiyalarni real korpus chastotasi bilan tekshirish.',
    ai: true,
  },
  {
    key: 'semanticNetwork',
    label: 'Semantik tarmoq',
    description: 'So‘zlar orasidagi ma’noviy bog‘lanishlar vizualizatsiyasi.',
    ai: true,
  },
  {
    key: 'gamification',
    label: 'Gamifikatsiya',
    description: 'XP, nishonlar, seriya (streak) va reyting. Ikkala guruhda ham yoqiladi.',
    ai: false,
  },
  {
    key: 'peerAssessment',
    label: 'O‘zaro baholash',
    description: 'Talabalarning bir-birini rubrika bo‘yicha baholashi.',
    ai: false,
  },
  {
    key: 'forum',
    label: 'Forum va muloqot markazi',
    description: 'Guruh chatlari, forum mavzulari, o‘qituvchi bilan yozishma.',
    ai: false,
  },
]

export interface GroupFlagsEditorProps {
  groupId: string
  groupName: string
  type: ExperimentGroup
  flags: FeatureFlags
}

export function GroupFlagsEditor({ groupId, groupName, type, flags }: GroupFlagsEditorProps) {
  const router = useRouter()
  const [state, setState] = React.useState<FeatureFlags>(flags)
  const [pending, setPending] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const changed = FLAG_META.filter((meta) => state[meta.key] !== flags[meta.key])
  const aiEnabledInControl =
    type === 'control' ? FLAG_META.filter((meta) => meta.ai && state[meta.key]) : []

  async function save(confirmDesignBreak = false) {
    setPending(true)
    try {
      const patch: Partial<FeatureFlags> = {}
      for (const meta of changed) patch[meta.key] = state[meta.key]

      const result = await updateGroupFlagsAction({ groupId, flags: patch, confirmDesignBreak })
      if (result.ok) {
        toast.success('Flaglar saqlandi')
        setConfirmOpen(false)
        router.refresh()
      } else if (result.code === 'design_break') {
        setConfirmOpen(true)
      } else {
        toast.error(result.error)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-4">
      {type === 'control' ? (
        <Alert variant={aiEnabledInControl.length ? 'destructive' : 'success'}>
          <AlertTriangle />
          <AlertTitle>
            {aiEnabledInControl.length
              ? 'Nazorat guruhida AI imkoniyati yoqilgan!'
              : 'Nazorat guruhi to‘g‘ri sozlangan'}
          </AlertTitle>
          <AlertDescription>
            {aiEnabledInControl.length
              ? `Yoqilgan: ${aiEnabledInControl.map((meta) => meta.label).join(', ')}. Bu eksperimentning mustaqil o‘zgaruvchisini yo‘q qiladi — natijalar ilmiy jihatdan yaroqsiz bo‘ladi.`
              : 'Barcha AI imkoniyatlari o‘chirilgan — mustaqil o‘zgaruvchi to‘g‘ri ajratilgan.'}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {FLAG_META.map((meta) => (
          <div
            key={meta.key}
            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0 space-y-1">
              <Label htmlFor={`${groupId}-${meta.key}`} className="flex items-center gap-2">
                {meta.label}
                {meta.ai ? <Badge variant="info">AI</Badge> : null}
              </Label>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </div>
            <Switch
              id={`${groupId}-${meta.key}`}
              checked={state[meta.key]}
              onCheckedChange={(checked) =>
                setState((prev) => ({ ...prev, [meta.key]: checked }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {changed.length ? `${changed.length} ta o‘zgarish saqlanmagan` : 'O‘zgarish yo‘q'}
        </p>
        <Button disabled={!changed.length} loading={pending} onClick={() => void save(false)}>
          <Save />
          Saqlash
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(next) => (pending ? null : setConfirmOpen(next))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eksperiment dizayni buziladi</DialogTitle>
            <DialogDescription>
              «{groupName}» — nazorat guruhi. Unda AI imkoniyatini yoqish tadqiqotning mustaqil
              o‘zgaruvchisini yo‘q qiladi va yig‘ilgan ma’lumotlarni taqqoslab bo‘lmaydi. Bu amal
              audit jurnaliga yoziladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Bekor qilish
            </Button>
            <Button variant="destructive" loading={pending} onClick={() => void save(true)}>
              Tushundim, baribir saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
