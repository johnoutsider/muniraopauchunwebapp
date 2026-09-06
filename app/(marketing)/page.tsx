import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BookA,
  Braces,
  Brain,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Mic,
  Network,
  PenLine,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APP_NAME, STAGE_META, STAGES } from '@/config/constants'
import { getSessionUser } from '@/lib/firebase/session'

export const metadata: Metadata = {
  title: 'Iqtisodchilar uchun professional ingliz tili',
  description:
    'Sun‘iy intellekt asosida iqtisodiyot yo‘nalishi talabalarining leksik, grammatik va fonetik kompetensiyasini rivojlantiruvchi ilmiy-metodik platforma.',
}

const COMPONENTS = [
  {
    icon: BookA,
    title: 'Vocabulary & Lexis',
    text: 'Umumiy, akademik va kasbiy lug‘at: moliya, bank, marketing, menejment. Har bir so‘z ma‘no → kollokatsiya → kontekst → kasbiy vaziyat → kommunikativ qo‘llash ketma-ketligida o‘rgatiladi.',
  },
  {
    icon: Braces,
    title: 'Grammar in economic context',
    text: 'Grammatika quruq qoida emas: Present Perfect — kompaniya natijalari, Passive Voice — iqtisodiy hisobotlar, Conditionals — biznes qarorlari.',
  },
  {
    icon: AudioLines,
    title: 'Pronunciation & Phonetics',
    text: 'AI Pronunciation Coach talaffuz, urg‘u, intonatsiya va ravonlikni so‘z hamda tovush darajasida baholaydi, namuna bilan taqqoslash imkonini beradi.',
  },
]

const AI_FEATURES = [
  { icon: Brain, label: 'AI Tutor 24/7' },
  { icon: Sparkles, label: 'Adaptiv mashqlar' },
  { icon: Mic, label: 'Talaffuz tahlili' },
  { icon: PenLine, label: 'Writing feedback' },
  { icon: MessageSquare, label: 'Role-play suhbat' },
  { icon: Network, label: 'Semantik tarmoq' },
  { icon: ClipboardCheck, label: 'Xatolar tahlili' },
  { icon: BarChart3, label: 'Learning analytics' },
]

const AUDIENCE = [
  {
    icon: GraduationCap,
    title: 'Talaba',
    text: 'Individual yo‘nalish, adaptiv mashqlar, AI o‘qituvchi, speaking va writing laboratoriyalari, portfolio.',
  },
  {
    icon: Users,
    title: 'O‘qituvchi',
    text: 'Guruh monitoringi, yozma va og‘zaki ishlarni baholash navbati, AI yaratgan materiallarni tasdiqlash.',
  },
  {
    icon: BarChart3,
    title: 'Tadqiqotchi',
    text: 'Eksperimental va nazorat guruhlari, pre/post testlar, so‘rovnomalar, Excel va SPSS uchun eksport.',
  },
]

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const user = await getSessionUser()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <Badge variant="info" className="mb-5">
            DSc ilmiy tadqiqot platformasi
          </Badge>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Iqtisodchilar uchun professional ingliz tili —{' '}
            <span className="text-primary">sun‘iy intellekt bilan</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {APP_NAME} nofilologik, xususan iqtisodiyot yo‘nalishi talabalarining leksik, grammatik
            va fonetik kompetensiyasini rivojlantiradi. Har bir talabaning darajasi diagnostika
            qilinadi, so‘ng AI individual o‘quv trayektoriyasi, moslashtirilgan mashqlar va
            tushuntirishli feedback taqdim etadi.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Button asChild size="lg">
                <Link href="/redirect">
                  Kabinetga o‘tish
                  <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/login">
                    Tizimga kirish
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/about">Metodika haqida</Link>
                </Button>
              </>
            )}
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '8', label: 'bosqichli o‘quv algoritmi' },
              { value: '3', label: 'lingvistik yo‘nalish' },
              { value: '16', label: 'AI funksiyasi' },
              { value: '7', label: 'mualliflik strategiyasi' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold text-primary">{stat.value}</dt>
                <dd className="text-xs text-muted-foreground">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Mazmuniy-lingvistik komponent */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Mazmuniy-lingvistik komponent</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Platformaning o‘zagi — leksik, grammatik va fonetik kompetensiyalarni birgalikda
          rivojlantirish.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {COMPONENTS.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <item.icon className="mb-4 size-6 text-primary" />
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 8 bosqich */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">8 bosqichli o‘quv algoritmi</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tashkiliy-tayyorgarlik, o‘quv-amaliy va baholash-refleksiv bosqichlar ketma-ketligi.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => {
              const meta = STAGE_META[stage]
              const phaseLabel =
                meta.phase === 'organizational'
                  ? 'Tashkiliy-tayyorgarlik'
                  : meta.phase === 'practical'
                    ? 'O‘quv-amaliy'
                    : 'Baholash-refleksiv'
              return (
                <li key={stage} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {stage}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {phaseLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-snug">{meta.uz}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.en}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* AI imkoniyatlari */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">AI shunchaki javob bermaydi</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Platformaning mualliflik metodikasida AI xatoni faqat &laquo;wrong&raquo; deb
              belgilamaydi. Har bir feedback uch savolga javob beradi:{' '}
              <strong className="text-foreground">nima uchun xato</strong>,{' '}
              <strong className="text-foreground">qanday tuzatiladi</strong> va{' '}
              <strong className="text-foreground">bu qoida yana qayerda ishlatiladi</strong>.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Talaba AI bilan ishlashni ham o‘rganadi: Prompt Practice Lab Simple → Guided →
              Independent bosqichlarida prompt yozishni, AI javobini tekshirishni va akademik
              halollikni shakllantiradi.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs">
              <p className="text-rose-600">&#10007; &ldquo;Give me English exercises.&rdquo;</p>
              <p className="mt-2 text-emerald-600">
                &#10003; &ldquo;Create five B1&ndash;B2 grammar exercises about inflation for
                economics students.&rdquo;
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {AI_FEATURES.map((feature) => (
              <div
                key={feature.label}
                className="flex flex-col items-start gap-2 rounded-xl border border-border p-4"
              >
                <feature.icon className="size-5 text-accent" />
                <span className="text-xs font-medium leading-tight">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kim uchun */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Kim uchun</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {AUDIENCE.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <item.icon className="mb-4 size-6 text-primary" />
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-primary/5 p-8 text-center sm:p-12">
          <Target className="mx-auto mb-4 size-8 text-primary" />
          <h2 className="text-2xl font-semibold tracking-tight">Boshlashga tayyormisiz?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Diagnostika testidan o‘ting, individual lingvistik profilingizni oling va shaxsiy o‘quv
            yo‘nalishingizni boshlang.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={user ? '/redirect' : '/login'}>
              {user ? 'Kabinetga o‘tish' : 'Tizimga kirish'}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
