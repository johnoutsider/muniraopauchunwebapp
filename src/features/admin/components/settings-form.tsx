'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Megaphone, Save, ServerCog, Sliders, Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AI_LIMITS } from '@/config/constants'
import type { FeatureFlags, GlobalSettingsDoc } from '@/types'

import {
  setMaintenanceAction,
  updateAnnouncementAction,
  updateGlobalFlagsAction,
  updateLimitsAction,
  updateModelsAction,
} from '../actions'
import { FLAG_META } from './group-flags-editor'

type FlagState = 'inherit' | 'on' | 'off'

export interface SettingsFormProps {
  settings: GlobalSettingsDoc | null
  experimentRunning: boolean
}

function toState(value: boolean | undefined): FlagState {
  if (value === undefined) return 'inherit'
  return value ? 'on' : 'off'
}

export function SettingsForm({ settings, experimentRunning }: SettingsFormProps) {
  const router = useRouter()

  const initialFlags = React.useMemo(() => {
    const map: Partial<Record<keyof FeatureFlags, FlagState>> = {}
    for (const meta of FLAG_META) map[meta.key] = toState(settings?.featureFlags?.[meta.key])
    return map as Record<keyof FeatureFlags, FlagState>
  }, [settings])

  const [flags, setFlags] = React.useState(initialFlags)
  const [flagsPending, setFlagsPending] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const [main, setMain] = React.useState(settings?.models?.main ?? 'claude-sonnet-4-5')
  const [fast, setFast] = React.useState(settings?.models?.fast ?? 'claude-haiku-4-5')
  const [modelsPending, setModelsPending] = React.useState(false)

  const [messagesPerDay, setMessagesPerDay] = React.useState(
    settings?.limits?.messagesPerDay ?? AI_LIMITS.MESSAGES_PER_DAY
  )
  const [tokensPerDay, setTokensPerDay] = React.useState(
    settings?.limits?.tokensPerDay ?? AI_LIMITS.TOKENS_PER_DAY
  )
  const [limitsPending, setLimitsPending] = React.useState(false)

  const [announcement, setAnnouncement] = React.useState(settings?.announcement?.text ?? '')
  const [level, setLevel] = React.useState<'info' | 'warning'>(
    settings?.announcement?.level ?? 'info'
  )
  const [announcementPending, setAnnouncementPending] = React.useState(false)

  const [maintenance, setMaintenance] = React.useState(Boolean(settings?.maintenanceMode))
  const [maintenancePending, setMaintenancePending] = React.useState(false)

  const changedFlags = FLAG_META.filter((meta) => flags[meta.key] !== initialFlags[meta.key])
  const touchedAi = changedFlags.filter((meta) => meta.ai)

  async function saveFlags(confirmDesignBreak = false) {
    setFlagsPending(true)
    try {
      const patch: Partial<FeatureFlags> = {}
      for (const meta of changedFlags) {
        if (flags[meta.key] === 'inherit') continue
        patch[meta.key] = flags[meta.key] === 'on'
      }
      // «inherit» ga qaytarilganlar uchun ham qiymat yuboriladi (guruh sozlamasi
      // ustun bo'lishi uchun global qiymat o'chirilishi kerak) — buni serverda
      // qo'lda tozalash kerak bo'lsa, flagni «on»/«off» ga qo'ying.
      if (!Object.keys(patch).length) {
        toast.info('Saqlanadigan o‘zgarish yo‘q (faqat «guruh sozlamasi» tanlangan).')
        return
      }

      const result = await updateGlobalFlagsAction({ flags: patch, confirmDesignBreak })
      if (result.ok) {
        toast.success('Global flaglar saqlandi')
        setConfirmOpen(false)
        router.refresh()
      } else if (result.code === 'design_break') {
        setConfirmOpen(true)
      } else {
        toast.error(result.error)
      }
    } finally {
      setFlagsPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {experimentRunning ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Eksperiment davom etmoqda</AlertTitle>
          <AlertDescription>
            AI bilan bog‘liq flagni hozir o‘zgartirish <strong>tadqiqot dizaynini buzadi</strong>:
            eksperimental va nazorat guruhlari orasidagi yagona farq yo‘qoladi va yig‘ilgan
            ma’lumotlarni taqqoslab bo‘lmaydi. Zarurat bo‘lmasa tegmang.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="size-4 text-primary" />
            Global feature flaglar
          </CardTitle>
          <CardDescription>
            «Guruh sozlamasi» — global qiymat qo‘llanilmaydi, guruhning o‘z sozlamasi ishlaydi.
            «Yoqilgan»/«O‘chirilgan» — barcha guruhlar uchun majburiy qiymat (guruh sozlamasidan
            ustun turadi).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {FLAG_META.map((meta) => (
              <div key={meta.key} className="space-y-2 rounded-lg border border-border p-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    {meta.label}
                    {meta.ai ? <Badge variant="info">AI</Badge> : null}
                  </Label>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <Select
                  value={flags[meta.key]}
                  onValueChange={(value) =>
                    setFlags((prev) => ({ ...prev, [meta.key]: value as FlagState }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Guruh sozlamasi (standart)</SelectItem>
                    <SelectItem value="on">Hamma uchun yoqilgan</SelectItem>
                    <SelectItem value="off">Hamma uchun o‘chirilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {touchedAi.length ? (
            <Alert variant="warning">
              <AlertDescription className="text-xs">
                O‘zgartirilayotgan AI flaglari: {touchedAi.map((meta) => meta.label).join(', ')}.
                Bu mustaqil o‘zgaruvchiga bevosita ta’sir qiladi.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {changedFlags.length ? `${changedFlags.length} ta o‘zgarish` : 'O‘zgarish yo‘q'}
            </p>
            <Button
              disabled={!changedFlags.length}
              loading={flagsPending}
              onClick={() => void saveFlags(false)}
            >
              <Save />
              Flaglarni saqlash
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ServerCog className="size-4 text-primary" />
              Model sozlamalari
            </CardTitle>
            <CardDescription>
              Asosiy model — murakkab tahlil va feedback uchun; tez model — qisqa javoblar va
              tasniflash uchun.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="model-main">Asosiy model</Label>
              <Input
                id="model-main"
                value={main}
                onChange={(event) => setMain(event.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model-fast">Tez model</Label>
              <Input
                id="model-fast"
                value={fast}
                onChange={(event) => setFast(event.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button
              loading={modelsPending}
              onClick={async () => {
                setModelsPending(true)
                try {
                  const result = await updateModelsAction({ main, fast })
                  if (result.ok) {
                    toast.success('Model sozlamalari saqlandi')
                    router.refresh()
                  } else toast.error(result.error)
                } finally {
                  setModelsPending(false)
                }
              }}
            >
              <Save />
              Saqlash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kunlik limitlar</CardTitle>
            <CardDescription>
              Bir talaba uchun sutkalik chegara. Limit tugagach AI funksiyalari vaqtincha
              to‘xtaydi (xarajatni nazorat qilish uchun).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="limit-messages">Kunlik xabarlar</Label>
              <Input
                id="limit-messages"
                type="number"
                min={1}
                value={messagesPerDay}
                onChange={(event) => setMessagesPerDay(Number(event.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit-tokens">Kunlik tokenlar</Label>
              <Input
                id="limit-tokens"
                type="number"
                min={1000}
                step={1000}
                value={tokensPerDay}
                onChange={(event) => setTokensPerDay(Number(event.target.value))}
              />
            </div>
            <Button
              loading={limitsPending}
              onClick={async () => {
                setLimitsPending(true)
                try {
                  const result = await updateLimitsAction({ messagesPerDay, tokensPerDay })
                  if (result.ok) {
                    toast.success('Limitlar saqlandi')
                    router.refresh()
                  } else toast.error(result.error)
                } finally {
                  setLimitsPending(false)
                }
              }}
            >
              <Save />
              Saqlash
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" />
            Global e’lon
          </CardTitle>
          <CardDescription>
            Barcha foydalanuvchilarga ko‘rinadigan xabar (masalan: «Post-test 12-may kuni
            o‘tkaziladi»).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={3}
            value={announcement}
            onChange={(event) => setAnnouncement(event.target.value)}
            placeholder="E’lon matni…"
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Daraja</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as 'info' | 'warning')}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Ma’lumot</SelectItem>
                  <SelectItem value="warning">Ogohlantirish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              loading={announcementPending}
              onClick={async () => {
                setAnnouncementPending(true)
                try {
                  const result = await updateAnnouncementAction({ text: announcement, level })
                  if (result.ok) {
                    toast.success(result.data.cleared ? 'E’lon o‘chirildi' : 'E’lon saqlandi')
                    router.refresh()
                  } else toast.error(result.error)
                } finally {
                  setAnnouncementPending(false)
                }
              }}
            >
              <Save />
              Saqlash
            </Button>
            <Button
              variant="outline"
              disabled={announcementPending}
              onClick={async () => {
                setAnnouncementPending(true)
                try {
                  const result = await updateAnnouncementAction({ text: '', level, clear: true })
                  if (result.ok) {
                    setAnnouncement('')
                    toast.success('E’lon o‘chirildi')
                    router.refresh()
                  } else toast.error(result.error)
                } finally {
                  setAnnouncementPending(false)
                }
              }}
            >
              Tozalash
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="size-4 text-primary" />
            Texnik xizmat rejimi
          </CardTitle>
          <CardDescription>
            Yoqilganda talabalar platformadan foydalana olmaydi. Eksperiment davomida faqat
            zaruratda yoqing — faollik ma’lumotlari uziladi.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch
              id="maintenance"
              checked={maintenance}
              disabled={maintenancePending}
              onCheckedChange={async (checked) => {
                setMaintenance(checked)
                setMaintenancePending(true)
                try {
                  const result = await setMaintenanceAction(checked)
                  if (result.ok) {
                    toast.success(checked ? 'Texnik rejim yoqildi' : 'Texnik rejim o‘chirildi')
                    router.refresh()
                  } else {
                    setMaintenance(!checked)
                    toast.error(result.error)
                  }
                } finally {
                  setMaintenancePending(false)
                }
              }}
            />
            <Label htmlFor="maintenance">
              {maintenance ? 'Yoqilgan — platforma yopiq' : 'O‘chirilgan — platforma ochiq'}
            </Label>
          </div>
          {maintenance ? <Badge variant="danger">Texnik rejim</Badge> : null}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={(next) => (flagsPending ? null : setConfirmOpen(next))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eksperiment davom etayotganda AI flagini o‘zgartirish</DialogTitle>
            <DialogDescription>
              Bu o‘zgarish eksperimental va nazorat guruhlari orasidagi farqni buzadi. Yig‘ilgan
              ma’lumotlar ilmiy jihatdan taqqoslanmaydigan bo‘lib qolishi mumkin. Amal audit
              jurnaliga yoziladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={flagsPending}>
              Bekor qilish
            </Button>
            <Button variant="destructive" loading={flagsPending} onClick={() => void saveFlags(true)}>
              Tushundim, saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
