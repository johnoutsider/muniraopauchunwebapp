'use client'

import * as React from 'react'
import { Play, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { AI_PERSONAS, PERSONA_LABELS, type AiPersona } from '@/config/constants'

import type { ScenarioSummary } from '../types'

export interface RolePlaySetupProps {
  scenarios: ScenarioSummary[]
  persona: AiPersona
  onPersonaChange: (persona: AiPersona) => void
  scenarioId: string
  onScenarioChange: (scenarioId: string) => void
  onStart: () => void
  starting: boolean
  disabled?: boolean
}

/** Persona + stsenariy tanlash ekrani (PLAN 8.6). */
export function RolePlaySetup({
  scenarios,
  persona,
  onPersonaChange,
  scenarioId,
  onScenarioChange,
  onStart,
  starting,
  disabled,
}: RolePlaySetupProps) {
  const forPersona = scenarios.filter((scenario) => scenario.persona === persona)
  const selected = forPersona.find((scenario) => scenario.id === scenarioId) ?? null

  return (
    <div className="space-y-5 p-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">1. Suhbatdoshni tanlang</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AI_PERSONAS.map((item) => {
            const label = PERSONA_LABELS[item]
            const active = persona === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onPersonaChange(item)
                  onScenarioChange('')
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-muted/40',
                  active && 'border-primary bg-primary/5 ring-1 ring-primary/30'
                )}
                aria-pressed={active}
              >
                <span className="text-lg" aria-hidden="true">
                  {label.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{label.uz}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {label.en}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">2. Vaziyatni tanlang</h3>
        {forPersona.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            Bu persona uchun tayyor stsenariy hali qo‘shilmagan. Erkin suhbatni boshlashingiz mumkin
            — AI o‘z rolida vaziyatni o‘zi taklif qiladi.
          </p>
        ) : (
          <div className="space-y-2">
            {forPersona.map((scenario) => {
              const active = scenarioId === scenario.id
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onScenarioChange(active ? '' : scenario.id)}
                  aria-pressed={active}
                  className={cn(
                    'block w-full rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40',
                    active && 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{scenario.title}</span>
                    <Badge variant="outline" className="shrink-0">
                      {scenario.cefr}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {scenario.context}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected && selected.goals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="size-4 text-primary" />
              Maqsadlaringiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {selected.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button onClick={onStart} disabled={starting || disabled} loading={starting}>
        <Play />
        Rol o‘yinini boshlash
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Suhbat davomida yozishingiz yoki mikrofon tugmasi orqali gapirishingiz mumkin. Yakunlash
        uchun <code className="rounded bg-muted px-1">/end</code> deb yozing yoki «Yakunlash»
        tugmasini bosing — AI suhbat bo‘yicha feedback beradi.
      </p>
    </div>
  )
}
