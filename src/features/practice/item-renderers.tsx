'use client'

import * as React from 'react'
import { Check, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'

import type { RunnerItem } from './types'

/**
 * 10 ta mashq turining kirish (input) komponentlari.
 * Har bir komponent ichki holatini o'zi boshqaradi va `onChange` orqali
 * serverga yuboriladigan `string[]` javobni yuqoriga uzatadi.
 *
 * Javob formatlari `@/lib/adaptive/grade` bilan mos:
 *   mcq              → [optionId]
 *   gap_fill va matn → bo'shliqlar bo'yicha pozitsion massiv
 *   matching         → ["left::right", …]
 *   classification   → ["element::kategoriya", …]
 *   word_order       → ["so'z", "so'z", …]
 */

export interface ItemInputProps {
  item: RunnerItem
  disabled: boolean
  onChange: (answer: string[]) => void
  /** Javob berilgandan keyin bo'laklar bo'yicha natija */
  parts?: boolean[]
}

const GAP_SPLIT_RE = /(_{2,}|\{\s*\}|\[\s*\.{2,}\s*\])/g
const GAP_TEST_RE = /^(?:_{2,}|\{\s*\}|\[\s*\.{2,}\s*\])$/

function splitStem(stem: string): string[] {
  return stem.split(GAP_SPLIT_RE)
}

function countGaps(stem: string): number {
  const matches = stem.match(GAP_SPLIT_RE)
  return matches ? matches.length : 0
}

/* ------------------------------------------------------------------ */
/* 1. MCQ — variant tanlash                                            */
/* ------------------------------------------------------------------ */

function McqInput({ item, disabled, onChange }: ItemInputProps) {
  const [selected, setSelected] = React.useState<string>('')

  function pick(id: string) {
    if (disabled) return
    setSelected(id)
    onChange([id])
  }

  if (!item.options?.length) {
    return <p className="text-sm text-muted-foreground">Bu mashq uchun variantlar yo‘q.</p>
  }

  return (
    <div className="grid gap-2" role="radiogroup" aria-label="Variantlar">
      {item.options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={selected === option.id}
          disabled={disabled}
          onClick={() => pick(option.id)}
          className={cn(
            'flex items-center gap-3 rounded-lg border border-border p-3 text-left text-sm transition-colors',
            'hover:border-primary/50 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-70',
            selected === option.id && 'border-primary bg-primary/5'
          )}
        >
          <span
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-medium',
              selected === option.id && 'border-primary bg-primary text-primary-foreground'
            )}
          >
            {option.id.slice(-1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">{option.text}</span>
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Gap fill — gap ichidagi inline inputlar                          */
/* ------------------------------------------------------------------ */

function GapFillInput({ item, disabled, onChange, parts }: ItemInputProps) {
  const gaps = Math.max(countGaps(item.stem), item.blanks, 1)
  const [values, setValues] = React.useState<string[]>(() => Array.from({ length: gaps }, () => ''))

  function update(index: number, value: string) {
    const next = [...values]
    next[index] = value
    setValues(next)
    onChange(next)
  }

  const segments = splitStem(item.stem)
  let gapIndex = -1

  return (
    <div className="space-y-3">
      <p className="text-base leading-8">
        {segments.map((segment, index) => {
          if (GAP_TEST_RE.test(segment)) {
            gapIndex += 1
            const current = gapIndex
            return (
              <Input
                key={`gap-${index}`}
                value={values[current] ?? ''}
                disabled={disabled}
                onChange={(event) => update(current, event.target.value)}
                aria-label={`Bo‘shliq ${current + 1}`}
                className={cn(
                  'mx-1 inline-flex h-8 w-32 align-baseline sm:w-40',
                  parts?.[current] === true && 'border-emerald-500 text-emerald-700',
                  parts?.[current] === false && 'border-rose-500 text-rose-700'
                )}
              />
            )
          }
          return <span key={`text-${index}`}>{segment}</span>
        })}
      </p>

      {countGaps(item.stem) === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: gaps }).map((_, index) => (
            <Input
              key={index}
              value={values[index] ?? ''}
              disabled={disabled}
              placeholder={`Javob ${index + 1}`}
              aria-label={`Javob ${index + 1}`}
              onChange={(event) => update(index, event.target.value)}
              className={cn(
                parts?.[index] === true && 'border-emerald-500',
                parts?.[index] === false && 'border-rose-500'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Matching — ikki ustun, bosib juftlash                            */
/* ------------------------------------------------------------------ */

function MatchingInput({ item, disabled, onChange }: ItemInputProps) {
  const left = item.left ?? []
  const right = item.right ?? []
  const [activeLeft, setActiveLeft] = React.useState<string | null>(null)
  const [pairs, setPairs] = React.useState<Record<string, string>>({})

  function emit(next: Record<string, string>) {
    setPairs(next)
    onChange(Object.entries(next).map(([l, r]) => `${l}::${r}`))
  }

  function pickLeft(value: string) {
    if (disabled) return
    setActiveLeft((current) => (current === value ? null : value))
  }

  function pickRight(value: string) {
    if (disabled) return
    if (!activeLeft) return
    const next = { ...pairs }
    // Bir «right» faqat bitta «left» ga biriktiriladi
    for (const [key, val] of Object.entries(next)) {
      if (val === value) delete next[key]
    }
    next[activeLeft] = value
    setActiveLeft(null)
    emit(next)
  }

  function clearPair(value: string) {
    if (disabled) return
    const next = { ...pairs }
    delete next[value]
    emit(next)
  }

  const usedRight = new Set(Object.values(pairs))

  if (!left.length || !right.length) {
    return <p className="text-sm text-muted-foreground">Juftliklar topilmadi.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Avval chapdagi so‘zni, so‘ng o‘ngdagi mos variantni bosing.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ul className="space-y-2">
          {left.map((value) => (
            <li key={value}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => pickLeft(value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg border border-border p-3 text-left text-sm transition-colors',
                  'hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70',
                  activeLeft === value && 'border-primary bg-primary/5',
                  pairs[value] && 'bg-muted/50'
                )}
              >
                <span className="min-w-0 flex-1">{value}</span>
                {pairs[value] ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {pairs[value]}
                    <X
                      className="size-3"
                      role="button"
                      aria-label="Juftlikni olib tashlash"
                      onClick={(event) => {
                        event.stopPropagation()
                        clearPair(value)
                      }}
                    />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {right.map((value) => (
            <li key={value}>
              <button
                type="button"
                disabled={disabled || usedRight.has(value)}
                onClick={() => pickRight(value)}
                className={cn(
                  'w-full rounded-lg border border-border p-3 text-left text-sm transition-colors',
                  'hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
                  usedRight.has(value) && 'bg-muted/50'
                )}
              >
                {value}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Classification — so'zni bosib, savatchani bosish                 */
/* ------------------------------------------------------------------ */

function ClassificationInput({ item, disabled, onChange }: ItemInputProps) {
  const elements = item.elements ?? []
  const categories = item.categories ?? []
  const [active, setActive] = React.useState<string | null>(null)
  const [assigned, setAssigned] = React.useState<Record<string, string>>({})

  function emit(next: Record<string, string>) {
    setAssigned(next)
    onChange(Object.entries(next).map(([element, category]) => `${element}::${category}`))
  }

  function assign(category: string) {
    if (disabled || !active) return
    emit({ ...assigned, [active]: category })
    setActive(null)
  }

  function unassign(element: string) {
    if (disabled) return
    const next = { ...assigned }
    delete next[element]
    emit(next)
  }

  if (!elements.length || !categories.length) {
    return <p className="text-sm text-muted-foreground">Tasniflash uchun element yo‘q.</p>
  }

  const pool = elements.filter((element) => !assigned[element])

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        So‘zni tanlang, so‘ng mos savatchani bosing.
      </p>
      <div className="flex flex-wrap gap-2">
        {pool.length === 0 ? (
          <p className="text-xs text-muted-foreground">Barcha so‘zlar taqsimlandi.</p>
        ) : (
          pool.map((element) => (
            <button
              key={element}
              type="button"
              disabled={disabled}
              onClick={() => setActive((current) => (current === element ? null : element))}
              className={cn(
                'rounded-full border border-border px-3 py-1.5 text-sm transition-colors',
                'hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70',
                active === element && 'border-primary bg-primary/10 text-primary'
              )}
            >
              {element}
            </button>
          ))
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            disabled={disabled || !active}
            onClick={() => assign(category)}
            className={cn(
              'min-h-24 rounded-lg border border-dashed border-border p-3 text-left transition-colors',
              'hover:border-primary/50 disabled:cursor-not-allowed'
            )}
          >
            <span className="text-sm font-medium">{category}</span>
            <span className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(assigned)
                .filter(([, value]) => value === category)
                .map(([element]) => (
                  <span
                    key={element}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      unassign(element)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation()
                        unassign(element)
                      }
                    }}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {element}
                  </span>
                ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Word order — chiplarni bosib gap qurish                          */
/* ------------------------------------------------------------------ */

function WordOrderInput({ item, disabled, onChange }: ItemInputProps) {
  const chips = item.chips ?? []
  const [order, setOrder] = React.useState<number[]>([])

  function emit(next: number[]) {
    setOrder(next)
    onChange(next.map((index) => chips[index]))
  }

  const used = new Set(order)

  if (!chips.length) {
    return <p className="text-sm text-muted-foreground">So‘zlar topilmadi.</p>
  }

  return (
    <div className="space-y-3">
      <div className="min-h-14 rounded-lg border border-dashed border-border p-3">
        {order.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            So‘zlarni to‘g‘ri tartibda bosing — gap shu yerda quriladi.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {order.map((chipIndex, position) => (
              <button
                key={`${chipIndex}-${position}`}
                type="button"
                disabled={disabled}
                onClick={() => emit(order.filter((_, i) => i !== position))}
                className="rounded-md bg-primary/10 px-2.5 py-1 text-sm text-primary transition-colors hover:bg-primary/20"
              >
                {chips[chipIndex]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, index) =>
          used.has(index) ? null : (
            <button
              key={`${chip}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => emit([...order, index])}
              className="rounded-md border border-border px-2.5 py-1 text-sm transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-70"
            >
              {chip}
            </button>
          )
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Error correction — noto'g'ri so'zni bosish va tuzatish           */
/* ------------------------------------------------------------------ */

function ErrorCorrectionInput({ item, disabled, onChange }: ItemInputProps) {
  const words = React.useMemo(() => item.stem.split(/(\s+)/), [item.stem])
  const [picked, setPicked] = React.useState<number | null>(null)
  const [correction, setCorrection] = React.useState('')

  function pick(index: number) {
    if (disabled) return
    setPicked(index)
    const raw = words[index].replace(/[.,!?;:]+$/, '')
    setCorrection(raw)
    onChange([raw])
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Xato so‘zni bosing, so‘ng to‘g‘ri variantini yozing.
      </p>
      <p className="text-base leading-8">
        {words.map((word, index) =>
          word.trim() === '' ? (
            <span key={index}>{word}</span>
          ) : (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => pick(index)}
              className={cn(
                'rounded px-1 transition-colors hover:bg-muted',
                picked === index && 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              )}
            >
              {word}
            </button>
          )
        )}
      </p>
      {picked !== null && (
        <Input
          value={correction}
          disabled={disabled}
          aria-label="To‘g‘ri variant"
          placeholder="To‘g‘ri variant"
          onChange={(event) => {
            setCorrection(event.target.value)
            onChange([event.target.value])
          }}
          className="max-w-sm"
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Ochiq matnli turlar: transformation, expansion, imitation,       */
/*    substitution                                                     */
/* ------------------------------------------------------------------ */

function TextAnswerInput({
  item: _item,
  disabled,
  onChange,
  rows = 3,
  placeholder,
}: ItemInputProps & { rows?: number; placeholder?: string }) {
  const [value, setValue] = React.useState('')

  return (
    <Textarea
      value={value}
      rows={rows}
      disabled={disabled}
      aria-label="Javobingiz"
      placeholder={placeholder ?? 'Javobingizni yozing…'}
      onChange={(event) => {
        setValue(event.target.value)
        onChange([event.target.value])
      }}
      maxLength={600}
      className="resize-y"
    />
  )
}

function SubstitutionInput(props: ItemInputProps) {
  const gaps = countGaps(props.item.stem)
  if (gaps > 0) return <GapFillInput {...props} />
  return <TextAnswerInput {...props} rows={2} placeholder="Almashtirilgan gapni yozing…" />
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export function ItemInput(props: ItemInputProps) {
  switch (props.item.type) {
    case 'mcq':
      return <McqInput {...props} />
    case 'gap_fill':
      return <GapFillInput {...props} />
    case 'matching':
      return <MatchingInput {...props} />
    case 'classification':
      return <ClassificationInput {...props} />
    case 'word_order':
      return <WordOrderInput {...props} />
    case 'error_correction':
      return <ErrorCorrectionInput {...props} />
    case 'substitution':
      return <SubstitutionInput {...props} />
    case 'transformation':
      return <TextAnswerInput {...props} rows={2} placeholder="Gapni qayta yozing…" />
    case 'expansion':
      return (
        <TextAnswerInput {...props} rows={3} placeholder="Gapni kengaytirib qayta yozing…" />
      )
    case 'imitation':
      return (
        <TextAnswerInput
          {...props}
          rows={3}
          placeholder="Namunaga taqlid qilib o‘z gapingizni yozing…"
        />
      )
    default:
      return <TextAnswerInput {...props} />
  }
}

/** Javob bo'sh emasligini tekshirish (Tekshirish tugmasi uchun). */
export function hasAnswer(item: RunnerItem, answer: string[]): boolean {
  if (!answer.length) return false
  if (item.type === 'matching') return answer.length === (item.left?.length ?? 0)
  if (item.type === 'classification') return answer.length === (item.elements?.length ?? 0)
  if (item.type === 'word_order') return answer.length === (item.chips?.length ?? 0)
  return answer.some((value) => value.trim().length > 0)
}

/** Javobdan keyin ko'rsatiladigan kichik natija belgisi. */
export function PartMarks({ parts }: { parts?: boolean[] }) {
  if (!parts?.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((ok, index) => (
        <span
          key={index}
          className={cn(
            'inline-flex size-5 items-center justify-center rounded-full text-[10px]',
            ok ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
          )}
          title={`${index + 1}-bo‘lak: ${ok ? 'to‘g‘ri' : 'xato'}`}
        >
          {ok ? <Check className="size-3" /> : <X className="size-3" />}
        </span>
      ))}
    </div>
  )
}
