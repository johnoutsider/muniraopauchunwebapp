'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check, Mic, MicOff, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { updateProfileAction } from '@/features/auth/actions'

import { updatePreferencesAction } from './actions'
import { GOAL_LIMITS, type StudentPreferences } from './preferences'

/* ================================================================== */
/* 1. Profil                                                           */
/* ================================================================== */

export function ProfileForm({
  displayName,
  locale,
}: {
  displayName: string
  locale: 'uz' | 'en' | 'ru'
}) {
  const router = useRouter()
  const [name, setName] = React.useState(displayName)
  const [lang, setLang] = React.useState<'uz' | 'en' | 'ru'>(locale)
  const [pending, setPending] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Ism bo‘sh bo‘lishi mumkin emas.')
      return
    }
    setPending(true)
    setError(null)
    const result = await updateProfileAction({ displayName: name, locale: lang })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Ism va familiya</Label>
        <Input
          id="displayName"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ismingiz"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="locale">Interfeys tili</Label>
        <Select value={lang} onValueChange={(value) => setLang(value as 'uz' | 'en' | 'ru')}>
          <SelectTrigger id="locale" className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uz">O‘zbekcha</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          O‘quv kontenti (matnlar, mashqlar) har doim ingliz tilida qoladi.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} disabled={pending}>
          <Save />
          Saqlash
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3" />
            Saqlandi
          </span>
        ) : null}
      </div>
    </form>
  )
}

/* ================================================================== */
/* 2. Bildirishnoma va kunlik maqsad                                   */
/* ================================================================== */

export function PreferencesForm({ preferences }: { preferences: StudentPreferences }) {
  const router = useRouter()
  const [goal, setGoal] = React.useState(preferences.dailyGoalXp)
  const [notifications, setNotifications] = React.useState(preferences.notifications)
  const [pending, setPending] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function toggle(key: keyof StudentPreferences['notifications'], value: boolean) {
    setNotifications((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    setPending(true)
    setError(null)
    const result = await updatePreferencesAction({ dailyGoalXp: goal, notifications })
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  const rows: Array<{ key: keyof StudentPreferences['notifications']; label: string; hint: string }> =
    [
      {
        key: 'reminders',
        label: 'Kunlik eslatmalar',
        hint: 'Mashq qilish vaqti kelganda eslatib turadi',
      },
      {
        key: 'feedback',
        label: 'Feedback xabarlari',
        hint: 'O‘qituvchi yoki tizim bahosi kelganda',
      },
      { key: 'assignments', label: 'Topshiriqlar', hint: 'Yangi topshiriq va muddatlar haqida' },
      {
        key: 'leaderboard',
        label: 'Reyting o‘zgarishlari',
        hint: 'Guruh reytingidagi o‘rningiz o‘zgarganda',
      },
    ]

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="daily-goal">Kunlik maqsad: {goal} XP</Label>
        <Slider
          id="daily-goal"
          min={GOAL_LIMITS.min}
          max={GOAL_LIMITS.max}
          step={10}
          value={[goal]}
          onValueChange={(value) => setGoal(value[0] ?? goal)}
          aria-label="Kunlik XP maqsadi"
        />
        <Progress
          value={Math.round(((goal - GOAL_LIMITS.min) / (GOAL_LIMITS.max - GOAL_LIMITS.min)) * 100)}
          className="h-1.5"
        />
        <p className="text-xs text-muted-foreground">
          Taxminan {Math.max(1, Math.round(goal / 12))} ta mashq yoki {Math.max(1, Math.round(goal / 50))}{' '}
          ta dars.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label htmlFor={`notify-${row.key}`} className="text-sm">
                {row.label}
              </Label>
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch
              id={`notify-${row.key}`}
              checked={notifications[row.key]}
              onCheckedChange={(value) => toggle(row.key, value)}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => void handleSave()} loading={pending} disabled={pending}>
          <Save />
          Saqlash
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check className="size-3" />
            Saqlandi
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* ================================================================== */
/* 3. Mikrofon tekshiruvi                                              */
/* ================================================================== */

export function AudioCheck() {
  const [state, setState] = React.useState<'idle' | 'running' | 'denied' | 'unsupported'>('idle')
  const [level, setLevel] = React.useState(0)
  const [deviceLabel, setDeviceLabel] = React.useState<string | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const contextRef = React.useRef<AudioContext | null>(null)
  const frameRef = React.useRef<number | null>(null)

  const stop = React.useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    void contextRef.current?.close()
    contextRef.current = null
    setLevel(0)
    setState('idle')
  }, [])

  React.useEffect(() => () => stop(), [stop])

  async function start() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setDeviceLabel(stream.getAudioTracks()[0]?.label || 'Mikrofon')

      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) {
        setState('unsupported')
        return
      }

      const context = new AudioCtx()
      contextRef.current = context
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buffer)
        let peak = 0
        for (const value of buffer) peak = Math.max(peak, Math.abs(value - 128))
        setLevel(Math.min(100, Math.round((peak / 128) * 100 * 1.6)))
        frameRef.current = requestAnimationFrame(tick)
      }
      tick()
      setState('running')
    } catch {
      setState('denied')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Speaking Lab va talaffuz mashqlari uchun mikrofon kerak. Tugmani bosing va normal ovozda
        gapiring — chiziq harakatlansa, mikrofon ishlayapti.
      </p>

      {state === 'running' ? (
        <div className="space-y-1">
          <Progress value={level} aria-label="Mikrofon darajasi" />
          <p className="text-xs text-muted-foreground">
            Qurilma: {deviceLabel} · daraja {level}%
          </p>
        </div>
      ) : null}

      {state === 'denied' ? (
        <p role="alert" className="text-sm text-destructive">
          Mikrofonga ruxsat berilmadi. Brauzer manzil qatoridagi qulf belgisidan ruxsatni yoqing va
          qayta urinib ko‘ring.
        </p>
      ) : null}

      {state === 'unsupported' ? (
        <p role="alert" className="text-sm text-destructive">
          Bu brauzer mikrofon yozishni qo‘llab-quvvatlamaydi. Chrome yoki Edge’ning so‘nggi
          versiyasidan foydalaning.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {state === 'running' ? (
          <Button type="button" variant="outline" onClick={stop}>
            <MicOff />
            To‘xtatish
          </Button>
        ) : (
          <Button type="button" onClick={() => void start()}>
            <Mic />
            Mikrofonni tekshirish
          </Button>
        )}
      </div>
    </div>
  )
}
