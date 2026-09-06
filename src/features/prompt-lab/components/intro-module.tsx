'use client'

import * as React from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  CircleCheck,
  CircleX,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

import { INTRO_SECTIONS, SHOWCASE } from '../content'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  can: Sparkles,
  cannot: CircleX,
  verify: BookOpenCheck,
  honesty: ShieldCheck,
}

/** 3-bosqich: AI bilan ishlashga metodik tayyorgarlik (PLAN 5, 8.15). */
export function IntroModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI bilan ishlashga tayyorgarlik</CardTitle>
        <CardDescription>
          Promptlar yozishdan oldin: AI nima qila oladi, nimani qila olmaydi, javobini qanday
          tekshirish kerak va akademik halollik qoidalari.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="can" className="w-full">
          {INTRO_SECTIONS.map((section) => {
            const Icon = ICONS[section.id] ?? Sparkles
            return (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'size-4',
                        section.id === 'cannot' ? 'text-destructive' : 'text-primary'
                      )}
                    />
                    {section.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5">
                    {section.points.map((point, index) => (
                      <li key={index} className="flex gap-2 text-sm">
                        {section.id === 'cannot' ? (
                          <CircleX className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                        ) : (
                          <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                        )}
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}

/** «Yomon vs yaxshi prompt» namunasi (PLAN 8.15 misoli). */
export function BadVsGood() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Yomon prompt ↔ yaxshi prompt</CardTitle>
        <CardDescription>
          Bir xil maqsad, ikki xil natija. Farqni tahlil qiling — mashqlarda shu mezonlar bo‘yicha
          baholanasiz.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
            <CircleX className="size-3.5" />
            Yomon prompt
          </p>
          <p className="rounded bg-background/60 p-2 font-mono text-sm">«{SHOWCASE.bad}»</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {SHOWCASE.whyBad.map((item, index) => (
              <li key={index} className="flex gap-1.5">
                <CircleX className="mt-0.5 size-3 shrink-0 text-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <CircleCheck className="size-3.5" />
            Yaxshi prompt
          </p>
          <p className="rounded bg-background/60 p-2 font-mono text-sm">«{SHOWCASE.good}»</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {SHOWCASE.whyGood.map((item, index) => (
              <li key={index} className="flex gap-1.5">
                <CircleCheck className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-2">
          <ArrowRight className="size-3.5 shrink-0" />
          Qoida: <span className="font-medium">vazifa + daraja + mavzu + format</span> — to‘rt qism
          ham bo‘lsa, prompt ishlaydi.
        </p>
      </CardContent>
    </Card>
  )
}
