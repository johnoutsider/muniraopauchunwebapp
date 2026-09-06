'use client'

import * as React from 'react'
import { CheckCircle2, CircleDashed, Sparkles, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ITEM_TYPE_LABELS } from '@/config/constants'
import { cn } from '@/lib/utils/cn'
import { wordCount } from '@/lib/utils/format'
import type { ItemExplanation } from '@/types'

import { AudioAnswer } from './audio-answer'
import { ListeningPlayer } from './listening-player'
import { splitStemByBlanks } from './runner-content'
import type { RunnerItem } from './types'

/**
 * Barcha yopiq mashq turlarini render qiluvchi yagona komponent (PLAN 8.2).
 *
 * Javob formati HAR DOIM `string[]` va `@/lib/adaptive/grade` kutgan shaklda:
 *   • mcq            → [optionId] yoki bir nechta optionId
 *   • gap_fill       → pozitsion: har bo'shliq uchun bitta band
 *   • matching       → ['left::right', …]
 *   • classification → ['element::category', …]
 *   • word_order     → ['word', 'word', …]
 *   • matnli turlar  → [javob matni]
 * Shu sabab baholash klientdagi ko'rinishga umuman bog'liq emas.
 *
 * `readOnly` + `result` — topshirilgandan keyingi tahlil rejimi.
 */

const SELECT_CLASS = cn(
  'h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

export interface QuestionResult {
  isCorrect?: boolean
  score?: number
  answerKey?: string[]
  explanation?: ItemExplanation
}

export interface QuestionRendererProps {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  readOnly?: boolean
  result?: QuestionResult
  /** speaking_prompt / imitation turlari uchun yozuv joyi */
  audio?: { uid: string; storagePrefix: string }
  className?: string
}

function setAt(list: string[], index: number, value: string, length: number): string[] {
  const next = Array.from({ length }, (_, i) => list[i] ?? '')
  next[index] = value
  return next
}

/* ------------------------------------------------------------------ */

export function QuestionRenderer({
  item,
  value,
  onChange,
  readOnly = false,
  result,
  audio,
  className,
}: QuestionRendererProps) {
  const disabled = readOnly

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{ITEM_TYPE_LABELS[item.type]?.uz ?? item.type}</Badge>
        <Badge variant="secondary">{item.cefr}</Badge>
        {item.open ? (
          <Badge variant="info" className="gap-1">
            <Sparkles />
            O‘qituvchi/AI baholaydi
          </Badge>
        ) : null}
        {readOnly && result ? <ResultBadge result={result} item={item} /> : null}
      </div>

      {item.instruction ? (
        <p className="text-sm text-muted-foreground">{item.instruction}</p>
      ) : null}

      {item.audioUrl ? <ListeningPlayer audioUrl={item.audioUrl} label="Savol audiosi" /> : null}

      {item.type === 'gap_fill' ? null : (
        <p className="whitespace-pre-line text-base leading-relaxed">{item.stem}</p>
      )}

      <ItemBody
        item={item}
        value={value}
        onChange={onChange}
        disabled={disabled}
        audio={audio}
      />

      {readOnly && result ? <ResultDetails result={result} /> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Turlarga qarab javob maydoni                                        */
/* ------------------------------------------------------------------ */

function ItemBody({
  item,
  value,
  onChange,
  disabled,
  audio,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
  audio?: { uid: string; storagePrefix: string }
}) {
  switch (item.type) {
    case 'mcq':
      return <McqBody item={item} value={value} onChange={onChange} disabled={disabled} />
    case 'gap_fill':
      return <GapFillBody item={item} value={value} onChange={onChange} disabled={disabled} />
    case 'matching':
      return <MatchingBody item={item} value={value} onChange={onChange} disabled={disabled} />
    case 'classification':
      return (
        <ClassificationBody item={item} value={value} onChange={onChange} disabled={disabled} />
      )
    case 'word_order':
      return <WordOrderBody item={item} value={value} onChange={onChange} disabled={disabled} />
    case 'speaking_prompt':
    case 'imitation':
      return (
        <AudioItemBody item={item} value={value} onChange={onChange} disabled={disabled} audio={audio} />
      )
    case 'open_writing':
      return <LongTextBody value={value} onChange={onChange} disabled={disabled} />
    default:
      return <ShortTextBody item={item} value={value} onChange={onChange} disabled={disabled} />
  }
}

/* --- MCQ ---------------------------------------------------------- */

function McqBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  const options = item.options ?? []

  if (item.multi) {
    const selected = new Set(value)
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors',
              selected.has(option.id) && 'border-primary bg-primary/5',
              disabled && 'cursor-default opacity-90'
            )}
          >
            <Checkbox
              className="mt-0.5"
              checked={selected.has(option.id)}
              disabled={disabled}
              onCheckedChange={(checked) => {
                const next = new Set(selected)
                if (checked === true) next.add(option.id)
                else next.delete(option.id)
                onChange(options.filter((o) => next.has(o.id)).map((o) => o.id))
              }}
            />
            <span>{option.text}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <RadioGroup
      value={value[0] ?? ''}
      onValueChange={(next) => onChange([next])}
      disabled={disabled}
      className="gap-2"
    >
      {options.map((option) => (
        <label
          key={option.id}
          htmlFor={`${item.id}-${option.id}`}
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors',
            value[0] === option.id && 'border-primary bg-primary/5',
            disabled && 'cursor-default opacity-90'
          )}
        >
          <RadioGroupItem
            id={`${item.id}-${option.id}`}
            value={option.id}
            className="mt-0.5"
          />
          <span>{option.text}</span>
        </label>
      ))}
    </RadioGroup>
  )
}

/* --- Gap fill ----------------------------------------------------- */

function GapFillBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  const blanks = Math.max(1, item.blanks ?? 1)
  const parts = splitStemByBlanks(item.stem)
  const hasInlineBlanks = parts.length > 1

  if (!hasInlineBlanks) {
    return (
      <div className="space-y-2">
        {Array.from({ length: blanks }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-sm text-muted-foreground">{index + 1}.</span>
            <Input
              value={value[index] ?? ''}
              disabled={disabled}
              onChange={(event) => onChange(setAt(value, index, event.target.value, blanks))}
              placeholder="Javobingiz"
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <p className="flex flex-wrap items-baseline gap-x-1 gap-y-2 text-base leading-loose">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <span className="whitespace-pre-wrap">{part}</span>
          {index < parts.length - 1 ? (
            <Input
              aria-label={`Bo‘shliq ${index + 1}`}
              value={value[index] ?? ''}
              disabled={disabled}
              onChange={(event) =>
                onChange(setAt(value, index, event.target.value, parts.length - 1))
              }
              className="inline-flex h-8 w-36 align-baseline"
            />
          ) : null}
        </React.Fragment>
      ))}
    </p>
  )
}

/* --- Matching ----------------------------------------------------- */

function MatchingBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  const lefts = item.lefts ?? []
  const rights = item.rights ?? []

  const chosen = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of value) {
      const index = entry.indexOf('::')
      if (index > 0) map.set(entry.slice(0, index), entry.slice(index + 2))
    }
    return map
  }, [value])

  function pick(left: string, right: string) {
    const next = new Map(chosen)
    if (right) next.set(left, right)
    else next.delete(left)
    onChange(lefts.filter((l) => next.get(l)).map((l) => `${l}::${next.get(l)}`))
  }

  return (
    <div className="space-y-2">
      {lefts.map((left) => (
        <div key={left} className="grid items-center gap-2 sm:grid-cols-2">
          <span className="rounded-md bg-muted/50 px-3 py-2 text-sm">{left}</span>
          <select
            className={SELECT_CLASS}
            value={chosen.get(left) ?? ''}
            disabled={disabled}
            aria-label={`${left} uchun moslik`}
            onChange={(event) => pick(left, event.target.value)}
          >
            <option value="">— tanlang —</option>
            {rights.map((right) => (
              <option key={right} value={right}>
                {right}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

/* --- Classification ----------------------------------------------- */

function ClassificationBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  const elements = item.elements ?? []
  const categories = item.categories ?? []

  const chosen = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of value) {
      const index = entry.indexOf('::')
      if (index > 0) map.set(entry.slice(0, index), entry.slice(index + 2))
    }
    return map
  }, [value])

  function pick(element: string, category: string) {
    const next = new Map(chosen)
    if (category) next.set(element, category)
    else next.delete(element)
    onChange(elements.filter((e) => next.get(e)).map((e) => `${e}::${next.get(e)}`))
  }

  return (
    <div className="space-y-2">
      {elements.map((element) => (
        <div key={element} className="grid items-center gap-2 sm:grid-cols-2">
          <span className="rounded-md bg-muted/50 px-3 py-2 text-sm">{element}</span>
          <select
            className={SELECT_CLASS}
            value={chosen.get(element) ?? ''}
            disabled={disabled}
            aria-label={`${element} uchun kategoriya`}
            onChange={(event) => pick(element, event.target.value)}
          >
            <option value="">— kategoriya —</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

/* --- Word order --------------------------------------------------- */

function WordOrderBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  // `?? []` har renderda yangi massiv yaratadi — memo qilamiz, aks holda
  // quyidagi useMemo har safar qayta hisoblanadi.
  const pool = React.useMemo(() => item.scrambled ?? [], [item.scrambled])

  // Qaysi so'z necha marta ishlatilganini hisoblaymiz (takroriy so'zlar bo'lishi mumkin)
  const used = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const word of value) counts.set(word, (counts.get(word) ?? 0) + 1)
    return counts
  }, [value])

  const remaining = React.useMemo(() => {
    const counts = new Map(used)
    return pool.filter((word) => {
      const left = counts.get(word) ?? 0
      if (left > 0) {
        counts.set(word, left - 1)
        return false
      }
      return true
    })
  }, [pool, used])

  return (
    <div className="space-y-3">
      <div
        className="flex min-h-12 flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3"
        aria-label="Tuzilgan gap"
      >
        {value.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            So‘zlarni to‘g‘ri tartibda bosing
          </span>
        ) : (
          value.map((word, index) => (
            <button
              key={`${word}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="rounded-md bg-primary px-2.5 py-1 text-sm text-primary-foreground disabled:opacity-70"
            >
              {word}
            </button>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {remaining.map((word, index) => (
          <button
            key={`${word}-pool-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange([...value, word])}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-sm transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
          >
            {word}
          </button>
        ))}
        {remaining.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Barcha so‘zlar ishlatildi. Tuzatish uchun yuqoridagi so‘zni bosing.
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* --- Matnli javoblar ---------------------------------------------- */

function ShortTextBody({
  item,
  value,
  onChange,
  disabled,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
}) {
  const multiline = item.type === 'expansion' || item.type === 'transformation'
  if (multiline) {
    return (
      <Textarea
        value={value[0] ?? ''}
        disabled={disabled}
        rows={3}
        placeholder="Javobingizni yozing"
        onChange={(event) => onChange([event.target.value])}
      />
    )
  }
  return (
    <Input
      value={value[0] ?? ''}
      disabled={disabled}
      placeholder="Javobingizni yozing"
      onChange={(event) => onChange([event.target.value])}
    />
  )
}

function LongTextBody({
  value,
  onChange,
  disabled,
  minWords,
}: {
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
  minWords?: number
}) {
  const text = value[0] ?? ''
  const words = wordCount(text)
  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        disabled={disabled}
        rows={8}
        placeholder="Javobingizni ingliz tilida yozing"
        onChange={(event) => onChange([event.target.value])}
      />
      <p className="text-xs text-muted-foreground">
        {words} ta so‘z
        {minWords ? ` · kamida ${minWords} ta so‘z` : ''}
      </p>
    </div>
  )
}

function AudioItemBody({
  item,
  value,
  onChange,
  disabled,
  audio,
}: {
  item: RunnerItem
  value: string[]
  onChange: (value: string[]) => void
  disabled: boolean
  audio?: { uid: string; storagePrefix: string }
}) {
  if (!audio) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu topshiriq ovozli javob talab qiladi, lekin yozib olish mavjud emas.
      </p>
    )
  }
  return (
    <AudioAnswer
      uid={audio.uid}
      storagePrefix={audio.storagePrefix}
      name={item.id}
      readOnly={disabled}
      value={{ audioPath: value[0] || undefined }}
      onChange={(next) => onChange(next.audioPath ? [next.audioPath] : [])}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Topshirilgandan keyingi tahlil                                      */
/* ------------------------------------------------------------------ */

function ResultBadge({ result, item }: { result: QuestionResult; item: RunnerItem }) {
  if (item.open || result.isCorrect === undefined) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CircleDashed />
        Baholanmoqda
      </Badge>
    )
  }
  if (result.isCorrect) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 />
        To‘g‘ri
      </Badge>
    )
  }
  const partial = typeof result.score === 'number' && result.score > 0
  return (
    <Badge variant={partial ? 'warning' : 'danger'} className="gap-1">
      <XCircle />
      {partial ? `Qisman (${Math.round((result.score ?? 0) * 100)}%)` : 'Noto‘g‘ri'}
    </Badge>
  )
}

function ResultDetails({ result }: { result: QuestionResult }) {
  const hasKey = (result.answerKey?.length ?? 0) > 0
  if (!hasKey && !result.explanation) return null

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      {hasKey ? (
        <p>
          <span className="font-medium">To‘g‘ri javob: </span>
          {result.answerKey?.join(' · ')}
        </p>
      ) : null}
      {result.explanation ? (
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Nima uchun: </span>
            {result.explanation.why}
          </p>
          <p>
            <span className="font-medium text-foreground">Qanday tuzatish: </span>
            {result.explanation.how}
          </p>
          <p>
            <span className="font-medium text-foreground">Yana qayerda: </span>
            {result.explanation.whereElse}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export { LongTextBody }
