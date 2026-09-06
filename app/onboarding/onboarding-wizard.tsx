'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Sparkles, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import {
  CEFR_LEVELS,
  DOMAIN_LABELS,
  SKILL_LABELS,
  SKILLS,
  type CefrLevel,
  type Domain,
  type Skill,
} from '@/config/constants'
import { completeOnboardingAction } from '@/features/auth/actions'

/** Kasbiy yo'nalishlar — iqtisodiyot talabalari uchun (PLAN 8.7) */
const TRACKS: Array<{ id: Domain; description: string }> = [
  { id: 'finance', description: 'Moliya, investitsiya, hisobot va moliyaviy tahlil tili' },
  { id: 'banking', description: 'Bank xizmatlari, kredit, mijoz bilan muloqot' },
  { id: 'marketing', description: 'Bozor tadqiqoti, reklama kampaniyalari, brend' },
  { id: 'management', description: 'Boshqaruv, jamoa, strategiya va yig‘ilishlar' },
  { id: 'economics', description: 'Umumiy iqtisodiy nazariya, statistika, makroiqtisodiyot' },
]

const GOAL_SUGGESTIONS = [
  'Kasbiy suhbatda (job interview) ishonchli gapirish',
  'Iqtisodiy hisobot va grafiklarni ingliz tilida tushuntirish',
  'Xalqaro konferensiyada taqdimot qilish',
  'Biznes yozishmalarni xatosiz yozish',
  'Ilmiy maqolalarni erkin o‘qish',
]

const WEEKLY_OPTIONS = [
  { minutes: 60, label: '60 daqiqa', sub: 'Haftasiga ~1 soat' },
  { minutes: 120, label: '120 daqiqa', sub: 'Haftasiga ~2 soat' },
  { minutes: 180, label: '180 daqiqa', sub: 'Haftasiga ~3 soat' },
  { minutes: 300, label: '300 daqiqa', sub: 'Kuniga ~40 daqiqa' },
]

const STEP_TITLES = ['Maqsad', 'Kasbiy yo‘nalish', 'Ko‘nikmalar', 'Sur‘at va daraja', 'Tasdiqlash']

export function OnboardingWizard({ displayName }: { displayName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [goal, setGoal] = useState('')
  const [track, setTrack] = useState<Domain | null>(null)
  const [targetSkills, setTargetSkills] = useState<Skill[]>([])
  const [weeklyMinutes, setWeeklyMinutes] = useState(120)
  const [level, setLevel] = useState<CefrLevel>('B1')

  const canContinue =
    (step === 0 && goal.trim().length >= 10) ||
    (step === 1 && track !== null) ||
    (step === 2 && targetSkills.length > 0) ||
    step === 3 ||
    step === 4

  function toggleSkill(skill: Skill) {
    setTargetSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  async function finish() {
    if (!track) return
    setLoading(true)
    const result = await completeOnboardingAction({
      goal: goal.trim(),
      professionalTrack: track,
      targetSkills,
      weeklyMinutes,
      selfAssessedLevel: level,
    })
    setLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('Maqsadingiz saqlandi. Endi diagnostikadan o‘tamiz.')
    router.push('/student/assessment/diagnostic')
    router.refresh()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {step + 1}-qadam / {STEP_TITLES.length} &middot; {STEP_TITLES[step]}
          </span>
          <span>1-bosqich: maqsadni belgilash</span>
        </div>
        <Progress value={((step + 1) / STEP_TITLES.length) * 100} />
        <CardTitle className="pt-4 text-xl">
          {step === 0 && `Salom, ${displayName.split(' ')[0] || 'talaba'}!`}
          {step === 1 && 'Kasbiy yo‘nalishingiz qaysi?'}
          {step === 2 && 'Qaysi ko‘nikmalarni rivojlantirmoqchisiz?'}
          {step === 3 && 'Sur‘at va boshlang‘ich daraja'}
          {step === 4 && 'Hammasi tayyor'}
        </CardTitle>
        <CardDescription>
          {step === 0 &&
            'What do you want to improve? Maqsadingizni o‘z so‘zlaringiz bilan yozing.'}
          {step === 1 && 'Materiallar va AI topshiriqlari shu sohaga moslashtiriladi.'}
          {step === 2 && 'Bir nechtasini tanlashingiz mumkin. Keyin o‘zgartirasiz.'}
          {step === 3 && 'Bu individual o‘quv yo‘nalishini rejalashtirish uchun kerak.'}
          {step === 4 && 'Keyingi qadam — diagnostika testi va individual yo‘nalish.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 0 && (
          <div className="space-y-3">
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Masalan: Xalqaro bank amaliyotiga topshirish uchun moliyaviy hisobotlarni ingliz tilida tushuntirishni o‘rganmoqchiman."
              className="min-h-28"
              maxLength={400}
            />
            <div className="flex flex-wrap gap-2">
              {GOAL_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setGoal(suggestion)}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Kamida 10 belgi. Maqsad refleksiya kundaligida va AI tavsiyalarida ishlatiladi.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {TRACKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTrack(item.id)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  track === item.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{DOMAIN_LABELS[item.id].uz}</span>
                  {track === item.id && <Check className="size-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => {
              const active = targetSkills.includes(skill)
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/5 font-medium text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span>
                    {SKILL_LABELS[skill].uz}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {SKILL_LABELS[skill].en}
                    </span>
                  </span>
                  {active && <Check className="size-4" />}
                </button>
              )
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium">Haftasiga qancha vaqt ajrata olasiz?</p>
              <div className="grid gap-2 sm:grid-cols-4">
                {WEEKLY_OPTIONS.map((option) => (
                  <button
                    key={option.minutes}
                    type="button"
                    onClick={() => setWeeklyMinutes(option.minutes)}
                    className={cn(
                      'rounded-lg border px-3 py-3 text-center transition-colors',
                      weeklyMinutes === option.minutes
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">
                O‘zingizni qaysi darajada deb bilasiz?
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Diagnostika testi buni aniqlashtiradi.
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CEFR_LEVELS.map((cefr) => (
                  <button
                    key={cefr}
                    type="button"
                    onClick={() => setLevel(cefr)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm transition-colors',
                      level === cefr
                        ? 'border-primary bg-primary/5 font-medium text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {cefr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Target className="size-4 text-primary" />
                Sizning maqsadingiz
              </div>
              <p className="text-sm text-muted-foreground">{goal}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Kasbiy yo‘nalish</div>
                <div className="text-sm font-medium">{track && DOMAIN_LABELS[track].uz}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Haftalik sur‘at</div>
                <div className="text-sm font-medium">{weeklyMinutes} daqiqa</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Boshlang‘ich daraja</div>
                <div className="text-sm font-medium">{level}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">Tanlangan ko‘nikmalar</div>
              <div className="flex flex-wrap gap-2">
                {targetSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {SKILL_LABELS[skill].uz}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Keyingi qadamda 8 bo‘limli diagnostika testidan o‘tasiz. Natijaga qarab platforma
                sizning{' '}
                <strong className="text-foreground">Individual lingvistik profilingizni</strong>{' '}
                tuzadi va shaxsiy o‘quv yo‘nalishini shakllantiradi.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
          >
            <ArrowLeft />
            Orqaga
          </Button>

          {step < STEP_TITLES.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
              Davom etish
              <ArrowRight />
            </Button>
          ) : (
            <Button onClick={finish} loading={loading} size="lg">
              Diagnostikaga o‘tish
              <ArrowRight />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
