import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { STAGE_META, STAGES } from '@/config/constants'

export const metadata: Metadata = {
  title: 'Metodika',
  description:
    'Platformaning ilmiy-metodik asosi: motivatsion-maqsadli va mazmuniy-lingvistik komponentlar, 8 bosqichli algoritm, mualliflik AI strategiyalari.',
}

const STRATEGIES = [
  {
    title: 'AI Semantic Network Strategy',
    text: 'Lug‘at so‘zlari izolyatsiyada emas, semantik tarmoq shaklida o‘rgatiladi: inflation → prices → purchasing power → consumer spending → monetary policy.',
  },
  {
    title: 'Prompt Scaffolding Strategy',
    text: 'Talaba AI bilan ishlashni Simple Prompt → Guided Prompt → Independent Prompt bosqichlarida o‘rganadi.',
  },
  {
    title: 'Adaptive Learning Strategy',
    text: 'Diagnostika → natija → individual mashq → feedback → qayta moslashtirish tsikli. Mashqlar murakkabligi natijaga qarab avtomatik o‘zgaradi.',
  },
  {
    title: 'AI Feedback and Reflection Strategy',
    text: 'Feedback hech qachon faqat «wrong» emas: nima uchun xato, qanday tuzatiladi, yana qayerda ishlatiladi.',
  },
  {
    title: 'Corpus Verification Strategy',
    text: 'Kasbiy kollokatsiyalar real til materiallari asosida tekshiriladi: «make a profit» to‘g‘ri, «do a profit» esa yo‘q.',
  },
  {
    title: 'Interactive AI Communication Strategy',
    text: 'Talaba AI bilan intervyu, muzokara, yig‘ilish, biznes taqdimot va mijoz bilan muloqot vaziyatlarida gaplashadi.',
  },
  {
    title: 'AI Pronunciation Coaching Strategy',
    text: 'Talaba nutqini yozadi, AI talaffuz, urg‘u, intonatsiya va ravonlik bo‘yicha individual tavsiya beradi.',
  },
]

const PRINCIPLES = [
  'adaptivlik va personalizatsiya',
  'intellektual va uzluksiz feedback',
  'ma‘lumotlarga asoslangan o‘quv progressiyasi',
  'AI va inson hamkorligi',
  'autentiklik va verifikatsiya',
  'o‘quvchi avtonomiyasi',
  'akademik halollik va inson nazorati',
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <Badge variant="info" className="mb-4">
        Ilmiy-metodik asos
      </Badge>
      <h1 className="text-3xl font-bold tracking-tight">Platforma metodikasi</h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Platforma DSc dissertatsiyasi doirasida ishlab chiqilgan: sun‘iy intellekt texnologiyalari
        asosida nofilologik, xususan iqtisodiyot yo‘nalishi talabalarining professional ingliz
        tilidagi lingvistik kompetensiyasini rivojlantirish metodikasini takomillashtirish. U mavjud
        ilovalarning nusxasi emas — o‘quv holatini diagnostika qilish, individual ta‘limni tashkil
        etish va ilmiy ma‘lumot to‘plash yagona tizimga birlashtirilgan.
      </p>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Metodik tizim komponentlari</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-medium">1. Motivatsion-maqsadli komponent</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                O‘quv maqsadini aniqlash, kasbiy ehtiyojlarni belgilash, individual goal setting,
                o‘quv motivatsiyasi, AI savodxonligi boshlang‘ich moduli va refleksiya kundaligi.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-medium">2. Mazmuniy-lingvistik komponent</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Uch yo‘nalish: Vocabulary &amp; Lexis, Grammar (iqtisodiy kontekstda) va
                Pronunciation &amp; Phonetics. Leksik, grammatik va fonetik kompetensiyalar markaziy
                natija sifatida belgilangan.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">8 bosqichli o‘quv algoritmi</h2>
        <ol className="mt-5 space-y-3">
          {STAGES.map((stage) => (
            <li key={stage} className="flex gap-4 rounded-lg border border-border p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {stage}
              </span>
              <div>
                <p className="font-medium">{STAGE_META[stage].uz}</p>
                <p className="text-sm text-muted-foreground">{STAGE_META[stage].en}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Mualliflik AI strategiyalari</h2>
        <div className="mt-5 space-y-3">
          {STRATEGIES.map((strategy, index) => (
            <div key={strategy.title} className="rounded-lg border border-border p-4">
              <p className="font-medium">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {strategy.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{strategy.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Maxsus AI-metodik tamoyillar</h2>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <li key={principle} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              {principle}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
